import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

const ROTAS_PUBLICAS = ["/login", "/cadastro", "/feed"];

/**
 * Proteção de rotas (Next 16: proxy.ts, antigo middleware.ts).
 * Navegação exige login; /login e /cadastro são públicas; o **feed** é público
 * para navegar (listagem), mas /feed/[obraId] (leitura) exige login — a rota
 * exata "/feed" casa só a listagem. APIs do Auth.js sempre liberadas. As APIs
 * do feed são liberadas (a rota valida sessão internamente: leitura/lista sem
 * login; interações devolvem 401 quando deslogado). APIs próprias também
 * chamam auth() internamente (defesa em profundidade).
 */
export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const sessao = await auth();
  const logado = !!sessao?.user;

  // Fluxo do Auth.js (signIn/signOut/callback) e upload de assets
  if (nextUrl.pathname.startsWith("/api/auth")) return NextResponse.next();

  // Feed: listagem pública (a rota decide o que exige login)
  if (nextUrl.pathname.startsWith("/api/feed")) return NextResponse.next();

  // Já logado não vê páginas de login/cadastro
  if (logado && ROTAS_PUBLICAS.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Não logado: bloqueia tudo, exceto páginas públicas
  if (!logado && !ROTAS_PUBLICAS.includes(nextUrl.pathname)) {
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