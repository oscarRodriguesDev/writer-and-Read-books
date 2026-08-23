import Link from "next/link";
import { prisma } from "@/lib/db";
import { FormImportar } from "@/components/FormImportar";

export const dynamic = "force-dynamic";

export default async function ImportarPage() {
  const obras = await prisma.obra.findMany({
    where: { arquivada: false },
    orderBy: { criadoEm: "desc" },
    select: { id: true, titulo: true },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link href="/" className="mb-6 inline-block rounded-md border border-inputline bg-surface px-3 py-1.5 text-sm text-soft hover:bg-hoverbg">
        ← Voltar
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Importar História</h1>
      <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <p className="mb-4 text-sm text-muted">
          Envie um ou vários arquivos <strong>.txt</strong> ou <strong>.pdf</strong>.
          Se os textos tiverem marcadores como <em>“Capítulo 1”</em>, a importação
          cria um capítulo para cada um; caso contrário, cada arquivo vira um capítulo.
          O conteúdo é distribuído entre as cenas do capítulo e você pode reorganizar
          depois no editor.
        </p>
        <FormImportar obras={obras} />
      </div>
    </main>
  );
}
