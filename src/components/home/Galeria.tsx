"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { midia } from "@/conteudo/midia";
import { CabecalhoSecao } from "./CabecalhoSecao";

// Galeria que se arrasta para o lado. Sem fotos cadastradas, mostra espaços reservados.
export function Galeria() {
  const trilho = useRef<HTMLDivElement>(null);
  const faixa = useRef<HTMLDivElement>(null);
  // Limites do arraste em pixels: de 0 (primeira foto no lugar de sempre) até a última foto encostar
  // na margem direita. Usar o próprio trilho como limite prendia a faixa sem a margem da esquerda.
  const [limite, setLimite] = useState(0);

  useEffect(() => {
    const t = trilho.current;
    const f = faixa.current;
    if (!t || !f) return;
    const medir = () => {
      const estilo = getComputedStyle(t);
      const util = t.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
      setLimite(Math.min(0, util - f.scrollWidth));
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(t);
    obs.observe(f);
    return () => obs.disconnect();
  }, []);
  const fotos = midia.galeria.length ? midia.galeria : Array.from({ length: 6 }, (_, i) => ({ src: "", alt: `Foto ${i + 1}` }));

  return (
    <section className="overflow-hidden bg-areia py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <CabecalhoSecao rotulo="Galeria" titulo="nossos cachos" acao={<p className="hidden text-sm text-terra/85 sm:block">Arraste para o lado</p>} />
      </div>
      <div ref={trilho} className="mt-10 cursor-grab px-4 active:cursor-grabbing sm:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
        <motion.div ref={faixa} className="flex w-max gap-4" drag="x" dragConstraints={{ left: limite, right: 0 }} dragElastic={0.08}>
          {fotos.map((f, i) => (
            <motion.figure
              key={i}
              className="relative h-80 w-60 shrink-0 overflow-hidden rounded-3xl bg-terra/10 sm:h-96 sm:w-72"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
            >
              {f.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.src} alt={f.alt} className="pointer-events-none h-full w-full object-cover" draggable={false} />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-terra/15 to-folha/25 text-sm text-terra/50">foto {i + 1}</div>
              )}
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
