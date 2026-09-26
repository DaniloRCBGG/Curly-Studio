// Tipos e contas dos serviços, sem acesso ao banco: pode ser usado também em componentes do navegador.

export const TAMANHOS = ["P", "M", "G", "GG"] as const;
export type Tamanho = (typeof TAMANHOS)[number];

// Grupos da tabela de valores, na ordem em que aparecem no site.
export const GRUPOS = [
  { id: "cuidados", titulo: "Corte e cuidados" },
  { id: "coloracao", titulo: "Coloração" },
  { id: "mechas", titulo: "Mechas" },
  { id: "ruivos", titulo: "Ruivos" },
] as const;
export type Grupo = (typeof GRUPOS)[number]["id"];

export type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  grupo: Grupo;
  duracao_minutos: number;
  valor: number;
  valor_sinal: number;
  preco_p: number | null;
  preco_m: number | null;
  preco_g: number | null;
  preco_gg: number | null;
  a_partir_de: boolean;
  observacoes: string | null;
};

// Preços por tamanho [P, M, G, GG], ou null quando o serviço tem preço único.
export function precosPorTamanho(s: Pick<Servico, "preco_p" | "preco_m" | "preco_g" | "preco_gg">): [number, number, number, number] | null {
  if (s.preco_p === null || s.preco_m === null || s.preco_g === null || s.preco_gg === null) return null;
  return [s.preco_p, s.preco_m, s.preco_g, s.preco_gg];
}

// Preço para um tamanho (ou o preço único).
export function precoPara(s: Servico, tamanho?: Tamanho | null): number {
  const precos = precosPorTamanho(s);
  if (!precos || !tamanho) return precos ? precos[0] : s.valor;
  return precos[TAMANHOS.indexOf(tamanho)];
}

export const ehTamanho = (v: unknown): v is Tamanho => typeof v === "string" && (TAMANHOS as readonly string[]).includes(v);

// Serviços agrupados como na tabela de valores (grupos sem serviço ficam de fora).
export function agruparServicos(servicos: Servico[]) {
  return GRUPOS.map((g) => ({ ...g, servicos: servicos.filter((s) => s.grupo === g.id) })).filter((g) => g.servicos.length > 0);
}

export const reais = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

export function duracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
