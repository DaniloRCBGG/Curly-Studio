import Link from "next/link";
import { exigirEquipe } from "@/lib/auth/sessao";
import { UNIDADES, type Unidade } from "@/lib/estoque";
import { salvarConsumo } from "../actions";

const TAMANHOS = ["P", "M", "G", "GG"] as const;

type ProdutoResumo = { id: string; nome: string; unidade: Unidade };
type Consumo = { servico_id: string; produto_id: string; tamanho: (typeof TAMANHOS)[number]; quantidade: number };

// Consumo de produto por serviço (RF11, RF12): base da baixa automática ao concluir o atendimento.
export default async function ConsumoPorServico({ searchParams }: PageProps<"/equipe/estoque/consumo">) {
  const { ok, erro } = await searchParams;
  const { supabase } = await exigirEquipe();
  const [{ data: servicos }, { data: produtos }, { data: consumo }] = await Promise.all([
    supabase.from("servicos").select("id, nome, ativo").order("ativo", { ascending: false }).order("ordem").order("nome"),
    supabase.from("produtos").select("id, nome, unidade").eq("ativo", true).order("nome"),
    supabase.from("consumo_servico").select("servico_id, produto_id, tamanho, quantidade"),
  ]);
  const listaProdutos = (produtos ?? []) as ProdutoResumo[];
  const porId = new Map(listaProdutos.map((p) => [p.id, p]));
  const linhas = (consumo ?? []) as Consumo[];

  return (
    <div className="space-y-6">
      <Link href="/equipe/estoque" className="text-sm text-folha-escura underline-offset-4 hover:underline">
        Voltar ao estoque
      </Link>
      <div className="max-w-3xl space-y-2">
        <h1 className="titulo text-4xl">consumo por serviço</h1>
        <p className="text-terra/75">
          Quanto cada serviço gasta de cada produto, por tamanho de cabelo. Quando um atendimento é marcado como
          concluído na agenda, o sistema tira essas quantidades do estoque sozinho. Se o gasto não muda com o tamanho,
          repita o mesmo número nas quatro colunas. Atendimento sem tamanho usa a coluna M.
        </p>
      </div>
      {typeof erro === "string" && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{erro}</p>}
      {listaProdutos.length === 0 && <p className="cartao text-terra/75">Cadastre os produtos no estoque primeiro.</p>}

      {(servicos ?? []).map((s) => {
        const doServico = linhas.filter((l) => l.servico_id === s.id);
        const ligados = [...new Set(doServico.map((l) => l.produto_id))].map((id) => porId.get(id)).filter((p): p is ProdutoResumo => !!p);
        const valor = (produto: string, t: string) => doServico.find((l) => l.produto_id === produto && l.tamanho === t)?.quantidade ?? "";
        return (
          <details key={s.id} id={`s-${s.id}`} className="cartao scroll-mt-6" open={ok === s.id}>
            <summary className="cursor-pointer">
              <span className="font-medium">{s.nome}</span>
              <span className="ml-2 text-sm text-terra/70">
                {ligados.length === 0 ? "nenhum produto informado" : ligados.map((p) => p.nome).join(", ")}
                {!s.ativo && " · serviço inativo"}
              </span>
            </summary>
            {ok === s.id && <p role="status" className="mt-4 rounded-xl bg-folha/15 p-3">Salvo.</p>}
            <form action={salvarConsumo} className="mt-4 space-y-4">
              <input type="hidden" name="servico_id" value={s.id} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead className="text-terra/70">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Produto</th>
                      {TAMANHOS.map((t) => (
                        <th key={t} className="w-24 px-1 py-2 font-medium">Cabelo {t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ligados.map((p) => (
                      <tr key={p.id}>
                        <td className="py-1 pr-3">
                          {p.nome} <span className="text-terra/60">({UNIDADES[p.unidade]})</span>
                        </td>
                        {TAMANHOS.map((t) => (
                          <td key={t} className="px-1 py-1">
                            <input className="campo px-3 py-2" name={`q|${p.id}|${t}`} inputMode="decimal" defaultValue={valor(p.id, t)} aria-label={`${p.nome}, cabelo ${t}`} />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td className="py-1 pr-3">
                        <select className="campo px-3 py-2" name="novo_produto" aria-label="Adicionar produto" defaultValue="">
                          <option value="">Adicionar produto…</option>
                          {listaProdutos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome} ({UNIDADES[p.unidade]})
                            </option>
                          ))}
                        </select>
                      </td>
                      {TAMANHOS.map((t) => (
                        <td key={t} className="px-1 py-1">
                          <input className="campo px-3 py-2" name={`novo|${t}`} inputMode="decimal" aria-label={`Produto adicionado, cabelo ${t}`} />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-terra/60">Para tirar um produto do serviço, apague os números dele e salve.</p>
                <button className="botao py-2">Salvar consumo</button>
              </div>
            </form>
          </details>
        );
      })}
    </div>
  );
}
