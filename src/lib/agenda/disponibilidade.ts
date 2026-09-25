import { criarClienteServidor } from "@/lib/supabase/server";
import { FUSO, diaDaSemana, horariosLivres, type HorarioLivre } from "./horarios";

export type Profissional = { id: string; nome: string };

// Junta horário de funcionamento, profissionais do serviço e ocupação do dia.
export async function disponibilidade(servicoId: string, data: string, ignorarAgendamentoId?: string) {
  const supabase = await criarClienteServidor();
  const dia = diaDaSemana(data);

  const [{ data: servico }, { data: expediente }, { data: vinculos }, { data: ocupados }] = await Promise.all([
    supabase.from("servicos").select("id, nome, duracao_minutos").eq("id", servicoId).eq("ativo", true).maybeSingle(),
    supabase.from("horario_funcionamento").select("abre, fecha").eq("dia_semana", dia).maybeSingle(),
    supabase.from("funcionaria_servicos").select("funcionarias!inner(id, nome, ativa, atende)").eq("servico_id", servicoId),
    supabase.rpc("horarios_ocupados", { dia_inicio: `${data}T00:00:00${FUSO}`, dia_fim: `${data}T23:59:59${FUSO}` }),
  ]);

  const profissionais: Profissional[] = ((vinculos ?? []) as unknown as { funcionarias: Profissional & { ativa: boolean; atende: boolean } }[])
    .map((v) => v.funcionarias)
    .filter((f) => f.ativa && f.atende)
    .map(({ id, nome }) => ({ id, nome }));

  // No reagendamento, o horário atual da própria cliente não conta como ocupado.
  let ocupacao = (ocupados ?? []) as { funcionaria_id: string; inicio: string; fim: string }[];
  if (ignorarAgendamentoId) {
    const { data: atual } = await supabase.from("agendamentos").select("funcionaria_id, inicio, fim").eq("id", ignorarAgendamentoId).maybeSingle();
    if (atual) ocupacao = ocupacao.filter((o) => !(o.funcionaria_id === atual.funcionaria_id && o.inicio === atual.inicio));
  }

  const livres: HorarioLivre[] = servico
    ? horariosLivres({
        data,
        expediente: expediente ?? null,
        duracaoMinutos: servico.duracao_minutos,
        funcionarias: profissionais.map((p) => p.id),
        ocupados: ocupacao,
        agora: new Date(),
      })
    : [];

  return { servico, profissionais, livres, abre: Boolean(expediente) };
}

export async function diasDeFuncionamento(): Promise<number[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("horario_funcionamento").select("dia_semana");
  return (data ?? []).map((d) => d.dia_semana as number);
}
