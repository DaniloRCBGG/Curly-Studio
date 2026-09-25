// Cálculo dos horários livres para um serviço em um dia.
// O salão fica em Niterói/RJ: horário de Brasília, UTC-3 o ano todo (sem horário de verão desde 2019).
export const FUSO = "-03:00";
export const INTERVALO_MINUTOS = 30;

export type Expediente = { abre: string; fecha: string }; // "09:00", "19:00"
export type Ocupado = { funcionaria_id: string; inicio: string; fim: string };
export type HorarioLivre = { inicio: string; funcionarias: string[] };

export function diaDaSemana(data: string): number {
  return new Date(`${data}T12:00:00${FUSO}`).getUTCDay();
}

function instante(data: string, hora: string): number {
  return new Date(`${data}T${hora.slice(0, 5)}:00${FUSO}`).getTime();
}

export function horariosLivres(params: {
  data: string; // "2026-10-02"
  expediente: Expediente | null;
  duracaoMinutos: number;
  funcionarias: string[];
  ocupados: Ocupado[];
  agora: Date;
  antecedenciaMinutos?: number;
}): HorarioLivre[] {
  const { data, expediente, duracaoMinutos, funcionarias, ocupados, agora } = params;
  if (!expediente || funcionarias.length === 0) return [];

  const abre = instante(data, expediente.abre);
  const fecha = instante(data, expediente.fecha);
  const duracao = duracaoMinutos * 60_000;
  const minimo = agora.getTime() + (params.antecedenciaMinutos ?? 60) * 60_000;
  const passo = INTERVALO_MINUTOS * 60_000;

  const ocupacao = ocupados.map((o) => ({
    funcionaria: o.funcionaria_id,
    inicio: new Date(o.inicio).getTime(),
    fim: new Date(o.fim).getTime(),
  }));

  const livres: HorarioLivre[] = [];
  for (let inicio = abre; inicio + duracao <= fecha; inicio += passo) {
    if (inicio < minimo) continue;
    const fim = inicio + duracao;
    const disponiveis = funcionarias.filter(
      (f) => !ocupacao.some((o) => o.funcionaria === f && o.inicio < fim && o.fim > inicio),
    );
    if (disponiveis.length > 0) livres.push({ inicio: new Date(inicio).toISOString(), funcionarias: disponiveis });
  }
  return livres;
}

export function formatarHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

export function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

export function hojeEmSaoPaulo(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00${FUSO}`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
