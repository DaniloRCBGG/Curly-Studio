import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Renova a sessão do Supabase a cada requisição e protege as áreas logadas.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const protegida = caminho.startsWith("/minha-conta") || caminho.startsWith("/equipe") || caminho.startsWith("/agendar/pagamento");
  if (!user && protegida) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.searchParams.set("voltar", caminho);
    return NextResponse.redirect(destino);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|marca/|icon.svg|api/asaas/webhook|api/cron).*)"],
};
