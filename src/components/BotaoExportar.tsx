"use client";

import { useState } from "react";
import { btnSecundario } from "@/components/ui";

type FormatoExportacao = "epub" | "pdf" | "docx" | "kindle";

const FORMATOS: { valor: FormatoExportacao; label: string; icone: string; descricao: string }[] = [
  { valor: "epub", label: "EPUB", icone: "📚", descricao: "Padrão para e-readers (Kobo, Google Play, Apple Books)" },
  { valor: "kindle", label: "Kindle (EPUB)", icone: "📱", descricao: "EPUB otimizado para Kindle (enviar por e-mail @kindle.com)" },
  { valor: "pdf", label: "PDF", icone: "📄", descricao: "Para impressão ou leitura no computador" },
  { valor: "docx", label: "DOCX", icone: "📝", descricao: "Para editar no Word/LibreOffice" },
];

export function BotaoExportar({ obraId }: { obraId: string }) {
  const [formatoSelecionado, setFormatoSelecionado] = useState<FormatoExportacao>("epub");
  const [exportando, setExportando] = useState<FormatoExportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function exportar(formato: FormatoExportacao) {
    setErro(null);
    setSucesso(false);
    setExportando(formato);
    try {
      const res = await fetch(`/api/obras/${obraId}/exportar/${formato}`, {
        method: "GET",
      });
      if (!res.ok) {
        const erroData = await res.json().catch(() => ({}));
        throw new Error(erroData.erro ?? `Erro ${res.status} ao exportar`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisposition = res.headers.get("Content-Disposition");
      let nomeArquivo = `livro.${formato === "kindle" ? "epub" : formato}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) nomeArquivo = match[1];
      }
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao exportar");
    } finally {
      setExportando(null);
    }
  }

  const formato = FORMATOS.find((f) => f.valor === formatoSelecionado)!;

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2">
        <select
          value={formatoSelecionado}
          onChange={(e) => setFormatoSelecionado(e.target.value as FormatoExportacao)}
          disabled={exportando !== null}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-faint"
          aria-label="Formato de exportação"
        >
          {FORMATOS.map((f) => (
            <option key={f.valor} value={f.valor}>
              {f.icone} {f.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => exportar(formatoSelecionado)}
          disabled={exportando !== null}
          className={`${btnSecundario} shrink-0`}
          aria-label={`Exportar como ${formato.label}`}
        >
          {exportando ? (
            <>
              ⏳
              <span className="sr-only">Exportando…</span>
            </>
          ) : (
            <>
              📤 Exportar
            </>
          )}
        </button>
      </div>

      {/* Tooltip/descrição do formato */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-md border border-line bg-surface p-2 text-xs text-muted opacity-0 invisible transition-all group-hover:opacity-100 group-hover:visible z-10">
        <p className="font-medium">{formato.icone} {formato.label}</p>
        <p>{formato.descricao}</p>
      </div>

      {erro && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-lg animate-slide-up">
          ❌ {erro}
        </div>
      )}
      {sucesso && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 shadow-lg animate-slide-up">
          ✅ Exportação concluída! Arquivo salvo na pasta Downloads.
        </div>
      )}
    </div>
  );
}