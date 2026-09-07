import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Helpers de autenticação + isolamento de obras por usuário.
 * Todo acesso a obra (página ou API) deve passar por aqui para garantir que
 * cada usuário só veja/edite as obras das quais é dono.
 */

/** ID do usuário logado (a partir do token JWT). Retorna null se deslogado. */
export async function obterUsuarioId(): Promise<string | null> {
  const sessao = await auth();
  return sessao?.user?.id ?? null;
}

/**
 * Busca uma obra garantindo que pertence ao usuário logado.
 * Retorna `null` se não existir OU se não for do usuário (não vaza existência).
 * Aceita `include` para páginas/rotas que precisam de relacionamentos.
 */
export async function obterObraDoUsuario<T extends Prisma.ObraInclude>(
  obraId: string,
  include?: T,
): Promise<Prisma.ObraGetPayload<{ include: T }> | null> {
  const usuarioId = await obterUsuarioId();
  if (!usuarioId) return null;
  return prisma.obra.findFirst({
    where: { id: obraId, usuarioId },
    include,
  }) as Promise<Prisma.ObraGetPayload<{ include: T }> | null>;
}

/**
 * Filtro Prisma `where` de obras do usuário logado.
 * Retorna `null` se deslogado (uso: short-circuit da consulta).
 */
export async function whereObrasDoUsuario() {
  const usuarioId = await obterUsuarioId();
  if (!usuarioId) return null;
  return { usuarioId };
}

/**
 * Busca uma cena garantindo que a obra dela pertence ao usuário logado
 * (cena → parte → capítulo → obra). Retorna `null` se não existir ou
 * não for do usuário (não vaza existência).
 */
export async function obterCenaDoUsuario<T extends Prisma.CenaInclude>(
  cenaId: string,
  include?: T,
): Promise<Prisma.CenaGetPayload<{ include: T }> | null> {
  const usuarioId = await obterUsuarioId();
  if (!usuarioId) return null;
  return prisma.cena.findFirst({
    where: { id: cenaId, parte: { capitulo: { obra: { usuarioId } } } },
    include,
  }) as Promise<Prisma.CenaGetPayload<{ include: T }> | null>;
}

/**
 * Busca uma relação entre personagens garantindo que a obra do personagem
 * de origem pertence ao usuário logado. Retorna `null` caso contrário.
 */
export async function obterRelacaoDoUsuario<
  T extends Prisma.RelacaoPersonagemInclude,
>(
  relacaoId: string,
  include?: T,
): Promise<Prisma.RelacaoPersonagemGetPayload<{ include: T }> | null> {
  const usuarioId = await obterUsuarioId();
  if (!usuarioId) return null;
  return prisma.relacaoPersonagem.findFirst({
    where: { id: relacaoId, origem: { obra: { usuarioId } } },
    include,
  }) as Promise<Prisma.RelacaoPersonagemGetPayload<{ include: T }> | null>;
}
