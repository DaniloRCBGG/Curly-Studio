import "server-only";
import QRCode from "qrcode";
import { env } from "@/lib/env";

// Cobrança do sinal por Pix. Usa o Asaas quando ASAAS_API_KEY está configurada;
// sem a chave, gera uma cobrança simulada para testar o fluxo sem dinheiro real.

export type ClientePix = { nome: string; cpf: string; email?: string | null; telefone?: string | null; asaasCustomerId?: string | null };

export type CobrancaPix = {
  id: string;
  customerId: string | null;
  copiaECola: string;
  qrCodeBase64: string;
};

export const pixSimulado = () => !env.asaasApiKey();

async function asaas<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${env.asaasBaseUrl()}${caminho}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "curly-studio",
      access_token: env.asaasApiKey()!,
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!resposta.ok) {
    throw new Error(`Asaas ${init.method ?? "GET"} ${caminho} falhou (${resposta.status}): ${await resposta.text()}`);
  }
  return resposta.json() as Promise<T>;
}

export async function criarCobrancaPix(params: {
  cliente: ClientePix;
  valor: number;
  descricao: string;
  referencia: string; // id do agendamento
}): Promise<CobrancaPix> {
  if (pixSimulado()) {
    const id = `simulado_${params.referencia}`;
    const copiaECola = `PIX-SIMULADO|${params.referencia}|${params.valor.toFixed(2)}`;
    const qrCodeBase64 = (await QRCode.toDataURL(copiaECola)).replace(/^data:image\/png;base64,/, "");
    return { id, customerId: null, copiaECola, qrCodeBase64 };
  }

  let customerId = params.cliente.asaasCustomerId ?? null;
  if (!customerId) {
    const cliente = await asaas<{ id: string }>("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: params.cliente.nome,
        cpfCnpj: params.cliente.cpf.replace(/\D/g, ""),
        email: params.cliente.email ?? undefined,
        mobilePhone: params.cliente.telefone?.replace(/\D/g, "") || undefined,
        notificationDisabled: true,
      }),
    });
    customerId = cliente.id;
  }

  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const cobranca = await asaas<{ id: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value: params.valor,
      dueDate: hoje,
      description: params.descricao,
      externalReference: params.referencia,
    }),
  });
  const qr = await asaas<{ encodedImage: string; payload: string }>(`/payments/${cobranca.id}/pixQrCode`);
  return { id: cobranca.id, customerId, copiaECola: qr.payload, qrCodeBase64: qr.encodedImage };
}

// Cancela a cobrança quando a reserva expira, para o QR code não poder mais ser pago.
export async function cancelarCobrancaPix(id: string): Promise<void> {
  if (pixSimulado() || id.startsWith("simulado_")) return;
  try {
    await asaas(`/payments/${id}`, { method: "DELETE" });
  } catch (erro) {
    console.error("Não foi possível cancelar a cobrança Pix", id, erro);
  }
}
