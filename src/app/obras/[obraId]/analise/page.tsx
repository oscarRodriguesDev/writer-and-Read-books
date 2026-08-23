import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NavegacaoObra } from "@/components/NavegacaoObra";
import { PainelAnaliseObra } from "@/components/PainelAnaliseObra";
import { btnSecundario } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AnalisePage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    select: { id: true, titulo: true },
  });
  if (!obra) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-4">
        <Link href={`/obras/${obra.id}`} className={`inline-block ${btnSecundario}`}>
          ← {obra.titulo}
        </Link>
      </div>
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Análise IA</h1>
        <p className="text-sm text-muted">
          A IA procura furos de roteiro e inconsistências comparando cenas,
          personagens, linha do tempo e regras da obra.
        </p>
      </header>
      <NavegacaoObra obraId={obra.id} />
      <PainelAnaliseObra obraId={obra.id} />
    </main>
  );
}
