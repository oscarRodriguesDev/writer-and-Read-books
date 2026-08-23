import { prisma } from "@/lib/db";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { filtroAchadosSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ obraId: string }> };

/** Lista os achados de IA da obra, com filtro opcional por status (?status=). */
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await prisma.obra.findUnique({ where: { id: obraId } });
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const url = new URL(req.url);
    const filtro = filtroAchadosSchema.safeParse({
      status: url.searchParams.get("status") ?? undefined,
    });

    const achados = await prisma.achadoIA.findMany({
      where: {
        analise: { obraId },
        ...(filtro.success && filtro.data.status
          ? { status: filtro.data.status }
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
