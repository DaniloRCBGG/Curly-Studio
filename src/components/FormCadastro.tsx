"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cadastrar, completarCadastro } from "@/app/(site)/entrar/actions";
import { CamposEndereco } from "@/components/CamposEndereco";

// "completar" é para quem entrou pelo Google: sem e-mail e senha, que já vieram do Google.
export function FormCadastro({ voltar, completar = false, nome = "" }: { voltar: string; completar?: boolean; nome?: string }) {
  const [estado, acao, enviando] = useActionState(completar ? completarCadastro : cadastrar, undefined);
  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="voltar" value={voltar} />
      <div className="sm:col-span-2">
        <label className="rotulo" htmlFor="nome">Nome completo</label>
        <input className="campo" id="nome" name="nome" autoComplete="name" defaultValue={nome} required />
      </div>
      <div>
        <label className="rotulo" htmlFor="telefone">Telefone / WhatsApp</label>
        <input className="campo" id="telefone" name="telefone" type="tel" autoComplete="tel" placeholder="(21) 99999-9999" required />
      </div>
      <div>
        <label className="rotulo" htmlFor="cpf">CPF</label>
        <input className="campo" id="cpf" name="cpf" inputMode="numeric" placeholder="000.000.000-00" required />
      </div>
      {!completar && (
        <>
          <div className="sm:col-span-2">
            <label className="rotulo" htmlFor="email">E-mail</label>
            <input className="campo" id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="sm:col-span-2">
            <label className="rotulo" htmlFor="senha">Senha (mínimo 8 caracteres)</label>
            <input className="campo" id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
          </div>
        </>
      )}
      <CamposEndereco obrigatorio />
      <label className="flex items-start gap-3 text-sm sm:col-span-2">
        <input type="checkbox" name="aceite" className="mt-1 size-4 accent-folha-escura" required />
        <span>
          Li e aceito a{" "}
          <Link href="/privacidade" target="_blank" className="text-folha-escura underline underline-offset-4">
            política de privacidade
          </Link>
          .
        </span>
      </label>
      {estado?.erro && <p role="alert" className="text-sm text-red-800 sm:col-span-2">{estado.erro}</p>}
      <button className="botao sm:col-span-2" disabled={enviando}>{enviando ? "Salvando…" : completar ? "Continuar" : "Criar conta"}</button>
    </form>
  );
}
