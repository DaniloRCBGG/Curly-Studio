import { pixSimulado } from "@/lib/pagamentos/pix";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

// Só existe no modo de teste (sem ASAAS_API_KEY): simula o Pix sendo pago.
export async function POST(request: Request) {
  if (!pixSimulado()) return new Response("indisponível", { status: 404 });
  const { agendamentoId } = (await request.json()) as { agendamentoId: string };

  // Confere com a sessão da cliente que o agendamento é dela.
  const supabase = await criarClienteServidor();
  const { data: sinal } = await supabase.from("sinais").select("provedor_cobranca_id").eq("agendamento_id", agendamentoId).maybeSingle();
  if (!sinal?.provedor_cobranca_id) return new Response("não encontrado", { status: 404 });

  const { data, error } = await criarClienteAdmin().rpc("confirmar_sinal", { p_provedor_cobranca_id: sinal.provedor_cobranca_id });
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ status: data });
}
