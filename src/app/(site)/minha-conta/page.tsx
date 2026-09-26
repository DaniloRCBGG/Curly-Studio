import type { Metadata } from "next";
import Link from "next/link";
import { CamposEndereco } from "@/components/CamposEndereco";
import { redirect } from "next/navigation";
import { formatarData, formatarHora } from "@/lib/agenda/horarios";
import { exigirLogin } from "@/lib/auth/sessao";
import { sair } from "../entrar/actions";
import { cancelarAgendamento, salvarDados } from "./actions";

export const metadata: Metadata = { title: "Minha conta" };

const STATUS: Record<string, string> = {
  aguardando_sinal: "Aguardando Pix",
  agendado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

type Linha = {
  id: string;
  inicio: string;
  status: string;
  expira_em: string | null;
  servicos: { nome: string };
  funcionarias: { nome: string };
  sinais: { cliente_informou_em: string | null } | null;
};

export default async function MinhaConta({ searchParams }: PageProps<"/minha-conta">) {
  const { erro, ok } = await searchParams;
  const { supabase, user, perfil } = await exigirLogin("/minha-conta");

  const [{ data: cliente }, { data: agendamentos }] = await Promise.all([
    supabase.from("clientes").select("nome, telefone, email, cep, endereco, bairro, cidade").eq("usuario_id", user.id).maybeSingle(),
    supabase.from("agendamentos").select("id, inicio, status, expira_em, servicos(nome), funcionarias(nome), sinais(cliente_informou_em)").order("inicio", { ascending: false }).limit(30),
  ]);
  if (!cliente && perfil === "cliente") redirect("/cadastro/completar?voltar=/minha-conta");
  const lista = (agendamentos ?? []) as unknown as Linha[];
  const agora = new Date();
  const proximos = lista.filter((a) => new Date(a.inicio) > agora && ["agendado", "aguardando_sinal"].includes(a.status)).reverse();
  const historico = lista.filter((a) => !proximos.includes(a));

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="titulo text-5xl">olá{cliente?.nome ? `, ${cliente.nome.split(" ")[0].toLowerCase()}` : ""}</h1>
        <div className="flex gap-2">
          {perfil !== "cliente" && (
            <Link href="/equipe" className="botao-secundario py-2">
              Painel da equipe
            </Link>
          )}
          <form action={sair}>
            <button className="botao-secundario py-2">Sair</button>
          </form>
        </div>
      </div>

      {typeof erro === "string" && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{erro}</p>}
      {ok === "reagendado" && <p className="rounded-xl bg-folha/15 p-4">Agendamento remarcado.</p>}
      {ok === "dados" && <p className="rounded-xl bg-folha/15 p-4">Dados atualizados.</p>}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="titulo text-3xl">próximos horários</h2>
          <Link href="/agendar" className="botao py-2">
            Novo agendamento
          </Link>
        </div>
        {proximos.length === 0 ? (
          <p className="cartao mt-4 text-terra/75">Nenhum horário marcado.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {proximos.map((a) => (
              <li key={a.id} className="cartao flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {a.servicos.nome} com {a.funcionarias.nome}
                  </p>
                  <p className="text-sm text-terra/75">
                    {formatarData(a.inicio)} às {formatarHora(a.inicio)} ·{" "}
                    {a.status === "aguardando_sinal" && a.sinais?.cliente_informou_em ? "Aguardando o salão confirmar o Pix" : STATUS[a.status]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status === "aguardando_sinal" && (
                    <Link href={`/agendar/pagamento/${a.id}`} className="botao py-2 text-sm">
                      {a.sinais?.cliente_informou_em ? "Ver pagamento" : "Pagar sinal"}
                    </Link>
                  )}
                  {a.status === "agendado" && (
                    <Link href={`/minha-conta/reagendar/${a.id}`} className="botao-secundario py-2 text-sm">
                      Remarcar
                    </Link>
                  )}
                  <form action={cancelarAgendamento}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="botao-secundario py-2 text-sm">Cancelar</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-terra/60">Ao cancelar, a devolução do sinal é combinada com o salão pelo WhatsApp.</p>
      </section>

      {historico.length > 0 && (
        <section>
          <h2 className="titulo text-3xl">histórico</h2>
          <ul className="mt-4 divide-y divide-terra/10 rounded-2xl border border-terra/10 bg-white/70">
            {historico.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 px-5 py-3 text-sm">
                <span>
                  {a.servicos.nome} · {formatarData(a.inicio)} às {formatarHora(a.inicio)}
                </span>
                <span className="text-terra/60">{STATUS[a.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cliente && (
        <section>
          <h2 className="titulo text-3xl">meus dados</h2>
          <form action={salvarDados} className="cartao mt-4 grid gap-4 sm:grid-cols-2">
            {(
              [
                ["nome", "Nome", cliente.nome],
                ["telefone", "Telefone", cliente.telefone],
              ] as const
            ).map(([nome, rotulo, valor]) => (
              <div key={nome}>
                <label className="rotulo" htmlFor={nome}>{rotulo}</label>
                <input className="campo" id={nome} name={nome} defaultValue={valor ?? ""} />
              </div>
            ))}
            <CamposEndereco obrigatorio inicial={{ cep: cliente.cep ?? "", endereco: cliente.endereco ?? "", bairro: cliente.bairro ?? "", cidade: cliente.cidade ?? undefined }} />
            <p className="text-sm text-terra/60 sm:col-span-2">E-mail: {cliente.email}</p>
            <button className="botao sm:col-span-2 sm:justify-self-start">Salvar</button>
          </form>
        </section>
      )}
    </div>
  );
}
