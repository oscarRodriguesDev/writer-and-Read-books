import { prisma } from "@/lib/db";
import { obterUsuarioId } from "@/lib/auth-obras";
import { FeedExplorar } from "@/components/feed/FeedExplorar";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Feed de obras | Book Writer & Reader",
  description: "Descubra obras compartilhadas por autores desta comunidade.",
};

async function buscarFeed() {
  const usuarioId = await obterUsuarioId();
  const where: Prisma.ObraWhereInput = {
    compartilhada: true,
    arquivada: false,
  };

  const [total, obras] = await Promise.all([
    prisma.obra.count({ where }),
    prisma.obra.findMany({
      where,
      orderBy: [{ atualizadoEm: "desc" }],
      take: 12,
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
    atualizadoEm: obra.atualizadoEm.toISOString(),
    autor:
      obra.usuario?.nomeAutor ?? obra.usuario?.nome ?? obra.usuario?.username ?? null,
    curtidas: obra._count.curtidas,
    comentarios: obra._count.comentarios,
    curtidaDoUsuario: Array.isArray(obra.curtidas) && obra.curtidas.length > 0,
  }));

  return {
    itens,
    total,
    pagina: 1,
    limite: 12,
    totalPaginas: Math.max(1, Math.ceil(total / 12)),
  };
}

export default async function FeedPage() {
  const usuarioId = await obterUsuarioId();
  const dadosIniciais = await buscarFeed();

  return (
    <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
      <header className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Comunidade
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Feed de obras
        </h1>
        <p className="mt-2 text-sm text-soft">
          Obras compartilhadas por autores desta comunidade. Leia, curta e
          comente para apoiar os escritores.
        </p>
      </header>

      <FeedExplorar dadosIniciais={dadosIniciais} usuarioId={usuarioId} />
    </main>
  );
}
