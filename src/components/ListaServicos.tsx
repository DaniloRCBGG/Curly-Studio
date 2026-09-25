import Link from "next/link";
import { duracao, reais, type Servico } from "@/lib/servicos";

export function ListaServicos({ servicos }: { servicos: Servico[] }) {
  if (servicos.length === 0) {
    return (
      <p className="cartao text-terra/70">
        A lista de serviços aparece aqui assim que for cadastrada no painel da equipe.
      </p>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {servicos.map((s) => (
        <li key={s.id} className="cartao flex flex-col">
          <h3 className="titulo text-2xl">{s.nome}</h3>
          {s.descricao && <p className="mt-2 flex-1 text-terra/75">{s.descricao}</p>}
          <p className="mt-4 text-sm text-terra/70">
            {duracao(s.duracao_minutos)} · {reais(s.valor)}
          </p>
          <Link href={`/agendar?servico=${s.id}`} className="mt-4 self-start text-sm font-medium text-folha-escura underline-offset-4 hover:underline">
            Agendar este serviço
          </Link>
        </li>
      ))}
    </ul>
  );
}
