import { prisma } from "@/lib/db";
import { obterUsuarioId } from "@/lib/auth-obras";
import { FeedExplorar } from "@/components/feed/FeedExplorar";
import { ColunaSugestoes } from "@/components/feed/ColunaSugestoes";
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

// Sugestões da lateral direita (mesma métrica do leitor público): livros
// compartilhados mais curtidos e autores em destaque.
async function buscarSugestoes() {
  const [sugestoesLivros, autoresSugeridos] = await Promise.all([
    prisma.obra.findMany({
      where: { compartilhada: true, arquivada: false },
      orderBy: [{ curtidas: { _count: "desc" } }, { atualizadoEm: "desc" }],
      take: 5,
      select: {
        id: true,
        titulo: true,
        genero: true,
        subgenero: true,
        capaUrl: true,
        usuario: { select: { nomeAutor: true, nome: true, username: true } },
        _count: { select: { curtidas: true } },
      },
    }),
    prisma.usuario.findMany({
      where: { obras: { some: { compartilhada: true, arquivada: false } } },
      orderBy: { obras: { _count: "desc" } },
      take: 5,
      select: {
        id: true,
        nome: true,
        nomeAutor: true,
        username: true,
        fotoUrl: true,
        _count: { select: { obras: { where: { compartilhada: true, arquivada: false } } } },
      },
    }),
  ]);

  return {
    obras: sugestoesLivros.map((o) => ({
      id: o.id,
      titulo: o.titulo,
      genero: o.genero,
      subgenero: o.subgenero,
      capaUrl: o.capaUrl,
      autor: o.usuario?.nomeAutor ?? o.usuario?.nome ?? o.usuario?.username ?? "Autor",
      curtidas: o._count.curtidas,
    })),
    autores: autoresSugeridos.map((u) => ({
      id: u.id,
      nome: u.nome,
      nomeAutor: u.nomeAutor,
      username: u.username,
      fotoUrl: u.fotoUrl,
      obrasCompartilhadas: u._count.obras,
    })),
  };
}

export default async function FeedPage() {
  const usuarioId = await obterUsuarioId();
  const dadosIniciais = await buscarFeed();
  const anonimo = !usuarioId;
  const sugestoes = anonimo ? await buscarSugestoes() : null;

  const Header = (
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
  );

  // Visitante deslogado: mesma métrica do leitor público — sem sidebar/header
  // do app, grade editorial com laterais (abas mock à esquerda, sugestões à
  // direita), centralizando a listagem.
  if (anonimo) {
    return (
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
          {/* Lateral esquerda: abas/seções da plataforma — MOCK */}
          <aside className="hidden xl:block" aria-label="Seções da plataforma">
            <div className="sticky top-20 space-y-5">
              <nav
                aria-label="Seções da plataforma"
                className="rounded-xl border border-line fundo-papel p-2 shadow-sm"
              >
                <h2 className="px-3 pt-2 pb-1 text-sm font-semibold text-foreground">
                  Explorar
                </h2>
                <ul className="space-y-0.5">
                  {MOCK_ABAS.map((aba, i) => (
                    <li key={aba.rotulo}>
                      <span
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                          i === 0
                            ? "bg-accent/10 font-medium text-accent"
                            : "text-foreground hover:bg-hoverbg"
                        }`}
                      >
                        <span aria-hidden>{aba.emoji}</span>
                        {aba.rotulo}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-faint">
                  (abas de demonstração)
                </p>
              </nav>
            </div>
          </aside>

          {/* Coluna central: listagem do feed */}
          <div className="mx-auto w-full max-w-3xl">
            {Header}
            <FeedExplorar dadosIniciais={dadosIniciais} usuarioId={usuarioId} />
          </div>

          {/* Lateral direita: sugestões da plataforma */}
          {sugestoes && (
            <ColunaSugestoes obras={sugestoes.obras} autores={sugestoes.autores} />
          )}
        </div>
      </main>
    );
  }

  // Logado: layout normal da aplicação com a listagem em largura total.
  return (
    <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
      {Header}
      <FeedExplorar dadosIniciais={dadosIniciais} usuarioId={usuarioId} />
    </main>
  );
}

// Abas fictícias da plataforma (MOCK — mesma do leitor público)
const MOCK_ABAS = [
  { emoji: "🔥", rotulo: "Em alta" },
  { emoji: "🆕", rotulo: "Novidades" },
  { emoji: "🏅", rotulo: "Mais curtidos" },
  { emoji: "🏷️", rotulo: "Gêneros" },
  { emoji: "📚", rotulo: "Coleções" },
  { emoji: "⭐", rotulo: "Favoritos" },
];
