"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TipTapLink from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { DOMSerializer, Fragment, type Node as PMNode } from "@tiptap/pm/model";
import { ROTULO_PARTE, type ParteTipo } from "@/lib/constants";
import { textoParaHtml } from "@/lib/html";
import type { CapituloEditorDados } from "@/components/EditorCapitulo";

type EstadoSave = "ocioso" | "salvando" | "salvo" | "erro";

/** Cenas ainda não persistidas no banco fogem com este prefixo em `cenaId`. */
const PREFIXO_TMP = "tmp-";

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
          const atual = editor.getAttributes("link").href ?? "";
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

/* ---------------------------------------------------------------------------
   Hash leve para saber quais cenas mudaram (evita reenvio de tudo a cada pausa)
   --------------------------------------------------------------------------- */

function hashTexto(texto: string): string {
  let h = 7;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
  return String(h);
}

/* ---------------------------------------------------------------------------
   Nós custom: anotações travadas dentro do documento
   --------------------------------------------------------------------------- */

/** Anotação de parte (escrita no documento, não-editável): INÍCIO / MEIO / FIM. */
function marcaParteNode() {
  return Node.create({
    name: "marcaParte",
    group: "block",
    atom: true,
    selectable: false,
    draggable: false,
    addAttributes: () => ({
      parteId: { default: "" },
      tipo: { default: "INICIO" },
    }),
    parseHTML: () => [
      {
        tag: "div[data-marca-part]",
        getAttrs: (el) => ({
          parteId: (el as HTMLElement).getAttribute("data-parte-id") ?? "",
          tipo: (el as HTMLElement).getAttribute("data-marca-part") ?? "INICIO",
        }),
      },
    ],
    renderHTML: ({ node, HTMLAttributes }) => [
      "div",
      {
        ...HTMLAttributes,
        "data-marca-part": node.attrs.tipo,
        "data-parte-id": node.attrs.parteId,
        class: "marca-parte",
      },
      "·",
    ],
    addNodeView() {
      return ({ node }: { node: PMNode }) => {
        const dom = document.createElement("div");
        dom.className = "marca-parte";
        dom.contentEditable = "false";
        const rotulo = document.createElement("span");
        rotulo.className = "marca-rotulo";
        const attrs = {
          parteId: node.attrs.parteId ?? "",
          tipo: node.attrs.tipo ?? "INICIO",
        };
        const atualizar = () => {
          rotulo.textContent = (
            ROTULO_PARTE[attrs.tipo as ParteTipo] ?? attrs.tipo
          ).toUpperCase();
        };
        atualizar();
        dom.setAttribute("data-marca-part", attrs.tipo);
        dom.setAttribute("data-parte-id", attrs.parteId);
        dom.appendChild(rotulo);
        return {
          dom,
          ignoreMutation: () => true,
          stopEvent: () => true,
          update: (novo: PMNode) => {
            if (
              novo.attrs.tipo !== attrs.tipo ||
              novo.attrs.parteId !== attrs.parteId
            ) {
              attrs.tipo = novo.attrs.tipo;
              attrs.parteId = novo.attrs.parteId;
              atualizar();
            }
            return true;
          },
        };
      };
    },
  });
}

/** Anotação de cena (não-editável) + botões "+" (adicionar) e "−" (excluir). */
function marcaCenaNode(deps: {
  onAdicionar: (parteId: string) => void;
  onRemover: (cenaId: string, parteId: string) => void;
}) {
  return Node.create({
    name: "marcaCena",
    group: "block",
    atom: true,
    selectable: false,
    draggable: false,
    addAttributes: () => ({
      cenaId: { default: "" },
      parteId: { default: "" },
      numero: { default: 1 },
    }),
    parseHTML: () => [
      {
        tag: "div[data-marca-cena]",
        getAttrs: (el) => ({
          cenaId: (el as HTMLElement).getAttribute("data-marca-cena") ?? "",
          parteId: (el as HTMLElement).getAttribute("data-parte-id") ?? "",
          numero:
            parseInt(
              (el as HTMLElement).getAttribute("data-numero") ?? "1",
              10,
            ) || 1,
        }),
      },
    ],
    renderHTML: ({ node, HTMLAttributes }) => [
      "div",
      {
        ...HTMLAttributes,
        "data-marca-cena": node.attrs.cenaId,
        "data-parte-id": node.attrs.parteId,
        "data-numero": node.attrs.numero,
        class: "marca-cena",
      },
      "CENA",
    ],
    addNodeView() {
      return ({ node }: { node: PMNode }) => {
        const dom = document.createElement("div");
        dom.className = "marca-cena";
        dom.contentEditable = "false";
        const rotulo = document.createElement("span");
        rotulo.className = "marca-rotulo";
        const botaoMais = document.createElement("button");
        botaoMais.type = "button";
        botaoMais.className = "marca-btn marca-btn-add";
        botaoMais.title = "Adicionar cena no fim desta parte";
        botaoMais.textContent = "+";
        const botaoMenos = document.createElement("button");
        botaoMenos.type = "button";
        botaoMenos.className = "marca-btn marca-btn-del";
        botaoMenos.title = "Excluir esta cena";
        botaoMenos.textContent = "−";
        const attrs = {
          cenaId: node.attrs.cenaId ?? "",
          parteId: node.attrs.parteId ?? "",
          numero: node.attrs.numero ?? 1,
        };
        const atualizar = () => {
          rotulo.textContent = `CENA ${attrs.numero}`;
        };
        atualizar();
        botaoMais.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          deps.onAdicionar(attrs.parteId);
        });
        botaoMenos.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          deps.onRemover(attrs.cenaId, attrs.parteId);
        });
        dom.appendChild(botaoMais);
        dom.appendChild(rotulo);
        dom.appendChild(botaoMenos);
        return {
          dom,
          ignoreMutation: () => true,
          stopEvent: () => true,
          update: (novo: PMNode) => {
            if (novo.attrs.numero !== attrs.numero) {
              attrs.numero = novo.attrs.numero;
              atualizar();
            }
            return true;
          },
        };
      };
    },
  });
}

/* ---------------------------------------------------------------------------
   Montagem, leitura e manipulação da estrutura do documento
   --------------------------------------------------------------------------- */

function montarHtmlDocumento(
  capitulo: CapituloEditorDados,
  conteudos: Map<string, string>,
): string {
  return capitulo.partes
    .map((parte) => {
      const blocos = parte.cenas.map((cena, i) => {
        const corpo = conteudos.get(cena.id) ?? "";
        const marca = `<div data-marca-cena="${cena.id}" data-parte-id="${parte.id}" data-numero="${i + 1}"></div>`;
        return `${marca}\n${corpo || "<p></p>"}`;
      });
      return `<div data-marca-part="${parte.tipo}" data-parte-id="${parte.id}"></div>\n${blocos.join("\n")}`;
    })
    .join("\n");
}

type CenaColetada = { cenaId: string; parteId: string; html: string };

/** Lê o documento atual e devolve, para cada cena, seu HTML (sem as marcas). */
function coletarCenas(editor: Editor): CenaColetada[] {
  const cenas: CenaColetada[] = [];
  let cenaAtual: string | null = null;
  let parteIdAtual = "";
  let nodesCena: PMNode[] = [];
  let refugo: PMNode[] = [];

  const fecharCena = () => {
    if (cenaAtual == null) return;
    const todos = refugo.length ? [...refugo, ...nodesCena] : nodesCena;
    refugo = [];
    nodesCena = [];
    let html = "";
    if (todos.length) {
      const fragmento = DOMSerializer.fromSchema(editor.schema).serializeFragment(
        Fragment.fromArray(todos),
      );
      const caixa = document.createElement("div");
      caixa.appendChild(fragmento);
      html = caixa.innerHTML.trim();
    }
    if (html.replace(/<[^>]+>/g, "").trim() === "") html = "";
    cenas.push({ cenaId: cenaAtual, parteId: parteIdAtual, html });
    cenaAtual = null;
  };

  editor.state.doc.forEach((node) => {
    if (node.type.name === "marcaParte") {
      if (cenaAtual) fecharCena();
      parteIdAtual = node.attrs.parteId ?? "";
      refugo = [];
      return;
    }
    if (node.type.name === "marcaCena") {
      if (cenaAtual) fecharCena();
      cenaAtual = node.attrs.cenaId ?? "";
      nodesCena = [];
      return;
    }
    if (cenaAtual) nodesCena.push(node);
    else if (parteIdAtual) refugo.push(node);
  });
  if (cenaAtual) fecharCena();
  return cenas;
}

function posDaMarcaCena(editor: Editor, cenaId: string): number | null {
  let pos: number | null = null;
  editor.state.doc.descendants((node, p) => {
    if (node.type.name === "marcaCena" && node.attrs.cenaId === cenaId) {
      pos = p;
      return false;
    }
    return true;
  });
  return pos;
}

/** Renumera as anotações CENA N dentro de cada parte, na ordem do documento. */
function renumerarMarcas(editor: Editor) {
  const tr = editor.state.tr;
  let contagem: number | null = null;
  editor.state.doc.forEach((node, offset) => {
    if (node.type.name === "marcaParte") {
      contagem = 0;
      return;
    }
    if (node.type.name === "marcaCena" && contagem != null) {
      contagem++;
      if (node.attrs.numero !== contagem) {
        tr.setNodeMarkup(offset, undefined, { ...node.attrs, numero: contagem });
      }
    }
  });
  if (tr.docChanged) editor.view.dispatch(tr);
}

/** Posição logo após a última marca/parágrafo de uma parte (para inserir ao fim). */
function posFimDaParte(editor: Editor, parteId: string): number | null {
  let fim: number | null = null;
  editor.state.doc.forEach((node, offset) => {
    if (node.type.name === "marcaParte") {
      fim = node.attrs.parteId === parteId ? offset + node.nodeSize : null;
      return;
    }
    if (fim != null) fim = offset + node.nodeSize;
  });
  return fim;
}

/** Posição após o conteúdo da cena que começa em `posMarca` (até a próxima marca). */
function fimConteudoCena(editor: Editor, posMarca: number): number {
  const doc = editor.state.doc;
  const nodeNaMarca = doc.nodeAt(posMarca);
  const inicio = posMarca + (nodeNaMarca ? nodeNaMarca.nodeSize : 1);
  let fim = inicio;
  let p = inicio;
  while (p < doc.content.size) {
    const node = doc.nodeAt(p);
    if (!node) break;
    if (node.type.name.startsWith("marca")) break;
    fim = p + node.nodeSize;
    p = fim;
  }
  return fim;
}

/* ---------------------------------------------------------------------------
   API
   --------------------------------------------------------------------------- */

async function criarCenaApi(parteId: string): Promise<{ id: string }> {
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
  return (await res.json()) as { id: string };
}

async function salvarCenaApi(cenaId: string, conteudo: string): Promise<void> {
  const res = await fetch(`/api/cenas/${cenaId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conteudo }),
  });
  if (!res.ok) throw new Error("Falha ao salvar a cena.");
}

function trocarIdDaMarca(editor: Editor, de: string, para: string) {
  const pos = posDaMarcaCena(editor, de);
  if (pos == null) return;
  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "marcaCena") return;
  const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    cenaId: para,
  });
  editor.view.dispatch(tr);
}

/* ---------------------------------------------------------------------------
   Componente
   --------------------------------------------------------------------------- */

export function EditorDocumento({
  capitulo,
}: {
  capitulo: CapituloEditorDados;
}) {
  const editorRef = useRef<Editor | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hashes = useRef(new Map<string, string>());
  const [estado, setEstado] = useState<EstadoSave>("ocioso");

  const conteudoInicial = useMemo(() => {
    const conteudos = new Map<string, string>();
    for (const parte of capitulo.partes)
      for (const cena of parte.cenas)
        conteudos.set(cena.id, textoParaHtml(cena.conteudo));
    for (const [id, html] of conteudos) hashes.current.set(id, hashTexto(html));
    return montarHtmlDocumento(capitulo, conteudos);
  }, [capitulo]);

  const executarSalvar = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setEstado("salvando");
    try {
      for (const cena of coletarCenas(editor)) {
        let id = cena.cenaId;
        if (id.startsWith(PREFIXO_TMP)) {
          const nova = await criarCenaApi(cena.parteId);
          id = nova.id;
          trocarIdDaMarca(editor, cena.cenaId, id);
        }
        const hash = hashTexto(cena.html);
        if (hashes.current.get(id) === hash) continue;
        await salvarCenaApi(id, cena.html);
        hashes.current.set(id, hash);
      }
      setEstado("salvo");
    } catch {
      setEstado("erro");
    }
  }, []);

  const agendarSalvar = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void executarSalvar();
    }, 1200);
  }, [executarSalvar]);

  const adicionarCena = useCallback(
    (parteId: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      const fim = posFimDaParte(editor, parteId);
      if (fim == null) return;
      const tmpId = `${PREFIXO_TMP}${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const marca = editor.schema.nodes.marcaCena.create({
        cenaId: tmpId,
        parteId,
        numero: 0,
      });
      const paragrafo = editor.schema.nodes.paragraph.create();
      editor.chain().focus().insertContentAt(fim, [marca, paragrafo]).run();
      renumerarMarcas(editor);
      agendarSalvar();
    },
    [agendarSalvar],
  );

  const removerCena = useCallback(
    async (cenaId: string, parteId: string) => {
      if (!window.confirm("Excluir esta cena e todo o texto dela?")) return;
      const editor = editorRef.current;
      if (!editor) return;
      const pos = posDaMarcaCena(editor, cenaId);
      if (pos == null) return;
      const fim = fimConteudoCena(editor, pos);
      editor.chain().focus().deleteRange({ from: pos, to: fim }).run();
      renumerarMarcas(editor);
      hashes.current.delete(cenaId);
      try {
        await fetch(`/api/cenas/${cenaId}`, { method: "DELETE" });
      } catch {
        /* o próximo ciclo de salvamento reenviará o estado do documento */
      }
      agendarSalvar();
    },
    [agendarSalvar],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TipTapLink.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Placeholder.configure({ placeholder: "Escreva a cena…" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      marcaParteNode(),
      marcaCenaNode({
        onAdicionar: (parteId) => adicionarCena(parteId),
        onRemover: (cenaId, parteId) => void removerCena(cenaId, parteId),
      }),
    ],
    content: conteudoInicial,
    editorProps: {
      attributes: { class: "documento-area" },
    },
    onUpdate: () => agendarSalvar(),
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const estadoSalvo =
    estado === "salvando"
      ? { texto: "Salvando…", cls: "text-soft" }
      : estado === "erro"
        ? { texto: "Erro ao salvar", cls: "text-danger" }
        : estado === "salvo"
          ? { texto: "Salvo ✓", cls: "text-success" }
          : { texto: "", cls: "" };

  if (!editor) return null;

  return (
    <div className="editor-documento">
      <BarraFerramentas editor={editor} />
      <div className="documento-folha">
        <EditorContent editor={editor} />
      </div>
      <div className="documento-rodape">
        <span className={`text-sm ${estadoSalvo.cls}`}>{estadoSalvo.texto}</span>
        <span className="documento-dica">
          As anotações de parte e de cena são fixas — escreva entre elas. Use
          o “+” para acrescentar cenas.
        </span>
      </div>
    </div>
  );
}