import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Confirme seu e-mail" };

export default function ConfirmeEmail() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="titulo text-5xl">quase lá!</h1>
      <div className="cartao mt-8 space-y-4">
        <p className="rounded-xl bg-folha/15 p-4">
          Conta criada. Enviamos um e-mail de confirmação: clique no link para ativar sua conta e depois entre com seu e-mail e senha.
        </p>
        <p className="text-sm text-terra/75">Não chegou? Confira o spam ou a aba Promoções. O e-mail pode levar alguns minutos.</p>
        <Link href="/entrar" className="botao w-full">
          Ir para entrar
        </Link>
      </div>
    </div>
  );
}
