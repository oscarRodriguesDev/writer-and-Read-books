import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

const ROTAS_PUBLICAS = ["/login", "/cadastro", "/feed"];
// Páginas que só fazem sentido deslogado (logado não deve ver;
// /feed está em ROTAS_PUBLICAS mas é navegável PARA TODOS, logado ou não).
const ROTAS_SO_ANONIMAS = ["/login", "/cadastro"];

// Visitante (não logado) pode navegar o feed E ler as obras públicas;
// só interações (curtir/comentar/sugerir) exigem login (401 na API).
function ePublica(pathname: string) {
  return ROTAS_PUBLICAS.includes(pathname) || pathname.startsWith("/feed/");
}

/**
 * Proteção de rotas (Next 16: proxy.ts, antigo middleware.ts).
 * Público para todos: /login, /cadastro, /feed (listagem) e /feed/[obraId]
 * (leitura de obras compartilhadas). Interagir (curtir/comentar/sugerir)
 * exige login — as APIs de interação devolvem 401 quando deslogado. APIs do
 * Auth.js sempre liberadas. APIs próprias também chamam auth() internamente
 * (defesa em profundidade).
 */
export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const sessao = await auth();
  const logado = !!sessao?.user;

  // Fluxo do Auth.js (signIn/signOut/callback) e upload de assets
  if (nextUrl.pathname.startsWith("/api/auth")) return NextResponse.next();

  // Feed: listagem pública (a rota decide o que exige login)
  if (nextUrl.pathname.startsWith("/api/feed")) return NextResponse.next();

  // Já logado não vê páginas de login/cadastro (mas vê /feed, que é pública p/ todos)
  if (logado && ROTAS_SO_ANONIMAS.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Não logado: bloqueia tudo, exceto páginas públicas (feed + leitura pública)
  if (!logado && !ePublica(nextUrl.pathname)) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|uploads|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|pdf)$).*)",
  ],
};