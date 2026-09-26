import Link from "next/link";
import { CamposEndereco } from "@/components/CamposEndereco";
import { exigirEquipe } from "@/lib/auth/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { cadastrarCliente } from "../actions";

export default async function Clientes({ searchParams }: PageProps<"/equipe/clientes">) {
  const { busca, erro } = await searchParams;
  const termo = typeof busca === "string" ? busca.trim() : "";
  const { supabase, perfil } = await exigirEquipe();
  let consulta = supabase.from("clientes").select("id, nome, telefone, email, bairro, usuario_id").order("nome").limit(50);
  if (termo) {
    const digitos = termo.replace(/\D/g, "");
    consulta = digitos.length >= 4 ? consulta.ilike("telefone", `%${digitos}%`) : consulta.ilike("nome", `%${termo}%`);
  }
  const { data: clientes } = await consulta;
  // Só a gerente baixa a lista de contatos para o WhatsApp do salão.
  const novasParaWhatsapp =
    perfil === "gerente"
      ? ((
          await criarClienteAdmin()
            .from("clientes")
            .select("id", { count: "exact", head: true })
            .not("telefone", "is", null)
            .neq("telefone", "")
            .is("contato_exportado_em", null)
        ).count ?? 0)
      : null;

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
                  {c.telefone ?? c.email}
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
        {novasParaWhatsapp !== null && (
          <div className="cartao mb-8">
            <h2 className="titulo text-3xl">contatos para o whatsapp</h2>
            <p className="mt-2 text-sm text-terra/80">
              {novasParaWhatsapp === 0
                ? "Nenhuma cliente nova desde a última lista."
                : `${novasParaWhatsapp} ${novasParaWhatsapp === 1 ? "cliente nova" : "clientes novas"} para salvar no celular do salão.`}
            </p>
            {novasParaWhatsapp > 0 && (
              <a href="/equipe/clientes/contatos" className="botao mt-4 w-full">
                Baixar contatos novos
              </a>
            )}
            <details className="mt-3 text-sm text-terra/80">
              <summary className="cursor-pointer text-folha-escura">Como salvar no celular</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Baixe a lista no celular do salão (ou mande o arquivo para ele).</li>
                <li>Toque no arquivo .vcf: o celular oferece importar todos os contatos de uma vez.</li>
                <li>Pronto: no WhatsApp, as clientes aparecem pelo nome.</li>
              </ol>
              <p className="mt-2">
                Cada lista traz só quem ainda não saiu em nenhuma.{" "}
                <a href="/equipe/clientes/contatos?todas=1" className="text-folha-escura underline underline-offset-4">
                  Baixar todas de novo
                </a>
              </p>
            </details>
          </div>
        )}
        <h2 className="titulo text-3xl">cadastrar na chegada</h2>
        {typeof erro === "string" && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-900">{erro}</p>}
        <form action={cadastrarCliente} className="cartao mt-4 space-y-3">
          <div>
            <label className="rotulo" htmlFor="nome">Nome</label>
            <input className="campo" id="nome" name="nome" required />
          </div>
          <div>
            <label className="rotulo" htmlFor="telefone">Telefone</label>
            <input className="campo" id="telefone" name="telefone" type="tel" />
          </div>
          <div>
            <label className="rotulo" htmlFor="cpf">CPF (opcional)</label>
            <input className="campo" id="cpf" name="cpf" inputMode="numeric" />
          </div>
          <div>
            <label className="rotulo" htmlFor="email">E-mail</label>
            <p className="-mt-1 mb-1 text-xs text-terra/70">Telefone ou e-mail: pelo menos um dos dois.</p>
            <input className="campo" id="email" name="email" type="email" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CamposEndereco />
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
