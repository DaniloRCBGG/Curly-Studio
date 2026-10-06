import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { caminhoSeguro } from "@/lib/validacao";

// Volta do login com Google e do link de "Esqueci minha senha" (tipo=senha): troca o código pela
// sessão e, se a cliente ainda não tem ficha, manda completar o cadastro (CPF e CEP) antes de seguir.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const voltar = caminhoSeguro(searchParams.get("voltar"));
  const code = searchParams.get("code");
  const supabase = await criarClienteServidor();

  if (!code || (await supabase.auth.exchangeCodeForSession(code)).error) {
    if (searchParams.get("tipo") === "senha") return NextResponse.redirect(`${origin}/entrar/esqueci?erro=link`);
    return NextResponse.redirect(`${origin}/entrar?voltar=${encodeURIComponent(voltar)}&erro=google`);
  }
  if (searchParams.get("tipo") === "senha") return NextResponse.redirect(`${origin}/minha-conta/senha`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: perfil }, { data: ficha }] = await Promise.all([
    supabase.from("usuarios").select("perfil").eq("id", user!.id).maybeSingle(),
    supabase.from("clientes").select("id").eq("usuario_id", user!.id).maybeSingle(),
  ]);
  if ((perfil?.perfil ?? "cliente") === "cliente" && !ficha) {
    return NextResponse.redirect(`${origin}/cadastro/completar?voltar=${encodeURIComponent(voltar)}`);
  }
  return NextResponse.redirect(`${origin}${voltar}`);
}
