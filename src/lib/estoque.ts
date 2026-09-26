// Conversão e exibição de quantidades de estoque (RF09, RF10, RF12, RN03).
// O banco guarda tudo na menor unidade (ml, g ou unidade); a equipe pensa em embalagens.

export type Unidade = "ml" | "g" | "un";

export const UNIDADES: Record<Unidade, string> = { ml: "ml", g: "g", un: "unidades" };

export type Produto = {
  id: string;
  nome: string;
  marca: string | null;
  unidade: Unidade;
  tamanho_embalagem: number;
  valor_embalagem: number | null;
  fornecedor_id: string | null;
  estoque_atual: number;
  estoque_minimo: number;
  minimo_manual: boolean;
  ativo: boolean;
};

const numero = (valor: number, casas = 2) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: casas }).format(valor);

// Aceita "1,5", "1.5" e "1.000" (milhar) como a equipe digitar.
export function lerNumero(texto: string): number | null {
  let t = texto.trim().replace(/\s/g, "");
  if (t === "") return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// Quantidade digitada (em embalagens ou na menor unidade) convertida para a menor unidade.
export function paraMenorUnidade(quantidade: number, emEmbalagens: boolean, tamanhoEmbalagem: number): number {
  const total = emEmbalagens ? quantidade * tamanhoEmbalagem : quantidade;
  return Math.round(total * 100) / 100;
}

export function formatarQuantidade(valor: number, unidade: Unidade): string {
  if (unidade === "un") return `${numero(valor)} ${valor === 1 ? "unidade" : "unidades"}`;
  if (valor >= 1000) return `${numero(valor / 1000)} ${unidade === "ml" ? "L" : "kg"}`;
  return `${numero(valor)} ${unidade}`;
}

export function descreverEmbalagem(tamanho: number, unidade: Unidade): string {
  if (unidade === "un") return tamanho === 1 ? "avulso" : `pacote com ${numero(tamanho)}`;
  return `embalagem de ${formatarQuantidade(tamanho, unidade)}`;
}

// "2,3 embalagens" para dar noção de quanto sobra; vazio quando a embalagem é unitária.
export function emEmbalagens(valor: number, tamanho: number, unidade: Unidade): string | null {
  if (unidade === "un" && tamanho === 1) return null;
  const qtd = valor / tamanho;
  return `${numero(qtd, 1)} ${qtd === 1 ? "embalagem" : "embalagens"}`;
}

export const estoqueBaixo = (p: Pick<Produto, "estoque_atual" | "estoque_minimo" | "ativo">) =>
  p.ativo && p.estoque_atual <= p.estoque_minimo;
