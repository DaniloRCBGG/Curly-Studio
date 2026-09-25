import type { Metadata } from "next";
import { salao } from "@/conteudo/salao";

export const metadata: Metadata = { title: "Contato e localização" };

export default function Contato() {
  const { latitude: lat, longitude: lon } = salao.contato;
  const d = 0.004;
  const mapa = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&layer=mapnik&marker=${lat},${lon}`;
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
      <iframe
        title="Mapa com a localização do salão"
        src={mapa}
        className="min-h-80 w-full rounded-2xl border border-terra/10"
        loading="lazy"
      />
    </div>
  );
}
