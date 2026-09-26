import { salao } from "@/conteudo/salao";

// Mapa pequeno com os arredores do salão e um botão que abre o pino no Google Maps.
export function MapaBairro({ className = "", zoom = 15, claro = false }: { className?: string; zoom?: number; claro?: boolean }) {
  const { latitude, longitude, mapsLink } = salao.contato;
  const mapa = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&hl=pt-BR&output=embed`;
  return (
    <div className={`overflow-hidden rounded-2xl ${claro ? "bg-areia/10 ring-1 ring-areia/20" : "bg-white ring-1 ring-terra/10"} ${className}`}>
      <iframe title="Mapa dos arredores do salão" src={mapa} className="h-44 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <a
        href={mapsLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${claro ? "text-areia-clara hover:bg-areia hover:text-folha-escura" : "text-folha-escura hover:bg-areia"}`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
        </svg>
        Abrir no Google Maps
      </a>
    </div>
  );
}
