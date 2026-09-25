import { env } from "@/lib/env";
import { cancelarCobrancaPix } from "@/lib/pagamentos/pix";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Limpeza das reservas vencidas e das cobranças Pix que não foram pagas.
// A agenda já ignora reservas vencidas na hora; esta rota só arruma o que sobrou.
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${env.cronSecret()}`) {
    return new Response("não autorizado", { status: 401 });
  }
  const { data, error } = await criarClienteAdmin().rpc("expirar_reservas");
  if (error) return new Response(error.message, { status: 500 });

  const expirados = (data ?? []) as { provedor_cobranca_id: string | null }[];
  await Promise.all(expirados.filter((e) => e.provedor_cobranca_id).map((e) => cancelarCobrancaPix(e.provedor_cobranca_id!)));
  return Response.json({ expirados: expirados.length });
}
