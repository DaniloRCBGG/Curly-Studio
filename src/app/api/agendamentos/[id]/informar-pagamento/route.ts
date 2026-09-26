import { criarClienteServidor } from "@/lib/supabase/server";

// Pix manual: a cliente toca em "Já paguei". O horário fica guardado até a equipe conferir.
export async function POST(_request: Request, ctx: RouteContext<"/api/agendamentos/[id]/informar-pagamento">) {
  const { id } = await ctx.params;
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("informar_pagamento", { p_agendamento_id: id });
  if (error) return new Response(error.message, { status: 400 });
  return Response.json({ ok: true });
}
