"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { midia } from "@/conteudo/midia";
import { salao } from "@/conteudo/salao";

const suave = [0.22, 1, 0.36, 1] as const;

// Topo da home: o vídeo da Carol ocupa a seção inteira e congela no último quadro,
// com ela ao lado da logo. O texto entra aos poucos por cima, e tudo se move devagar ao rolar.
export function Hero() {
  const reduzir = useReducedMotion();
  const temVideo = Boolean(midia.videoTopo) && !reduzir;
  const [videoTerminou, setVideoTerminou] = useState(false);
  const pronta = !temVideo || videoTerminou;

  const secao = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: secao, offset: ["start start", "end start"] });
  const yFundo = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const yTexto = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacidade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const palavras = salao.chamada.split(" ");
  const estado = pronta ? "visivel" : "oculto";

  return (
    <section ref={secao} className="relative isolate min-h-[92svh] overflow-hidden bg-terra text-areia">
      {midia.videoTopo || midia.posterTopo ? (
        <motion.div style={{ y: yFundo }} className="absolute inset-0 -z-10">
          {temVideo ? (
            <video
              src={midia.videoTopo}
              poster={midia.posterTopo || undefined}
              className="h-full w-full object-cover"
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={() => setVideoTerminou(true)}
              onError={() => setVideoTerminou(true)}
              aria-hidden
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={midia.posterTopo} alt="" className="h-full w-full object-cover" aria-hidden />
          )}
          {/* Degradê para o texto ficar legível sobre o vídeo. */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-terra/85 via-terra/40 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: pronta ? 1 : 0 }}
            transition={{ duration: 1.2 }}
          />
        </motion.div>
      ) : null}

      {/* Logo do lado direito: a Carol entra no vídeo e para ao lado dela. */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 items-center justify-center md:flex"
        style={{ y: yFundo }}
        initial={{ opacity: 0, scale: 0.9, filter: "blur(12px)", clipPath: "circle(0% at 50% 50%)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)", clipPath: "circle(75% at 50% 50%)" }}
        transition={{ duration: 1.6, ease: suave }}
      >
        <Image src="/marca/logo-secundaria-clara.svg" alt="" width={340} height={237} aria-hidden priority />
      </motion.div>

      <motion.div style={{ y: yTexto, opacity: opacidade }} className="mx-auto flex min-h-[92svh] max-w-6xl items-center px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h1 className="titulo text-5xl text-areia-clara sm:text-7xl" aria-label={salao.chamada}>
            {palavras.map((p, i) => (
              <span key={i} className="inline-block overflow-hidden pb-2 align-bottom" aria-hidden>
                <motion.span
                  className="inline-block"
                  initial="oculto"
                  animate={estado}
                  variants={{ oculto: { y: "110%" }, visivel: { y: 0 } }}
                  transition={{ duration: 0.9, delay: 0.3 + i * 0.09, ease: suave }}
                >
                  {p}&nbsp;
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-6 text-lg text-areia"
            initial={{ opacity: 0, y: 16 }}
            animate={pronta ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.4 + palavras.length * 0.09, ease: suave }}
          >
            {salao.subchamada}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={pronta ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.6 + palavras.length * 0.09, ease: suave }}
          >
            <Link href="/agendar" className="botao bg-folha hover:bg-areia hover:text-terra">
              Agendar horário
            </Link>
            <Link href="/servicos" className="inline-flex items-center rounded-full border border-areia/40 px-6 py-3 font-medium hover:border-areia">
              Ver serviços
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs tracking-widest text-areia/70 uppercase"
        initial={{ opacity: 0 }}
        animate={pronta ? { opacity: 1 } : {}}
        transition={{ delay: 1.8 }}
        aria-hidden
      >
        role
        <motion.span className="block h-8 w-px origin-top bg-areia/60" animate={{ scaleY: [0.3, 1, 0.3] }} transition={{ duration: 1.8, repeat: Infinity }} />
      </motion.div>
    </section>
  );
}
