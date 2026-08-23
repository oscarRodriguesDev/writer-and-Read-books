"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario } from "@/components/ui";

type ObraResumo = { id: string; titulo: string };

export function FormImportar({ obras }: { obras: ObraResumo[] }) {
  const router = useRouter();
  const inputArquivos = useRef<HTMLInputElement>(null);
  const [destino, setDestino] = useState<"nova" | "existente">("nova");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function aoEscolherArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const selecionados = Array.from(e.target.files ?? []).filter((f) =>
      /\.(txt|pdf)$/i.test(f.name),
    );
    setArquivos(selecionados);
  }

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (arquivos.length === 0) {
      setErro("Selecione ao menos um arquivo .txt ou .pdf.");
      return;
    }
    if (destino === "nova" && !String(form.get("tituloNovaObra") ?? "").trim()) {
      setErro("Informe o título da nova obra.");
      return;
    }
    if (destino === "existente" && !form.get("obraId")) {
      setErro("Selecione a obra de destino.");
      return;
    }

    const dados = new FormData();
    for (const arquivo of arquivos) {
      dados.append("arquivos", arquivo);
    }
    if (destino === "existente") {
      dados.append("obraId", String(form.get("obraId")));
    } else {
      dados.append("tituloNovaObra", String(form.get("tituloNovaObra") ?? ""));
    }

    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/importar", { method: "POST", body: dados });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro ?? "Não foi possível importar os arquivos.");
        return;
      }
      router.push(`/obras/${json.obraId}/capitulos`);
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const totalMb =
    arquivos.reduce((s, f) => s + f.size, 0) / (1024 * 1024);

  return (
    <form onSubmit={aoEnviar} className="space-y-5">
      {/* Destino */}
      <fieldset className="space-y-2">
        <legend className={labelCls}>Destino da importação</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="destino"
            value="nova"
            checked={destino === "nova"}
            onChange={() => setDestino("nova")}
          />
          Criar nova obra
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="destino"
            value="existente"
            checked={destino === "existente"}
            onChange={() => setDestino("existente")}
          />
          Adicionar a uma obra existente
        </label>
      </fieldset>

      {destino === "nova" ? (
        <div>
          <label htmlFor="tituloNovaObra" className={labelCls}>
            Título da obra *
          </label>
          <input
            id="tituloNovaObra"
            name="tituloNovaObra"
            maxLength={200}
            className={inputCls}
            placeholder="Ex.: O Segredo das Marés"
          />
        </div>
      ) : (
        <div>
          <label htmlFor="obraId" className={labelCls}>
            Obra existente *
          </label>
          <select id="obraId" name="obraId" className={inputCls} defaultValue="">
            <option value="" disabled>
              Selecione…
            </option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.titulo}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Arquivos */}
      <div>
        <label htmlFor="arquivos" className={labelCls}>
          Arquivos (.txt ou .pdf, um ou vários) *
        </label>
        <input
          ref={inputArquivos}
          id="arquivos"
          name="arquivos"
          type="file"
          multiple
          accept=".txt,.pdf,text/plain,application/pdf"
          onChange={aoEscolherArquivos}
          className={`${inputCls} file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-onaccent`}
        />
        {arquivos.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-soft">
            {arquivos.map((f) => (
              <li key={f.name}>
                {f.name}{" "}
                <span className="text-faint">
                  ({(f.size / 1024).toFixed(1)} KB)
                </span>
              </li>
            ))}
            <li className="text-faint">
              Total: {arquivos.length} arquivo(s), {totalMb.toFixed(2)} MB
            </li>
          </ul>
        )}
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button type="submit" disabled={enviando} className={btnPrimario}>
        {enviando
          ? `Importando ${arquivos.length} arquivo(s)…`
          : "Importar"}
      </button>
    </form>
  );
}
