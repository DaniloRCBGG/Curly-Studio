import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeletorHorario } from "@/components/SeletorHorario";
import { disponibilidade, diasDeFuncionamento } from "@/lib/agenda/disponibilidade";
import { formatarData, formatarHora } from "@/lib/agenda/horarios";
import { exigirLogin } from "@/lib/auth/sessao";
import { reagendar } from "../../actions";

export const metadata: Metadata = { title: "Remarcar" };

export default async function Reagendar({ params, searchParams }: PageProps<"/minha-conta/reagendar/[id]">) {
  const { id } = await params;
  const { data: dataParam, erro } = await searchParams;
  const { supabase } = await exigirLogin(`/minha-conta/reagendar/${id}`);
  const { data: ag } = await supabase.from("agendamentos").select("id, inicio, status, servico_id, servicos(nome)").eq("id", id).maybeSingle();
  if (!ag || ag.status !== "agendado") notFound();

  const data = typeof dataParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) ? dataParam : undefined;
  const [dias, disp] = await Promise.all([diasDeFuncionamento(), data ? disponibilidade(ag.servico_id, data, id) : null]);
  const nome = (ag.servicos as unknown as { nome: string }).nome;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6">
      <Link href="/minha-conta" className="text-sm text-folha-escura underline-offset-4 hover:underline">
        Voltar
      </Link>
      <h1 className="titulo text-5xl">remarcar</h1>
      <p className="text-terra/75">
        {nome}, hoje marcado para {formatarData(ag.inicio)} às {formatarHora(ag.inicio)}. O sinal pago continua valendo.
      </p>
      {typeof erro === "string" && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{erro}</p>}
      <SeletorHorario
        hrefDia={(d) => `/minha-conta/reagendar/${id}?data=${d}`}
        diasAbertos={dias}
        dataSelecionada={data}
        livres={disp?.livres ?? []}
        profissionais={disp?.profissionais ?? []}
        acao={reagendar}
        camposOcultos={{ agendamento: id, servico: ag.servico_id }}
        textoBotao="Remarcar para este horário"
      />
    </div>
  );
}
