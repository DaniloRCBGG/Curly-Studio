"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirEquipe } from "@/lib/auth/sessao";
import { lerNumero, paraMenorUnidade } from "@/lib/estoque";

const texto = (form: FormData, nome: string) => String(form.get(nome) ?? "").trim();
const numero = (form: FormData, nome: string) => lerNumero(texto(form, nome));

const ERROS: Record<string, string> = {
  estoque_insuficiente: "A saída é maior do que o que tem no estoque. Confira a quantidade ou faça uma contagem.",
  quantidade_invalida: "Informe uma quantidade maior que zero.",
  sem_permissao: "Só a equipe pode mexer no estoque.",
};

const comErro = (caminho: string, mensagem: string) =>
  `${caminho}${caminho.includes("?") ? "&" : "?"}erro=${encodeURIComponent(mensagem)}`;

// Produtos (RF08–RF10, RF14, RF28) ----------------------------------------------------

export async function salvarProduto(form: FormData) {
  const { supabase } = await exigirEquipe();
  const id = texto(form, "id");
  const voltar = id ? `/equipe/estoque/${id}` : "/equipe/estoque";
  const tamanho = numero(form, "tamanho_embalagem");
  if (!tamanho || tamanho <= 0) redirect(comErro(voltar, "Informe o tamanho da embalagem."));

  const registro: Record<string, unknown> = {
    nome: texto(form, "nome"),
    marca: texto(form, "marca") || null,
    unidade: texto(form, "unidade"),
    tamanho_embalagem: tamanho,
    valor_embalagem: numero(form, "valor_embalagem"),
    fornecedor_id: texto(form, "fornecedor_id") || null,
    ativo: id ? form.get("ativo") === "on" : true,
  };

  if (id) {
    // Mínimo à mão (RF28) ou de volta ao padrão de 10% do estoque atual (RN01).
    const manual = form.get("minimo_manual") === "on";
    const { data: atual } = await supabase.from("produtos").select("estoque_atual").eq("id", id).single();
    registro.minimo_manual = manual;
    registro.estoque_minimo = manual
      ? paraMenorUnidade(numero(form, "estoque_minimo") ?? 0, form.get("minimo_em") === "embalagens", tamanho!)
      : Math.ceil(Number(atual?.estoque_atual ?? 0) * 0.1);
    const { error } = await supabase.from("produtos").update(registro).eq("id", id);
    if (error) redirect(comErro(voltar, "Não foi possível salvar. Confira os campos."));
    revalidatePath("/equipe/estoque");
    redirect(`${voltar}?ok=1`);
  }

  const { data, error } = await supabase.from("produtos").insert(registro).select("id").single();
  if (error || !data) redirect(comErro(voltar, "Não foi possível cadastrar. Confira os campos."));

  // Estoque que já existe no salão entra como primeira movimentação, para o histórico bater.
  const inicial = numero(form, "estoque_inicial");
  if (inicial && inicial > 0) {
    await supabase.rpc("movimentar_estoque", {
      p_produto_id: data.id,
      p_tipo: "entrada",
      p_quantidade: paraMenorUnidade(inicial, form.get("inicial_em") === "embalagens", tamanho!),
      p_observacao: "Estoque inicial",
    });
  }
  revalidatePath("/equipe/estoque");
  redirect(`/equipe/estoque/${data.id}?ok=1`);
}

// Entrada, saída e contagem (RF08, RF12) -------------------------------------------------

export async function movimentar(form: FormData) {
  const { supabase } = await exigirEquipe();
  const id = texto(form, "produto_id");
  const voltar = `/equipe/estoque/${id}`;
  const tipo = texto(form, "tipo");
  if (!["entrada", "saida", "ajuste"].includes(tipo)) redirect(voltar);

  const quantidade = numero(form, "quantidade");
  if (quantidade === null || quantidade < 0) redirect(comErro(voltar, ERROS.quantidade_invalida));
  const tamanho = Number(texto(form, "tamanho_embalagem")) || 1;

  const { error } = await supabase.rpc("movimentar_estoque", {
    p_produto_id: id,
    p_tipo: tipo,
    p_quantidade: paraMenorUnidade(quantidade!, form.get("em") === "embalagens", tamanho),
    p_valor_total: tipo === "entrada" ? numero(form, "valor_total") : null,
    p_observacao: texto(form, "observacao") || null,
  });
  if (error) redirect(comErro(voltar, ERROS[error.message] ?? "Não foi possível registrar."));
  revalidatePath("/equipe", "layout");
  redirect(`${voltar}?ok=1`);
}

// Fornecedores (RF15) ---------------------------------------------------------------

export async function salvarFornecedor(form: FormData) {
  const { supabase } = await exigirEquipe();
  const id = texto(form, "id");
  const registro = {
    nome: texto(form, "nome"),
    telefone: texto(form, "telefone").replace(/\D/g, "") || null,
    email: texto(form, "email") || null,
    observacao: texto(form, "observacao") || null,
    ativo: id ? form.get("ativo") === "on" : true,
  };
  const { error } = id
    ? await supabase.from("fornecedores").update(registro).eq("id", id)
    : await supabase.from("fornecedores").insert(registro);
  if (error) redirect(comErro("/equipe/estoque/fornecedores", "Não foi possível salvar."));
  revalidatePath("/equipe/estoque", "layout");
  redirect("/equipe/estoque/fornecedores?ok=1");
}

// Consumo por serviço (RF11, RF12): quanto cada serviço gasta de cada produto, por tamanho de cabelo.

const TAMANHOS = ["P", "M", "G", "GG"] as const;

export async function salvarConsumo(form: FormData) {
  const { supabase } = await exigirEquipe();
  const servicoId = texto(form, "servico_id");

  // Campos "q|<produto>|<tamanho>" dos produtos já ligados e "novo|<tamanho>" do produto adicionado.
  const novoProduto = texto(form, "novo_produto");
  const linhas: { servico_id: string; produto_id: string; tamanho: string; quantidade: number }[] = [];
  for (const [chave, valor] of form.entries()) {
    const partes = chave.split("|");
    const produto = partes[0] === "q" ? partes[1] : partes[0] === "novo" ? novoProduto : null;
    const tamanho = partes[partes.length - 1];
    if (!produto || !TAMANHOS.includes(tamanho as (typeof TAMANHOS)[number])) continue;
    const quantidade = lerNumero(String(valor));
    if (quantidade === null) continue;
    if (quantidade < 0) redirect(comErro(`/equipe/estoque/consumo`, "Use só números positivos.") + `#s-${servicoId}`);
    if (quantidade > 0) linhas.push({ servico_id: servicoId, produto_id: produto, tamanho, quantidade });
  }
  // O mesmo produto escolhido de novo em "adicionar" substitui a linha que já existia.
  const unicas = [...new Map(linhas.map((l) => [`${l.produto_id}|${l.tamanho}`, l])).values()];

  let { error } = await supabase.from("consumo_servico").delete().eq("servico_id", servicoId);
  if (!error && unicas.length) ({ error } = await supabase.from("consumo_servico").insert(unicas));
  if (error) redirect(comErro("/equipe/estoque/consumo", "Não foi possível salvar o consumo.") + `#s-${servicoId}`);
  revalidatePath("/equipe/estoque/consumo");
  redirect(`/equipe/estoque/consumo?ok=${servicoId}#s-${servicoId}`);
}
