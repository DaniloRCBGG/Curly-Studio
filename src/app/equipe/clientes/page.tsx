import Link from "next/link";
import { exigirEquipe } from "@/lib/auth/sessao";
import { cadastrarCliente } from "../actions";

export default async function Clientes({ searchParams }: PageProps<"/equipe/clientes">) {
  const { busca, erro } = await searchParams;
  const termo = typeof busca === "string" ? busca.trim() : "";
  const { supabase } = await exigirEquipe();
  let consulta = supabase.from("clientes").select("id, nome, telefone, bairro, usuario_id").order("nome").limit(50);
  if (termo) {
    const digitos = termo.replace(/\D/g, "");
    consulta = digitos.length >= 4 ? consulta.ilike("telefone", `%${digitos}%`) : consulta.ilike("nome", `%${termo}%`);
  }
  const { data: clientes } = await consulta;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1 className="titulo text-4xl">clientes</h1>
        <form className="mt-4 flex gap-2">
          <input name="busca" defaultValue={termo} placeholder="Buscar por nome ou telefone" className="campo" />
          <button className="botao-secundario">Buscar</button>
        </form>
        <ul className="mt-4 divide-y divide-terra/10 rounded-2xl border border-terra/10 bg-white/70">
          {(clientes ?? []).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <span>
                <span className="font-medium">{c.nome}</span>
                <span className="ml-2 text-sm text-terra/70">
                  {c.telefone}
                  {c.bairro ? ` · ${c.bairro}` : ""}
                  {c.usuario_id ? " · tem conta no site" : ""}
                </span>
              </span>
              <Link href={`/equipe/novo?cliente=${c.id}`} className="text-sm font-medium text-folha-escura hover:underline">
                Agendar
              </Link>
            </li>
          ))}
          {clientes?.length === 0 && <li className="px-5 py-3 text-terra/70">Nenhuma cliente encontrada.</li>}
        </ul>
      </section>
      <section>
        <h2 className="titulo text-3xl">cadastrar na chegada</h2>
        {typeof erro === "string" && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-900">{erro}</p>}
        <form action={cadastrarCliente} className="cartao mt-4 space-y-3">
          <div>
            <label className="rotulo" htmlFor="nome">Nome</label>
            <input className="campo" id="nome" name="nome" required />
          </div>
          <div>
            <label className="rotulo" htmlFor="telefone">Telefone</label>
            <input className="campo" id="telefone" name="telefone" type="tel" required />
          </div>
          <div>
            <label className="rotulo" htmlFor="cpf">CPF (opcional)</label>
            <input className="campo" id="cpf" name="cpf" inputMode="numeric" />
          </div>
          <div>
            <label className="rotulo" htmlFor="email">E-mail (opcional)</label>
            <input className="campo" id="email" name="email" type="email" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="rotulo" htmlFor="bairro">Bairro</label>
              <input className="campo" id="bairro" name="bairro" />
            </div>
            <div>
              <label className="rotulo" htmlFor="cidade">Cidade</label>
              <input className="campo" id="cidade" name="cidade" defaultValue="Niterói" />
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="aceite" className="mt-1 accent-folha-escura" />
            A cliente autorizou o uso dos dados conforme a política de privacidade.
          </label>
          <button className="botao w-full">Cadastrar e agendar</button>
        </form>
      </section>
    </div>
  );
}
