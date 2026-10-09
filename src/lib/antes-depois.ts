import { env } from "@/lib/env";
import { criarClienteServidor } from "@/lib/supabase/server";

// Antes e depois das clientes, mostrados na home. A equipe cadastra as fotos no painel
// (/equipe/fotos); elas ficam no Storage do Supabase, no bucket público "antes-depois".
export const BUCKET_ANTES_DEPOIS = "antes-depois";

export type Transformacao = {
  id: string;
  antes: string; // URL da foto; vazia = arte provisória
  depois: string;
  servico: string;
  legenda: string | null;
};

// Enquanto não houver fotos cadastradas, a home mostra estes exemplos com arte provisória.
export const TRANSFORMACOES_EXEMPLO: Transformacao[] = [
  { id: "exemplo-1", antes: "", depois: "", servico: "Corte + definição", legenda: "Cachos 3B, primeira visita" },
  { id: "exemplo-2", antes: "", depois: "", servico: "Transição capilar", legenda: "Seis meses de acompanhamento" },
  { id: "exemplo-3", antes: "", depois: "", servico: "Hidratação profunda", legenda: "Crespos 4A, mais brilho e menos frizz" },
  { id: "exemplo-4", antes: "", depois: "", servico: "Coloração", legenda: "Mechas cobre com cachos definidos" },
];

export async function listarTransformacoes(): Promise<Transformacao[]> {
  if (!env.supabaseConfigurado()) return [];
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("antes_depois")
    .select("id, antes_caminho, depois_caminho, servico, legenda")
    .eq("ativo", true)
    .order("ordem")
    .order("criado_em", { ascending: false });
  const url = (caminho: string) => supabase.storage.from(BUCKET_ANTES_DEPOIS).getPublicUrl(caminho).data.publicUrl;
  return (data ?? []).map((t) => ({ id: t.id, antes: url(t.antes_caminho), depois: url(t.depois_caminho), servico: t.servico, legenda: t.legenda }));
}
