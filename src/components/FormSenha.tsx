"use client";

import { useActionState } from "react";
import { pedirNovaSenha, trocarSenha } from "@/app/(site)/entrar/actions";

function Erro({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-800/20 bg-red-50 p-4 text-sm text-red-900">
      {texto}
    </p>
  );
}

export function FormEsqueciSenha() {
  const [estado, acao, enviando] = useActionState(pedirNovaSenha, undefined);
  return (
    <form action={acao} className="space-y-4">
      <div>
        <label className="rotulo" htmlFor="email">E-mail da sua conta</label>
        <input className="campo" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <Erro texto={estado?.erro} />
      <button className="botao w-full" disabled={enviando}>{enviando ? "Enviando…" : "Enviar link"}</button>
    </form>
  );
}

export function FormNovaSenha() {
  const [estado, acao, enviando] = useActionState(trocarSenha, undefined);
  return (
    <form action={acao} className="space-y-4">
      <div>
        <label className="rotulo" htmlFor="senha">Nova senha (mínimo 8 caracteres)</label>
        <input className="campo" id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <label className="rotulo" htmlFor="confirmacao">Repita a nova senha</label>
        <input className="campo" id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <Erro texto={estado?.erro} />
      <button className="botao w-full" disabled={enviando}>{enviando ? "Salvando…" : "Salvar nova senha"}</button>
    </form>
  );
}
