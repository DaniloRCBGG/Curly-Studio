"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { disponibilidade } from "@/lib/agenda/disponibilidade";
import { criarClienteServidor } from "@/lib/supabase/server";
import { soDigitos } from "@/lib/validacao";

export async function cancelarAgendamento(form: FormData) {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("cancelar_meu_agendamento", { p_agendamento_id: String(form.get("id")) });
  if (error) redirect(`/minha-conta?erro=${encodeURIComponent("Não foi possível cancelar este agendamento.")}`);
  revalidatePath("/minha-conta");
}

export async function reagendar(form: FormData) {
  const id = String(form.get("agendamento"));
  const servicoId = String(form.get("servico"));
  const data = String(form.get("data"));
  const inicio = String(form.get("inicio"));
  const pedida = String(form.get("profissional") ?? "qualquer");
  const voltar = `/minha-conta/reagendar/${id}?data=${data}`;

  const { livres } = await disponibilidade(servicoId, data, id);
  const horario = livres.find((h) => h.inicio === inicio);
  const funcionaria = horario && (pedida !== "qualquer" ? (horario.funcionarias.includes(pedida) ? pedida : null) : horario.funcionarias[0]);
  if (!funcionaria) redirect(`${voltar}&erro=${encodeURIComponent("Esse horário não está mais livre. Escolha outro.")}`);

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("reagendar_meu_agendamento", { p_agendamento_id: id, p_funcionaria_id: funcionaria, p_inicio: inicio });
  if (error) redirect(`${voltar}&erro=${encodeURIComponent("Não foi possível reagendar. Tente outro horário.")}`);
  redirect("/minha-conta?ok=reagendado");
}

export async function salvarDados(form: FormData) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const campo = (n: string) => String(form.get(n) ?? "").trim();
  await supabase
    .from("clientes")
    .update({ nome: campo("nome"), telefone: soDigitos(campo("telefone")), cep: soDigitos(campo("cep")), endereco: campo("endereco"), bairro: campo("bairro"), cidade: campo("cidade") })
    .eq("usuario_id", user.id);
  redirect("/minha-conta?ok=dados");
}
