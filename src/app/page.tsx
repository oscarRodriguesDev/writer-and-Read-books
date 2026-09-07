import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { WorkGrid } from "@/components/Dashboard/WorkGrid";
import { EmptyState } from "@/components/Dashboard/EmptyState";
import { Obra } from "@/lib/types";
import { obterUsuarioId } from "@/lib/auth-obras";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

async function fetchObrasComEstatisticas(): Promise<{
  obras: Obra[];
  totalObras: number;
  totalPalavras: number;
  obrasAtivas: number;
  obrasArquivadas: number;
}> {
  const usuarioId = await obterUsuarioId();
  const obras = usuarioId
    ? await prisma.obra.findMany({
        where: { usuarioId },
        orderBy: { atualizadoEm: "desc" },
        include: {
          capitulos: {
            include: {
              partes: {
                include: {
                  cenas: {
                    select: { conteudo: true },
                  },
                },
              },
            },
          },
        },
      })
    : [];

  const obrasComPalavras: Obra[] = obras.map((obra) => {
    let totalPalavras = 0;
    for (const capitulo of obra.capitulos) {
      for (const parte of capitulo.partes) {
        for (const cena of parte.cenas) {
          const palavras = cena.conteudo.trim().split(/\s+/).filter(Boolean).length;
          totalPalavras += palavras;
        }
      }
    }

    return {
      id: obra.id,
      titulo: obra.titulo,
      genero: obra.genero,
      subgenero: obra.subgenero,
      status: obra.status,
      arquivada: obra.arquivada,
      criadoEm: obra.criadoEm,
      atualizadoEm: obra.atualizadoEm,
      capaUrl: null,
      totalPalavras,
    };
  });

  const totalPalavras = obrasComPalavras.reduce((acc, o) => acc + (o.totalPalavras || 0), 0);
  const obrasAtivas = obrasComPalavras.filter((o) => !o.arquivada).length;
  const obrasArquivadas = obrasComPalavras.filter((o) => o.arquivada).length;

  return {
    obras: obrasComPalavras,
    totalObras: obrasComPalavras.length,
    totalPalavras,
    obrasAtivas,
    obrasArquivadas,
  };
}

export default async function Dashboard() {
  const [sessao, { obras, totalObras, totalPalavras, obrasAtivas, obrasArquivadas }] =
    await Promise.all([auth(), fetchObrasComEstatisticas()]);

  // Saudação usa o nome artístico (pseudônimo); fallback: nome real / genérico
  const usuario = sessao?.user?.id
    ? await prisma.usuario.findUnique({
        where: { id: sessao.user.id },
        select: { nomeAutor: true, nome: true },
      })
    : null;
  const nomeSaudacao = usuario?.nomeAutor ?? usuario?.nome ?? sessao?.user?.name ?? "escritor";

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
      <DashboardHeader
        totalObras={totalObras}
        totalPalavras={totalPalavras}
        obrasAtivas={obrasAtivas}
        obrasArquivadas={obrasArquivadas}
        nomeUsuario={nomeSaudacao}
      />

      {totalObras === 0 ? (
        <EmptyState />
      ) : (
        <WorkGrid obras={obras} />
      )}
    </main>
  );
}
