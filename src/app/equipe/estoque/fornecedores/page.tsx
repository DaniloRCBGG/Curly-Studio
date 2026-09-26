import Link from "next/link";
import { exigirEquipe } from "@/lib/auth/sessao";
import { salvarFornecedor } from "../actions";

type Fornecedor = { id: string; nome: string; telefone: string | null; email: string | null; observacao: string | null; ativo: boolean };

function FormFornecedor({ fornecedor }: { fornecedor?: Fornecedor }) {
  const campo = (nome: string) => (fornecedor ? `${nome}-${fornecedor.id}` : nome);
  return (
    <form action={salvarFornecedor} className="grid gap-3 sm:grid-cols-2">
      {fornecedor && <input type="hidden" name="id" value={fornecedor.id} />}
      <div>
        <label className="rotulo" htmlFor={campo("nome")}>Nome</label>
        <input className="campo" id={campo("nome")} name="nome" defaultValue={fornecedor?.nome} required />
      </div>
      <div>
        <label className="rotulo" htmlFor={campo("telefone")}>Telefone ou WhatsApp</label>
        <input className="campo" id={campo("telefone")} name="telefone" type="tel" defaultValue={fornecedor?.telefone ?? ""} />
      </div>
      <div>
        <label className="rotulo" htmlFor={campo("email")}>E-mail</label>
        <input className="campo" id={campo("email")} name="email" type="email" defaultValue={fornecedor?.email ?? ""} />
      </div>
      <div>
        <label className="rotulo" htmlFor={campo("observacao")}>Observação</label>
        <input className="campo" id={campo("observacao")} name="observacao" defaultValue={fornecedor?.observacao ?? ""} placeholder="Ex.: entrega às quintas" />
      </div>
      {fornecedor && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ativo" defaultChecked={fornecedor.ativo} className="accent-folha-escura" />
          Ativo
        </label>
      )}
      <div className={fornecedor ? "sm:text-right" : "sm:col-span-2 sm:text-right"}>
        <button className="botao py-2">{fornecedor ? "Salvar" : "Adicionar fornecedor"}</button>
      </div>
    </form>
  );
}

// Fornecedores (RF15).
export default async function Fornecedores({ searchParams }: PageProps<"/equipe/estoque/fornecedores">) {
  const { erro, ok } = await searchParams;
  const { supabase } = await exigirEquipe();
  const [{ data: fornecedores }, { data: produtos }] = await Promise.all([
    supabase.from("fornecedores").select("id, nome, telefone, email, observacao, ativo").order("ativo", { ascending: false }).order("nome"),
    supabase.from("produtos").select("fornecedor_id").eq("ativo", true),
  ]);
  const contagem = (id: string) => (produtos ?? []).filter((p) => p.fornecedor_id === id).length;

  return (
    <div className="space-y-6">
      <Link href="/equipe/estoque" className="text-sm text-folha-escura underline-offset-4 hover:underline">
        Voltar ao estoque
      </Link>
      <h1 className="titulo text-4xl">fornecedores</h1>
      {typeof erro === "string" && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{erro}</p>}
      {ok && <p role="status" className="rounded-xl bg-folha/15 p-3">Salvo.</p>}
      <div className="cartao">
        <h2 className="titulo mb-4 text-2xl">novo fornecedor</h2>
        <FormFornecedor />
      </div>
      {((fornecedores ?? []) as Fornecedor[]).map((f) => {
        const n = contagem(f.id);
        const whatsapp = f.telefone ? `https://wa.me/55${f.telefone}` : null;
        return (
          <details key={f.id} className="cartao">
            <summary className="cursor-pointer">
              <span className="font-medium">{f.nome}</span>
              <span className="ml-2 text-sm text-terra/70">
                {n === 1 ? "1 produto" : `${n} produtos`}
                {f.observacao ? ` · ${f.observacao}` : ""}
                {!f.ativo && " · inativo"}
              </span>
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="ml-3 text-sm font-medium text-folha-escura hover:underline">
                  WhatsApp
                </a>
              )}
            </summary>
            <div className="mt-4">
              <FormFornecedor fornecedor={f} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
