import { notFound } from "next/navigation";
import { CabecalhoObra } from "@/components/CabecalhoObra";
import { GerenciadorPersonagens } from "@/components/GerenciadorPersonagens";
import { obterObraDoUsuario } from "@/lib/auth-obras";

export const dynamic = "force-dynamic";

export default async function PersonagensPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await obterObraDoUsuario(obraId, {
    personagens: { orderBy: { criadoEm: "asc" } },
  });
  if (!obra) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <CabecalhoObra
        obraId={obra.id}
        titulo={obra.titulo}
        subtitulo="Personagens"
      />

      <div className="mt-6">
        <GerenciadorPersonagens obraId={obra.id} iniciais={obra.personagens} />
      </div>
    </main>
  );
}
