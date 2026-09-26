import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormCadastro } from "@/components/FormCadastro";
import { exigirLogin } from "@/lib/auth/sessao";
import { caminhoSeguro } from "@/lib/validacao";

export const metadata: Metadata = { title: "Completar cadastro" };

// Depois do login com Google: pede telefone e CPF, que o Google não informa e o Pix exige.
export default async function CompletarCadastro({ searchParams }: PageProps<"/cadastro/completar">) {
  const { voltar } = await searchParams;
  const destino = caminhoSeguro(voltar, "/agendar");
  const { supabase, user, perfil } = await exigirLogin(`/cadastro/completar?voltar=${encodeURIComponent(destino)}`);
  const { data: ficha } = await supabase.from("clientes").select("id").eq("usuario_id", user.id).maybeSingle();
  if (ficha || perfil !== "cliente") redirect(destino);

  const nome = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "");
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="titulo text-5xl">quase lá</h1>
      <p className="mt-3 text-terra/75">
        Você entrou com o Google ({user.email}). Falta só o telefone e o CPF, que usamos para confirmar seus horários e gerar o Pix do sinal.
      </p>
      <div className="cartao mt-8">
        <FormCadastro voltar={destino} completar nome={nome} />
      </div>
    </div>
  );
}
