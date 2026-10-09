import { Revelar } from "./Revelar";

// Cabeçalho padrão das seções da home: rótulo pequeno em verde, título grande e, se houver, um texto de apoio
// e uma ação à direita. Os títulos ficam sempre fora dos cartões.
export function CabecalhoSecao({ rotulo, titulo, texto, acao }: { rotulo: string; titulo: string; texto?: string; acao?: React.ReactNode }) {
  return (
    <Revelar className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="max-w-2xl">
        <p className="text-sm font-medium tracking-widest text-folha-escura uppercase">{rotulo}</p>
        <h2 className="titulo mt-3 text-4xl sm:text-5xl">{titulo}</h2>
        {texto && <p className="mt-4 text-terra/85">{texto}</p>}
      </div>
      {acao}
    </Revelar>
  );
}
