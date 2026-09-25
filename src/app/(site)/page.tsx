import Image from "next/image";
import Link from "next/link";
import { ListaServicos } from "@/components/ListaServicos";
import { salao } from "@/conteudo/salao";
import { listarServicos } from "@/lib/servicos";

export default async function Inicio() {
  const servicos = (await listarServicos()).slice(0, 3);
  return (
    <>
      <section className="bg-terra text-areia">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.3fr_1fr] md:py-28">
          <div>
            <h1 className="titulo text-5xl text-areia-clara sm:text-6xl">{salao.chamada}</h1>
            <p className="mt-6 max-w-xl text-lg text-areia">{salao.subchamada}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/agendar" className="botao bg-folha hover:bg-areia hover:text-terra">
                Agendar horário
              </Link>
              <Link href="/servicos" className="inline-flex items-center rounded-full border border-areia/40 px-6 py-3 font-medium hover:border-areia">
                Ver serviços
              </Link>
            </div>
          </div>
          <div className="hidden justify-center md:flex">
            <Image src="/marca/logo-secundaria-clara.svg" alt="" width={300} height={209} aria-hidden />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm font-medium uppercase tracking-widest text-folha-escura">Nossa missão</p>
        <p className="titulo mt-3 max-w-3xl text-3xl sm:text-4xl">{salao.missao}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {salao.valores.map((v) => (
            <div key={v.titulo} className="cartao">
              <h2 className="titulo text-2xl">{v.titulo}</h2>
              <p className="mt-2 text-terra/75">{v.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-areia">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="titulo text-4xl">serviços</h2>
            <Link href="/servicos" className="text-sm font-medium text-folha-escura underline-offset-4 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-8">
            <ListaServicos servicos={servicos} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="titulo text-4xl">vamos cuidar dos seus cachos?</h2>
        <p className="mx-auto mt-4 max-w-xl text-terra/75">
          Escolha o serviço, o dia e o horário. O agendamento é confirmado assim que o sinal é pago por Pix.
        </p>
        <Link href="/agendar" className="botao mt-8">
          Agendar agora
        </Link>
      </section>
    </>
  );
}
