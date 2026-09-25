"use client";

import { motion, type Variants } from "motion/react";

// Faz o conteúdo surgir com fade ao entrar na tela.
export function Revelar({ children, atraso = 0, className, y = 28 }: { children: React.ReactNode; atraso?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay: atraso, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const grupo: Variants = { oculto: {}, visivel: { transition: { staggerChildren: 0.14 } } };
export const itemRevelar: Variants = {
  oculto: { opacity: 0, y: 32 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

// Grupo cujos filhos (motion.* com variants={itemRevelar}) aparecem um depois do outro.
export function RevelarGrupo({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "ul" }) {
  const Comp = as === "ul" ? motion.ul : motion.div;
  return (
    <Comp className={className} variants={grupo} initial="oculto" whileInView="visivel" viewport={{ once: true, margin: "0px 0px -10% 0px" }}>
      {children}
    </Comp>
  );
}
