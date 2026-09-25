import Link from "next/link";
import { formatarHora, hojeEmSaoPaulo, somarDias, diaDaSemana } from "@/lib/agenda/horarios";
import type { HorarioLivre } from "@/lib/agenda/horarios";
import type { Profissional } from "@/lib/agenda/disponibilidade";

const DIAS_ADIANTE = 21;

function rotuloDia(data: string) {
  const d = new Date(`${data}T12:00:00-03:00`);
  return {
    semana: new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" }).format(d).replace(".", ""),
    dia: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).format(d).replace(".", ""),
  };
}

// Escolha de dia e horário. Cada horário é um formulário que chama a ação recebida.
export function SeletorHorario(props: {
  hrefDia: (data: string) => string;
  diasAbertos: number[];
  dataSelecionada?: string;
  livres: HorarioLivre[];
  profissionais: Profissional[];
  acao: (form: FormData) => Promise<void>;
  camposOcultos: Record<string, string>;
  textoBotao: string;
}) {
  const hoje = hojeEmSaoPaulo();
  const dias = Array.from({ length: DIAS_ADIANTE }, (_, i) => somarDias(hoje, i)).filter((d) => props.diasAbertos.includes(diaDaSemana(d)));
  const nomes = new Map(props.profissionais.map((p) => [p.id, p.nome]));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="rotulo">Dia</h2>
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {dias.map((d) => {
            const r = rotuloDia(d);
            const ativo = d === props.dataSelecionada;
            return (
              <li key={d}>
                <Link
                  href={props.hrefDia(d)}
                  scroll={false}
                  aria-current={ativo ? "date" : undefined}
                  className={`flex w-20 flex-col items-center rounded-2xl border px-2 py-3 text-sm transition ${
                    ativo ? "border-folha-escura bg-folha-escura text-areia-clara" : "border-terra/15 bg-white hover:border-terra/40"
                  }`}
                >
                  <span className="capitalize">{r.semana}</span>
                  <span className="font-medium">{r.dia}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {props.dataSelecionada && (
        <div>
          <h2 className="rotulo">Horário</h2>
          {props.livres.length === 0 ? (
            <p className="cartao text-terra/75">Não há horários livres neste dia. Tente outra data.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {props.livres.map((h) => (
                <li key={h.inicio}>
                  <form action={props.acao} className="cartao flex flex-col gap-3 p-4">
                    {Object.entries(props.camposOcultos).map(([nome, valor]) => (
                      <input key={nome} type="hidden" name={nome} value={valor} />
                    ))}
                    <input type="hidden" name="data" value={props.dataSelecionada} />
                    <input type="hidden" name="inicio" value={h.inicio} />
                    <p className="titulo text-3xl">{formatarHora(h.inicio)}</p>
                    <label className="text-sm">
                      <span className="sr-only">Profissional</span>
                      <select name="profissional" className="campo py-2 text-sm" defaultValue="qualquer">
                        {h.funcionarias.length > 1 && <option value="qualquer">Qualquer profissional</option>}
                        {h.funcionarias.map((f) => (
                          <option key={f} value={f}>
                            Com {nomes.get(f)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="botao py-2 text-sm">{props.textoBotao}</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
