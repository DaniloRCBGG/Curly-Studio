import Link from "next/link";
import { agruparServicos, listarServicos, precoPara } from "@/lib/servicos";
import { CabecalhoSecao } from "./CabecalhoSecao";
import { Revelar } from "./Revelar";

const real = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

// Serviços na home, lidos do mesmo cadastro da aba Valores e do agendamento. Cada grupo mostra só
// os nomes e um "a partir de": os preços por tamanho ficam para a aba Valores.
export async function ServicosHome() {
  const grupos = agruparServicos(await listarServicos());
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
      {grupos.length === 0 ? (
        <p className="cartao mt-10 text-terra/85">Os serviços aparecem aqui assim que forem cadastrados no painel da equipe.</p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {grupos.map((g, i) => {
            const menor = Math.min(...g.servicos.map((s) => precoPara(s, "P")));
            return (
              <Revelar key={g.id} atraso={i * 0.1} className="cartao flex h-full flex-col">
                <h3 className="titulo text-2xl">{g.titulo.toLowerCase()}</h3>
                <p className="mt-1 text-sm text-terra/85">
                  a partir de <strong className="font-medium text-folha-escura">{real(menor)}</strong>
                </p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                  {g.servicos.map((s) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-folha" />
                      {s.nome}
                    </li>
                  ))}
                </ul>
                <Link href={`/valores#${g.id}`} className="mt-5 self-start text-sm font-medium text-folha-escura underline-offset-4 hover:underline">
                  Ver valores por tamanho
                </Link>
              </Revelar>
            );
          })}
        </div>
      )}
    </section>
  );
}
