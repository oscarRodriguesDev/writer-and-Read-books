import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

const ROTAS_PUBLICAS = ["/login", "/cadastro"];

/**
 * Proteção de rotas (Next 16: proxy.ts, antigo middleware.ts).
 * Navegação exige login; /login e /cadastro são públicas; APIs do Auth.js
 * sempre liberadas. APIs próprias também chamam auth() internamente
 * (defesa em profundidade — não confiar só no proxy).
 */
export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const sessao = await auth();
  const logado = !!sessao?.user;

  // Fluxo do Auth.js (signIn/signOut/callback) e upload de assets
  if (nextUrl.pathname.startsWith("/api/auth")) return NextResponse.next();

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