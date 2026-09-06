"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, labelCls, btnPrimario, btnSecundario } from "@/components/ui";

export type ObraDados = {
  titulo: string;
  subtitulo: string | null;
  genero: string | null;
  subgenero: string | null;
  tema: string | null;
  publicoAlvo: string | null;
  descricao: string | null;
  status: string;
  // Metadados de publicação
  isbn: string | null;
  isbn13: string | null;
  idioma: string;
  dataPublicacao: string | null;
  editora: string | null;
  edicao: string | null;
  direitosAutorais: string | null;
  capaUrl: string | null;
};

const STATUS = [
  { valor: "PLANEJAMENTO", rotulo: "Planejamento" },
  { valor: "ESCRITA", rotulo: "Escrita" },
  { valor: "REVISAO", rotulo: "Revisão" },
  { valor: "CONCLUIDA", rotulo: "Concluída" },
] as const;

const IDIOMAS = [
  { valor: "pt-BR", rotulo: "Português (Brasil)" },
  { valor: "pt-PT", rotulo: "Português (Portugal)" },
  { valor: "en-US", rotulo: "English (US)" },
  { valor: "en-GB", rotulo: "English (UK)" },
  { valor: "es-ES", rotulo: "Español" },
  { valor: "fr-FR", rotulo: "Français" },
  { valor: "de-DE", rotulo: "Deutsch" },
  { valor: "it-IT", rotulo: "Italiano" },
] as const;

/** Edição de todos os dados da obra (RP-07/08): título, gênero, status etc. */
export function FormEditarObra({
  obraId,
  inicial,
}: {
  obraId: string;
  inicial: ObraDados;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"basicos" | "publicacao" | "capa">("basicos");

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSalvando(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/obras/${obraId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      if (!res.ok) {
        const corpo = (await res.json().catch(() => null)) as { erro?: string } | null;
        setFeedback(corpo?.erro ?? "Erro ao salvar.");
        return;
      }
      setFeedback("Dados salvos ✓");
      router.refresh();
    } catch {
      setFeedback("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setAberto((v) => !v)} className={btnSecundario}>
        {aberto ? "Fechar edição" : "✏️ Editar dados da obra"}
      </button>

      {aberto && (
        <div className="mt-4">
          {/* Abas */}
          <div className="flex gap-1 border-b border-line mb-4">
            <button
              type="button"
              onClick={() => setAbaAtiva("basicos")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                abaAtiva === "basicos" ? "border-primary text-primary" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              Básicos
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva("publicacao")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                abaAtiva === "publicacao" ? "border-primary text-primary" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              Publicação
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva("capa")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                abaAtiva === "capa" ? "border-primary text-primary" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              Capa
            </button>
          </div>

          <form onSubmit={aoEnviar} className="space-y-4">
            {/* ABA BÁSICOS */}
            {abaAtiva === "basicos" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="titulo" className={labelCls}>Título *</label>
                    <input id="titulo" name="titulo" required maxLength={200} defaultValue={inicial.titulo} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="subtitulo" className={labelCls}>Subtítulo</label>
                    <input id="subtitulo" name="subtitulo" maxLength={200} defaultValue={inicial.subtitulo ?? ""} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="status" className={labelCls}>Status</label>
                    <select id="status" name="status" defaultValue={inicial.status} className={inputCls}>
                      {STATUS.map((s) => (
                        <option key={s.valor} value={s.valor}>{s.rotulo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="idioma" className={labelCls}>Idioma</label>
                    <select id="idioma" name="idioma" defaultValue={inicial.idioma ?? "pt-BR"} className={inputCls}>
                      {IDIOMAS.map((i) => (
                        <option key={i.valor} value={i.valor}>{i.rotulo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="genero" className={labelCls}>Gênero</label>
                    <input id="genero" name="genero" maxLength={100} defaultValue={inicial.genero ?? ""} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="subgenero" className={labelCls}>Subgênero</label>
                    <input id="subgenero" name="subgenero" maxLength={100} defaultValue={inicial.subgenero ?? ""} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="tema" className={labelCls}>Tema</label>
                    <input id="tema" name="tema" maxLength={200} defaultValue={inicial.tema ?? ""} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="publicoAlvo" className={labelCls}>Público-alvo</label>
                    <input id="publicoAlvo" name="publicoAlvo" maxLength={200} defaultValue={inicial.publicoAlvo ?? ""} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label htmlFor="descricao" className={labelCls}>Descrição</label>
                  <textarea id="descricao" name="descricao" rows={4} maxLength={2000} defaultValue={inicial.descricao ?? ""} className={inputCls} />
                </div>
              </div>
            )}

            {/* ABA PUBLICAÇÃO */}
            {abaAtiva === "publicacao" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="isbn" className={labelCls}>ISBN (10 ou 13 dígitos)</label>
                    <input id="isbn" name="isbn" maxLength={13} defaultValue={inicial.isbn ?? ""} className={inputCls} placeholder="Ex: 978-85-12345-67-8" />
                  </div>
                  <div>
                    <label htmlFor="isbn13" className={labelCls}>ISBN-13</label>
                    <input id="isbn13" name="isbn13" maxLength={13} defaultValue={inicial.isbn13 ?? ""} className={inputCls} placeholder="Ex: 9788512345678" />
                  </div>
                  <div>
                    <label htmlFor="editora" className={labelCls}>Editora</label>
                    <input id="editora" name="editora" maxLength={200} defaultValue={inicial.editora ?? ""} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="edicao" className={labelCls}>Edição</label>
                    <input id="edicao" name="edicao" maxLength={50} defaultValue={inicial.edicao ?? "1"} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="dataPublicacao" className={labelCls}>Data de publicação</label>
                    <input id="dataPublicacao" name="dataPublicacao" type="date" defaultValue={inicial.dataPublicacao ? inicial.dataPublicacao.split("T")[0] : ""} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label htmlFor="direitosAutorais" className={labelCls}>Direitos autorais</label>
                  <textarea id="direitosAutorais" name="direitosAutorais" rows={3} maxLength={1000} defaultValue={inicial.direitosAutorais ?? ""} className={inputCls} placeholder="Ex: © 2024 Nome do Autor. Todos os direitos reservados." />
                </div>
              </div>
            )}

            {/* ABA CAPA */}
            {abaAtiva === "capa" && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="capaUrl" className={labelCls}>URL da capa</label>
                  <input id="capaUrl" name="capaUrl" maxLength={500} defaultValue={inicial.capaUrl ?? ""} className={inputCls} placeholder="https://... ou /uploads/capa/arquivo.jpg" />
                  <p className="mt-1 text-xs text-muted">URL pública da imagem da capa. Proporção recomendada: 1.6:1 (ex: 1600x2560px).</p>
                </div>
                {inicial.capaUrl && (
                  <div className="p-4 border border-line rounded-md bg-muted/30">
                    <p className="text-sm font-medium mb-2">Pré-visualização atual:</p>
                    <img src={inicial.capaUrl} alt="Capa da obra" className="max-w-xs h-auto rounded shadow" />
                  </div>
                )}
              </div>
            )}

            {feedback && <p className="text-sm text-muted">{feedback}</p>}

            <button type="submit" disabled={salvando} className={btnPrimario}>
              {salvando ? "Salvando…" : "Salvar dados"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
