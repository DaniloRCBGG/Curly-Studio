import { env } from "@/lib/env";
import type { Servico } from "@/lib/servicos-tabela";
import { criarClienteServidor } from "@/lib/supabase/server";

export * from "@/lib/servicos-tabela";

export const CAMPOS_SERVICO =
  "id, nome, descricao, grupo, duracao_minutos, valor, valor_sinal, preco_p, preco_m, preco_g, preco_gg, a_partir_de, observacoes";

// Lista pública de serviços: é a única fonte de nomes e preços (home, aba Valores e agendamento).
// A equipe cadastra e edita tudo no painel (/equipe/servicos).
export async function listarServicos(): Promise<Servico[]> {
  if (!env.supabaseConfigurado()) return [];
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("servicos").select(CAMPOS_SERVICO).eq("ativo", true).order("ordem").order("nome");
  return ((data ?? []) as Servico[]).map((s) => ({
    ...s,
    valor: Number(s.valor),
    valor_sinal: Number(s.valor_sinal),
    preco_p: s.preco_p === null ? null : Number(s.preco_p),
    preco_m: s.preco_m === null ? null : Number(s.preco_m),
    preco_g: s.preco_g === null ? null : Number(s.preco_g),
    preco_gg: s.preco_gg === null ? null : Number(s.preco_gg),
  }));
}
