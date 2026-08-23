import { ErroAplicacao } from "@/lib/erros";
import type { OpcoesCompletar, IaProvider } from "./provider";

/** Modelo padrão da NVIDIA NIM (troque aqui se necessário). */
export const MODELO_PADRAO = "nvidia/nemotron-3-ultra-550b-a55b";

/**
 * Nemotron 3 Ultra é um modelo de raciocínio: com thinking ligado ele gera
 * uma trilha de raciocínio antes da resposta (mais lento e consome tokens).
 * Para nossas tarefas (JSON de análise e prosa de cena) desligamos o thinking.
 */
const CHAT_TEMPLATE_KWARGS = { enable_thinking: false };

const BASE_URL = "https://integrate.api.nvidia.com/v1";
const TIMEOUT_MS = 120_000;
const TEMPERATURA = 0.2;

/**
 * Remove cercas de código (```json ... ```) que alguns modelos adicionam
 * mesmo pedindo resposta em JSON puro.
 */
function extrairJson(texto: string): unknown {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(limpo);
  } catch {
    throw new ErroAplicacao(
      "A IA respondeu em um formato inválido (JSON esperado). Tente novamente.",
      502,
    );
  }
}

/**
 * Provider NVIDIA NIM (API compatível com OpenAI).
 * RNF-07: erros HTTP/rede são convertidos em mensagens claras para o autor.
 */
export function criarProviderNvidia(): IaProvider {
  const chave = process.env.KEY_NVIDIA;
  if (!chave)
    throw new ErroAplicacao(
      "Chave da IA não configurada (variável KEY_NVIDIA no .env).",
      500,
    );

  return {
    async completarJson(system, user, opts?: OpcoesCompletar) {
      const timeoutMs = opts?.timeoutMs ?? TIMEOUT_MS;
      let res: Response;
      try {
        res = await fetch(`${BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${chave}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODELO_PADRAO,
            temperature: TEMPERATURA,
            max_tokens: opts?.maxTokens,
            chat_template_kwargs: CHAT_TEMPLATE_KWARGS,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (e) {
        if (e instanceof Error && e.name === "TimeoutError")
          throw new ErroAplicacao(
            "A IA demorou demais para responder. Tente novamente.",
            504,
          );
        throw new ErroAplicacao(
          "Não foi possível conectar ao serviço de IA. Verifique sua conexão e tente novamente.",
          502,
        );
      }

      if (!res.ok) {
        const detalhe = (await res.text()).slice(0, 300);
        throw new ErroAplicacao(
          `O serviço de IA retornou erro ${res.status}. ${detalhe}`,
          502,
        );
      }

      const dados = (await res.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const conteudo = dados.choices?.[0]?.message?.content;
      if (typeof conteudo !== "string")
        throw new ErroAplicacao(
          "Resposta inesperada do serviço de IA.",
          502,
        );
      return extrairJson(conteudo);
    },
  };
}
