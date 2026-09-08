import { prisma } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Helpers de acesso público a obras compartilhadas (feed).
 * Diferente do `auth-obras` (que isola por dono), aqui o acesso é livre a
 * qualquer visitante — desde que a obra esteja publicamente compartilhada.
 */

/** Busca uma obra compartilhada e não arquivada. Retorna null se não for pública. */
export async function obterObraCompartilhada(obraId: string) {
  return prisma.obra.findFirst({
    where: { id: obraId, compartilhada: true, arquivada: false },
    include: {
      usuario: { select: { id: true, nomeAutor: true, nome: true, username: true } },
    },
  });
}

/** ID do usuário logado (ou null) — reuso do helper de auth-obras. */
export async function obterSessaoUsuarioId(): Promise<string | null> {
  const sessao = await auth();
  return sessao?.user?.id ?? null;
}

export async function ehDonoDaObra(obraId: string): Promise<boolean> {
  const usuarioId = await obterSessaoUsuarioId();
  if (!usuarioId) return false;
  const obra = await prisma.obra.findFirst({
    where: { id: obraId, usuarioId },
    select: { id: true },
  });
  return !!obra;
}