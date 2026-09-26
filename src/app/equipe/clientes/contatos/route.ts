import { exigirGerente } from "@/lib/auth/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { montarVcard } from "@/lib/vcard";

// Lista de contatos (.vcf) para a Carol salvar no celular do salão e achar as clientes no WhatsApp.
// Por padrão traz só as clientes que ainda não saíram em nenhuma lista e marca essas como exportadas;
// com ?todas=1 traz todas com telefone, sem marcar nada.
export async function GET(request: Request) {
  await exigirGerente();
  const todas = new URL(request.url).searchParams.get("todas") === "1";
  const admin = criarClienteAdmin();

  let consulta = admin.from("clientes").select("id, nome, telefone, email, criado_em").not("telefone", "is", null).neq("telefone", "").order("criado_em");
  if (!todas) consulta = consulta.is("contato_exportado_em", null);
  const { data, error } = await consulta;
  if (error) return new Response("Não foi possível montar a lista.", { status: 500 });

  const clientes = data ?? [];
  const vcf = montarVcard(
    clientes.map((c) => ({
      nome: c.nome,
      telefone: c.telefone,
      email: c.email,
      desde: new Date(c.criado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    })),
    "Cliente Carol Rios Curly Studio",
  );

  if (!todas && clientes.length > 0) {
    await admin
      .from("clientes")
      .update({ contato_exportado_em: new Date().toISOString() })
      .in(
        "id",
        clientes.map((c) => c.id),
      );
  }

  const dia = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  return new Response(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${todas ? "todas" : "novas"}-${dia}.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
