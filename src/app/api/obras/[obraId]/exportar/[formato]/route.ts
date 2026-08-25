import { exportarObra, type FormatoExportacao } from "@/lib/services/exportarObra";
import { tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ obraId: string; formato: string }> };

/** GET /api/obras/[obraId]/exportar/[formato] — exporta a obra no formato solicitado. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { obraId, formato } = await params;
    const formatosValidos: FormatoExportacao[] = ["epub", "pdf", "docx", "kindle"];
    if (!formatosValidos.includes(formato as FormatoExportacao)) {
      return new Response(JSON.stringify({ erro: "Formato inválido" }), { status: 400 });
    }
    const { buffer, nomeArquivo, contentType } = await exportarObra(obraId, formato as FormatoExportacao);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}