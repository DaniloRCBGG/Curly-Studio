// Complementos da tabela de valores, transcritos do Canva "Tabela de serviços / Tabela de produtos" (set/2026).

import type { Grupo } from "@/lib/servicos-tabela";

// Os serviços e seus preços por tamanho ficam no banco (painel da equipe, /equipe/servicos).
// Aqui ficam só os adicionais de cada grupo e os produtos, que ainda não têm cadastro no painel.

export type Adicional = { nome: string; preco: number };
export type BlocoAdicionais = { titulo: string; itens: Adicional[]; observacoes?: string[] };

export const adicionaisPorGrupo: Partial<Record<Grupo, BlocoAdicionais[]>> = {
  coloracao: [
    {
      titulo: "Incluir na coloração",
      itens: [
        { nome: "Corte", preco: 110 },
        { nome: "Tratamento", preco: 170 },
        { nome: "Tratamento + corte", preco: 230 },
        { nome: "Lavagem e finalização", preco: 80 },
      ],
    },
  ],
  mechas: [
    {
      titulo: "Incluir nas mechas",
      itens: [
        { nome: "Tratamento", preco: 90 },
        { nome: "Tratamento + corte", preco: 180 },
      ],
      observacoes: ["Só é considerado retoque o cabelo feito há até 3 meses.", "Serviço de topo e contorno custa 60% do valor da tabela."],
    },
  ],
  ruivos: [
    {
      titulo: "Incluir no ruivo",
      itens: [
        { nome: "Tratamento", preco: 90 },
        { nome: "Tratamento + corte", preco: 180 },
      ],
      observacoes: ["É considerado retoque até 3 cm de raiz: 60% do valor correspondente na tabela."],
    },
  ],
};

export type Produto = { nome: string; preco: number };

export const gruposProdutos: { titulo: string; itens: Produto[]; destaque?: Produto }[] = [
  {
    titulo: "Linha Dhonna",
    itens: [
      { nome: "Condicionador", preco: 40 },
      { nome: "Shampoo", preco: 40 },
      { nome: "Creme de pentear", preco: 40 },
      { nome: "Gel creme", preco: 40 },
      { nome: "Máscara crespos", preco: 55 },
      { nome: "Máscara Nano Link", preco: 85 },
      { nome: "Primer", preco: 75 },
      { nome: "Fixador 10 em 1", preco: 85 },
    ],
    destaque: { nome: "Kit com 4 produtos", preco: 150 },
  },
  {
    titulo: "Acessórios",
    itens: [
      { nome: "Touca difusora", preco: 50 },
      { nome: "Touca de cetim", preco: 30 },
      { nome: "Fronha de cetim", preco: 25 },
    ],
  },
];
