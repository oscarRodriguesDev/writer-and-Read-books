import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export interface UsuarioAtual {
  nome: string;
  username: string | null;
  fotoUrl: string | null;
}

/** Busca os dados do usuário logado para exibição no header (dados frescos). */
export async function buscarUsuarioAtual(): Promise<UsuarioAtual | null> {
  const sessao = await auth();
  if (!sessao?.user?.id) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: sessao.user.id },
    select: { nome: true, username: true, fotoUrl: true },
  });
  return usuario;
}