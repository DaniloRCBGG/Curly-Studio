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

// Enquanto não houver fotos cadastradas no painel, a home mostra estas fotos de teste (enviadas pelo Danilo
// em 09/10/2026). Antes de publicar o site, confirmar a autorização das clientes ou trocar pelas do painel.
const TESTE = "/midia/antes-depois-teste";
export const TRANSFORMACOES_EXEMPLO: Transformacao[] = [
  { id: "teste-1", antes: `${TESTE}/1-antes.webp`, depois: `${TESTE}/1-depois.webp`, servico: "Corte + tratamento", legenda: null },
  { id: "teste-2", antes: `${TESTE}/2-antes.webp`, depois: `${TESTE}/2-depois.webp`, servico: "Coloração cobre", legenda: null },
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
