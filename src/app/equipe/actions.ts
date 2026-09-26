"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirEquipe, exigirGerente } from "@/lib/auth/sessao";
import { CAMPOS_SERVICO, ehTamanho, precoPara, precosPorTamanho, type Servico, type Tamanho } from "@/lib/servicos";
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
  if (status === "cancelado") await supabase.from("sinais").update({ status: "cancelado" }).eq("agendamento_id", texto(form, "id")).eq("status", "pendente");
  revalidatePath("/equipe");
}

// Pix manual: a equipe conferiu no banco que o sinal caiu.
export async function confirmarSinal(form: FormData) {
  const { supabase } = await exigirEquipe();
  await supabase.rpc("confirmar_sinal_manual", { p_agendamento_id: texto(form, "id") });
  revalidatePath("/equipe");
}

// Agendamento feito pela equipe no salão: o sinal é recebido presencialmente (RF06).
export async function agendarPelaEquipe(form: FormData) {
  const { supabase, user } = await exigirEquipe();
  const servicoId = texto(form, "servico");
  const clienteId = texto(form, "cliente");
  const data = texto(form, "data");
  const inicio = texto(form, "inicio");
  const tamanho = ehTamanho(texto(form, "tamanho")) ? (texto(form, "tamanho") as Tamanho) : null;
  const voltar = `/equipe/novo?cliente=${clienteId}&servico=${servicoId}${tamanho ? `&tamanho=${tamanho}` : ""}&data=${data}`;

  const { disponibilidade } = await import("@/lib/agenda/disponibilidade");
  const { livres } = await disponibilidade(servicoId, data);
  const horario = livres.find((h) => h.inicio === inicio);
  const pedida = texto(form, "profissional");
  const funcionaria = horario && (pedida && pedida !== "qualquer" ? (horario.funcionarias.includes(pedida) ? pedida : null) : horario.funcionarias[0]);
  if (!funcionaria) redirect(`${voltar}&erro=${encodeURIComponent("Horário não está mais livre.")}`);

  const { data: servico } = await supabase.from("servicos").select(CAMPOS_SERVICO).eq("id", servicoId).single();
  const porTamanho = servico ? precosPorTamanho(servico as Servico) !== null : false;
  if (porTamanho && !tamanho) redirect(`${voltar}&erro=${encodeURIComponent("Escolha o tamanho do cabelo.")}`);
  const valor = Number(precoPara(servico as Servico, porTamanho ? tamanho : null));
  const fim = new Date(new Date(inicio).getTime() + servico!.duracao_minutos * 60_000).toISOString();
  const { data: ag, error } = await supabase
    .from("agendamentos")
    .insert({ cliente_id: clienteId, funcionaria_id: funcionaria, servico_id: servicoId, inicio, fim, status: "agendado", valor, tamanho: porTamanho ? tamanho : null, criado_por: user.id })
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
  const telefone = soDigitos(texto(form, "telefone"));
  const email = texto(form, "email");
  if (cpf && !cpfValido(cpf)) redirect(`/equipe/clientes?erro=${encodeURIComponent("CPF inválido.")}`);
  // Precisa de pelo menos um contato: telefone ou e-mail.
  if (!telefone && !email) redirect(`/equipe/clientes?erro=${encodeURIComponent("Informe o telefone ou o e-mail da cliente.")}`);
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nome: texto(form, "nome"),
      telefone: telefone || null,
      email: email || null,
      cpf: cpf || null,
      cep: soDigitos(texto(form, "cep")) || null,
      endereco: texto(form, "endereco") || null,
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
  // Preço por tamanho (os quatro) ou preço único; com tamanhos, o preço base passa a ser o do cabelo P.
  const precos = { preco_p: numero(form, "preco_p"), preco_m: numero(form, "preco_m"), preco_g: numero(form, "preco_g"), preco_gg: numero(form, "preco_gg") };
  const preenchidos = Object.values(precos).filter((v) => v !== null).length;
  if (preenchidos !== 0 && preenchidos !== 4) redirect(`/equipe/servicos?erro=${encodeURIComponent("Preencha o preço dos quatro tamanhos, ou deixe todos vazios e use o preço único.")}`);
  const valor = preenchidos === 4 ? precos.preco_p : numero(form, "valor");
  if (valor === null) redirect(`/equipe/servicos?erro=${encodeURIComponent("Informe o preço por tamanho ou o preço único.")}`);
  const registro = {
    nome: texto(form, "nome"),
    descricao: texto(form, "descricao") || null,
    grupo: texto(form, "grupo") || "cuidados",
    duracao_minutos: numero(form, "duracao_minutos"),
    valor,
    ...precos,
    a_partir_de: form.get("a_partir_de") === "on",
    observacoes: texto(form, "observacoes") || null,
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
