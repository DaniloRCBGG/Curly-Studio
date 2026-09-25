import { criarClienteServidor } from "@/lib/supabase/server";

// Consultada pela tela do QR code até o Pix ser confirmado.
export async function GET(_request: Request, ctx: RouteContext<"/api/agendamentos/[id]/status">) {
  const { id } = await ctx.params;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("agendamentos").select("status, expira_em").eq("id", id).maybeSingle();
  if (!data) return new Response("não encontrado", { status: 404 });
  const vencido = data.status === "aguardando_sinal" && data.expira_em && new Date(data.expira_em) < new Date();
  return Response.json({ status: vencido ? "expirado" : data.status }, { headers: { "Cache-Control": "no-store" } });
}
