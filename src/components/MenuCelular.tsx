"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Menu do celular: o botão ☰ abre todas as abas que o computador mostra no cabeçalho.
export function MenuCelular({ links }: { links: { href: string; rotulo: string }[] }) {
  const caminho = usePathname();
  // Guarda em que página o menu foi aberto: ao trocar de página, ele fecha sozinho.
  const [abertoEm, setAbertoEm] = useState<string | null>(null);
  const aberto = abertoEm === caminho;
  const setAberto = (valor: boolean | ((a: boolean) => boolean)) =>
    setAbertoEm((atual) => ((typeof valor === "function" ? valor(atual === caminho) : valor) ? caminho : null));

  // Fecha também com a tecla Esc.
  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAbertoEm(null);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-controls="menu-celular"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        className="flex size-10 items-center justify-center rounded-full hover:bg-areia"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {aberto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {aberto && (
        <nav id="menu-celular" aria-label="Menu" className="absolute inset-x-0 top-full border-b border-terra/10 bg-areia-clara shadow-lg">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={caminho === l.href ? "page" : undefined}
                  className={`block rounded-xl px-3 py-3 text-base hover:bg-areia ${caminho === l.href ? "font-medium text-folha-escura" : ""}`}
                >
                  {l.rotulo}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-terra/10 pt-3">
              <Link href="/agendar" className="botao w-full">
                Agendar
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
