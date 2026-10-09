import { Revelar } from "./Revelar";

// Cabeçalho padrão das seções da home: rótulo pequeno em verde, título grande e, se houver, um texto de apoio
// e uma ação à direita. Os títulos ficam sempre fora dos cartões. "escuro" é para seções de fundo terra.
export function CabecalhoSecao({ rotulo, titulo, texto, acao, escuro }: { rotulo: string; titulo: string; texto?: string; acao?: React.ReactNode; escuro?: boolean }) {
  return (
    <Revelar className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="max-w-2xl">
        <p className={`text-sm font-medium tracking-widest uppercase ${escuro ? "text-folha" : "text-folha-escura"}`}>{rotulo}</p>
        <h2 className={`titulo mt-3 text-4xl sm:text-5xl ${escuro ? "text-areia-clara" : ""}`}>{titulo}</h2>
        {texto && <p className={`mt-4 ${escuro ? "text-areia/85" : "text-terra/85"}`}>{texto}</p>}
      </div>
      {acao}
    </Revelar>
  );
}
