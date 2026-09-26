// Tabela de valores do salão, transcrita do Canva "Tabela de serviços / Tabela de produtos" (set/2026).
// Para mudar um preço, edite aqui: a aba /valores é montada a partir deste arquivo.

export const tamanhos = ["P", "M", "G", "GG"] as const;

export type ServicoTabela = {
  nome: string;
  descricao?: string;
  precos: [number, number, number, number]; // P, M, G, GG
  aPartirDe?: boolean;
  observacoes?: string[];
};

export type Adicional = { nome: string; preco: number };

export type GrupoServicos = {
  id: string;
  titulo: string;
  servicos: ServicoTabela[];
  adicionais?: { titulo: string; itens: Adicional[]; observacoes?: string[] }[];
};

export const gruposServicos: GrupoServicos[] = [
  {
    id: "cuidados",
    titulo: "Corte e cuidados",
    servicos: [
      { nome: "Corte", precos: [120, 140, 160, 180], observacoes: ["Inclui lavagem e finalização."] },
      { nome: "Tratamento", precos: [170, 180, 190, 210], observacoes: ["Inclui lavagem e finalização.", "Combo com corte: incluir R$ 90."] },
      { nome: "SOS Recuperação", precos: [190, 200, 210, 230], observacoes: ["Combo com corte: incluir R$ 90."] },
      { nome: "Finalização premium", precos: [70, 80, 100, 120] },
      { nome: "Clubinho", descricao: "Cronograma capilar em 4 visitas.", precos: [380, 400, 440, 480] },
    ],
  },
  {
    id: "coloracao",
    titulo: "Coloração",
    servicos: [
      { nome: "Retoque de raiz", precos: [120, 130, 140, 160] },
      { nome: "Coloração total", precos: [160, 180, 210, 240], aPartirDe: true },
    ],
    adicionais: [
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
  },
  {
    id: "mechas",
    titulo: "Mechas",
    servicos: [
      { nome: "Morena iluminada", precos: [350, 400, 480, 550], aPartirDe: true },
      { nome: "Mechas super claras", precos: [500, 550, 600, 700], aPartirDe: true },
    ],
    adicionais: [
      {
        titulo: "Incluir nas mechas",
        itens: [
          { nome: "Tratamento", preco: 90 },
          { nome: "Tratamento + corte", preco: 180 },
        ],
        observacoes: ["Só é considerado retoque o cabelo feito há até 3 meses.", "Serviço de topo e contorno custa 60% do valor da tabela."],
      },
    ],
  },
  {
    id: "ruivos",
    titulo: "Ruivos",
    servicos: [
      { nome: "Ruivo sem descolorir", precos: [250, 300, 380, 450], aPartirDe: true },
      { nome: "Ruivo com descolorante", precos: [350, 450, 500, 600], aPartirDe: true },
    ],
    adicionais: [
      {
        titulo: "Incluir no ruivo",
        itens: [
          { nome: "Tratamento", preco: 90 },
          { nome: "Tratamento + corte", preco: 180 },
        ],
        observacoes: ["É considerado retoque até 3 cm de raiz: 60% do valor correspondente na tabela."],
      },
    ],
  },
];

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
