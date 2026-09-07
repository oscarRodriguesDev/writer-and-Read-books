import { notFound } from "next/navigation";
import { CabecalhoObra } from "@/components/CabecalhoObra";
import { GerenciadorAtos } from "@/components/GerenciadorAtos";
import { obterObraDoUsuario } from "@/lib/auth-obras";

export const dynamic = "force-dynamic";

export default async function AtosPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await obterObraDoUsuario(obraId, {
    atos: {
      orderBy: { ordem: "asc" },
      include: {
        capitulos: {
          orderBy: { ordemDentroDoAto: "asc" },
          select: { id: true, titulo: true, ordemDentroDoAto: true },
        },
      },
    },
    capitulos: {
      orderBy: [{ ordemNarrativa: "asc" }, { ordemEscrita: "asc" }],
      select: { id: true, titulo: true, atoId: true },
    },
  });
  if (!obra) notFound();

  const capitulosSemAto = obra.capitulos
    .filter((c) => c.atoId === null)
    .map((c) => ({ id: c.id, titulo: c.titulo }));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <CabecalhoObra
        obraId={obra.id}
        titulo={obra.titulo}
        subtitulo="Atos"
      />

      <div className="mt-6">
        <GerenciadorAtos
          obraId={obra.id}
          atos={obra.atos}
          capitulosSemAto={capitulosSemAto}
        />
      </div>
    </main>
  );
}