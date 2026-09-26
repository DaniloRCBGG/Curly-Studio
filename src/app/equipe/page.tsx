import Link from "next/link";
import { FUSO, formatarData, formatarHora, hojeEmSaoPaulo, somarDias } from "@/lib/agenda/horarios";
import { exigirEquipe } from "@/lib/auth/sessao";
import { reais } from "@/lib/servicos";
import { mudarStatus } from "./actions";

type Linha = {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  expira_em: string | null;
  clientes: { nome: string; telefone: string | null; email: string | null };
  servicos: { nome: string };
  funcionarias: { nome: string };
  sinais: { valor: number; status: string; forma: string } | null;
};

const SINAL: Record<string, string> = {
  pago: "sinal pago",
  pendente: "aguardando Pix",
  expirado: "Pix expirado",
  pago_apos_expirar: "Pix pago após expirar: devolver ou remarcar",
  cancelado: "sinal cancelado",
};

// Agenda do dia (RF05).
export default async function AgendaDoDia({ searchParams }: PageProps<"/equipe">) {
  const { data: dataParam } = await searchParams;
  const data = typeof dataParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) ? dataParam : hojeEmSaoPaulo();
  const { supabase } = await exigirEquipe();
  const { data: linhas } = await supabase
    .from("agendamentos")
    .select("id, inicio, fim, status, expira_em, clientes(nome, telefone, email), servicos(nome), funcionarias(nome), sinais(valor, status, forma)")
    .gte("inicio", `${data}T00:00:00${FUSO}`)
    .lte("inicio", `${data}T23:59:59${FUSO}`)
    .in("status", ["agendado", "aguardando_sinal", "concluido"])
    .order("inicio");
  const agenda = ((linhas ?? []) as unknown as Linha[]).filter(
    (a) => !(a.status === "aguardando_sinal" && a.expira_em && new Date(a.expira_em) < new Date()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-4xl">{formatarData(`${data}T12:00:00${FUSO}`)}</h1>
        <div className="flex gap-2 text-sm">
          <Link className="botao-secundario py-2" href={`/equipe?data=${somarDias(data, -1)}`}>Dia anterior</Link>
          <Link className="botao-secundario py-2" href="/equipe">Hoje</Link>
          <Link className="botao-secundario py-2" href={`/equipe?data=${somarDias(data, 1)}`}>Próximo dia</Link>
        </div>
      </div>
      {agenda.length === 0 ? (
        <p className="cartao text-terra/75">Nenhum atendimento neste dia.</p>
      ) : (
        <ul className="space-y-3">
          {agenda.map((a) => (
            <li key={a.id} className="cartao flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  {formatarHora(a.inicio)}–{formatarHora(a.fim)} · {a.servicos.nome} com {a.funcionarias.nome}
                </p>
                <p className="text-sm text-terra/75">
                  {a.clientes.nome} · {a.clientes.telefone ?? a.clientes.email} ·{" "}
                  {a.sinais ? `${reais(Number(a.sinais.valor))} ${SINAL[a.sinais.status]}${a.sinais.forma === "presencial" ? " no salão" : ""}` : "sem sinal"}
                  {a.status === "concluido" && " · concluído"}
                </p>
              </div>
              {a.status !== "concluido" && (
                <div className="flex gap-2">
                  {a.status === "agendado" && (
                    <form action={mudarStatus}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="status" value="concluido" />
                      <button className="botao py-2 text-sm">Concluir</button>
                    </form>
                  )}
                  <form action={mudarStatus}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="status" value="cancelado" />
                    <button className="botao-secundario py-2 text-sm">Cancelar</button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
