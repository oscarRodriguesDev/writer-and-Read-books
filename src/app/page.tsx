import Link from "next/link";
import { prisma } from "@/lib/db";
import { cardCls } from "@/components/ui";
import { BotaoExcluirObra } from "@/components/BotaoExcluirObra";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const obras = await prisma.obra.findMany({
    where: { arquivada: false },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Obras</h1>
          <p className="text-sm text-muted">
            {obras.length === 0
              ? "Nenhuma obra cadastrada ainda."
              : `${obras.length} obra(s) em andamento.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/importar"
            className="rounded-md border border-inputline bg-surface px-4 py-2 text-sm font-medium text-soft hover:bg-hoverbg"
          >
            Importar História
          </Link>
          <Link href="/obras/nova" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-onaccent hover:bg-accenthover">
            Nova Obra
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {obras.map((obra) => (
          <div key={obra.id} className={`${cardCls} relative`}>
            <div className="absolute right-2 top-2 z-10">
              <BotaoExcluirObra obraId={obra.id} titulo={obra.titulo} />
            </div>
            <Link href={`/obras/${obra.id}`} className="block transition hover:border-faint">
              <h2 className="mb-1 font-semibold">{obra.titulo}</h2>
              <p className="text-sm text-muted">{obra.genero ?? "Sem gênero"}</p>
              <span className="mt-3 inline-block rounded-full bg-chipbg px-2 py-0.5 text-xs text-soft">
                {obra.status}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
