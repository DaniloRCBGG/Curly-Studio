"use client";

import { useRef, type ReactNode } from "react";

// Botão "?" que abre o guia do estoque. O texto vem do servidor (GuiaEstoque) só para quem está logado,
// para não ir parar no JavaScript público do site.

export function AjudaEstoque({ children }: { children: ReactNode }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        aria-label="Como usar o estoque"
        title="Como usar o estoque"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-terra/30 text-lg font-medium text-terra transition hover:border-folha-escura hover:bg-folha-escura hover:text-areia-clara focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-folha-escura"
      >
        ?
      </button>
      <dialog
        ref={dialogo}
        aria-labelledby="ajuda-estoque-titulo"
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        className="m-auto max-h-[90vh] w-[min(48rem,calc(100vw-2rem))] rounded-2xl bg-areia-clara p-0 text-terra shadow-xl backdrop:bg-terra/40"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-terra/10 bg-areia-clara px-6 py-4">
          <h2 id="ajuda-estoque-titulo" className="titulo text-3xl">como usar o estoque</h2>
          <button type="button" onClick={() => dialogo.current?.close()} className="botao-secundario px-4 py-2 text-sm">
            Fechar
          </button>
        </div>
        <div className="space-y-8 px-6 py-6 leading-relaxed">{children}</div>
      </dialog>
    </>
  );
}
