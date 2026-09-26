import Link from "next/link";
import { exigirEquipe } from "@/lib/auth/sessao";
import { emEmbalagens, estoqueBaixo, formatarQuantidade, type Produto } from "@/lib/estoque";
import { salvarProduto } from "./actions";
import { CamposProduto } from "./CamposProduto";

// Estoque de produtos (RF08–RF14, RN08): funcionárias e gerente.
export default async function Estoque({ searchParams }: PageProps<"/equipe/estoque">) {
  const { busca, filtro, erro } = await searchParams;
  const termo = typeof busca === "string" ? busca.trim() : "";
  const soBaixo = filtro === "baixo";
  const { supabase } = await exigirEquipe();

  let consulta = supabase.from("produtos").select("*").order("ativo", { ascending: false }).order("nome");
  if (termo) consulta = consulta.or(`nome.ilike.%${termo.replace(/[,()%]/g, "")}%,marca.ilike.%${termo.replace(/[,()%]/g, "")}%`);
  const [{ data }, { data: fornecedores }] = await Promise.all([
    consulta,
    supabase.from("fornecedores").select("id, nome").eq("ativo", true).order("nome"),
  ]);
  const produtos = ((data ?? []) as Produto[]).map((p) => ({ ...p, estoque_atual: Number(p.estoque_atual), estoque_minimo: Number(p.estoque_minimo), tamanho_embalagem: Number(p.tamanho_embalagem) }));
  const baixos = produtos.filter(estoqueBaixo);
  const lista = soBaixo ? baixos : produtos;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="titulo text-4xl">estoque</h1>
        <Link href="/equipe/estoque/fornecedores" className="botao-secundario py-2 text-sm">
          Fornecedores
        </Link>
      </div>

      {baixos.length > 0 && (
        <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <strong>{baixos.length === 1 ? "1 produto está" : `${baixos.length} produtos estão`} com estoque baixo:</strong>{" "}
          {baixos.map((p) => p.nome).join(", ")}.{" "}
          {!soBaixo && (
            <Link href="/equipe/estoque?filtro=baixo" className="font-medium underline underline-offset-4">
              Ver só esses
            </Link>
          )}
        </p>
      )}
      {typeof erro === "string" && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{erro}</p>}

      <form className="flex flex-wrap gap-2">
        <input name="busca" defaultValue={termo} placeholder="Buscar produto ou marca" className="campo max-w-sm" />
        <button className="botao-secundario py-2">Buscar</button>
        {(termo || soBaixo) && (
          <Link href="/equipe/estoque" className="self-center px-2 text-sm text-folha-escura hover:underline">
            Ver todos
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-terra/10 bg-white/70">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-terra/10 text-terra/70">
            <tr>
              <th className="px-4 py-3 font-medium sm:px-5">Produto</th>
              <th className="px-5 py-3 font-medium">Em estoque</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Mínimo</th>
              <th className="px-5 py-3 font-medium"><span className="sr-only">Situação</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terra/10">
            {lista.map((p) => (
              <tr key={p.id} className={p.ativo ? "" : "text-terra/50"}>
                <td className="px-5 py-3">
                  <Link href={`/equipe/estoque/${p.id}`} className="font-medium text-terra hover:text-folha-escura hover:underline">
                    {p.nome}
                  </Link>
                  {p.marca && <span className="ml-2 text-terra/60">{p.marca}</span>}
                </td>
                <td className="px-5 py-3">
                  {formatarQuantidade(p.estoque_atual, p.unidade)}
                  {emEmbalagens(p.estoque_atual, p.tamanho_embalagem, p.unidade) && (
                    <span className="block text-xs text-terra/60">{emEmbalagens(p.estoque_atual, p.tamanho_embalagem, p.unidade)}</span>
                  )}
                </td>
                <td className="hidden px-5 py-3 sm:table-cell">{formatarQuantidade(p.estoque_minimo, p.unidade)}</td>
                <td className="px-5 py-3 text-right">
                  {!p.ativo ? (
                    <span className="text-xs">inativo</span>
                  ) : estoqueBaixo(p) ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                      {p.estoque_atual === 0 ? "acabou" : "repor"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-folha/15 px-3 py-1 text-xs font-medium text-folha-escura">ok</span>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-4 text-terra/70">
                  {produtos.length === 0 ? "Nenhum produto cadastrado ainda." : "Nenhum produto encontrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <details className="cartao" open={produtos.length === 0}>
        <summary className="titulo cursor-pointer text-2xl">cadastrar produto</summary>
        <form action={salvarProduto} className="mt-4 grid gap-3 sm:grid-cols-6">
          <CamposProduto fornecedores={fornecedores ?? []} />
          <div className="sm:col-span-3">
            <label className="rotulo" htmlFor="estoque_inicial">Quanto já tem no salão</label>
            <div className="flex gap-2">
              <input className="campo" id="estoque_inicial" name="estoque_inicial" inputMode="decimal" placeholder="0" />
              <select className="campo w-auto" name="inicial_em" aria-label="Unidade da quantidade inicial" defaultValue="embalagens">
                <option value="embalagens">embalagens</option>
                <option value="unidade">ml, g ou unidades</option>
              </select>
            </div>
          </div>
          <div className="self-end sm:col-span-3 sm:text-right">
            <button className="botao py-2">Cadastrar produto</button>
          </div>
        </form>
      </details>
    </div>
  );
}
