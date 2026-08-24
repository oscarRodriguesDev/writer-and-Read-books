"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Botão "🎨 Prompt de imagem": pede à IA um prompt representativo
 * (capítulo/personagem/ambiente) e exibe para copiar e colar no gerador
 * que o autor preferir (Gemini, ChatGPT, Midjourney…).
 * Com permitirGerar: também gera a imagem direto pela NVIDIA NIM e
 * salva automaticamente na entidade.
 */
export function BotaoPromptImagem({
  tipo,
  id,
  rotulo = "🎨 Prompt de imagem",
  permitirGerar = false,
}: {
  tipo: "capitulo" | "personagem" | "ambiente";
  id: string;
  rotulo?: string;
  permitirGerar?: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [gerandoImagem, setGerandoImagem] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function gerarImagem() {
    setErro(null);
    setGerandoImagem(true);
    try {
      const res = await fetch("/api/gerar-imagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, id }),
      });
      if (!res.ok) {
        const corpo = (await res.json().catch(() => null)) as { erro?: string } | null;
        throw new Error(corpo?.erro ?? "Falha na geração da imagem.");
      }
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na geração da imagem.");
    } finally {
      setGerandoImagem(false);
    }
  }

  async function gerar() {
    if (prompt) {
      setAberto((v) => !v); // já tem prompt: só abre/fecha o painel
      return;
    }
    setGerando(true);
    setErro(null);
    try {
      const res = await fetch("/api/prompts-imagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, id }),
      });
      const corpo = (await res.json().catch(() => null)) as
        | { prompt?: string; erro?: string }
        | null;
      if (!res.ok || !corpo?.prompt)
        throw new Error(corpo?.erro ?? "Falha ao gerar o prompt.");
      setPrompt(corpo.prompt);
      setAberto(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao gerar o prompt.");
    } finally {
      setGerando(false);
    }
  }

  async function copiar() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard pode falhar sem HTTPS — seleção manual resolve
      setErro("Não foi possível copiar automaticamente; selecione o texto.");
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={gerar}
        disabled={gerando}
        className="rounded-md border border-inputline bg-surface px-3 py-1.5 text-sm text-soft hover:bg-hoverbg disabled:opacity-50"
      >
        {gerando ? "⏳ Criando prompt…" : rotulo}
      </button>

      {permitirGerar && (
        <button
          type="button"
          onClick={gerarImagem}
          disabled={gerandoImagem || gerando}
          title="Gera a imagem automaticamente (NVIDIA NIM) e salva na entidade"
          className="mt-2 w-fit rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-onaccent hover:bg-accenthover disabled:opacity-50"
        >
          {gerandoImagem
            ? "⏳ Gerando imagem… pode levar minutos"
            : "🖼️ Gerar imagem com IA"}
        </button>
      )}

      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}

      {aberto && prompt && (
        <div className="mt-2 rounded-md border border-line p-2">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">
            Prompt em inglês (compatível com Gemini, ChatGPT, Midjourney…)
          </p>
          <textarea
            value={prompt}
            readOnly
            rows={5}
            aria-label="Prompt de imagem gerado"
            className="w-full resize-y rounded-md border border-line bg-surface p-2 text-sm outline-none"
          />
          <div className="mt-1.5 flex gap-2">
            <button type="button" onClick={copiar} className="rounded-md border border-inputline bg-surface px-3 py-1.5 text-sm text-soft hover:bg-hoverbg">
              {copiado ? "✅ Copiado!" : "📋 Copiar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPrompt(null);
                setAberto(false);
                setCopiado(false);
              }}
              className="rounded-md border border-inputline bg-surface px-3 py-1.5 text-sm text-soft hover:bg-hoverbg"
            >
              🔄 Gerar outro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
