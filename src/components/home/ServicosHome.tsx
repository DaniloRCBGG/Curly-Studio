import Link from "next/link";
import { gruposServicos } from "@/conteudo/valores";
import { CabecalhoSecao } from "./CabecalhoSecao";
import { Revelar } from "./Revelar";

const real = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

// Serviços e valores na home, a partir da mesma tabela da aba Valores: cada grupo vira um cartão
// com o menor preço de cada serviço (cabelo P), para a pessoa ter uma ideia sem simular um agendamento.
export function ServicosHome() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <CabecalhoSecao
        rotulo="Serviços e valores"
        titulo="o que fazemos"
        texto="Quer saber quanto custa? Não precisa simular um agendamento: os valores variam pelo tamanho do cabelo e estão todos na nossa tabela."
        acao={
          <Link href="/valores" className="botao shrink-0">
            Ver tabela de valores
          </Link>
        }
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {gruposServicos.map((g, i) => (
          <Revelar key={g.id} atraso={i * 0.1} className="cartao flex h-full flex-col">
            <h3 className="titulo text-2xl">{g.titulo.toLowerCase()}</h3>
            <p className="mt-1 text-xs font-medium tracking-wide text-terra/85 uppercase">a partir de</p>
            <ul className="mt-3 flex-1 divide-y divide-terra/10 text-sm">
              {g.servicos.map((s) => (
                <li key={s.nome} className="flex items-baseline justify-between gap-3 py-2">
                  <span>{s.nome}</span>
                  <span className="shrink-0 font-medium text-folha-escura">{real(s.precos[0])}</span>
                </li>
              ))}
            </ul>
            <Link href={`/valores#${g.id}`} className="mt-4 self-start text-sm font-medium text-folha-escura underline-offset-4 hover:underline">
              Ver valores por tamanho
            </Link>
          </Revelar>
        ))}
      </div>
    </section>
  );
}
