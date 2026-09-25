"use client";

import Link from "next/link";
import { useActionState } from "react";
import { entrar } from "@/app/(site)/entrar/actions";

export function FormEntrar({ voltar }: { voltar: string }) {
  const [estado, acao, enviando] = useActionState(entrar, undefined);
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="voltar" value={voltar} />
      <div>
        <label className="rotulo" htmlFor="email">E-mail</label>
        <input className="campo" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="rotulo" htmlFor="senha">Senha</label>
        <input className="campo" id="senha" name="senha" type="password" autoComplete="current-password" required />
      </div>
      {estado?.erro && <p role="alert" className="text-sm text-red-800">{estado.erro}</p>}
      <button className="botao w-full" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
      <p className="text-center text-sm text-terra/75">
        Ainda não tem conta?{" "}
        <Link href={`/cadastro?voltar=${encodeURIComponent(voltar)}`} className="font-medium text-folha-escura underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
