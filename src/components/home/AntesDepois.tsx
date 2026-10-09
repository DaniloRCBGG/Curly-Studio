"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Transformacao } from "@/lib/antes-depois";
import { ArteProvisoria } from "./ArteProvisoria";
import { CabecalhoSecao } from "./CabecalhoSecao";

const TROCA_AUTOMATICA = 6500; // ms entre uma cliente e outra, enquanto ninguém mexe
const suave = [0.22, 1, 0.36, 1] as const;

function Foto({ src, tipo, n, alt }: { src: string; tipo: "antes" | "depois"; n: number; alt: string }) {
  if (!src) return <ArteProvisoria tipo={tipo} n={n} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />;
}

// Antes e depois das clientes. O palco mostra sempre o depois; o antes só aparece enquanto a pessoa
// segura o botão "ver o antes" (ou a barra de espaço), abrindo num círculo a partir do botão, e some
// quando ela solta. Assim os cachos sem tratamento nunca ficam expostos sozinhos.
export function AntesDepois({ itens, provisorias }: { itens: Transformacao[]; provisorias: boolean }) {
  const [atual, setAtual] = useState(0);
  const [vendoAntes, setVendoAntes] = useState(false);
  const [mexeu, setMexeu] = useState(false);
  const palco = useRef<HTMLDivElement>(null);
  const naTela = useInView(palco, { amount: 0.5 });
  const reduzir = useReducedMotion();
  const item = itens[atual];

  // Troca de cliente sozinha enquanto a seção está na tela, até a pessoa interagir.
  const automatico = naTela && !mexeu && !reduzir && !vendoAntes && itens.length > 1;
  useEffect(() => {
    if (!automatico) return;
    const t = setTimeout(() => setAtual((a) => (a + 1) % itens.length), TROCA_AUTOMATICA);
    return () => clearTimeout(t);
  }, [automatico, atual, itens.length]);

  const escolher = (i: number) => {
    setMexeu(true);
    setVendoAntes(false);
    setAtual(i);
  };
  const segurar = (sim: boolean) => {
    if (sim) setMexeu(true);
    setVendoAntes(sim);
  };

  if (!item) return null;
  const alt = (tipo: string) => `${tipo} do serviço ${item.servico}${item.legenda ? ` (${item.legenda})` : ""}`;

  return (
    <section className="overflow-hidden bg-terra py-20 text-areia sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* No celular: título, foto e depois a escolha da cliente. No computador: foto à esquerda, o resto à direita. */}
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          {/* "contents" no celular: título e escolha viram itens da grade, um acima e outro abaixo da foto. */}
          <div className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-8">
            <div className="order-1">
              <CabecalhoSecao
                escuro
                rotulo="Antes e depois"
                titulo="cachos que contam histórias"
                texto="Cada cliente chega com uma história e sai com cachos definidos, hidratados e do jeito dela. Segure o botão na foto para ver como ela chegou."
              />
            </div>

            {/* Serviço da foto e escolha da cliente */}
            <div className="order-3">
              <div className="min-h-20 border-l-2 border-folha pl-5" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.4, ease: suave }}
                  >
                    <p className="titulo text-3xl text-areia-clara">{item.servico.toLowerCase()}</p>
                    {item.legenda && <p className="mt-1 text-areia/80">{item.legenda}</p>}
                  </motion.div>
                </AnimatePresence>
              </div>

              {itens.length > 1 && (
                <ul className="mt-8 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible" aria-label="Escolha uma transformação">
                  {itens.map((t, i) => (
                    <li key={t.id} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => escolher(i)}
                        aria-current={i === atual}
                        aria-label={`Ver ${t.servico}`}
                        className={`relative block aspect-[4/5] w-20 overflow-hidden rounded-2xl transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-areia sm:w-full ${
                          i === atual ? "opacity-100 ring-2 ring-folha ring-offset-2 ring-offset-terra" : "opacity-55 hover:opacity-90"
                        }`}
                      >
                        {t.depois ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.depois} alt="" className="h-full w-full object-cover" draggable={false} />
                        ) : (
                          <ArteProvisoria tipo="depois" n={i} rotulo={false} />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {provisorias && <p className="mt-4 text-xs text-areia/60">Fotos provisórias: as reais entram pelo painel da equipe, em Fotos.</p>}
            </div>
          </div>

          {/* Palco */}
          <div
            ref={palco}
            className="relative mx-auto aspect-[4/5] w-full max-w-md select-none overflow-hidden rounded-[2rem] bg-areia/10 shadow-2xl shadow-black/30 order-2 lg:col-start-1 lg:row-start-1 lg:max-w-none"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={item.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduzir ? 0 : 1.1, ease: suave }}
              >
                <Foto src={item.depois} tipo="depois" n={atual} alt={alt("Depois")} />
              </motion.div>
            </AnimatePresence>

            {/* O antes abre num círculo a partir do botão e fecha quando a pessoa solta. */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={false}
              animate={{
                clipPath: vendoAntes ? "circle(150% at 3.25rem calc(100% - 3.25rem))" : "circle(0% at 3.25rem calc(100% - 3.25rem))",
              }}
              transition={{
                duration: reduzir ? 0 : vendoAntes ? 0.7 : 0.5,
                ease: suave,
              }}
              aria-hidden={!vendoAntes}
            >
              <Foto src={item.antes} tipo="antes" n={atual} alt={alt("Antes")} />
            </motion.div>

            <div className="pointer-events-none absolute top-4 left-4 overflow-hidden rounded-full bg-terra/70 px-3 py-1 text-xs font-medium tracking-widest uppercase backdrop-blur">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={vendoAntes ? "a" : "d"}
                  className="block"
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                >
                  {vendoAntes ? "antes" : "depois"}
                </motion.span>
              </AnimatePresence>
            </div>

            <button
              type="button"
              className="absolute bottom-4 left-4 flex touch-none items-center gap-3 rounded-full bg-areia-clara py-2 pr-5 pl-2 text-sm font-medium text-terra shadow-lg transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-areia active:scale-95"
              aria-pressed={vendoAntes}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                segurar(true);
              }}
              onPointerUp={() => segurar(false)}
              onPointerCancel={() => segurar(false)}
              onLostPointerCapture={() => segurar(false)}
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                  e.preventDefault();
                  segurar(true);
                }
              }}
              onKeyUp={(e) => (e.key === " " || e.key === "Enter") && segurar(false)}
              onBlur={() => segurar(false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              <span className="relative flex size-9 items-center justify-center rounded-full bg-folha-escura text-areia-clara">
                {!vendoAntes && !reduzir && <span className="absolute inset-0 animate-ping rounded-full bg-folha-escura/40" />}
                <svg
                  viewBox="0 0 24 24"
                  className="relative size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              {vendoAntes ? "solte para voltar" : "segure para ver o antes"}
            </button>

            {/* Tempo até a próxima cliente */}
            {automatico && (
              <motion.div
                key={`barra-${atual}`}
                className="absolute right-0 bottom-0 left-0 h-1 origin-left bg-folha"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: TROCA_AUTOMATICA / 1000,
                  ease: "linear",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
