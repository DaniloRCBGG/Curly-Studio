import type { Metadata } from "next";
import { TabelaValores } from "@/components/TabelaValores";

export const metadata: Metadata = { title: "Valores", description: "Tabela de valores de cortes, tratamentos, coloração e produtos do Carol Rios Curly Studio." };

export default function Valores() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6">
      <h1 className="text-center">
        <span className="titulo block text-4xl text-terra italic sm:text-5xl">tabela de</span>
        <span className="titulo block text-6xl font-light tracking-[0.08em] text-folha-escura uppercase sm:text-7xl">valores</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-center text-terra/75">
        Os preços variam pelo tamanho do cabelo. Escolha o seu em “Meu cabelo” para ver só o que vale para você.
      </p>
      <div className="mt-10">
        <TabelaValores />
      </div>
    </div>
  );
}
