import Image from "next/image";
import Link from "next/link";
import { salao } from "@/conteudo/salao";

export function Rodape() {
  return (
    <footer className="mt-auto bg-terra text-areia">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Image src="/marca/logo-secundaria-clara.svg" alt="Carol Rios Curly Studio" width={140} height={97} />
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium text-areia-clara">Horários</p>
          {salao.horarios.map((h) => (
            <p key={h.dias}>
              {h.dias}: {h.horas}
            </p>
          ))}
          <p className="pt-2">{salao.contato.endereco}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium text-areia-clara">Fale com a gente</p>
          <p>
            <a href={salao.contato.whatsappLink} className="underline-offset-4 hover:underline">
              WhatsApp {salao.contato.whatsapp}
            </a>
          </p>
          <p>
            <a href={salao.contato.instagramLink} className="underline-offset-4 hover:underline">
              Instagram {salao.contato.instagram}
            </a>
          </p>
          <p className="pt-2">
            <Link href="/privacidade" className="underline-offset-4 hover:underline">
              Política de privacidade
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
