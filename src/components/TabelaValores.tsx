"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { gruposProdutos, gruposServicos, tamanhos, type ServicoTabela } from "@/conteudo/valores";

const suave = [0.22, 1, 0.36, 1] as const;
const real = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;
type Tamanho = (typeof tamanhos)[number];

// Tabela de valores: abas Serviços/Produtos e um seletor de tamanho que destaca o preço
// do cabelo da cliente em todos os serviços.
export function TabelaValores() {
  const [aba, setAba] = useState<"servicos" | "produtos">("servicos");
  const [tamanho, setTamanho] = useState<Tamanho | null>(null);

  return (
    <div>
      <div className="sticky top-[80px] md:top-[68px] z-10 -mx-4 flex flex-wrap items-center justify-between gap-4 border-b border-terra/10 bg-areia-clara/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div role="tablist" aria-label="Tabela" className="flex rounded-full bg-areia p-1">
          {(["servicos", "produtos"] as const).map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={aba === a}
              onClick={() => setAba(a)}
              className="relative rounded-full px-5 py-2 text-sm font-medium"
            >
              {aba === a && <motion.span layoutId="aba" className="absolute inset-0 rounded-full bg-folha-escura" transition={{ duration: 0.4, ease: suave }} />}
              <span className={`relative ${aba === a ? "text-areia-clara" : "text-terra"}`}>{a === "servicos" ? "Serviços" : "Produtos"}</span>
            </button>
          ))}
        </div>
        {aba === "servicos" && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-terra/85">Meu cabelo:</span>
            {tamanhos.map((t) => (
              <button
                key={t}
                aria-pressed={tamanho === t}
                onClick={() => setTamanho(tamanho === t ? null : t)}
                className={`h-9 min-w-9 rounded-full border px-2 font-medium transition ${tamanho === t ? "border-folha-escura bg-folha-escura text-areia-clara" : "border-terra/25 hover:border-terra"}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {aba === "servicos" ? (
          <motion.div key="servicos" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: suave }}>
            <nav aria-label="Categorias" className="mt-8 flex flex-wrap gap-2">
              {gruposServicos.map((g) => (
                <a key={g.id} href={`#${g.id}`} className="rounded-full border border-terra/20 px-4 py-1.5 text-sm hover:border-terra hover:bg-areia">
                  {g.titulo}
                </a>
              ))}
            </nav>
            {gruposServicos.map((g) => (
              <section key={g.id} id={g.id} className="scroll-mt-40 pt-12">
                <h2 className="titulo text-3xl">{g.titulo.toLowerCase()}</h2>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {g.servicos.map((s, i) => (
                    <Cartao key={s.nome} servico={s} tamanho={tamanho} indice={i} />
                  ))}
                  {g.adicionais?.map((a) => (
                    <motion.div
                      key={a.titulo}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                      transition={{ duration: 0.7, ease: suave }}
                      className="rounded-2xl border border-dashed border-folha-escura/40 p-6"
                    >
                      <h3 className="text-sm font-medium tracking-wide text-terra uppercase">{a.titulo}</h3>
                      <ul className="mt-4 divide-y divide-terra/10">
                        {a.itens.map((it) => (
                          <li key={it.nome} className="flex justify-between py-2">
                            <span>{it.nome}</span>
                            <span className="font-medium text-folha-escura">{real(it.preco)}</span>
                          </li>
                        ))}
                      </ul>
                      {a.observacoes?.map((o) => (
                        <p key={o} className="mt-3 text-sm text-terra/85">
                          {o}
                        </p>
                      ))}
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
            <p className="mt-12 text-sm text-terra/85">
              P, M, G e GG indicam o volume e o comprimento do cabelo. Na dúvida, a Carol confirma o tamanho no atendimento. Valores com “a partir de” podem variar conforme a técnica e a quantidade de produto.
            </p>
          </motion.div>
        ) : (
          <motion.div key="produtos" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: suave }} className="mt-10 grid gap-5 md:grid-cols-2">
            {gruposProdutos.map((g) => (
              <div key={g.titulo} className="rounded-2xl bg-white/70 p-6 shadow-[0_1px_0_rgb(61_28_17/0.06)]">
                <h2 className="titulo text-3xl">{g.titulo.toLowerCase()}</h2>
                <ul className="mt-4 divide-y divide-terra/10">
                  {g.itens.map((p) => (
                    <li key={p.nome} className="flex justify-between py-2.5">
                      <span>{p.nome}</span>
                      <span className="font-medium text-folha-escura">{real(p.preco)}</span>
                    </li>
                  ))}
                </ul>
                {g.destaque && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-folha-escura px-4 py-3 text-areia-clara">
                    <span className="font-medium">{g.destaque.nome}</span>
                    <span className="font-medium">{real(g.destaque.preco)}</span>
                  </div>
                )}
              </div>
            ))}
            <p className="text-sm text-terra/85 md:col-span-2">Produtos à venda no salão.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-16 flex flex-wrap items-center gap-4 rounded-2xl bg-terra p-8 text-areia">
        <p className="titulo mr-auto text-3xl text-areia-clara">vamos cuidar dos seus cachos?</p>
        <Link href="/agendar" className="botao bg-folha hover:bg-areia hover:text-terra">
          Agendar horário
        </Link>
      </div>
    </div>
  );
}

function Cartao({ servico, tamanho, indice }: { servico: ServicoTabela; tamanho: Tamanho | null; indice: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay: (indice % 2) * 0.08, ease: suave }}
      className="rounded-2xl bg-white/70 p-6 shadow-[0_1px_0_rgb(61_28_17/0.06)]"
    >
      <h3 className="text-sm font-medium tracking-wide text-terra uppercase">{servico.nome}</h3>
      {servico.descricao && <p className="mt-1 text-terra/85">{servico.descricao}</p>}
      {servico.aPartirDe && <p className="mt-1 text-xs font-medium tracking-wide text-terra/85 uppercase">a partir de</p>}
      <dl className="mt-4 grid grid-cols-4 gap-2">
        {tamanhos.map((t, i) => {
          const ativo = tamanho === t;
          const apagado = tamanho !== null && !ativo;
          return (
            <motion.div
              key={t}
              animate={{ scale: ativo ? 1.06 : 1 }}
              transition={{ duration: 0.35, ease: suave }}
              className={`rounded-xl px-2 py-3 text-center ${ativo ? "bg-folha-escura text-areia-clara" : apagado ? "bg-areia/35" : "bg-areia/70"}`}
            >
              <dt className={`text-sm font-medium ${ativo ? "text-areia-clara" : "text-terra"}`}>{t}</dt>
              <dd className={`mt-1 font-medium whitespace-nowrap ${ativo ? "" : "text-folha-escura"}`}>{real(servico.precos[i])}</dd>
            </motion.div>
          );
        })}
      </dl>
      {servico.observacoes?.map((o) => (
        <p key={o} className="mt-3 text-sm text-terra/85">
          {o}
        </p>
      ))}
    </motion.article>
  );
}
