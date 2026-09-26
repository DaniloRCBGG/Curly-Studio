import "server-only";
import QRCode from "qrcode";
import { env } from "@/lib/env";
import { montarPixCopiaECola } from "./pix-estatico";

// Cobrança do sinal por Pix, em um de três modos:
// - asaas: com ASAAS_API_KEY, cobrança no Asaas confirmada sozinha pelo webhook;
// - manual: com PIX_CHAVE, Pix direto na chave da Carol, confirmado pela equipe no painel;
// - simulado: sem nenhuma das duas, para testar o fluxo sem dinheiro real.

export type ModoPix = "asaas" | "manual" | "simulado";

export type ClientePix = { nome: string; cpf: string | null; email?: string | null; telefone?: string | null; asaasCustomerId?: string | null };

export type CobrancaPix = {
  id: string;
  customerId: string | null;
  copiaECola: string;
  qrCodeBase64: string;
  forma: "pix_online" | "pix_manual";
};

export const modoPix = (): ModoPix => (env.asaasApiKey() ? "asaas" : env.pixChave() ? "manual" : "simulado");
export const pixSimulado = () => modoPix() === "simulado";

const qrCode = async (texto: string) => (await QRCode.toDataURL(texto, { margin: 1, width: 480 })).replace(/^data:image\/png;base64,/, "");

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
  const modo = modoPix();
  if (modo === "simulado") {
    const copiaECola = `PIX-SIMULADO|${params.referencia}|${params.valor.toFixed(2)}`;
    return { id: `simulado_${params.referencia}`, customerId: null, copiaECola, qrCodeBase64: await qrCode(copiaECola), forma: "pix_online" };
  }
  if (modo === "manual") {
    const copiaECola = montarPixCopiaECola({ chave: env.pixChave()!, nome: env.pixNome(), cidade: env.pixCidade(), valor: params.valor, identificador: params.referencia });
    return { id: `manual_${params.referencia}`, customerId: null, copiaECola, qrCodeBase64: await qrCode(copiaECola), forma: "pix_manual" };
  }
  if (!params.cliente.cpf) throw new Error("Cliente sem CPF");

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
  return { id: cobranca.id, customerId, copiaECola: qr.payload, qrCodeBase64: qr.encodedImage, forma: "pix_online" };
}

// Cancela a cobrança quando a reserva expira, para o QR code não poder mais ser pago.
export async function cancelarCobrancaPix(id: string): Promise<void> {
  if (modoPix() !== "asaas" || id.startsWith("simulado_") || id.startsWith("manual_")) return;
  try {
    await asaas(`/payments/${id}`, { method: "DELETE" });
  } catch (erro) {
    console.error("Não foi possível cancelar a cobrança Pix", id, erro);
  }
}
