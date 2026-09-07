import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ErroAplicacao } from "@/lib/erros";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

/**
 * Upload de imagens representativas (personagem/ambiente/capitulo).
 * Armazenamento atual: filesystem local em public/uploads/ (sem storage externo);
 * o banco guarda apenas o caminho público. Para migrar a S3/R2 depois,
 * basta trocar a escrita de arquivo nesta rota.
 */

const TIPOS = ["personagem", "ambiente", "capitulo", "artefato", "perfil"] as const;
type Tipo = (typeof TIPOS)[number];

const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const TAMANHO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function buscarRegistro(tipo: Tipo, id: string) {
  if (tipo === "personagem") return prisma.personagem.findUnique({ where: { id } });
  if (tipo === "ambiente") return prisma.ambiente.findUnique({ where: { id } });
  if (tipo === "artefato") return prisma.artefato.findUnique({ where: { id } });
  if (tipo === "perfil") return prisma.usuario.findUnique({ where: { id } });
  return prisma.capitulo.findUnique({ where: { id } });
}

async function salvarImagemUrl(tipo: Tipo, id: string, url: string | null) {
  if (tipo === "personagem")
    await prisma.personagem.update({ where: { id }, data: { imagemUrl: url } });
  else if (tipo === "ambiente")
    await prisma.ambiente.update({ where: { id }, data: { imagemUrl: url } });
  else if (tipo === "artefato")
    await prisma.artefato.update({ where: { id }, data: { imagemUrl: url } });
  else if (tipo === "perfil")
    await prisma.usuario.update({ where: { id }, data: { fotoUrl: url } });
  else await prisma.capitulo.update({ where: { id }, data: { imagemUrl: url } });
}

function caminhoAbsoluto(urlRelativa: string): string {
  return path.join(process.cwd(), "public", urlRelativa.replace(/^\//, ""));
}

async function removerArquivoAntigo(url?: string | null) {
  if (!url || !url.startsWith("/uploads/")) return;
  await unlink(caminhoAbsoluto(url)).catch(() => {});
}

/** URL de imagem atual do registro (imagemUrl ou fotoUrl no caso de perfil). */
function urlAtualDoRegistro(tipo: Tipo, registro: Awaited<ReturnType<typeof buscarRegistro>>) {
  if (!registro) return null;
  return tipo === "perfil"
    ? (registro as { fotoUrl: string | null }).fotoUrl
    : (registro as { imagemUrl: string | null }).imagemUrl;
}

/** Verifica se o upload de "perfil" é do próprio usuário logado (RN-06/07). */
async function usuarioPodeEnviarFotoPerfil(id: string) {
  const sessao = await auth();
  return sessao?.user?.id !== undefined && sessao.user.id === id;
}

/**
 * Verifica se o registro de entidade (não-perfil) pertence a uma obra do
 * usuário logado. Retorna true se OK; se não for encontrado/do usuário,
 * retorna false (404 — não vaza existência).
 */
async function registroPertenceAoUsuario(
  _tipo: Exclude<Tipo, "perfil">,
  registro: Awaited<ReturnType<typeof buscarRegistro>>,
) {
  // Todos os tipos de entidade têm obraId direto (personagem, ambiente,
  // artefato, capitulo) — perfil não passa por aqui.
  const obraId = (registro as { obraId: string }).obraId;
  return Boolean(obraId && (await obterObraDoUsuario(obraId)));
}

/** POST /api/upload — multipart/form-data: tipo, id, arquivo. */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const tipo = form.get("tipo") as Tipo | null;
    const id = form.get("id") as string | null;
    const arquivo = form.get("arquivo");

    if (!tipo || !TIPOS.includes(tipo))
      return respostaErro("Tipo inválido.", 400);
    if (!id) return respostaErro("ID obrigatório.", 400);
    if (!(arquivo instanceof File))
      return respostaErro("Envie um arquivo de imagem.", 400);

    const extensao = EXTENSOES[arquivo.type];
    if (!extensao)
      return respostaErro("Formato não suportado. Use JPG, PNG ou WebP.", 400);
    if (arquivo.size > TAMANHO_MAX_BYTES)
      return respostaErro("Imagem muito grande. Máximo: 5 MB.", 400);

    // Registro precisa existir
    const registro = await buscarRegistro(tipo, id);
    if (!registro) return respostaErro("Registro não encontrado", 404);

    // Foto de perfil só pode ser enviada pelo próprio usuário (titularidade)
    if (tipo === "perfil" && !(await usuarioPodeEnviarFotoPerfil(id))) {
      return respostaErro("Você não pode alterar a foto de outro usuário.", 403);
    }

    // Entidades só podem ter imagem alterada pelo dono da obra
    if (
      tipo !== "perfil" &&
      !(await registroPertenceAoUsuario(tipo, registro))
    ) {
      return respostaErro("Registro não encontrado", 404);
    }

    const nomeArquivo = `${id}-${Date.now()}.${extensao}`;
    const urlPublica = `/uploads/${tipo}/${nomeArquivo}`;
    const destino = path.join(
      process.cwd(),
      "public",
      "uploads",
      tipo,
      nomeArquivo,
    );
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, Buffer.from(await arquivo.arrayBuffer()));

    // Substitui a referência e limpa o arquivo antigo
    await removerArquivoAntigo(urlAtualDoRegistro(tipo, registro));
    await salvarImagemUrl(tipo, id, urlPublica);

    return Response.json({ imagemUrl: urlPublica });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

/** DELETE /api/upload?tipo=&id= — remove a imagem do registro. */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo") as Tipo | null;
    const id = searchParams.get("id");
    if (!tipo || !TIPOS.includes(tipo) || !id)
      return respostaErro("Parâmetros inválidos.", 400);

    const registro = await buscarRegistro(tipo, id);
    if (!registro) return respostaErro("Registro não encontrado", 404);

    // Remoção de foto de perfil só pelo próprio usuário (titularidade)
    if (tipo === "perfil" && !(await usuarioPodeEnviarFotoPerfil(id))) {
      return respostaErro("Você não pode alterar a foto de outro usuário.", 403);
    }

    // Entidades só podem ter imagem removida pelo dono da obra
    if (
      tipo !== "perfil" &&
      !(await registroPertenceAoUsuario(tipo, registro))
    ) {
      return respostaErro("Registro não encontrado", 404);
    }

    await removerArquivoAntigo(urlAtualDoRegistro(tipo, registro));
    await salvarImagemUrl(tipo, id, null);
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
