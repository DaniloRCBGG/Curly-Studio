import { env } from "@/lib/env";
import { criarClienteServidor } from "@/lib/supabase/server";

export type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  valor: number;
  valor_sinal: number;
};

// Lista pública de serviços (preço e duração vêm do cadastro feito no painel da equipe).
export async function listarServicos(): Promise<Servico[]> {
  if (!env.supabaseConfigurado()) return [];
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("servicos")
    .select("id, nome, descricao, duracao_minutos, valor, valor_sinal")
    .eq("ativo", true)
    .order("ordem")
    .order("nome");
  return (data ?? []) as Servico[];
}

export const reais = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

export function duracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
