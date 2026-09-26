import type { Metadata } from "next";
import Link from "next/link";
import { BotaoGoogle, DivisorOu } from "@/components/BotaoGoogle";
import { FormCadastro } from "@/components/FormCadastro";
import { caminhoSeguro } from "@/lib/validacao";

export const metadata: Metadata = { title: "Criar conta" };

export default async function Cadastro({ searchParams }: PageProps<"/cadastro">) {
  const { voltar } = await searchParams;
  const destino = caminhoSeguro(voltar, "/agendar");
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="titulo text-5xl">criar conta</h1>
      <p className="mt-3 text-terra/75">
        Já tem conta?{" "}
        <Link href={`/entrar?voltar=${encodeURIComponent(destino)}`} className="font-medium text-folha-escura underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
      <div className="cartao mt-8">
        <div className="mx-auto max-w-sm">
          <BotaoGoogle voltar={destino} />
        </div>
        <DivisorOu />
        <FormCadastro voltar={destino} />
      </div>
    </div>
  );
}
