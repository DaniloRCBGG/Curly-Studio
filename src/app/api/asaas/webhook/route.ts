import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// O Asaas chama esta rota quando o Pix do sinal é pago.
// Configurar no painel do Asaas: URL https://<site>/api/asaas/webhook e o mesmo token de ASAAS_WEBHOOK_TOKEN.
const EVENTOS_DE_PAGAMENTO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);

function tokenValido(recebido: string | null): boolean {
  const esperado = Buffer.from(env.asaasWebhookToken());
  const valor = Buffer.from(recebido ?? "");
  return valor.length === esperado.length && timingSafeEqual(valor, esperado);
}

export async function POST(request: Request) {
  if (!tokenValido(request.headers.get("asaas-access-token"))) {
    return new Response("não autorizado", { status: 401 });
  }

  const corpo = (await request.json()) as { event?: string; payment?: { id?: string } };
  if (!corpo.event || !EVENTOS_DE_PAGAMENTO.has(corpo.event) || !corpo.payment?.id) {
    return Response.json({ ok: true, ignorado: true });
  }

  const { data, error } = await criarClienteAdmin().rpc("confirmar_sinal", { p_provedor_cobranca_id: corpo.payment.id });
  if (error) {
    console.error("Erro ao confirmar sinal", corpo.payment.id, error);
    return new Response("erro", { status: 500 }); // o Asaas tenta de novo
  }
  return Response.json({ ok: true, status: data });
}
