import type { Metadata } from "next";
import { FormEntrar } from "@/components/FormEntrar";
import { caminhoSeguro } from "@/lib/validacao";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const { voltar } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="titulo text-5xl">entrar</h1>
      <p className="mt-3 text-terra/75">Entre para agendar e acompanhar seus horários.</p>
      <div className="cartao mt-8">
        <FormEntrar voltar={caminhoSeguro(voltar)} />
      </div>
    </div>
  );
}
