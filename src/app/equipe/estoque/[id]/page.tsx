import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirEquipe } from "@/lib/auth/sessao";
import { descreverEmbalagem, emEmbalagens, estoqueBaixo, formatarQuantidade, type Produto, type Unidade } from "@/lib/estoque";
import { reais } from "@/lib/servicos";
import { movimentar, salvarProduto } from "../actions";
import { CamposProduto } from "../CamposProduto";

type Movimentacao = { id: string; tipo: "entrada" | "saida" | "ajuste"; quantidade: number; estoque_depois: number; valor_total: number | null; observacao: string | null; criado_em: string; feita_por: string | null; agendamento_id: string | null };

const TIPO = { entrada: "Entrada", saida: "Saída", ajuste: "Contagem" };

const dataHora = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

function SeletorUnidade({ unidade, tamanho, padrao = "embalagens", nome = "em" }: { unidade: Unidade; tamanho: number; padrao?: string; nome?: string }) {
  if (unidade === "un" && tamanho === 1) return <input type="hidden" name={nome} value="unidade" />;
  return (
    <select className="campo w-auto" name={nome} aria-label="Unidade da quantidade" defaultValue={padrao}>
      <option value="embalagens">embalagens</option>
      <option value="unidade">{unidade === "un" ? "unidades" : unidade}</option>
    </select>
  );
}

function FormMovimento({ produto, tipo, titulo, ajuda, botao, padrao }: { produto: Produto; tipo: string; titulo: string; ajuda: string; botao: string; padrao: string }) {
  return (
    <form action={movimentar} className="cartao space-y-3">
      <input type="hidden" name="produto_id" value={produto.id} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="tamanho_embalagem" value={produto.tamanho_embalagem} />
      <h2 className="titulo text-2xl">{titulo}</h2>
      <p className="text-sm text-terra/70">{ajuda}</p>
      <div className="flex gap-2">
        <input className="campo" name="quantidade" inputMode="decimal" aria-label="Quantidade" placeholder="Quantidade" required />
        <SeletorUnidade unidade={produto.unidade} tamanho={produto.tamanho_embalagem} padrao={padrao} />
      </div>
      {tipo === "entrada" && <input className="campo" name="valor_total" inputMode="decimal" aria-label="Valor pago (R$)" placeholder="Valor pago (R$, opcional)" />}
      <input className="campo" name="observacao" aria-label="Observação" placeholder="Observação (opcional)" />
      <button className="botao w-full py-2">{botao}</button>
    </form>
  );
}

export default async function ProdutoEstoque({ params, searchParams }: PageProps<"/equipe/estoque/[id]">) {
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const { supabase } = await exigirEquipe();
  const [{ data }, { data: historico }, { data: fornecedores }, { data: equipe }] = await Promise.all([
    supabase.from("produtos").select("*").eq("id", id).maybeSingle(),
    supabase.from("movimentacoes_estoque").select("id, tipo, quantidade, estoque_depois, valor_total, observacao, criado_em, feita_por, agendamento_id").eq("produto_id", id).order("criado_em", { ascending: false }).limit(50),
    supabase.from("fornecedores").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("funcionarias").select("usuario_id, nome").not("usuario_id", "is", null),
  ]);
  if (!data) notFound();
  const nomes = new Map((equipe ?? []).map((f) => [f.usuario_id, f.nome]));
  const p = { ...(data as Produto), estoque_atual: Number(data.estoque_atual), estoque_minimo: Number(data.estoque_minimo), tamanho_embalagem: Number(data.tamanho_embalagem) };
  const baixo = estoqueBaixo(p);
  const embalagens = emEmbalagens(p.estoque_atual, p.tamanho_embalagem, p.unidade);

  return (
    <div className="space-y-6">
      <Link href="/equipe/estoque" className="text-sm text-folha-escura underline-offset-4 hover:underline">
        Voltar ao estoque
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo text-4xl">{p.nome.toLowerCase()}</h1>
          <p className="text-terra/70">
            {[p.marca, descreverEmbalagem(p.tamanho_embalagem, p.unidade), p.valor_embalagem != null ? reais(Number(p.valor_embalagem)) : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className={`rounded-2xl px-5 py-3 text-right ${baixo ? "bg-amber-50 text-amber-950" : "bg-folha/15"}`}>
          <p className="text-2xl font-medium">{formatarQuantidade(p.estoque_atual, p.unidade)}</p>
          <p className="text-sm">
            {embalagens ? `${embalagens} · ` : ""}mínimo {formatarQuantidade(p.estoque_minimo, p.unidade)}
            {baixo && <strong className="block">{p.estoque_atual === 0 ? "Acabou: precisa comprar" : "Estoque baixo: hora de repor"}</strong>}
          </p>
        </div>
      </div>

      {typeof erro === "string" && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{erro}</p>}
      {ok && <p role="status" className="rounded-xl bg-folha/15 p-3">Salvo.</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <FormMovimento produto={p} tipo="entrada" titulo="chegou produto" ajuda="Compra ou reposição. Soma ao estoque." botao="Registrar entrada" padrao="embalagens" />
        <FormMovimento produto={p} tipo="saida" titulo="usei ou saiu" ajuda="Uso em atendimento, perda ou vencimento. Tira do estoque." botao="Registrar saída" padrao={p.unidade === "un" ? "embalagens" : "unidade"} />
        <FormMovimento produto={p} tipo="ajuste" titulo="contei o estoque" ajuda="Informe o total que tem de verdade. O sistema corrige a diferença." botao="Salvar contagem" padrao="unidade" />
      </div>

      <section>
        <h2 className="titulo text-3xl">histórico</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-terra/10 bg-white/70">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-terra/10 text-terra/70">
              <tr>
                <th className="px-5 py-3 font-medium">Quando</th>
                <th className="px-5 py-3 font-medium">Movimento</th>
                <th className="px-5 py-3 font-medium">Ficou</th>
                <th className="px-5 py-3 font-medium">Quem</th>
                <th className="px-5 py-3 font-medium">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terra/10">
              {((historico ?? []) as Movimentacao[]).map((m) => {
                const q = Number(m.quantidade);
                return (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap px-5 py-3">{dataHora(m.criado_em)}</td>
                    <td className="px-5 py-3">
                      {TIPO[m.tipo]}{" "}
                      <span className={q > 0 ? "text-folha-escura" : "text-red-800"}>
                        {q > 0 ? "+" : "−"}{formatarQuantidade(Math.abs(q), p.unidade)}
                      </span>
                      {m.valor_total != null && <span className="text-terra/60"> · {reais(Number(m.valor_total))}</span>}
                    </td>
                    <td className="px-5 py-3">{formatarQuantidade(Number(m.estoque_depois), p.unidade)}</td>
                    <td className="px-5 py-3">
                      {nomes.get(m.feita_por) ?? "—"}
                      {m.agendamento_id && <span className="block text-xs text-terra/60">baixa automática</span>}
                    </td>
                    <td className="px-5 py-3 text-terra/70">{m.observacao}</td>
                  </tr>
                );
              })}
              {historico?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-4 text-terra/70">Nenhuma movimentação ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <details className="cartao">
        <summary className="titulo cursor-pointer text-2xl">editar produto</summary>
        <form action={salvarProduto} className="mt-4 grid gap-3 sm:grid-cols-6">
          <input type="hidden" name="id" value={p.id} />
          <CamposProduto produto={p} fornecedores={fornecedores ?? []} />
          <fieldset className="space-y-2 sm:col-span-6">
            <legend className="rotulo">Estoque mínimo (aviso de repor)</legend>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="minimo_manual" defaultChecked={p.minimo_manual} className="mt-1 accent-folha-escura" />
              Definir à mão. Sem marcar, o mínimo é 10% do estoque e se atualiza a cada entrada.
            </label>
            <div className="flex max-w-sm gap-2">
              <input className="campo" name="estoque_minimo" inputMode="decimal" aria-label="Estoque mínimo" defaultValue={p.estoque_minimo} />
              <SeletorUnidade unidade={p.unidade} tamanho={p.tamanho_embalagem} padrao="unidade" nome="minimo_em" />
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <input type="checkbox" name="ativo" defaultChecked={p.ativo} className="accent-folha-escura" />
            Ativo (o salão ainda usa este produto)
          </label>
          <div className="sm:col-span-3 sm:text-right">
            <button className="botao py-2">Salvar</button>
          </div>
        </form>
      </details>
    </div>
  );
}
