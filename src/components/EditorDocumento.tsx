"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CapituloEditorDados } from "@/components/EditorCapitulo";
import { montarDocumento, parsearDocumento } from "@/lib/documentoCapitulo";
import { btnSecundario } from "@/components/ui";

type EstadoSave = "ocioso" | "salvando" | "salvo" | "erro";

const ROTULO_ESTADO: Record<EstadoSave, string> = {
  ocioso: "",
  salvando: "Salvando…",
  salvo: "Tudo salvo ✓",
  erro: "Erro ao salvar — o texto continua aqui",
};

const CORES_ESTADO: Record<EstadoSave, string> = {
  ocioso: "",
  salvando: "text-soft",
  salvo: "text-green-700",
  erro: "text-red-600",
};

/** Hash leve para só reenviar ao servidor o que mudou de fato. */
function hashTexto(texto: string): string {
  let h = 7;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
  return String(h);
}

const MARCAS_INSERIR = [
  "{inicio}",
  "{meio}",
  "{fim}",
  "[inicio]",
  "[meio]",
  "[fim]",
  "(cena 1)",
];

export function EditorDocumento({
  capitulo,
}: {
  capitulo: CapituloEditorDados;
}) {
  const textoRef = useRef<string>(montarDocumento(capitulo.partes));
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hashes = useRef(new Map<string, string>());
  const idsPorParte = useRef(new Map<string, string[]>());

  const [texto, setTexto] = useState(textoRef.current);
  const [estado, setEstado] = useState<EstadoSave>("ocioso");

  // Guarda o id de cada cena na posição atual do documento (para reusar no PUT)
  useEffect(() => {
    idsPorParte.current = new Map(
      capitulo.partes.map((parte) => [
        parte.id,
        parte.cenas.map((cena) => cena.id),
      ]),
    );
  }, [capitulo]);

  const executarSalvar = useCallback(async () => {
    const partesParse = parsearDocumento(textoRef.current);
    setEstado("salvando");
    let algumErro = false;

    for (const parte of capitulo.partes) {
      const parseada = partesParse.find((p) => p.tipo === parte.tipo);
      // Parte sem marcador `{...}` no texto não é tocada (não apaga por engano).
      if (!parseada) continue;

      const idsAtuais = idsPorParte.current.get(parte.id) ?? [];
      const cenas = parseada.cenas.map((cena, i) => ({
        cenaId: idsAtuais[i] ?? null,
        tipo: cena.tipo,
        titulo: cena.nome ? `cena ${cena.nome}` : null,
        conteudo: cena.conteudo,
      }));
      const chave = JSON.stringify(cenas);
      if (hashes.current.get(parte.id) === hashTexto(chave)) continue;

      try {
        const res = await fetch(`/api/partes/${parte.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cenas }),
        });
        if (!res.ok) throw new Error();
        const corpo = (await res.json()) as {
          cenas: Array<{ id: string; ordem: number }>;
        };
        idsPorParte.current.set(
          parte.id,
          corpo.cenas.map((c) => c.id),
        );
        hashes.current.set(parte.id, hashTexto(chave));
      } catch {
        algumErro = true;
      }
    }

    setEstado(algumErro ? "erro" : "salvo");
  }, [capitulo]);

  const agendarSalvar = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setEstado("salvando");
    timerRef.current = setTimeout(() => void executarSalvar(), 1300);
  }, [executarSalvar]);

  function aoMudar(novo: string) {
    textoRef.current = novo;
    setTexto(novo);
    agendarSalvar();
  }

  function inserirMarcador(valor: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const inicio = ta.selectionStart;
    const fim = ta.selectionEnd;
    const atual = textoRef.current;
    aoMudar(atual.slice(0, inicio) + valor + atual.slice(fim));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = inicio + valor.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div className="editor-documento">
      <div className="documento-ajuda">
        <span className="documento-ajuda-titulo">Inserir:</span>
        {MARCAS_INSERIR.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => inserirMarcador(m)}
            className={btnSecundario}
          >
            {m}
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={texto}
        onChange={(e) => aoMudar(e.target.value)}
        className="documento-texto"
        aria-label="Documento do capítulo"
        spellCheck={false}
        placeholder={
          "Escreva o capítulo de ponta a ponta.\n\n" +
          "{inicio}, {meio} e {fim} dividem as partes do capítulo;\n" +
          "[inicio], [meio] e [fim] organizam a escrita dentro de cada parte;\n" +
          "(cena 1), (cena A)… marcam cada cena — o texto depois dela pertence a ela."
        }
      />
      <div className="documento-rodape">
        <span className={`text-sm ${CORES_ESTADO[estado]}`}>
          {ROTULO_ESTADO[estado]}
        </span>
        <span className="documento-dica">
          {"{inicio}/{meio}/{fim}"} = partes · {"[inicio]/[meio]/[fim]"} =
          organização da escrita · {"(cena 1)"} = cena
        </span>
      </div>
    </div>
  );
}