function obrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) throw new Error(`Variável de ambiente ausente: ${nome}`);
  return valor;
}

// Lidas sob demanda para o build funcionar sem as chaves configuradas.
export const env = {
  supabaseUrl: () => obrigatoria("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () => obrigatoria("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseServiceRoleKey: () => obrigatoria("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  asaasApiKey: () => process.env.ASAAS_API_KEY,
  asaasBaseUrl: () => process.env.ASAAS_BASE_URL ?? "https://api-sandbox.asaas.com/v3",
  asaasWebhookToken: () => obrigatoria("ASAAS_WEBHOOK_TOKEN", process.env.ASAAS_WEBHOOK_TOKEN),
  // Pix manual: chave Pix da Carol (usada quando não há ASAAS_API_KEY) e os dados que aparecem no app do banco.
  pixChave: () => process.env.PIX_CHAVE,
  pixNome: () => process.env.PIX_NOME ?? "Carol Rios",
  pixCidade: () => process.env.PIX_CIDADE ?? "Rio de Janeiro",
  cronSecret: () => obrigatoria("CRON_SECRET", process.env.CRON_SECRET),
  supabaseConfigurado: () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};
