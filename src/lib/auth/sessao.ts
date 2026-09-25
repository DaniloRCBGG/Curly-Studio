import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

export type Perfil = "cliente" | "funcionaria" | "gerente";

export async function usuarioAtual() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("usuarios").select("perfil").eq("id", user.id).maybeSingle();
  return { supabase, user, perfil: (data?.perfil ?? "cliente") as Perfil };
}

export async function exigirLogin(voltar: string) {
  const sessao = await usuarioAtual();
  if (!sessao) redirect(`/entrar?voltar=${encodeURIComponent(voltar)}`);
  return sessao;
}

export async function exigirEquipe() {
  const sessao = await exigirLogin("/equipe");
  if (sessao.perfil === "cliente") redirect("/minha-conta");
  return sessao;
}

export async function exigirGerente() {
  const sessao = await exigirEquipe();
  if (sessao.perfil !== "gerente") redirect("/equipe");
  return sessao;
}
