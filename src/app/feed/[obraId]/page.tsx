import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PARTES_TIPOS, type ParteTipo } from "@/lib/constants";
import { htmlParaTexto } from "@/lib/html";
import LeitorLivro from "@/components/leitor/LeitorLivro";
import type { CapituloLeitura } from "@/lib/leitor";
import { PainelInteracoes, type ComentarioDTO } from "@/components/feed/PainelInteracoes";
import { ColunaSugestoes } from "@/components/feed/ColunaSugestoes";
import { obterObraCompartilhada, obterSessaoUsuarioId, ehDonoDaObra } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function FeedObraPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;

  const obra = await obterObraCompartilhada(obraId);
  if (!obra) notFound();

  const usuarioId = await obterSessaoUsuarioId();
  const dono = await ehDonoDaObra(obraId);

  const capitulosBrutos = await prisma.capitulo.findMany({
    where: { obraId },
    include: { partes: { include: { cenas: true } } },
  });
  const capitulos: CapituloLeitura[] = capitulosBrutos
    .sort(
      (a, b) =>
        (a.ordemNarrativa === null ? 1 : 0) -
          (b.ordemNarrativa === null ? 1 : 0) ||
        (a.ordemNarrativa ?? 0) - (b.ordemNarrativa ?? 0),
    )
    .map((capitulo) => ({
      id: capitulo.id,
      titulo: capitulo.titulo,
      partes: [...capitulo.partes]
        .sort(
          (a, b) =>
            PARTES_TIPOS.indexOf(a.tipo as ParteTipo) -
            PARTES_TIPOS.indexOf(b.tipo as ParteTipo),
        )
        .map((parte) => ({
          tipo: parte.tipo,
          paragrafos: parte.cenas
            .sort((a, b) => a.ordem - b.ordem)
            .map((cena) => htmlParaTexto(cena.conteudo))
            .filter(Boolean)
            .join("\n\n")
            .split("\n\n"),
        })),
    }));

  // Curtida atual do usuário + total
  const [minhasCurtidas, totalCurtidas, comentariosBrutos] = await Promise.all([
    usuarioId
      ? prisma.curtida.findUnique({
          where: { obraId_usuarioId: { obraId, usuarioId } },
          select: { id: true },
        })
      : null,
    prisma.curtida.count({ where: { obraId } }),
    prisma.comentario.findMany({
      where: { obraId, comentarioPaiId: null },
      orderBy: { criadoEm: "asc" },
      include: {
        usuario: {
          select: { id: true, nome: true, nomeAutor: true, fotoUrl: true, username: true },
        },
        respostas: {
          orderBy: { criadoEm: "asc" },
          include: {
            usuario: {
              select: { id: true, nome: true, nomeAutor: true, fotoUrl: true, username: true },
            },
          },
        },
      },
    }),
  ]);

  const comentarios: ComentarioDTO[] = comentariosBrutos.map((c) => ({
    id: c.id,
    conteudo: c.conteudo,
    criadoEm: c.criadoEm.toISOString(),
    usuario: c.usuario,
    respostas: c.respostas.map((r) => ({
      id: r.id,
      conteudo: r.conteudo,
      criadoEm: r.criadoEm.toISOString(),
      usuario: r.usuario,
    })),
  }));

  const autor = obra.usuario?.nomeAutor ?? obra.usuario?.nome ?? obra.usuario?.username ?? "Autor";
  const semCapitulos = capitulos.length === 0;

  // Sugestões da lateral direita: livros compartilhados (+curtidos) e autores
  const [sugestoesLivros, autoresSugeridos] = await Promise.all([
    prisma.obra.findMany({
      where: { compartilhada: true, arquivada: false, id: { not: obra.id } },
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

  return (
    <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-8">
      {/* Cabeçalho da obra pública */}
      <header className="mb-6 space-y-3 lg:mx-auto lg:max-w-4xl">
        <Link
          href="/feed"
          className="inline-block rounded-lg border border-line fundo-papel px-3 py-1.5 text-sm text-foreground shadow-sm transition-colors hover:bg-hoverbg"
        >
          ← Feed
        </Link>
        <div className="flex flex-col gap-2 rounded-xl border border-line fundo-papel p-5 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">{obra.titulo}</h1>
          <p className="text-sm text-muted">
            por <span className="font-medium text-foreground">{autor}</span>
            {obra.genero && ` · ${obra.genero}`}
            {obra.subgenero && ` / ${obra.subgenero}`}
          </p>
          {obra.descricao && (
            <p className="text-sm leading-relaxed text-soft">{obra.descricao}</p>
          )}
          {dono && (
            <p className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              👑 Você é o autor desta obra
            </p>
          )}
        </div>
      </header>

      {/* Grade editorial: esquerda (abas futuras) · leitura · esquerda-direita
          (sugestões de livros/autores + futuro anúncios) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Lateral esquerda: abas/seções da plataforma — MOCK por enquanto
            (não funcionais: apenas visual, aguardando definição do usuário) */}
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
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        i === 0
                          ? "bg-accent/10 font-medium text-accent"
                          : "text-foreground hover:bg-hoverbg"
                      }`}
                    >
                      <span aria-hidden>{aba.emoji}</span>
                      {aba.rotulo}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-faint">
                (abas de demonstração)
              </p>
            </nav>
          </div>
        </aside>

        {/* Coluna central: leitura + interações */}
        <div className="mx-auto w-full max-w-3xl">
          {semCapitulos ? (
            <div className="rounded-xl border border-line fundo-papel p-10 text-center shadow-sm">
              <p className="text-sm text-muted">Esta obra ainda não publicou capítulos.</p>
            </div>
          ) : (
            <LeitorLivro
              obraId={obra.id}
              capitulos={capitulos}
              capInicial={0}
              pagInicial={0}
              protegido={!dono}
              visitante={!usuarioId}
              voltarHref="/feed"
              voltarLabel="Feed"
              rotaBase={`/feed/${obra.id}`}
            />
          )}

          <PainelInteracoes
            obraId={obra.id}
            dono={dono}
            logado={!!usuarioId}
            usuarioId={usuarioId}
            curtiuInicial={!!minhasCurtidas}
            totalCurtidasInicial={totalCurtidas}
            comentariosInicial={comentarios}
          />
        </div>

        {/* Lateral direita: sugestões da plataforma */}
        <ColunaSugestoes
          obras={sugestoesLivros.map((o) => ({
            id: o.id,
            titulo: o.titulo,
            genero: o.genero,
            subgenero: o.subgenero,
            capaUrl: o.capaUrl,
            autor:
              o.usuario?.nomeAutor ?? o.usuario?.nome ?? o.usuario?.username ?? "Autor",
            curtidas: o._count.curtidas,
          }))}
          autores={autoresSugeridos.map((u) => ({
            id: u.id,
            nome: u.nome,
            nomeAutor: u.nomeAutor,
            username: u.username,
            fotoUrl: u.fotoUrl,
            obrasCompartilhadas: u._count.obras,
          }))}
        />
      </div>
    </main>
  );
}

// Abas fictícias da plataforma (MOCK — esperando definição do usuário)
const MOCK_ABAS = [
  { emoji: "🔥", rotulo: "Em alta" },
  { emoji: "🆕", rotulo: "Novidades" },
  { emoji: "🏅", rotulo: "Mais curtidos" },
  { emoji: "🏷️", rotulo: "Gêneros" },
  { emoji: "📚", rotulo: "Coleções" },
  { emoji: "⭐", rotulo: "Favoritos" },
];