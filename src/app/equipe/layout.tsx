import Image from "next/image";
import Link from "next/link";
import { exigirEquipe } from "@/lib/auth/sessao";

// Área interna: fora dos buscadores.
export const metadata = { title: "Painel da equipe", robots: { index: false, follow: false } };

export default async function LayoutEquipe({ children }: LayoutProps<"/equipe">) {
  const { perfil, supabase } = await exigirEquipe();
  // Aviso de estoque baixo no menu (RF13), para a equipe ver em qualquer tela.
  const { count: estoqueBaixo } = await supabase.from("produtos_estoque_baixo").select("id", { count: "exact", head: true });
  const links = [
    { href: "/equipe", rotulo: "Agenda" },
    { href: "/equipe/novo", rotulo: "Novo agendamento" },
    { href: "/equipe/clientes", rotulo: "Clientes" },
    { href: "/equipe/servicos", rotulo: "Serviços" },
    { href: "/equipe/estoque", rotulo: "Estoque", aviso: estoqueBaixo ?? 0 },
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
                {"aviso" in l && !!l.aviso && (
                  <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900" title="Produtos com estoque baixo">
                    {l.aviso}
                    <span className="sr-only"> com estoque baixo</span>
                  </span>
                )}
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
