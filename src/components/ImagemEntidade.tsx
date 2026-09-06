"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Tipo = "personagem" | "ambiente" | "capitulo" | "artefato";

/**
 * Imagem representativa de personagem/ambiente/capítulo: exibe thumbnail,
 * permite subir (JPG/PNG/WebP até 5 MB) e remover. Armazenamento atual:
 * filesystem local (public/uploads); troca futura por storage externo
 * afeta apenas a rota /api/upload.
 */
export function ImagemEntidade({
  tipo,
  id,
  url,
  rotulo = "Imagem",
  permitirUrl = false,
}: {
  tipo: Tipo;
  id: string;
  url?: string | null;
  rotulo?: string;
  /** Habilita definir a imagem por URL externa (além do upload). */
  permitirUrl?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [falhouCarregar, setFalhouCarregar] = useState(false);

  async function subir(arquivo: File) {
    setErro(null);
    setEnviando(true);
    try {
      const form = new FormData();
      form.set("tipo", tipo);
      form.set("id", id);
      form.set("arquivo", arquivo);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const corpo = (await res.json().catch(() => null)) as { erro?: string } | null;
        throw new Error(corpo?.erro ?? "Falha no upload.");
      }
      setFalhouCarregar(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  /** Lê uma imagem diretamente da área de transferência (Ctrl+C na imagem
   *  do Gemini/ChatGPT/etc. e cola aqui) — contorna URLs blob temporárias. */
  async function colarDaAreaTransferencia() {
    setErro(null);
    try {
      const itens = await navigator.clipboard.read();
      let arquivo: File | null = null;
      for (const item of itens) {
        const tipo = item.types.find((t) => t.startsWith("image/"));
        if (tipo) {
          const blob = await item.getType(tipo);
          arquivo = new File([blob], `colado.${tipo.split("/")[1] ?? "png"}`, {
            type: tipo,
          });
          break;
        }
      }
      if (!arquivo)
        throw new Error(
          "Nenhuma imagem encontrada na área de transferência. Copie a imagem primeiro (botão direito → Copiar imagem).",
        );
      await subir(arquivo);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível ler a área de transferência.",
      );
    }
  }

  /** Importa imagem codificada em Base64 (respostas de APIs de geração
   *  de imagem, ex.: Gemini) decodificando e salvando no servidor. */
  async function importarBase64() {
    const entrada = window.prompt(
      "Cole o Base64 ou Data URL da imagem (data:image/png;base64,…):",
    );
    if (!entrada?.trim()) return;
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/upload/base64", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, id, dados: entrada.trim() }),
      });
      if (!res.ok) {
        const corpo = (await res.json().catch(() => null)) as { erro?: string } | null;
        throw new Error(corpo?.erro ?? "Falha ao importar o Base64.");
      }
      setFalhouCarregar(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao importar o Base64.");
    } finally {
      setEnviando(false);
    }
  }

  async function definirPorUrl() {
    const entrada = window.prompt(
      "URL da imagem (http:// ou https://):",
      "https://",
    );
    if (!entrada || entrada.trim() === "" || entrada.trim() === "https://") return;
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/upload/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, id, url: entrada.trim() }),
      });
      if (!res.ok) {
        const corpo = (await res.json().catch(() => null)) as { erro?: string } | null;
        throw new Error(corpo?.erro ?? "Falha ao definir a URL.");
      }
      setFalhouCarregar(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao definir a URL.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    if (!confirm(`Remover a imagem deste ${rotulo.toLowerCase()}?`)) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/upload?tipo=${tipo}&id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setErro("Falha ao remover a imagem.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="shrink-0">
      {url ? (
        <div className="space-y-1">
          {falhouCarregar ? (
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-md border border-red-300 bg-red-50 p-2 text-center text-xs text-red-700">
              ⚠️ URL não é uma imagem direta. Use “Copiar endereço da imagem”.
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url}
              alt={`Imagem do ${rotulo.toLowerCase()}`}
              onError={() => setFalhouCarregar(true)}
              className="h-28 w-28 rounded-md border border-line object-cover"
            />
          )}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={enviando}
              className="rounded-md border border-inputline bg-surface px-2 py-0.5 text-xs text-soft hover:bg-hoverbg disabled:opacity-50"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={colarDaAreaTransferencia}
              disabled={enviando}
              title="Cola uma imagem copiada (ex.: do Gemini, ChatGPT)"
              className="rounded-md border border-inputline bg-surface px-2 py-0.5 text-xs text-soft hover:bg-hoverbg disabled:opacity-50"
            >
              📋 Colar
            </button>
            {permitirUrl && (
              <>
                <button
                  type="button"
                  onClick={definirPorUrl}
                  disabled={enviando}
                  title="Definir imagem por URL externa"
                  className="rounded-md border border-inputline bg-surface px-2 py-0.5 text-xs text-soft hover:bg-hoverbg disabled:opacity-50"
                >
                  🔗
                </button>
                <button
                  type="button"
                  onClick={importarBase64}
                  disabled={enviando}
                  title="Importar imagem em Base64 (APIs de geração)"
                  className="rounded-md border border-inputline bg-surface px-2 py-0.5 text-xs text-soft hover:bg-hoverbg disabled:opacity-50"
                >
                  🧩
                </button>
              </>
            )}
            <button
              type="button"
              onClick={remover}
              disabled={enviando}
              className="rounded-md border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            title="Subir imagem (JPG, PNG ou WebP até 5 MB)"
            className="flex h-28 w-28 flex-col items-center justify-center rounded-md border border-dashed border-line text-xs text-faint hover:bg-hoverbg disabled:opacity-50"
          >
            {enviando ? "⏳ Enviando…" : `🖼️ ${rotulo}`}
          </button>
          {permitirUrl && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={definirPorUrl}
                disabled={enviando}
                className="flex-1 rounded-md border border-inputline bg-surface px-2 py-0.5 text-xs text-soft hover:bg-hoverbg disabled:opacity-50"
              >
                🔗 URL
              </button>
              <button
                type="button"
                onClick={importarBase64}
                disabled={enviando}
                title="Importar Base64 de APIs de geração (Gemini etc.)"
                className="flex-1 rounded-md border border-inputline bg-surface px-2 py-0.5 text-xs text-soft hover:bg-hoverbg disabled:opacity-50"
              >
                🧩 Base64
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={colarDaAreaTransferencia}
            disabled={enviando}
            title="Copie a imagem no Gemini/ChatGPT e cole aqui"
            className="w-full rounded-md border border-inputline bg-surface px-2 py-0.5 text-xs text-soft hover:bg-hoverbg disabled:opacity-50"
          >
            📋 Colar imagem copiada
          </button>
        </div>
      )}
      {erro && <p className="mt-1 max-w-28 text-xs text-red-600">{erro}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void subir(f);
        }}
      />
    </div>
  );
}
