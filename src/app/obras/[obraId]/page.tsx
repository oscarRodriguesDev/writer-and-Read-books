import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NavegacaoObra } from "@/components/NavegacaoObra";
import { FormEditarObra } from "@/components/FormEditarObra";
import { cardCls, btnSecundario } from "@/components/ui";

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
      <div className="mb-4">
        <Link href="/" className={`inline-block ${btnSecundario}`}>← Obras</Link>
      </div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{obra.titulo}</h1>
        <p className="text-sm text-muted">
          {obra.genero ?? "Sem gênero"} · Criada em {formatarData(obra.criadoEm)}
        </p>
      </header>
      <NavegacaoObra obraId={obra.id} />

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className={cardCls}>
          <p className="text-3xl font-bold">{obra._count.capitulos}</p>
          <p className="text-sm text-muted">Capítulos</p>
        </div>
        <div className={cardCls}>
          <p className="text-3xl font-bold">{obra._count.personagens}</p>
          <p className="text-sm text-muted">Personagens</p>
        </div>
        <div className={cardCls}>
          <p className="text-3xl font-bold">{obra._count.ambientes}</p>
          <p className="text-sm text-muted">Ambientes</p>
        </div>
        <div className={cardCls}>
          <p className="text-3xl font-bold">{totalPalavras}</p>
          <p className="text-sm text-muted">Palavras</p>
        </div>
      </section>

      <section className={`mt-6 ${cardCls}`}>
        <h2 className="mb-2 font-semibold">Dados da obra</h2>
        <dl className="space-y-1 text-sm">
          <div><dt className="inline font-medium">Status: </dt><dd className="inline">{obra.status}</dd></div>
          {obra.subgenero && <div><dt className="inline font-medium">Subgênero: </dt><dd className="inline">{obra.subgenero}</dd></div>}
          {obra.publicoAlvo && <div><dt className="inline font-medium">Público-alvo: </dt><dd className="inline">{obra.publicoAlvo}</dd></div>}
          <div><dt className="inline font-medium">Tema: </dt><dd className="inline">{obra.tema ?? "—"}</dd></div>
          <div><dt className="inline font-medium">Descrição: </dt><dd className="inline">{obra.descricao ?? "—"}</dd></div>
        </dl>
        <FormEditarObra
          obraId={obra.id}
          inicial={{
            titulo: obra.titulo,
            genero: obra.genero,
            subgenero: obra.subgenero,
            tema: obra.tema,
            publicoAlvo: obra.publicoAlvo,
            descricao: obra.descricao,
            status: obra.status,
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
