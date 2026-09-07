import { notFound } from "next/navigation";
import { CabecalhoObra } from "@/components/CabecalhoObra";
import { PainelAnaliseObra } from "@/components/PainelAnaliseObra";
import { obterObraDoUsuario } from "@/lib/auth-obras";

export const dynamic = "force-dynamic";

export default async function AnalisePage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obra = await obterObraDoUsuario(obraId);
  if (!obra) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <CabecalhoObra
        obraId={obra.id}
        titulo="Análise IA"
        subtitulo="A IA procura furos de roteiro e inconsistências comparando cenas, personagens, linha do tempo e regras da obra."
      />
      <PainelAnaliseObra obraId={obra.id} />
    </main>
  );
}
