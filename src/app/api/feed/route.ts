import { prisma } from "@/lib/db";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterUsuarioId } from "@/lib/auth-obras";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

/**
 * Itens do feed: obras compartilhadas publicamente, com autor, capa, gênero,
 * contagem de curtidas/comentários e flag de curtida do usuário atual.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const genero = url.searchParams.get("genero")?.trim() || null;
    const busca = url.searchParams.get("q")?.trim() || null;
    const pagina = Math.max(1, Number(url.searchParams.get("pagina")) || 1);
    const limite = Math.min(50, Math.max(1, Number(url.searchParams.get("limite")) || 20));
    const ordem = url.searchParams.get("ordem") || "recentes";

    const usuarioId = await obterUsuarioId();

    const where: Record<string, unknown> = { compartilhada: true, arquivada: false };
    if (genero) where.genero = genero;
    if (busca) {
      where.OR = [
        { titulo: { contains: busca } },
        { descricao: { contains: busca } },
        { usuario: { nomeAutor: { contains: busca } } },
        { usuario: { nome: { contains: busca } } },
        { usuario: { username: { contains: busca } } },
      ];
    }

    const orderBy: Prisma.ObraOrderByWithRelationInput[] =
      ordem === "curtidas"
        ? [{ curtidas: { _count: "desc" } }, { atualizadoEm: "desc" }]
        : [{ atualizadoEm: "desc" }];

    const [total, obras] = await Promise.all([
      prisma.obra.count({ where }),
      prisma.obra.findMany({
        where,
        orderBy,
        skip: (pagina - 1) * limite,
        take: limite,
        select: {
          id: true,
          titulo: true,
          genero: true,
          subgenero: true,
          descricao: true,
          status: true,
          capaUrl: true,
          atualizadoEm: true,
          usuario: { select: { nomeAutor: true, nome: true, username: true } },
          _count: { select: { curtidas: true, comentarios: true } },
          curtidas: usuarioId
            ? { where: { usuarioId }, select: { id: true }, take: 1 }
            : false,
        },
      }),
    ]);

    const itens = obras.map((obra) => ({
      id: obra.id,
      titulo: obra.titulo,
      genero: obra.genero,
      subgenero: obra.subgenero,
      descricao: obra.descricao,
      status: obra.status,
      capaUrl: obra.capaUrl,
      atualizadoEm: obra.atualizadoEm,
      autor: obra.usuario?.nomeAutor ?? obra.usuario?.nome ?? obra.usuario?.username ?? null,
      curtidas: obra._count.curtidas,
      comentarios: obra._count.comentarios,
      curtidaDoUsuario: Array.isArray(obra.curtidas) && obra.curtidas.length > 0,
    }));

    return Response.json({
      itens,
      total,
      pagina,
      limite,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
    });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
