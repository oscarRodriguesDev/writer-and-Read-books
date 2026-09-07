import { notFound } from "next/navigation";
import { CabecalhoObra } from "@/components/CabecalhoObra";
import { GerenciadorRegras } from "@/components/GerenciadorRegras";
import { obterObraDoUsuario } from "@/lib/auth-obras";

export const dynamic = "force-dynamic";

export default async function RegrasPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await obterObraDoUsuario(obraId, {
    regras: { orderBy: [{ ativa: "desc" }, { descricao: "asc" }] },
  });
  if (!obra) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <CabecalhoObra
        obraId={obra.id}
        titulo={obra.titulo}
        subtitulo="Regras do universo"
      />

      <div className="mt-6">
        <GerenciadorRegras obraId={obra.id} iniciais={obra.regras} />
      </div>
    </main>
  );
}