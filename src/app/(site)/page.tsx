import Link from "next/link";
import { ComoFunciona } from "@/components/home/ComoFunciona";
import { Faixa } from "@/components/home/Faixa";
import { Galeria } from "@/components/home/Galeria";
import { Hero } from "@/components/home/Hero";
import { Revelar } from "@/components/home/Revelar";
import { ServicosHome } from "@/components/home/ServicosHome";
import { TextoRolagem } from "@/components/home/TextoRolagem";
import { salao } from "@/conteudo/salao";

export default function Inicio() {
  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Revelar>
          <p className="text-sm font-medium tracking-widest text-folha-escura uppercase">Nossa missão</p>
        </Revelar>
        <TextoRolagem texto={salao.missao} className="titulo mt-4 max-w-4xl text-4xl sm:text-5xl" />
      </section>

      <Faixa palavras={salao.valores.map((v) => v.titulo.toLowerCase())} />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {salao.valores.map((v, i) => (
            <Revelar key={v.titulo} atraso={i * 0.12} className="cartao h-full">
              <h2 className="titulo text-2xl">{v.titulo}</h2>
              <p className="mt-2 text-terra/75">{v.texto}</p>
            </Revelar>
          ))}
        </div>
      </section>

      <Galeria />

      <ServicosHome />

      <div className="bg-areia-clara">
        <ComoFunciona />
      </div>

      <section className="bg-terra text-areia">
        <Revelar className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
          <h2 className="titulo text-4xl text-areia-clara sm:text-6xl">vamos cuidar dos seus cachos?</h2>
          <p className="mx-auto mt-4 max-w-xl">Escolha o serviço, o dia e o horário. O agendamento é confirmado assim que o sinal é pago por Pix.</p>
          <Link href="/agendar" className="botao-no-escuro mt-8">
            Agendar agora
          </Link>
        </Revelar>
      </section>
    </>
  );
}
