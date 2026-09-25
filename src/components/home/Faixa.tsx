"use client";

import { motion } from "motion/react";

// Faixa com as palavras da marca passando devagar.
export function Faixa({ palavras }: { palavras: string[] }) {
  const linha = [...palavras, ...palavras, ...palavras];
  return (
    <div className="overflow-hidden border-y border-terra/10 bg-folha-escura py-5 text-areia-clara" aria-hidden>
      <motion.div className="flex w-max gap-10 whitespace-nowrap" animate={{ x: ["0%", "-33.333%"] }} transition={{ duration: 24, ease: "linear", repeat: Infinity }}>
        {linha.map((p, i) => (
          <span key={i} className="titulo flex items-center gap-10 text-3xl">
            {p}
            <span className="inline-block size-2 rounded-full bg-folha" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
