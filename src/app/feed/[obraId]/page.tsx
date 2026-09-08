import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PARTES_TIPOS, type ParteTipo } from "@/lib/constants";
import { htmlParaTexto } from "@/lib/html";
import LeitorLivro from "@/components/leitor/LeitorLivro";
import type { CapituloLeitura } from "@/lib/leitor";
import { PainelInteracoes, type ComentarioDTO } from "@/components/feed/PainelInteracoes";
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

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      {/* Cabeçalho da obra pública */}
      <header className="mb-6 space-y-3">
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
    </main>
  );
}