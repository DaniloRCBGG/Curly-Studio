import type { Metadata } from "next";
import Link from "next/link";
import { SeletorHorario } from "@/components/SeletorHorario";
import { disponibilidade, diasDeFuncionamento } from "@/lib/agenda/disponibilidade";
import { duracao, listarServicos, reais } from "@/lib/servicos";
import { iniciarAgendamento } from "./actions";

export const metadata: Metadata = { title: "Agendar" };

export default async function Agendar({ searchParams }: PageProps<"/agendar">) {
  const params = await searchParams;
  const servicoId = typeof params.servico === "string" ? params.servico : undefined;
  const data = typeof params.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.data) ? params.data : undefined;
  const erro = typeof params.erro === "string" ? params.erro : undefined;

  const servicos = await listarServicos();
  const servico = servicos.find((s) => s.id === servicoId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="titulo text-5xl">agendar</h1>
      <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-terra/60">
        <li className={servico ? "" : "font-medium text-terra"}>1. Serviço</li>
        <li className={servico ? "font-medium text-terra" : ""}>2. Dia e horário</li>
        <li>3. Sinal por Pix</li>
      </ol>

      {erro && (
        <p role="alert" className="mt-6 rounded-xl border border-red-800/20 bg-red-50 p-4 text-red-900">
          {erro}
        </p>
      )}

      {!servico ? (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {servicos.length === 0 && <p className="cartao">Os serviços ainda não foram cadastrados.</p>}
          {servicos.map((s) => (
            <li key={s.id}>
              <Link href={`/agendar?servico=${s.id}`} className="cartao block transition hover:border-folha-escura">
                <span className="titulo block text-2xl">{s.nome}</span>
                <span className="mt-2 block text-sm text-terra/70">
                  {duracao(s.duracao_minutos)} · {reais(s.valor)} · sinal de {reais(s.valor_sinal)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EscolhaHorario servicoId={servico.id} nome={servico.nome} valorSinal={servico.valor_sinal} data={data} />
      )}
    </div>
  );
}

async function EscolhaHorario({ servicoId, nome, valorSinal, data }: { servicoId: string; nome: string; valorSinal: number; data?: string }) {
  const [dias, disp] = await Promise.all([diasDeFuncionamento(), data ? disponibilidade(servicoId, data) : null]);
  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          <span className="titulo text-3xl">{nome}</span>
          <span className="ml-3 text-sm text-terra/70">sinal de {reais(valorSinal)} por Pix para confirmar</span>
        </p>
        <Link href="/agendar" className="text-sm text-folha-escura underline-offset-4 hover:underline">
          Trocar serviço
        </Link>
      </div>
      <SeletorHorario
        hrefDia={(d) => `/agendar?servico=${servicoId}&data=${d}`}
        diasAbertos={dias}
        dataSelecionada={data}
        livres={disp?.livres ?? []}
        profissionais={disp?.profissionais ?? []}
        acao={iniciarAgendamento}
        camposOcultos={{ servico: servicoId }}
        textoBotao="Reservar e pagar sinal"
      />
    </div>
  );
}
