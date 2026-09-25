import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/sobre", rotulo: "Quem somos" },
  { href: "/servicos", rotulo: "Serviços" },
  { href: "/contato", rotulo: "Contato" },
];

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-20 border-b border-terra/10 bg-areia-clara/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Carol Rios Curly Studio, página inicial" className="shrink-0">
          <Image src="/marca/logo-primaria.svg" alt="Carol Rios Curly Studio" width={172} height={40} priority />
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hidden rounded-full px-3 py-2 hover:bg-areia md:inline-block">
              {l.rotulo}
            </Link>
          ))}
          <Link href="/minha-conta" className="rounded-full px-3 py-2 hover:bg-areia">
            Minha conta
          </Link>
          <Link href="/agendar" className="botao px-5 py-2">
            Agendar
          </Link>
        </nav>
      </div>
    </header>
  );
}
