import type { Metadata } from "next";
import Link from "next/link";
import { FormNovaSenha } from "@/components/FormSenha";
import { exigirLogin } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Trocar senha" };

// Serve para quem quer trocar a senha e para quem chegou pelo link de "Esqueci minha senha".
export default async function TrocarSenha({ searchParams }: PageProps<"/minha-conta/senha">) {
  const { ok } = await searchParams;
  const { perfil } = await exigirLogin("/minha-conta/senha");
  const inicio = perfil === "cliente" ? "/minha-conta" : "/equipe";
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="titulo text-5xl">trocar senha</h1>
      <div className="cartao mt-8 space-y-4">
        {ok ? (
          <p className="rounded-xl bg-folha/15 p-4">Senha trocada. Use a nova senha da próxima vez que entrar.</p>
        ) : (
          <FormNovaSenha />
        )}
        <Link href={inicio} className="inline-block text-sm text-folha-escura underline-offset-4 hover:underline">
          {perfil === "cliente" ? "Voltar para minha conta" : "Voltar para o painel"}
        </Link>
      </div>
    </div>
  );
}
