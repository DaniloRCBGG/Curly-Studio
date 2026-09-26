import type { Metadata } from "next";
import { MapaBairro } from "@/components/MapaBairro";
import { salao } from "@/conteudo/salao";

export const metadata: Metadata = { title: "Contato e localização" };

export default function Contato() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
      <div>
        <h1 className="titulo text-5xl">contato</h1>
        <dl className="mt-8 space-y-5">
          <div>
            <dt className="rotulo">Endereço</dt>
            <dd>{salao.contato.endereco}</dd>
          </div>
          <div>
            <dt className="rotulo">WhatsApp</dt>
            <dd>
              <a className="text-folha-escura underline-offset-4 hover:underline" href={salao.contato.whatsappLink}>
                {salao.contato.whatsapp}
              </a>
            </dd>
          </div>
          <div>
            <dt className="rotulo">Instagram</dt>
            <dd>
              <a className="text-folha-escura underline-offset-4 hover:underline" href={salao.contato.instagramLink}>
                {salao.contato.instagram}
              </a>
            </dd>
          </div>
          <div>
            <dt className="rotulo">Horários</dt>
            {salao.horarios.map((h) => (
              <dd key={h.dias}>
                {h.dias}: {h.horas}
              </dd>
            ))}
          </div>
        </dl>
      </div>
      <MapaBairro zoom={16} className="self-start [&_iframe]:h-96" />
    </div>
  );
}
