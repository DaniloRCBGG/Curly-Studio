"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

function Palavra({ texto, progresso, faixa }: { texto: string; progresso: MotionValue<number>; faixa: [number, number] }) {
  const opacidade = useTransform(progresso, faixa, [0.15, 1]);
  return (
    <motion.span style={{ opacity: opacidade }} className="inline">
      {texto}{" "}
    </motion.span>
  );
}

// Texto que vai "acendendo" palavra por palavra conforme a pessoa rola a página.
export function TextoRolagem({ texto, className }: { texto: string; className?: string }) {
  const alvo = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: alvo, offset: ["start 0.85", "end 0.45"] });
  const palavras = texto.split(" ");
  return (
    <p ref={alvo} className={className} aria-label={texto}>
      <span aria-hidden>
        {palavras.map((p, i) => (
          <Palavra key={i} texto={p} progresso={scrollYProgress} faixa={[i / palavras.length, (i + 1) / palavras.length]} />
        ))}
      </span>
    </p>
  );
}
