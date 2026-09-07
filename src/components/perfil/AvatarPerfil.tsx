"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  usuarioId: string;
  fotoUrl: string | null;
  nome: string;
  onNotificar: (texto: string, tipo?: "erro" | "sucesso" | "aviso") => void;
};

/** Avatar circular do perfil com upload/remoção de foto (tipo "perfil"). */
export default function AvatarPerfil({ usuarioId, fotoUrl, nome, onNotificar }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const inicial = (nome || "?").trim().charAt(0).toUpperCase() || "?";

  async function enviarArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
      onNotificar("Foto: use JPG, PNG ou WebP.", "erro");
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      onNotificar("Foto: máximo 5 MB.", "erro");
      return;
    }
    setEnviando(true);
    try {
      const data = new FormData();
      data.append("tipo", "perfil");
      data.append("id", usuarioId);
      data.append("arquivo", arquivo);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const corpo = await res.json().catch(() => ({}));
      if (!res.ok) {
        onNotificar(corpo.erro ?? "Não foi possível enviar a foto.", "erro");
        return;
      }
      onNotificar("Foto de perfil atualizada.", "sucesso");
      router.refresh();
    } catch {
      onNotificar("Falha de conexão ao enviar a foto.", "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function removerFoto() {
    setEnviando(true);
    try {
      const res = await fetch(`/api/upload?tipo=perfil&id=${usuarioId}`, { method: "DELETE" });
      if (!res.ok) {
        const corpo = await res.json().catch(() => ({}));
        onNotificar(corpo.erro ?? "Não foi possível remover a foto.", "erro");
        return;
      }
      onNotificar("Foto removida.", "sucesso");
      router.refresh();
    } catch {
      onNotificar("Falha de conexão ao remover a foto.", "erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-line bg-surface text-4xl font-bold text-accent transition-colors hover:border-accent sm:h-28 sm:w-28"
        aria-label="Trocar foto de perfil"
      >
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
        ) : (
          inicial
        )}
      </button>
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="text-accent hover:underline"
        >
          {enviando ? "Enviando…" : "Trocar foto"}
        </button>
        {fotoUrl && (
          <button type="button" onClick={removerFoto} disabled={enviando} className="text-danger hover:underline">
            Remover
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => enviarArquivo(e.target.files?.[0])}
      />
    </div>
  );
}