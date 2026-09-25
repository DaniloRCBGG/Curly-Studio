import { exigirGerente } from "@/lib/auth/sessao";
import { salvarFuncionaria } from "../actions";

type Funcionaria = {
  id: string;
  nome: string;
  cargo: string;
  valor_diaria_semana: number | null;
  valor_diaria_sabado: number | null;
  percentual_comissao: number | null;
  atende: boolean;
  ativa: boolean;
  usuario_id: string | null;
};

const CARGOS: Record<string, string> = {
  gerente: "Gerente",
  cabeleireira_auxiliar: "Cabeleireira auxiliar (comissão)",
  assistente: "Assistente / estagiária (diária)",
};

function FormFuncionaria({ f }: { f?: Funcionaria }) {
  return (
    <form action={salvarFuncionaria} className="grid gap-3 sm:grid-cols-6">
      {f && <input type="hidden" name="id" value={f.id} />}
      <div className="sm:col-span-3">
        <label className="rotulo">Nome</label>
        <input className="campo" name="nome" defaultValue={f?.nome} required />
      </div>
      <div className="sm:col-span-3">
        <label className="rotulo">Cargo</label>
        <select className="campo" name="cargo" defaultValue={f?.cargo ?? "cabeleireira_auxiliar"}>
          {Object.entries(CARGOS).map(([v, r]) => (
            <option key={v} value={v}>{r}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="rotulo">Diária ter–sex (R$)</label>
        <input className="campo" name="valor_diaria_semana" inputMode="decimal" defaultValue={f?.valor_diaria_semana ?? 70} />
      </div>
      <div className="sm:col-span-2">
        <label className="rotulo">Diária sábado (R$)</label>
        <input className="campo" name="valor_diaria_sabado" inputMode="decimal" defaultValue={f?.valor_diaria_sabado ?? 90} />
      </div>
      <div className="sm:col-span-2">
        <label className="rotulo">Comissão (%)</label>
        <input className="campo" name="percentual_comissao" inputMode="decimal" defaultValue={f?.percentual_comissao ?? 30} />
      </div>
      {!f?.usuario_id && (
        <>
          <div className="sm:col-span-3">
            <label className="rotulo">E-mail de acesso (opcional)</label>
            <input className="campo" name="email" type="email" />
          </div>
          <div className="sm:col-span-3">
            <label className="rotulo">Senha inicial</label>
            <input className="campo" name="senha" type="text" minLength={8} autoComplete="off" />
          </div>
        </>
      )}
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="atende" defaultChecked={f?.atende ?? true} className="accent-folha-escura" />
        Atende clientes (aparece na agenda)
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="ativa" defaultChecked={f?.ativa ?? true} className="accent-folha-escura" />
        Ativa
      </label>
      <div className="sm:col-span-2 sm:text-right">
        <button className="botao py-2">{f ? "Salvar" : "Adicionar"}</button>
      </div>
    </form>
  );
}

export default async function Equipe({ searchParams }: PageProps<"/equipe/funcionarias">) {
  const { erro, ok } = await searchParams;
  const { supabase } = await exigirGerente();
  const { data } = await supabase
    .from("funcionarias")
    .select("id, nome, cargo, valor_diaria_semana, valor_diaria_sabado, percentual_comissao, atende, ativa, usuario_id")
    .order("nome");

  return (
    <div className="space-y-6">
      <h1 className="titulo text-4xl">equipe</h1>
      <p className="text-sm text-terra/70">A diária vale para assistentes e a comissão para cabeleireiras auxiliares. O cálculo do pagamento entra na fase 3.</p>
      {typeof erro === "string" && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{erro}</p>}
      {ok && <p className="rounded-xl bg-folha/15 p-3">Salvo.</p>}
      <div className="cartao">
        <h2 className="titulo mb-4 text-2xl">nova pessoa</h2>
        <FormFuncionaria />
      </div>
      {((data ?? []) as Funcionaria[]).map((f) => (
        <details key={f.id} className="cartao">
          <summary className="cursor-pointer">
            <span className="font-medium">{f.nome}</span>
            <span className="ml-2 text-sm text-terra/70">
              {CARGOS[f.cargo]}
              {f.usuario_id ? " · tem login" : " · sem login"}
              {!f.ativa && " · inativa"}
            </span>
          </summary>
          <div className="mt-4">
            <FormFuncionaria f={f} />
          </div>
        </details>
      ))}
    </div>
  );
}
