import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Cliente com a chave de serviço: ignora as políticas de acesso.
// Usar só em código de servidor que não depende da sessão (webhook, cron).
export function criarClienteAdmin() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
