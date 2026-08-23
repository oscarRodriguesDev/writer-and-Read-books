import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PARTES_TIPOS, CENAS_TIPOS, ROTULO_PARTE, type ParteTipo, type CenaTipo } from "@/lib/constants";
import { btnSecundario } from "@/components/ui";

export const dynamic = "force-dynamic";

type CapituloLeitura = {
  id: string;
  titulo: string;
  partes: {
    tipo: string;
    texto: string;
  }[];
};

export default async function LerPage({
  params,
  searchParams,
}: {
  params: Promise<{ obraId: string }>;
  searchParams: Promise<{ cap?: string }>;
}) {
  const { obraId } = await params;
  const { cap: capParam } = await searchParams;

  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) notFound();

  const capitulosBrutos = await prisma.capitulo.findMany({
    where: { obraId },
    include: { partes: { include: { cenas: true } } },
  });
  // Ordena narrativamente: posicionados primeiro, pendentes no fim
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
          texto: parte.cenas
            .sort(
              (a, b) =>
                CENAS_TIPOS.indexOf(a.tipo as CenaTipo) -
                CENAS_TIPOS.indexOf(b.tipo as CenaTipo),
            )
            .map((cena) => cena.conteudo.trim())
            .filter(Boolean)
            .join("\n\n"),
        })),
    }));

  if (capitulos.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 text-center">
        <p className="mb-4">Esta obra ainda não tem capítulos.</p>
        <Link href={`/obras/${obraId}/capitulos`} className={btnSecundario}>
          Criar capítulos
        </Link>
      </main>
    );
  }

  const indice = Math.min(Math.max(0, Number(capParam ?? 0) || 0), capitulos.length - 1);
  const capitulo = capitulos[indice];
  const anterior = indice > 0 ? `/ler/${obraId}?cap=${indice - 1}` : null;
  const proximo =
    indice < capitulos.length - 1 ? `/ler/${obraId}?cap=${indice + 1}` : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-8 border-b border-line pb-4">
        <Link href={`/obras/${obraId}`} className={`inline-block mb-3 ${btnSecundario}`}>
          ← Obra
        </Link>
        <h1 className="text-2xl font-bold">{capitulo.titulo}</h1>
        <p className="text-sm text-muted">
          Capítulo {indice + 1} de {capitulos.length}
        </p>
      </header>

      <article className="space-y-6 text-base leading-relaxed">
        {capitulo.partes.map((parte) => {
          if (!parte.texto) return null;
          return (
            <section key={parte.tipo}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-faint">
                {ROTULO_PARTE[parte.tipo as ParteTipo] ?? parte.tipo}
              </h2>
              {parte.texto.split("\n\n").map((paragrafo, i) => (
                <p key={i} className="mb-3 whitespace-pre-wrap">{paragrafo}</p>
              ))}
            </section>
          );
        })}
      </article>

      <nav className="mt-10 flex justify-between border-t border-line pt-4">
        {anterior ? (
          <Link href={anterior} className={btnSecundario}>← Anterior</Link>
        ) : (
          <span />
        )}
        {proximo ? (
          <Link href={proximo} className={btnSecundario}>Próximo →</Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
