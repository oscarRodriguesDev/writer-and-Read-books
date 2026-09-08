"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TipTapLink from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { ROTULO_PARTE } from "@/lib/constants";
import type { ParteTipo } from "@/lib/constants";
import { btnSecundario } from "@/components/ui";
import type { CapituloEditorDados } from "@/components/EditorCapitulo";
import { textoParaHtml } from "@/lib/html";

type EstadoSave = "ocioso" | "salvando" | "salvo" | "erro";

const clsFerramenta = (ativo: boolean) =>
  `rounded-md px-2 py-1.5 text-sm leading-none transition-colors ${
    ativo
      ? "bg-accent text-onaccent"
      : "bg-transparent text-soft hover:bg-hoverbg"
  }`;

const SEPARADOR_FERRAMENTA = (
  <span className="mx-1 block h-5 w-px bg-line" aria-hidden />
);

function BarraFerramentas({ editor }: { editor: Editor }) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-elevated px-3 py-1.5">
      <button
        type="button"
        title="Negrito"
        className={clsFerramenta(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <b>B</b>
      </button>
      <button
        type="button"
        title="Itálico"
        className={clsFerramenta(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <i>I</i>
      </button>
      <button
        type="button"
        title="Sublinhado"
        className={clsFerramenta(editor.isActive("underline"))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <u>U</u>
      </button>
      <button
        type="button"
        title="Riscado"
        className={clsFerramenta(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </button>
      <button
        type="button"
        title="Código"
        className={clsFerramenta(editor.isActive("code"))}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {"</>"}
      </button>
      <button
        type="button"
        title="Link"
        className={clsFerramenta(editor.isActive("link"))}
        onClick={() => {
          const atual =
            editor.getAttributes("link").href ??
            "";
          const href = window.prompt("Endereço do link:", atual);
          if (href === null) return;
          if (href.trim() === "")
            return editor.chain().focus().extendMarkRange("link").unsetLink().run();
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: href.trim() })
            .run();
        }}
      >
        🔗
      </button>

      {SEPARADOR_FERRAMENTA}

      <button
        type="button"
        title="Título"
        className={clsFerramenta(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <button
        type="button"
        title="Subtítulo"
        className={clsFerramenta(editor.isActive("heading", { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </button>
      <button
        type="button"
        title="Lista"
        className={clsFerramenta(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • Lista
      </button>
      <button
        type="button"
        title="Lista numerada"
        className={clsFerramenta(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. Lista
      </button>
      <button
        type="button"
        title="Citação"
        className={clsFerramenta(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❝
      </button>

      {SEPARADOR_FERRAMENTA}

      <button
        type="button"
        title="Alinhar à esquerda"
        className={clsFerramenta(editor.isActive({ textAlign: "left" }))}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        ←
      </button>
      <button
        type="button"
        title="Centralizar"
        className={clsFerramenta(editor.isActive({ textAlign: "center" }))}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        ⇔
      </button>
      <button
        type="button"
        title="Alinhar à direita"
        className={clsFerramenta(editor.isActive({ textAlign: "right" }))}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        →
      </button>
      <button
        type="button"
        title="Justificar"
        className={clsFerramenta(editor.isActive({ textAlign: "justify" }))}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        ≡
      </button>

      {SEPARADOR_FERRAMENTA}

      <button
        type="button"
        title="Desfazer"
        className={clsFerramenta(false)}
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↩
      </button>
      <button
        type="button"
        title="Refazer"
        className={clsFerramenta(false)}
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↪
      </button>
    </div>
  );
}

function EditorDeCena({
  cenaId,
  conteudoInicial,
  onMudar,
}: {
  cenaId: string;
  conteudoInicial: string;
  onMudar: (cenaId: string, html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TipTapLink.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Placeholder.configure({ placeholder: "Escreva esta cena…" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: textoParaHtml(conteudoInicial),
    editorProps: {
      attributes: { class: "tiptap min-h-28 px-4 py-3" },
    },
    onUpdate: ({ editor: atual }) => onMudar(cenaId, atual.getHTML()),
  });

  if (!editor) return null;
  return (
    <div className="editor-documento">
      <BarraFerramentas editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

type CenaDoc = {
  id: string;
  tipo: string;
  ordem: number;
  titulo: string | null;
  objetivo: string | null;
};

type ParteDoc = { id: string; tipo: string; cenas: CenaDoc[] };

/**
 * Modo "documento contínuo": lista as partes por ordem, cada cena como um
 * bloco com delimitador e editor rico (TipTap), com autosave por cena e
 * criação/remoção de cenas direto no texto.
 */
export function EditorDocumento({
  capitulo,
}: {
  capitulo: CapituloEditorDados;
}) {
  const [partes, setPartes] = useState<ParteDoc[]>(() =>
    capitulo.partes.map((p) => ({
      id: p.id,
      tipo: p.tipo,
      cenas: p.cenas.map((c) => ({
        id: c.id,
        tipo: c.tipo,
        ordem: c.ordem,
        titulo: c.titulo,
        objetivo: c.objetivo,
      })),
    })),
  );

  const conteudos = useRef<Map<string, string>>(new Map());
  if (conteudos.current.size === 0) {
    for (const p of capitulo.partes)
      for (const c of p.cenas) conteudos.current.set(c.id, c.conteudo);
  }

  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pendentes = useRef(0);
  const [salvo, setSalvo] = useState<EstadoSave>("ocioso");

  function agendarSalvar(cenaId: string, html: string) {
    conteudos.current.set(cenaId, html);
    clearTimeout(timers.current.get(cenaId));
    timers.current.set(
      cenaId,
      setTimeout(async () => {
        pendentes.current++;
        setSalvo("salvando");
        try {
          const res = await fetch(`/api/cenas/${cenaId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conteudo: html }),
          });
          if (!res.ok) throw new Error("Falha ao salvar a cena.");
        } catch {
          setSalvo("erro");
          pendentes.current--;
          return;
        }
        pendentes.current--;
        setSalvo(pendentes.current === 0 ? "salvo" : "salvando");
      }, 1200),
    );
  }

  async function criarCena(parteId: string) {
    const res = await fetch("/api/cenas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parteId }),
    });
    if (!res.ok) {
      const corpo = (await res.json().catch(() => null)) as
        | { erro?: string }
        | null;
      throw new Error(corpo?.erro ?? "Falha ao criar cena.");
    }
    const nova = (await res.json()) as { id: string; tipo: string; ordem: number };
    setPartes((prev) =>
      prev.map((p) =>
        p.id === parteId
          ? { ...p, cenas: [...p.cenas, { id: nova.id, tipo: nova.tipo, ordem: nova.ordem, titulo: null, objetivo: null }] }
          : p,
      ),
    );
  }

  async function removerCena(parteId: string, cenaId: string) {
    if (!window.confirm("Excluir esta cena?")) return;
    const res = await fetch(`/api/cenas/${cenaId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Falha ao excluir a cena.");
    conteudos.current.delete(cenaId);
    setPartes((prev) =>
      prev.map((p) =>
        p.id === parteId
          ? { ...p, cenas: p.cenas.filter((c) => c.id !== cenaId).map((c, i) => ({ ...c, ordem: i + 1 })) }
          : p,
      ),
    );
  }

  const estadoSalvo =
    salvo === "salvando"
      ? { texto: "Salvando…", cls: "text-soft" }
      : salvo === "erro"
        ? { texto: "Erro ao salvar", cls: "text-danger" }
        : salvo === "salvo"
          ? { texto: "Salvo ✓", cls: "text-success" }
          : { texto: "", cls: "" };

  return (
    <div className="editor-documento">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            Cada bloco é uma cena — adicione ou remova com os controles.
          </span>
          <span className={`text-sm ${estadoSalvo.cls}`}>{estadoSalvo.texto}</span>
        </div>
      </div>

      <div className="space-y-6">
        {partes.map((parte, idxParte) => {
          const rotuloParte =
            ROTULO_PARTE[parte.tipo as ParteTipo] ?? parte.tipo;
          return (
            <section key={parte.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-chipbg px-3 py-1 text-sm font-semibold text-soft">
                  PARTE {idxParte + 1} · {rotuloParte}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <div className="space-y-5">
                {parte.cenas.map((cena, idxCena) => {
                  const rotuloLegado =
                    cena.tipo === "INICIO"
                      ? "· Início"
                      : cena.tipo === "MEIO"
                        ? "· Meio"
                        : cena.tipo === "FIM"
                          ? "· Fim"
                          : "";
                  return (
                    <div
                      key={cena.id}
                      className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-line bg-hoverbg px-4 py-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Cena {idxCena + 1} {rotuloLegado}
                        </span>
                        <div className="flex items-center gap-3">
                          {cena.objetivo?.trim() ? (
                            <span
                              className="max-w-sm truncate text-xs italic text-soft"
                              title={`Objetivo: ${cena.objetivo}`}
                            >
                              {cena.objetivo}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            title="Excluir cena"
                            className="rounded-md px-2 py-1 text-xs text-danger hover:bg-danger-light"
                            onClick={() => removerCena(parte.id, cena.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                      <EditorDeCena
                        cenaId={cena.id}
                        conteudoInicial={conteudos.current.get(cena.id) ?? ""}
                        onMudar={agendarSalvar}
                      />
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className={`${btnSecundario} text-sm`}
                onClick={() => criarCena(parte.id)}
              >
                + Adicionar cena
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}