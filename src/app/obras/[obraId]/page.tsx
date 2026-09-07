import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CabecalhoObra } from "@/components/CabecalhoObra";
import { FormEditarObra } from "@/components/FormEditarObra";
import { btnSecundario, cardCls } from "@/components/ui";
import { BotaoExportar } from "@/components/BotaoExportar";

export const dynamic = "force-dynamic";

function formatarData(data: Date) {
  return data.toLocaleDateString("pt-BR");
}

export default async function ObraPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      _count: { select: { capitulos: true, personagens: true, ambientes: true } },
      capitulos: { select: { id: true }, orderBy: [{ ordemNarrativa: "asc" }] },
    },
  });
  if (!obra) notFound();

  const cenas = await prisma.cena.findMany({
    where: { parte: { capitulo: { obraId } } },
    select: { conteudo: true },
  });
  const totalPalavras = cenas.reduce(
    (total, cena) =>
      total + (cena.conteudo.trim() ? cena.conteudo.trim().split(/\s+/).length : 0),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <CabecalhoObra
        obraId={obra.id}
        titulo={obra.titulo}
        subtitulo={`${obra.genero ?? "Sem gênero"} · Criada em ${formatarData(obra.criadoEm)}`}
        acoes={<BotaoExportar obraId={obra.id} />}
      />
      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className={`${cardCls} flex flex-col items-center justify-center`}>
          <p className="text-3xl font-bold">{obra._count.capitulos}</p>
          <p className="text-sm text-muted">Capítulos</p>
        </div>
        <div className={`${cardCls} flex flex-col items-center justify-center`}>
          <p className="text-3xl font-bold">{obra._count.personagens}</p>
          <p className="text-sm text-muted">Personagens</p>
        </div>
        <div className={`${cardCls} flex flex-col items-center justify-center`}>
          <p className="text-3xl font-bold">{obra._count.ambientes}</p>
          <p className="text-sm text-muted">Ambientes</p>
        </div>
        <div className={`${cardCls} flex flex-col items-center justify-center`}>
          <p className="text-3xl font-bold">{totalPalavras.toLocaleString("pt-BR")}</p>
          <p className="text-sm text-muted">Palavras</p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-line fundo-papel p-6 shadow-sm">
        <h2 className="mb-2 font-semibold">Dados da obra</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {obra.subtitulo && <div><dt className="inline font-medium">Subtítulo: </dt><dd className="inline">{obra.subtitulo}</dd></div>}
          {obra.genero && <div><dt className="inline font-medium">Gênero: </dt><dd className="inline">{obra.genero}{obra.subgenero ? ` · ${obra.subgenero}` : ""}</dd></div>}
          {obra.tema && <div><dt className="inline font-medium">Tema: </dt><dd className="inline">{obra.tema}</dd></div>}
          {obra.publicoAlvo && <div><dt className="inline font-medium">Público-alvo: </dt><dd className="inline">{obra.publicoAlvo}</dd></div>}
          {obra.descricao && <div className="sm:col-span-2"><dt className="inline font-medium">Descrição: </dt><dd className="inline">{obra.descricao}</dd></div>}
          <div><dt className="inline font-medium">Status: </dt><dd className="inline">{obra.status}</dd></div>
          <div><dt className="inline font-medium">Palavras: </dt><dd className="inline">{totalPalavras.toLocaleString("pt-BR")}</dd></div>
          {obra.isbn && <div><dt className="inline font-medium">ISBN: </dt><dd className="inline">{obra.isbn}</dd></div>}
          {obra.isbn13 && <div><dt className="inline font-medium">ISBN-13: </dt><dd className="inline">{obra.isbn13}</dd></div>}
          {obra.editora && <div><dt className="inline font-medium">Editora: </dt><dd className="inline">{obra.editora}</dd></div>}
          {obra.edicao && <div><dt className="inline font-medium">Edição: </dt><dd className="inline">{obra.edicao}</dd></div>}
          {obra.dataPublicacao && <div><dt className="inline font-medium">Publicação: </dt><dd className="inline">{formatarData(new Date(obra.dataPublicacao))}</dd></div>}
          {obra.idioma && <div><dt className="inline font-medium">Idioma: </dt><dd className="inline">{obra.idioma}</dd></div>}
          {obra.direitosAutorais && <div className="sm:col-span-2"><dt className="inline font-medium">Direitos: </dt><dd className="inline">{obra.direitosAutorais}</dd></div>}
        </dl>
        <FormEditarObra
          obraId={obra.id}
          inicial={{
            titulo: obra.titulo,
            subtitulo: obra.subtitulo,
            genero: obra.genero,
            subgenero: obra.subgenero,
            tema: obra.tema,
            publicoAlvo: obra.publicoAlvo,
            descricao: obra.descricao,
            status: obra.status,
            isbn: obra.isbn,
            isbn13: obra.isbn13,
            idioma: obra.idioma,
            dataPublicacao: obra.dataPublicacao?.toISOString() ?? null,
            editora: obra.editora,
            edicao: obra.edicao,
            direitosAutorais: obra.direitosAutorais,
            capaUrl: obra.capaUrl,
          }}
        />
      </section>

      {obra.capitulos.length > 0 && (
        <section className="mt-6">
          <Link href={`/ler/${obra.id}`} className={btnSecundario}>
            📖 Ler esta obra
          </Link>
        </section>
      )}
    </main>
  );
}
