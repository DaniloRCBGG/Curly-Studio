import { exigirEquipe } from "@/lib/auth/sessao";
import { duracao, reais } from "@/lib/servicos";
import { salvarServico } from "../actions";

type Servico = { id: string; nome: string; descricao: string | null; duracao_minutos: number; valor: number; valor_sinal: number; ativo: boolean; ordem: number };

function FormServico({ servico, profissionais, vinculadas, podeVincular }: { servico?: Servico; profissionais: { id: string; nome: string }[]; vinculadas: string[]; podeVincular: boolean }) {
  return (
    <form action={salvarServico} className="grid gap-3 sm:grid-cols-6">
      {servico && <input type="hidden" name="id" value={servico.id} />}
      <div className="sm:col-span-3">
        <label className="rotulo">Nome</label>
        <input className="campo" name="nome" defaultValue={servico?.nome} required />
      </div>
      <div>
        <label className="rotulo">Duração (min)</label>
        <input className="campo" name="duracao_minutos" type="number" min={15} step={15} defaultValue={servico?.duracao_minutos ?? 60} required />
      </div>
      <div>
        <label className="rotulo">Valor (R$)</label>
        <input className="campo" name="valor" inputMode="decimal" defaultValue={servico?.valor} required />
      </div>
      <div>
        <label className="rotulo">Sinal (R$)</label>
        <input className="campo" name="valor_sinal" inputMode="decimal" defaultValue={servico?.valor_sinal} required />
      </div>
      <div className="sm:col-span-5">
        <label className="rotulo">Descrição (aparece no site)</label>
        <input className="campo" name="descricao" defaultValue={servico?.descricao ?? ""} />
      </div>
      <div>
        <label className="rotulo">Ordem</label>
        <input className="campo" name="ordem" type="number" defaultValue={servico?.ordem ?? 0} />
      </div>
      {podeVincular && (
        <fieldset className="sm:col-span-6">
          <input type="hidden" name="editar_profissionais" value="1" />
          <legend className="rotulo">Quem faz</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            {profissionais.map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <input type="checkbox" name="profissionais" value={p.id} defaultChecked={vinculadas.includes(p.id)} className="accent-folha-escura" />
                {p.nome}
              </label>
            ))}
            {profissionais.length === 0 && <span className="text-terra/60">Cadastre a equipe primeiro.</span>}
          </div>
        </fieldset>
      )}
      <label className="flex items-center gap-2 text-sm sm:col-span-3">
        <input type="checkbox" name="ativo" defaultChecked={servico?.ativo ?? true} className="accent-folha-escura" />
        Ativo (aparece no site e na agenda)
      </label>
      <div className="sm:col-span-3 sm:text-right">
        <button className="botao py-2">{servico ? "Salvar" : "Adicionar serviço"}</button>
      </div>
    </form>
  );
}

export default async function Servicos({ searchParams }: PageProps<"/equipe/servicos">) {
  const { erro, ok } = await searchParams;
  const { supabase, perfil } = await exigirEquipe();
  const [{ data: servicos }, { data: profissionais }, { data: vinculos }] = await Promise.all([
    supabase.from("servicos").select("id, nome, descricao, duracao_minutos, valor, valor_sinal, ativo, ordem").order("ordem").order("nome"),
    supabase.from("funcionarias").select("id, nome").eq("ativa", true).eq("atende", true).order("nome"),
    supabase.from("funcionaria_servicos").select("funcionaria_id, servico_id"),
  ]);
  const podeVincular = perfil === "gerente";

  return (
    <div className="space-y-6">
      <h1 className="titulo text-4xl">serviços</h1>
      {typeof erro === "string" && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{erro}</p>}
      {ok && <p className="rounded-xl bg-folha/15 p-3">Salvo.</p>}
      <div className="cartao">
        <h2 className="titulo mb-4 text-2xl">novo serviço</h2>
        <FormServico profissionais={profissionais ?? []} vinculadas={[]} podeVincular={podeVincular} />
      </div>
      {((servicos ?? []) as Servico[]).map((s) => (
        <details key={s.id} className="cartao">
          <summary className="cursor-pointer">
            <span className="font-medium">{s.nome}</span>
            <span className="ml-2 text-sm text-terra/70">
              {duracao(s.duracao_minutos)} · {reais(Number(s.valor))} · sinal {reais(Number(s.valor_sinal))}
              {!s.ativo && " · inativo"}
            </span>
          </summary>
          <div className="mt-4">
            <FormServico
              servico={s}
              profissionais={profissionais ?? []}
              vinculadas={(vinculos ?? []).filter((v) => v.servico_id === s.id).map((v) => v.funcionaria_id)}
              podeVincular={podeVincular}
            />
          </div>
        </details>
      ))}
    </div>
  );
}
