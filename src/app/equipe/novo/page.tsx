import Link from "next/link";
import { SeletorHorario } from "@/components/SeletorHorario";
import { disponibilidade, diasDeFuncionamento } from "@/lib/agenda/disponibilidade";
import { exigirEquipe } from "@/lib/auth/sessao";
import { TAMANHOS, ehTamanho, listarServicos, precoPara, precosPorTamanho, reais } from "@/lib/servicos";
import { agendarPelaEquipe } from "../actions";

// Agendamento pela equipe: cliente → serviço → horário. O sinal é registrado como recebido no salão.
export default async function NovoAgendamento({ searchParams }: PageProps<"/equipe/novo">) {
  const p = await searchParams;
  const clienteId = typeof p.cliente === "string" ? p.cliente : undefined;
  const servicoId = typeof p.servico === "string" ? p.servico : undefined;
  const data = typeof p.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.data) ? p.data : undefined;
  const { supabase } = await exigirEquipe();

  const { data: cliente } = clienteId ? await supabase.from("clientes").select("id, nome, telefone").eq("id", clienteId).maybeSingle() : { data: null };
  if (!cliente) {
    return (
      <div className="space-y-4">
        <h1 className="titulo text-4xl">novo agendamento</h1>
        <p>
          Primeiro escolha a cliente em{" "}
          <Link href="/equipe/clientes" className="font-medium text-folha-escura underline">
            Clientes
          </Link>{" "}
          (ou cadastre quem chegou agora).
        </p>
      </div>
    );
  }

  const servicos = await listarServicos();
  const servico = servicos.find((s) => s.id === servicoId);
  const porTamanho = servico ? precosPorTamanho(servico) !== null : false;
  const tamanho = porTamanho && ehTamanho(p.tamanho) ? p.tamanho : null;
  const base = `/equipe/novo?cliente=${cliente.id}`;
  const baseServico = servico ? `${base}&servico=${servico.id}${tamanho ? `&tamanho=${tamanho}` : ""}` : base;
  const [dias, disp] = servico ? await Promise.all([diasDeFuncionamento(), data ? disponibilidade(servico.id, data) : null]) : [[], null];

  return (
    <div className="space-y-6">
      <h1 className="titulo text-4xl">agendar para {cliente.nome.toLowerCase()}</h1>
      {typeof p.erro === "string" && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{p.erro}</p>}
      <div className="flex flex-wrap gap-2">
        {servicos.map((s) => (
          <Link
            key={s.id}
            href={`${base}&servico=${s.id}${data ? `&data=${data}` : ""}`}
            className={`rounded-full border px-4 py-2 text-sm ${s.id === servicoId ? "border-folha-escura bg-folha-escura text-areia-clara" : "border-terra/20 bg-white"}`}
          >
            {s.nome}
          </Link>
        ))}
      </div>
      {servico && porTamanho && (
        <div className="space-y-2">
          <p className="rotulo">Tamanho do cabelo</p>
          <div className="flex flex-wrap gap-2">
            {TAMANHOS.map((t) => (
              <Link
                key={t}
                href={`${base}&servico=${servico.id}&tamanho=${t}${data ? `&data=${data}` : ""}`}
                className={`rounded-full border px-4 py-2 text-sm ${t === tamanho ? "border-folha-escura bg-folha-escura text-areia-clara" : "border-terra/20 bg-white"}`}
              >
                {t} · {reais(precoPara(servico, t))}
              </Link>
            ))}
          </div>
        </div>
      )}
      {servico && (!porTamanho || tamanho) && (
        <>
          <p className="text-sm text-terra/85">
            {reais(precoPara(servico, tamanho))}. O sinal de {reais(servico.valor_sinal)} fica registrado como recebido no salão.
          </p>
          <SeletorHorario
            hrefDia={(d) => `${baseServico}&data=${d}`}
            diasAbertos={dias}
            dataSelecionada={data}
            livres={disp?.livres ?? []}
            profissionais={disp?.profissionais ?? []}
            acao={agendarPelaEquipe}
            camposOcultos={tamanho ? { cliente: cliente.id, servico: servico.id, tamanho } : { cliente: cliente.id, servico: servico.id }}
            textoBotao="Agendar"
          />
        </>
      )}
    </div>
  );
}
