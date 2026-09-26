"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { midia } from "@/conteudo/midia";
import { salao } from "@/conteudo/salao";

const suave = [0.22, 1, 0.36, 1] as const;

// Topo da home: o vídeo da Carol toca uma vez e para no último quadro, ao lado da logo.
// Depois o texto entra palavra por palavra, e tudo se move devagar ao rolar.
export function Hero() {
  const reduzir = useReducedMotion();
  const video = midia.topo.video;
  const [pronta, setPronta] = useState(!video);
  const [tocando, setTocando] = useState(false);
  const player = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!video) return;
    const v = player.current;
    // Com movimento reduzido fica só a capa (último quadro), e o texto entra logo.
    if (reduzir || !v) {
      const agora = setTimeout(() => setPronta(true), 0);
      return () => clearTimeout(agora);
    }
    // Se o navegador bloquear o autoplay (ex.: modo economia no iPhone), fica a capa e o texto entra.
    const reserva = setTimeout(() => setPronta(true), 4000);
    v.play().catch(() => setPronta(true));
    return () => clearTimeout(reserva);
  }, [video, reduzir]);

  const secao = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: secao, offset: ["start start", "end start"] });
  const yFoto = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const yTexto = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacidade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const palavras = salao.chamada.split(" ");
  const estado = pronta ? "visivel" : "oculto";

  return (
    <section ref={secao} className="relative isolate overflow-hidden bg-terra text-areia">
      <div className="mx-auto grid min-h-[92svh] max-w-7xl md:grid-cols-[1fr_1fr]">
        {/* Painel da foto: no celular fica em cima; no computador, à direita. */}
        {video && (
          <motion.div style={{ y: yFoto }} className="relative order-first h-[62svh] md:order-last md:h-auto">
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
              animate={tocando || pronta ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
              transition={{ duration: 1.1, ease: suave }}
            >
              {reduzir ? (
                <Image src={midia.topo.capa} alt="Carol Rios" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" style={{ objectPosition: midia.topo.enquadramento }} />
              ) : (
                <video
                  ref={player}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: midia.topo.enquadramento }}
                  poster={midia.topo.capa}
                  muted
                  playsInline
                  preload="auto"
                  aria-label="Carol Rios"
                  onPlaying={() => setTocando(true)}
                  onEnded={() => setPronta(true)}
                >
                  <source src={video.webm} type="video/webm" />
                  <source src={video.mp4} type="video/mp4" />
                </video>
              )}
            </motion.div>
            {/* Funde a foto com o fundo terra. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-terra via-transparent to-transparent md:bg-gradient-to-r md:from-terra md:via-terra/10" />
            <motion.div
              className="absolute bottom-6 left-4 w-40 md:top-1/2 md:bottom-auto md:left-0 md:w-56 md:-translate-x-1/2 md:-translate-y-1/2"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={pronta ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
              transition={{ duration: 1.2, ease: suave }}
            >
              <Image src="/marca/logo-secundaria-clara.svg" alt="" width={224} height={156} aria-hidden priority />
            </motion.div>
          </motion.div>
        )}

        {!video && (
          <motion.div
            className="order-last hidden items-center justify-center md:flex"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(12px)", clipPath: "circle(0% at 50% 50%)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", clipPath: "circle(75% at 50% 50%)" }}
            transition={{ duration: 1.6, ease: suave }}
          >
            <Image src="/marca/logo-secundaria-clara.svg" alt="" width={340} height={237} aria-hidden priority />
          </motion.div>
        )}

        <motion.div style={{ y: yTexto, opacity: opacidade }} className="flex items-center px-4 pt-6 pb-20 sm:px-6 md:py-20 md:pr-16 lg:pl-8">
          <div className="max-w-xl">
            <h1 className="titulo text-5xl text-areia-clara sm:text-6xl lg:text-7xl" aria-label={salao.chamada}>
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
      </div>
    </section>
  );
}
