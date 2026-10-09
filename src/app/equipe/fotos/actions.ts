"use server";

import { revalidatePath } from "next/cache";
import { exigirEquipe } from "@/lib/auth/sessao";
import { BUCKET_ANTES_DEPOIS } from "@/lib/antes-depois";

const texto = (form: FormData, nome: string) => String(form.get(nome) ?? "").trim();
const TIPOS = ["image/webp", "image/jpeg", "image/png"];
const LIMITE = 5 * 1024 * 1024;

function atualizarTelas() {
  revalidatePath("/");
  revalidatePath("/equipe/fotos");
}

function foto(form: FormData, nome: string) {
  const f = form.get(nome);
  return f instanceof File && f.size > 0 && f.size <= LIMITE && TIPOS.includes(f.type) ? f : null;
}

// Novo antes e depois. As fotos chegam já reduzidas pelo navegador (FormEnvio.tsx).
export async function enviarAntesDepois(form: FormData): Promise<{ erro?: string }> {
  const { supabase } = await exigirEquipe();
  const antes = foto(form, "antes");
  const depois = foto(form, "depois");
  const servico = texto(form, "servico").slice(0, 80);
  const legenda = texto(form, "legenda").slice(0, 120);
  if (!antes || !depois) return { erro: "Escolha as duas fotos (antes e depois). Cada uma pode ter até 5 MB." };
  if (!servico) return { erro: "Diga qual foi o serviço." };
  if (form.get("autorizado") !== "on") return { erro: "Só publique com a autorização da cliente." };

  const base = crypto.randomUUID();
  const ext = (f: File) => (f.type === "image/png" ? "png" : f.type === "image/jpeg" ? "jpg" : "webp");
  const caminhos = { antes: `${base}-antes.${ext(antes)}`, depois: `${base}-depois.${ext(depois)}` };
  const storage = supabase.storage.from(BUCKET_ANTES_DEPOIS);
  for (const [nome, arquivo] of [["antes", antes], ["depois", depois]] as const) {
    const { error } = await storage.upload(caminhos[nome], arquivo, { contentType: arquivo.type, cacheControl: "31536000" });
    if (error) {
      await storage.remove(Object.values(caminhos));
      return { erro: "Não consegui enviar as fotos. Tente de novo em instantes." };
    }
  }

  const { data: ultima } = await supabase.from("antes_depois").select("ordem").order("ordem", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("antes_depois").insert({
    antes_caminho: caminhos.antes,
    depois_caminho: caminhos.depois,
    servico,
    legenda: legenda || null,
    autorizado: true,
    ordem: (ultima?.ordem ?? 0) + 1,
  });
  if (error) {
    await storage.remove(Object.values(caminhos));
    return { erro: "Não consegui salvar. Tente de novo em instantes." };
  }
  atualizarTelas();
  return {};
}

export async function salvarAntesDepois(form: FormData) {
  const { supabase } = await exigirEquipe();
  const servico = texto(form, "servico").slice(0, 80);
  if (!servico) return;
  await supabase
    .from("antes_depois")
    .update({ servico, legenda: texto(form, "legenda").slice(0, 120) || null, ativo: form.get("ativo") === "on" })
    .eq("id", texto(form, "id"));
  atualizarTelas();
}

// Sobe ou desce uma posição na home, trocando a ordem com a vizinha.
export async function moverAntesDepois(form: FormData) {
  const { supabase } = await exigirEquipe();
  const { data } = await supabase.from("antes_depois").select("id, ordem").order("ordem").order("criado_em", { ascending: false });
  const lista = data ?? [];
  const i = lista.findIndex((t) => t.id === texto(form, "id"));
  const j = texto(form, "direcao") === "subir" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  await Promise.all(lista.map((t, n) => (t.ordem === n + 1 ? null : supabase.from("antes_depois").update({ ordem: n + 1 }).eq("id", t.id))));
  atualizarTelas();
}

export async function apagarAntesDepois(form: FormData) {
  const { supabase } = await exigirEquipe();
  const { data } = await supabase.from("antes_depois").select("antes_caminho, depois_caminho").eq("id", texto(form, "id")).maybeSingle();
  if (!data) return;
  await supabase.from("antes_depois").delete().eq("id", texto(form, "id"));
  await supabase.storage.from(BUCKET_ANTES_DEPOIS).remove([data.antes_caminho, data.depois_caminho]);
  atualizarTelas();
}
