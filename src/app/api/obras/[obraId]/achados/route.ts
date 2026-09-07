import { prisma } from "@/lib/db";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { filtroAchadosSchema } from "@/lib/validators";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

/** Lista os achados de IA da obra, com filtro opcional por status e/ou categoria. */
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const url = new URL(req.url);
    const filtro = filtroAchadosSchema.safeParse({
      status: url.searchParams.get("status") ?? undefined,
      categoria: url.searchParams.get("categoria") ?? undefined,
    });

    const achados = await prisma.achadoIA.findMany({
      where: {
        analise: { obraId },
        ...(filtro.success && filtro.data.status
          ? { status: filtro.data.status }
          : {}),
        ...(filtro.success && filtro.data.categoria
          ? { categoria: filtro.data.categoria }
          : {}),
      },
      orderBy: [{ criadoEm: "desc" }],
      include: {
        analise: { select: { escopo: true, criadoEm: true } },
        capitulo: { select: { titulo: true } },
        cena: { select: { titulo: true, tipo: true } },
      },
    });
    return Response.json(achados);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
