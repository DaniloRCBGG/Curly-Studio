"use client";

import { motion } from "motion/react";
import { CabecalhoSecao } from "./CabecalhoSecao";
import { RevelarGrupo, itemRevelar } from "./Revelar";

const passos = [
  { n: "01", titulo: "escolha", texto: "O serviço, o dia, o horário e, se quiser, a profissional." },
  { n: "02", titulo: "confirme", texto: "Pague o sinal por Pix com o QR code. Leva menos de um minuto." },
  { n: "03", titulo: "venha", texto: "Seu horário está garantido. É só chegar e cuidar dos seus cachos." },
];

export function ComoFunciona() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <CabecalhoSecao rotulo="Passo a passo" titulo="como agendar" texto="Seu horário fica confirmado na hora, com um sinal pago por Pix." />
      <div className="relative mt-12">
        <motion.span
          className="absolute top-7 left-0 hidden h-px w-full origin-left bg-folha-escura/40 md:block"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "0px 0px -20% 0px" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />
        <RevelarGrupo as="ul" className="grid gap-10 md:grid-cols-3">
          {passos.map((p) => (
            <motion.li key={p.n} variants={itemRevelar} className="relative">
              <span className="relative flex size-14 items-center justify-center rounded-full bg-terra text-sm font-medium text-areia">{p.n}</span>
              <h3 className="titulo mt-6 text-3xl">{p.titulo}</h3>
              <p className="mt-2 max-w-xs text-terra/75">{p.texto}</p>
            </motion.li>
          ))}
        </RevelarGrupo>
      </div>
    </section>
  );
}
