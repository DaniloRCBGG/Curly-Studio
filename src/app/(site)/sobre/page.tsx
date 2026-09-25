import type { Metadata } from "next";
import Link from "next/link";
import { salao } from "@/conteudo/salao";

export const metadata: Metadata = { title: "Quem somos" };

export default function Sobre() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="titulo text-5xl">quem somos</h1>
      <div className="mt-8 space-y-5 text-lg text-terra/85">
        {salao.quemSomos.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <h2 className="titulo mt-14 text-3xl">nossa missão</h2>
      <p className="mt-4 text-lg text-terra/85">{salao.missao}</p>
      <Link href="/agendar" className="botao mt-10">
        Agendar horário
      </Link>
    </div>
  );
}
