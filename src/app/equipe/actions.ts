"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirEquipe, exigirGerente } from "@/lib/auth/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { cpfValido, soDigitos } from "@/lib/validacao";

const texto = (form: FormData, nome: string) => String(form.get(nome) ?? "").trim();
const numero = (form: FormData, nome: string) => {
  const v = texto(form, nome).replace(",", ".");
  return v === "" ? null : Number(v);
};

// Agenda ------------------------------------------------------------------------

export async function mudarStatus(form: FormData) {
  const { supabase } = await exigirEquipe();
  const status = texto(form, "status");
  if (!["concluido", "cancelado"].includes(status)) return;
  await supabase
    .from("agendamentos")
    .update({ status, ...(status === "cancelado" ? { cancelado_em: new Date().toISOString() } : {}) })
    .eq("id", texto(form, "id"));
  revalidatePath("/equipe");
}

// Agendamento feito pela equipe no salão: o sinal é recebido presencialmente (RF06).
export async function agendarPelaEquipe(form: FormData) {
  const { supabase, user } = await exigirEquipe();
  const servicoId = texto(form, "servico");
  const clienteId = texto(form, "cliente");
  const data = texto(form, "data");
  const inicio = texto(form, "inicio");
  const voltar = `/equipe/novo?cliente=${clienteId}&servico=${servicoId}&data=${data}`;

  const { disponibilidade } = await import("@/lib/agenda/disponibilidade");
  const { livres } = await disponibilidade(servicoId, data);
  const horario = livres.find((h) => h.inicio === inicio);
  const pedida = texto(form, "profissional");
  const funcionaria = horario && (pedida && pedida !== "qualquer" ? (horario.funcionarias.includes(pedida) ? pedida : null) : horario.funcionarias[0]);
  if (!funcionaria) redirect(`${voltar}&erro=${encodeURIComponent("Horário não está mais livre.")}`);

  const { data: servico } = await supabase.from("servicos").select("duracao_minutos, valor, valor_sinal").eq("id", servicoId).single();
  const fim = new Date(new Date(inicio).getTime() + servico!.duracao_minutos * 60_000).toISOString();
  const { data: ag, error } = await supabase
    .from("agendamentos")
    .insert({ cliente_id: clienteId, funcionaria_id: funcionaria, servico_id: servicoId, inicio, fim, status: "agendado", valor: servico!.valor, criado_por: user.id })
    .select("id")
    .single();
  if (error || !ag) redirect(`${voltar}&erro=${encodeURIComponent("Não foi possível agendar: horário ocupado.")}`);
  await supabase.from("sinais").insert({ agendamento_id: ag.id, valor: servico!.valor_sinal, forma: "presencial", status: "pago", pago_em: new Date().toISOString() });
  redirect(`/equipe?data=${data}`);
}

// Clientes (cadastro na chegada, RF01) ----------------------------------------------

export async function cadastrarCliente(form: FormData) {
  const { supabase } = await exigirEquipe();
  const cpf = soDigitos(texto(form, "cpf"));
  if (cpf && !cpfValido(cpf)) redirect(`/equipe/clientes?erro=${encodeURIComponent("CPF inválido.")}`);
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nome: texto(form, "nome"),
      telefone: soDigitos(texto(form, "telefone")),
      email: texto(form, "email") || null,
      cpf: cpf || null,
      bairro: texto(form, "bairro") || null,
      cidade: texto(form, "cidade") || null,
      aceite_privacidade_em: form.get("aceite") === "on" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !data) redirect(`/equipe/clientes?erro=${encodeURIComponent("Não foi possível cadastrar.")}`);
  redirect(`/equipe/novo?cliente=${data.id}`);
}

// Serviços (RF03, RF25) -------------------------------------------------------------

export async function salvarServico(form: FormData) {
  const { supabase } = await exigirEquipe();
  const id = texto(form, "id");
  const registro = {
    nome: texto(form, "nome"),
    descricao: texto(form, "descricao") || null,
    duracao_minutos: numero(form, "duracao_minutos"),
    valor: numero(form, "valor"),
    valor_sinal: numero(form, "valor_sinal"),
    ordem: numero(form, "ordem") ?? 0,
    ativo: form.get("ativo") === "on",
  };
  const { data, error } = id
    ? await supabase.from("servicos").update(registro).eq("id", id).select("id").single()
    : await supabase.from("servicos").insert(registro).select("id").single();
  if (error || !data) redirect(`/equipe/servicos?erro=${encodeURIComponent("Confira duração, valor e sinal (maior que zero).")}`);

  // Quem faz o serviço: só a gerente altera os vínculos (política de acesso).
  const profissionais = form.getAll("profissionais").map(String);
  if (form.has("editar_profissionais")) {
    await supabase.from("funcionaria_servicos").delete().eq("servico_id", data.id);
    if (profissionais.length) {
      await supabase.from("funcionaria_servicos").insert(profissionais.map((f) => ({ funcionaria_id: f, servico_id: data.id })));
    }
  }
  revalidatePath("/equipe/servicos");
  redirect("/equipe/servicos?ok=1");
}

// Equipe (RF02, RF29): só a gerente --------------------------------------------------

export async function salvarFuncionaria(form: FormData) {
  const { supabase } = await exigirGerente();
  const id = texto(form, "id");
  const cargo = texto(form, "cargo");
  const modalidade = cargo === "assistente" ? "diaria" : cargo === "cabeleireira_auxiliar" ? "comissao" : null;
  const registro = {
    nome: texto(form, "nome"),
    cargo,
    modalidade,
    valor_diaria_semana: modalidade === "diaria" ? numero(form, "valor_diaria_semana") ?? 70 : null,
    valor_diaria_sabado: modalidade === "diaria" ? numero(form, "valor_diaria_sabado") ?? 90 : null,
    percentual_comissao: modalidade === "comissao" ? numero(form, "percentual_comissao") ?? 30 : null,
    atende: form.get("atende") === "on",
    ativa: form.get("ativa") === "on",
  };

  let funcionariaId = id;
  if (id) {
    await supabase.from("funcionarias").update(registro).eq("id", id);
  } else {
    const { data, error } = await supabase.from("funcionarias").insert(registro).select("id").single();
    if (error || !data) redirect(`/equipe/funcionarias?erro=${encodeURIComponent("Não foi possível salvar.")}`);
    funcionariaId = data.id;
  }

  // Cria o login da funcionária, se um e-mail foi informado e ela ainda não tem acesso.
  const email = texto(form, "email");
  const senha = texto(form, "senha");
  if (email && senha) {
    const admin = criarClienteAdmin();
    const { data: criado, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
    if (error || !criado.user) redirect(`/equipe/funcionarias?erro=${encodeURIComponent("Login não criado: " + (error?.message ?? ""))}`);
    await admin.from("usuarios").update({ perfil: cargo === "gerente" ? "gerente" : "funcionaria" }).eq("id", criado.user.id);
    await admin.from("funcionarias").update({ usuario_id: criado.user.id }).eq("id", funcionariaId);
  }
  revalidatePath("/equipe/funcionarias");
  redirect("/equipe/funcionarias?ok=1");
}
