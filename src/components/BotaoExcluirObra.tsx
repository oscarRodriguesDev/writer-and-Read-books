"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Exclusão de obra com confirmação explícita digitando o título (RP-06).
 *  A operação é irreversível: apaga capítulos, cenas, personagens, etc. */
export function BotaoExcluirObra({
  obraId,
  titulo,
}: {
  obraId: string;
  titulo: string;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [digitado, setDigitado] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    if (digitado.trim() !== titulo.trim()) return;
    setExcluindo(true);
    try {
      const res = await fetch(`/api/obras/${obraId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Não foi possível excluir a obra. Tente novamente.");
      setExcluindo(false);
    }
  }

  if (!confirmando)
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setConfirmando(true);
        }}
        title="Excluir esta obra permanentemente"
        className="rounded-md border border-red-300 bg-surface px-2 py-1 text-xs text-red-700 hover:bg-red-50"
      >
        🗑️
      </button>
    );

  return (
    <div
      onClick={(e) => e.preventDefault()}
      className="space-y-2 rounded-md border border-red-300 bg-red-50 p-3"
    >
      <p className="text-xs font-medium text-red-800">
        Isso apaga PERMANENTEMENTE “{titulo}” — capítulos, cenas, personagens,
        ambientes, linha do tempo e análises. Digite o título da obra para confirmar:
      </p>
      <input
        value={digitado}
        onChange={(e) => setDigitado(e.target.value)}
        placeholder={titulo}
        aria-label="Digite o título da obra para confirmar a exclusão"
        className="w-full rounded-md border border-red-300 bg-white px-2 py-1 text-sm outline-none focus:border-red-500"
        maxLength={200}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={excluir}
          disabled={excluindo || digitado.trim() !== titulo.trim()}
          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {excluindo ? "Excluindo…" : "Excluir para sempre"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirmando(false);
            setDigitado("");
          }}
          className="rounded-md border border-inputline bg-surface px-3 py-1 text-xs text-soft hover:bg-hoverbg"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
