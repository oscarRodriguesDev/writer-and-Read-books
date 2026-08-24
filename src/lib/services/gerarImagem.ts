import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { gerarPromptImagem, type TipoPrompt } from "@/lib/services/promptImagem";

/**
 * Geração de imagem via NVIDIA NIM (mesma KEY_NVIDIA dos LLMs).
 * Endpoint: ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell
 * Fluxo: submit → resposta inline (200) OU assíncrona (202 + NVCF-REQID,
 * com polling em api.nvcf.nvidia.com até a imagem ficar pronta).
 */

const ENDPOINT =
  "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell";
const STATUS_URL = "https://api.nvcf.nvidia.com/v2/nvcf/pexec/status";
const TAMANHO = 768; // mínimo aceito pelo endpoint
const TIMEOUT_SUBMISSAO_MS = 120_000;
const MAX_POLLS = 48; // 48 × 5s ≈ 4 min de espera no modo assíncrono

function chaveApi(): string {
  const chave = process.env.KEY_NVIDIA;
  if (!chave)
    throw new ErroAplicacao(
      "Chave da IA não configurada (variável KEY_NVIDIA no .env).",
      500,
    );
  return chave;
}

function erroAmigavel(status: number, detalhe: string): ErroAplicacao {
  if (status === 403 || status === 402)
    return new ErroAplicacao(
      "Sua conta NVIDIA não tem créditos/acesso para gerar imagens. Verifique em build.nvidia.com (a chave funciona para os LLMs, mas os endpoints de imagem exigem créditos dedicados).",
      502,
    );
  return new ErroAplicacao(
    `O serviço de imagem da NVIDIA retornou erro ${status}. ${detalhe}`,
    502,
  );
}

/** Extrai o Base64 da imagem nos formatos que a NIM devolve. */
function extrairBase64(corpo: unknown): string | null {
  const j = corpo as {
    artifacts?: Array<{ base64?: string; b64_json?: string }>;
    data?: Array<{ b64_json?: string; base64?: string }>;
    image?: string;
  };
  const deArtifacts = j.artifacts?.[0]?.base64 ?? j.artifacts?.[0]?.b64_json;
  const deData = j.data?.[0]?.b64_json ?? j.data?.[0]?.base64;
  return deArtifacts ?? deData ?? j.image ?? null;
}

export async function gerarImagem(
  tipo: TipoPrompt,
  id: string,
): Promise<string> {
  const chave = chaveApi();

  // Registro precisa existir antes de gastar a chamada
  if (tipo === "personagem") {
    if (!(await prisma.personagem.findUnique({ where: { id } })))
      throw new ErroAplicacao("Personagem não encontrado", 404);
  } else if (tipo === "ambiente") {
    if (!(await prisma.ambiente.findUnique({ where: { id } })))
      throw new ErroAplicacao("Ambiente não encontrado", 404);
  } else {
    if (!(await prisma.capitulo.findUnique({ where: { id } })))
      throw new ErroAplicacao("Capítulo não encontrado", 404);
  }

  const prompt = await gerarPromptImagem(tipo, id);

  // --- Submissão ---
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        prompt,
        seed: Math.floor(Math.random() * 2_147_483_647),
        width: TAMANHO,
        height: TAMANHO,
      }),
      signal: AbortSignal.timeout(TIMEOUT_SUBMISSAO_MS),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError")
      throw new ErroAplicacao(
        "A geração ficou muito tempo na fila da NVIDIA (>2 min). Isso normalmente indica falta de créditos para modelos de imagem na sua conta (build.nvidia.com) ou fila cheia. Tente novamente mais tarde.",
        504,
      );
    throw new ErroAplicacao(
      "Não foi possível conectar ao serviço de imagem da NVIDIA.",
      502,
    );
  }

  // --- Resposta inline (200) ---
  if (res.ok) {
    const corpo = await res.json();
    return await salvarImagem(tipo, id, extrairBase64(corpo));
  }

  // --- Assíncrona (202 + NVCF-REQID): faz polling do status ---
  if (res.status === 202) {
    const reqId = res.headers.get("nvcf-reqid") ?? res.headers.get("NVCF-REQID");
    if (!reqId)
      throw new ErroAplicacao(
        "Serviço de imagem aceitou a tarefa mas não retornou o identificador para acompanhamento.",
        502,
      );

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, 5_000));
      const statusRes = await fetch(`${STATUS_URL}/${reqId}`, {
        headers: { Authorization: `Bearer ${chave}`, Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      }).catch(() => null);
      if (!statusRes) continue;

      if (statusRes.status === 200) {
        const corpo = await statusRes.json();
        return await salvarImagem(tipo, id, extrairBase64(corpo));
      }
      if (statusRes.status === 202) continue; // ainda processando
      const detalhe = (await statusRes.text()).slice(0, 300);
      throw erroAmigavel(statusRes.status, detalhe);
    }
    throw new ErroAplicacao(
      "A geração não ficou pronta dentro do tempo esperado (~4 min). Tente novamente.",
      504,
    );
  }

  const detalhe = (await res.text()).slice(0, 300);
  throw erroAmigavel(res.status, detalhe);
}

/** Salva o Base64 como arquivo local e vincula ao registro. */
async function salvarImagem(
  tipo: TipoPrompt,
  id: string,
  base64: string | null,
): Promise<string> {
  if (!base64)
    throw new ErroAplicacao(
      "O serviço respondeu sem imagem. Tente novamente.",
      502,
    );
  const buffer = Buffer.from(base64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024)
    throw new ErroAplicacao("Imagem gerada inválida.", 502);

  const nomeArquivo = `${id}-${Date.now()}.png`;
  const urlPublica = `/uploads/${tipo}/${nomeArquivo}`;
  const destino = path.join(process.cwd(), "public", "uploads", tipo, nomeArquivo);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, buffer);

  if (tipo === "personagem")
    await prisma.personagem.update({ where: { id }, data: { imagemUrl: urlPublica } });
  else if (tipo === "ambiente")
    await prisma.ambiente.update({ where: { id }, data: { imagemUrl: urlPublica } });
  else await prisma.capitulo.update({ where: { id }, data: { imagemUrl: urlPublica } });

  return urlPublica;
}
