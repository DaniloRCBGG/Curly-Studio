"use server";

import { redirect } from "next/navigation";
import { disponibilidade } from "@/lib/agenda/disponibilidade";
import { formatarData, formatarHora } from "@/lib/agenda/horarios";
import { criarCobrancaPix } from "@/lib/pagamentos/pix";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

const MENSAGENS: Record<string, string> = {
  horario_indisponivel: "Esse horário acabou de ser reservado por outra pessoa. Escolha outro.",
  horario_passado: "Esse horário já passou. Escolha outro.",
  cliente_nao_encontrada: "Não encontramos sua ficha de cliente. Fale com o salão pelo WhatsApp.",
};

function erroDe(mensagem: string) {
  return Object.entries(MENSAGENS).find(([codigo]) => mensagem.includes(codigo))?.[1] ?? "Não foi possível reservar. Tente de novo.";
}

// Escolhe a profissional: a pedida pela cliente, ou a primeira livre quando for "qualquer uma".
async function profissionalParaHorario(servicoId: string, data: string, inicio: string, pedida: string) {
  const { livres } = await disponibilidade(servicoId, data);
  const horario = livres.find((h) => h.inicio === inicio);
  if (!horario) return null;
  if (pedida && pedida !== "qualquer") return horario.funcionarias.includes(pedida) ? pedida : null;
  return horario.funcionarias[0];
}

export async function iniciarAgendamento(form: FormData) {
  const servicoId = String(form.get("servico"));
  const data = String(form.get("data"));
  const inicio = String(form.get("inicio"));
  const voltar = `/agendar?servico=${servicoId}&data=${data}`;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?voltar=${encodeURIComponent(voltar)}`);

  const funcionariaId = await profissionalParaHorario(servicoId, data, inicio, String(form.get("profissional") ?? "qualquer"));
  if (!funcionariaId) redirect(`${voltar}&erro=${encodeURIComponent(MENSAGENS.horario_indisponivel)}`);

  const { data: agendamentoId, error } = await supabase.rpc("reservar_horario", {
    p_servico_id: servicoId,
    p_funcionaria_id: funcionariaId,
    p_inicio: inicio,
  });
  if (error || !agendamentoId) redirect(`${voltar}&erro=${encodeURIComponent(erroDe(error?.message ?? ""))}`);

  const admin = criarClienteAdmin();
  const [{ data: cliente }, { data: servico }] = await Promise.all([
    admin.from("clientes").select("id, nome, cpf, email, telefone, asaas_customer_id").eq("usuario_id", user.id).single(),
    admin.from("servicos").select("nome, valor_sinal").eq("id", servicoId).single(),
  ]);

  try {
    if (!cliente?.cpf) throw new Error("Cliente sem CPF");
    const cobranca = await criarCobrancaPix({
      cliente: { nome: cliente.nome, cpf: cliente.cpf, email: cliente.email, telefone: cliente.telefone, asaasCustomerId: cliente.asaas_customer_id },
      valor: Number(servico!.valor_sinal),
      descricao: `Sinal: ${servico!.nome}, ${formatarData(inicio)} às ${formatarHora(inicio)}`,
      referencia: agendamentoId,
    });
    await admin.from("sinais").insert({
      agendamento_id: agendamentoId,
      valor: servico!.valor_sinal,
      provedor_cobranca_id: cobranca.id,
      pix_copia_e_cola: cobranca.copiaECola,
      pix_qr_code_base64: cobranca.qrCodeBase64,
    });
    if (cobranca.customerId && !cliente.asaas_customer_id) {
      await admin.from("clientes").update({ asaas_customer_id: cobranca.customerId }).eq("id", cliente.id);
    }
  } catch (erro) {
    console.error("Falha ao gerar o Pix do sinal", erro);
    // Libera o horário na hora: sem Pix não há agendamento.
    await admin.from("agendamentos").update({ status: "cancelado", cancelado_em: new Date().toISOString() }).eq("id", agendamentoId);
    redirect(`${voltar}&erro=${encodeURIComponent("Não conseguimos gerar o Pix agora. Tente de novo em alguns minutos.")}`);
  }

  redirect(`/agendar/pagamento/${agendamentoId}`);
}
