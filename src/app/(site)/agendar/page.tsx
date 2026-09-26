import type { Metadata } from "next";
import Link from "next/link";
import { SeletorHorario } from "@/components/SeletorHorario";
import { disponibilidade, diasDeFuncionamento } from "@/lib/agenda/disponibilidade";
import { TAMANHOS, agruparServicos, duracao, ehTamanho, listarServicos, precoPara, precosPorTamanho, reais, type Servico, type Tamanho } from "@/lib/servicos";
import { iniciarAgendamento } from "./actions";

export const metadata: Metadata = { title: "Agendar" };

export default async function Agendar({ searchParams }: PageProps<"/agendar">) {
  const params = await searchParams;
  const servicoId = typeof params.servico === "string" ? params.servico : undefined;
  const data = typeof params.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.data) ? params.data : undefined;
  const erro = typeof params.erro === "string" ? params.erro : undefined;

  const servicos = await listarServicos();
  const servico = servicos.find((s) => s.id === servicoId);
  // Serviços com preço por tamanho pedem o tamanho do cabelo antes do horário.
  const precisaTamanho = servico ? precosPorTamanho(servico) !== null : false;
  const tamanho = precisaTamanho && ehTamanho(params.tamanho) ? params.tamanho : null;
  const etapa = !servico ? 1 : precisaTamanho && !tamanho ? 2 : 3;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="titulo text-5xl">agendar</h1>
      <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-terra/85">
        {["Serviço", "Tamanho do cabelo", "Dia e horário", "Sinal por Pix"].map((nome, i) => (
          <li key={nome} className={etapa === i + 1 ? "font-medium text-terra underline decoration-folha underline-offset-4" : ""}>
            {i + 1}. {nome}
          </li>
        ))}
      </ol>

      {erro && (
        <p role="alert" className="mt-6 rounded-xl border border-red-800/20 bg-red-50 p-4 text-red-900">
          {erro}
        </p>
      )}

      {!servico ? (
        <ListaParaAgendar servicos={servicos} />
      ) : etapa === 2 ? (
        <EscolhaTamanho servico={servico} />
      ) : (
        <EscolhaHorario servico={servico} tamanho={tamanho} data={data} />
      )}
    </div>
  );
}

function ListaParaAgendar({ servicos }: { servicos: Servico[] }) {
  const grupos = agruparServicos(servicos);
  if (grupos.length === 0) return <p className="cartao mt-8">Os serviços ainda não foram cadastrados.</p>;
  return (
    <div className="mt-8 space-y-10">
      {grupos.map((g) => (
        <section key={g.id}>
          <h2 className="titulo text-3xl">{g.titulo.toLowerCase()}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {g.servicos.map((s) => (
              <li key={s.id}>
                <Link href={`/agendar?servico=${s.id}`} className="cartao block h-full transition hover:border-folha-escura">
                  <span className="titulo block text-2xl">{s.nome}</span>
                  <span className="mt-2 block text-sm text-terra/85">
                    {duracao(s.duracao_minutos)} · {precosPorTamanho(s) ? `a partir de ${reais(precoPara(s, "P"))}` : reais(s.valor)} · sinal de {reais(s.valor_sinal)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CabecalhoServico({ servico, detalhe }: { servico: Servico; detalhe: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p>
        <span className="titulo text-3xl">{servico.nome}</span>
        <span className="ml-3 text-sm text-terra/85">{detalhe}</span>
      </p>
      <Link href="/agendar" className="text-sm text-folha-escura underline-offset-4 hover:underline">
        Trocar serviço
      </Link>
    </div>
  );
}

// O preço depende do tamanho do cabelo: a cliente escolhe antes de ver os horários.
function EscolhaTamanho({ servico }: { servico: Servico }) {
  return (
    <div className="mt-8 space-y-6">
      <CabecalhoServico servico={servico} detalhe={`${duracao(servico.duracao_minutos)} · sinal de ${reais(servico.valor_sinal)} por Pix`} />
      <div>
        <h2 className="text-lg font-medium">Qual é o tamanho do seu cabelo?</h2>
        <p className="mt-1 text-sm text-terra/85">
          P, M, G e GG indicam o volume e o comprimento. Na dúvida, escolha o que parecer mais próximo: a Carol confirma no atendimento.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TAMANHOS.map((t) => (
          <li key={t}>
            <Link
              href={`/agendar?servico=${servico.id}&tamanho=${t}`}
              className="block rounded-2xl border border-terra/15 bg-white/70 px-4 py-5 text-center transition hover:border-folha-escura hover:bg-areia/60"
            >
              <span className="block text-2xl font-medium">{t}</span>
              <span className="mt-1 block font-medium text-folha-escura">
                {servico.a_partir_de && <span className="block text-xs font-normal text-terra/85 uppercase">a partir de</span>}
                {reais(precoPara(servico, t))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function EscolhaHorario({ servico, tamanho, data }: { servico: Servico; tamanho: Tamanho | null; data?: string }) {
  const [dias, disp] = await Promise.all([diasDeFuncionamento(), data ? disponibilidade(servico.id, data) : null]);
  const base = `/agendar?servico=${servico.id}${tamanho ? `&tamanho=${tamanho}` : ""}`;
  const preco = `${servico.a_partir_de ? "a partir de " : ""}${reais(precoPara(servico, tamanho))}`;
  return (
    <div className="mt-8 space-y-6">
      <CabecalhoServico servico={servico} detalhe={`${tamanho ? `cabelo ${tamanho} · ` : ""}${preco} · sinal de ${reais(servico.valor_sinal)} por Pix para confirmar`} />
      {tamanho && (
        <Link href={`/agendar?servico=${servico.id}`} className="inline-block text-sm text-folha-escura underline-offset-4 hover:underline">
          Trocar tamanho
        </Link>
      )}
      <SeletorHorario
        hrefDia={(d) => `${base}&data=${d}`}
        diasAbertos={dias}
        dataSelecionada={data}
        livres={disp?.livres ?? []}
        profissionais={disp?.profissionais ?? []}
        acao={iniciarAgendamento}
        camposOcultos={tamanho ? { servico: servico.id, tamanho } : { servico: servico.id }}
        textoBotao="Reservar e pagar sinal"
      />
    </div>
  );
}
