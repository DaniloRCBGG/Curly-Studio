"use client";

import { useState, useTransition } from "react";
import { enviarAntesDepois } from "./actions";

const LADO_MAXIMO = 1400; // px do lado maior: nítida no site e leve para o celular de quem visita

// Reduz a foto no próprio navegador (as do celular passam de 3 MB) e converte para .webp.
async function reduzir(arquivo: File): Promise<File> {
  const img = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
  const tela = document.createElement("canvas");
  tela.width = Math.round(img.width * escala);
  tela.height = Math.round(img.height * escala);
  tela.getContext("2d")!.drawImage(img, 0, 0, tela.width, tela.height);
  const blob = await new Promise<Blob | null>((ok) => tela.toBlob(ok, "image/webp", 0.82));
  if (!blob) return arquivo;
  return new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".webp", { type: blob.type });
}

function CampoFoto({ nome, rotulo, ajuda }: { nome: "antes" | "depois"; rotulo: string; ajuda: string }) {
  const [previa, setPrevia] = useState<string | null>(null);
  return (
    <label className="block cursor-pointer">
      <span className="rotulo">{rotulo}</span>
      <span className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-terra/25 bg-white text-center text-sm text-terra/70 hover:border-folha-escura">
        {previa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previa} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="px-4">
            Toque para escolher
            <br />
            <span className="text-xs">{ajuda}</span>
          </span>
        )}
      </span>
      <input
        type="file"
        name={nome}
        accept="image/*"
        required
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setPrevia(f ? URL.createObjectURL(f) : null);
        }}
      />
    </label>
  );
}

export function FormEnvio() {
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, iniciar] = useTransition();
  const [chave, setChave] = useState(0); // recria o formulário depois de enviar, limpando as prévias

  return (
    <form
      key={chave}
      className="cartao grid gap-4 sm:grid-cols-[1fr_1fr_2fr]"
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        setErro(null);
        setOk(false);
        iniciar(async () => {
          try {
            for (const nome of ["antes", "depois"]) {
              const f = dados.get(nome);
              if (f instanceof File && f.size) dados.set(nome, await reduzir(f));
            }
            const r = await enviarAntesDepois(dados);
            if (r.erro) return setErro(r.erro);
            setOk(true);
            setChave((c) => c + 1);
          } catch {
            setErro("Não consegui ler uma das fotos. Tente outra (JPG, PNG ou HEIC convertido).");
          }
        });
      }}
    >
      <CampoFoto nome="antes" rotulo="Foto do antes" ajuda="como a cliente chegou" />
      <CampoFoto nome="depois" rotulo="Foto do depois" ajuda="esta é a que aparece primeiro no site" />
      <div className="flex flex-col gap-3">
        <div>
          <label className="rotulo" htmlFor="servico">
            Serviço
          </label>
          <input id="servico" className="campo" name="servico" maxLength={80} placeholder="Ex.: Corte + definição" required />
        </div>
        <div>
          <label className="rotulo" htmlFor="legenda">
            Legenda (opcional)
          </label>
          <input id="legenda" className="campo" name="legenda" maxLength={120} placeholder="Ex.: Transição capilar, 6 meses" />
          <p className="mt-1 text-xs text-terra/85">Não escreva o nome completo da cliente.</p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="autorizado" required className="mt-1 accent-folha-escura" />
          <span>A cliente autorizou o uso destas fotos no site e nas redes do salão.</span>
        </label>
        {erro && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-900">
            {erro}
          </p>
        )}
        {ok && (
          <p role="status" className="rounded-xl bg-folha/15 p-3 text-sm text-folha-escura">
            Pronto! As fotos já estão na home.
          </p>
        )}
        <button className="botao mt-auto" disabled={enviando}>
          {enviando ? "Enviando…" : "Publicar no site"}
        </button>
      </div>
    </form>
  );
}
