import type { Metadata } from "next";
import Link from "next/link";
import { FormEsqueciSenha } from "@/components/FormSenha";

export const metadata: Metadata = { title: "Esqueci a senha" };

export default async function EsqueciSenha({ searchParams }: PageProps<"/entrar/esqueci">) {
  const { enviado, erro } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="titulo text-5xl">nova senha</h1>
      <div className="cartao mt-8 space-y-4">
        {enviado ? (
          <p className="rounded-xl bg-folha/15 p-4">
            Se este e-mail tem conta no site, enviamos um link para criar uma nova senha. Confira a caixa de entrada e o spam.
          </p>
        ) : (
          <>
            {erro === "link" && (
              <p role="alert" className="rounded-xl border border-red-800/20 bg-red-50 p-4 text-sm text-red-900">
                Esse link expirou ou já foi usado. Peça um novo abaixo.
              </p>
            )}
            <p className="text-terra/75">Informe o e-mail da sua conta e enviamos um link para você criar uma senha nova.</p>
            <FormEsqueciSenha />
          </>
        )}
        <Link href="/entrar" className="inline-block text-sm text-folha-escura underline-offset-4 hover:underline">
          Voltar para entrar
        </Link>
      </div>
    </div>
  );
}
