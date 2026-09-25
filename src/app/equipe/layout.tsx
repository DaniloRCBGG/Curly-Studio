import Image from "next/image";
import Link from "next/link";
import { exigirEquipe } from "@/lib/auth/sessao";

export const metadata = { title: "Painel da equipe" };

export default async function LayoutEquipe({ children }: LayoutProps<"/equipe">) {
  const { perfil } = await exigirEquipe();
  const links = [
    { href: "/equipe", rotulo: "Agenda" },
    { href: "/equipe/novo", rotulo: "Novo agendamento" },
    { href: "/equipe/clientes", rotulo: "Clientes" },
    { href: "/equipe/servicos", rotulo: "Serviços" },
    ...(perfil === "gerente" ? [{ href: "/equipe/funcionarias", rotulo: "Equipe" }] : []),
  ];
  return (
    <>
      <header className="border-b border-terra/10 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/equipe" aria-label="Painel da equipe">
            <Image src="/marca/logo-terciaria.svg" alt="" width={36} height={36} />
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-full px-3 py-2 hover:bg-areia">
                {l.rotulo}
              </Link>
            ))}
          </nav>
          <Link href="/minha-conta" className="ml-auto text-sm text-terra/70 hover:underline">
            Minha conta
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
