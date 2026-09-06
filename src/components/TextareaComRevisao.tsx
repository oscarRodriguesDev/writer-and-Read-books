"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import type { ErroRevisao } from "@/lib/revisao/types";
import { PopupSugestoes, type PosicaoPopup } from "./PopupSugestoes";

type Props = {
  value: string;
  erros: ErroRevisao[];
  onChangeTexto: (texto: string) => void;
  aoSubstituir: (inicio: number, fim: number, sugestao: string) => void;
  aoIgnorar: (erro: ErroRevisao) => void;
  aoAdicionarDicionario?: (palavra: string) => void;
  podeAdicionarDicionario?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
};

/** Largura real da scrollbar do sistema (div temporária com overflow). */
function medirLarguraScrollbarSistema(): number {
  if (typeof document === "undefined") return 0;
  const d = document.createElement("div");
  d.style.cssText =
    "position:absolute;top:-9999px;left:-9999px;width:100px;height:100px;overflow:scroll;visibility:hidden;";
  document.body.appendChild(d);
  const largura = d.offsetWidth - d.clientWidth;
  d.remove();
  return largura;
}

/** Mensagem exibida no tooltip ao passar o mouse sobre um trecho marcado. */
function textoMotivo(e: ErroRevisao): string {
  if (e.tipo === "ORTOGRAFICO") {
    const sug = e.sugestoes[0];
    return sug
      ? `Erro de ortografia — sugestão: “${sug}”`
      : "Erro de ortografia (palavra fora do dicionário)";
  }
  const cat = e.categoria ? `${e.categoria} — ` : "";
  const expl = e.explicacao ? e.explicacao : "Erro gramatical";
  const sug = e.sugestoes[0] ? ` Sugestão: “${e.sugestoes[0]}”.` : "";
  return `${cat}${expl}${sug}`;
}

function renderizarMarcas(texto: string, erros: ErroRevisao[]) {
  const nos: ReactNode[] = [];
  // Só desenha a marca quando o trecho AINDA está exatamente no offset
  // informado. Erros com offset defasado (enquanto a re-verificação não
  // chega após editar) são pulados para nunca sublinhar palavras erradas.
  const ordenados = erros
    .filter(
      (e) =>
        e.inicio >= 0 &&
        e.fim <= texto.length &&
        texto.slice(e.inicio, e.fim) === e.trecho,
    )
    .sort((a, b) => a.inicio - b.inicio || b.fim - a.fim);
  let cursor = 0;
  for (const e of ordenados) {
    if (e.inicio < cursor) continue; // sobreposto/duplicado
    if (e.inicio > cursor) nos.push(texto.slice(cursor, e.inicio));
    nos.push(
      <span
        key={`${e.tipo}-${e.inicio}`}
        data-inicio={e.inicio}
        className={e.tipo === "ORTOGRAFICO" ? "marca-ortografia" : "marca-gramatica"}
      >
        {texto.slice(e.inicio, e.fim)}
      </span>,
    );
    cursor = e.fim;
  }
  if (cursor < texto.length) nos.push(texto.slice(cursor));
  return nos;
}

/**
 * Textarea com corretor visual (sublinhado ondulado vermelho/azul) e popup de
 * sugestões estilo Android. O texto real e o caret ficam no textarea; um
 * espelho sem interação atrás dele desenha os sublinhados nas mesmas posições.
 */
export function TextareaComRevisao({
  value,
  erros,
  onChangeTexto,
  aoSubstituir,
  aoIgnorar,
  aoAdicionarDicionario,
  podeAdicionarDicionario = true,
  placeholder,
  ariaLabel,
  className = "",
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const espelhoRef = useRef<HTMLDivElement>(null);
  const [larguraScrollbar, setLarguraScrollbar] = useState(0);
  const [erroAberto, setErroAberto] = useState<ErroRevisao | null>(null);
  const [posicaoPopup, setPosicaoPopup] = useState<PosicaoPopup | null>(null);
  const [erroHover, setErroHover] = useState<ErroRevisao | null>(null);
  const [posicaoTooltip, setPosicaoTooltip] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const rAFHover = useRef<number | null>(null);

  // Mede a scrollbar do sistema UMA vez. O textarea reserva esse espaço
  // sempre (`scrollbar-gutter: stable`), então o espelho compensa de forma
  // estável: quebras de linha batem com o texto real mesmo quando a barra de
  // rolagem aparece/some durante a digitação.
  useEffect(() => {
    setLarguraScrollbar(medirLarguraScrollbarSistema());
  }, []);

  // Fecha o popup quando o texto muda (os erros/layout antigos ficam inválidos).
  useEffect(() => {
    setErroAberto(null);
    setPosicaoPopup(null);
    setErroHover(null);
    setPosicaoTooltip(null);
  }, [value]);

  // Cancela o hit-test agendado de hover ao desmontar.
  useEffect(() => {
    return () => {
      if (rAFHover.current != null) cancelAnimationFrame(rAFHover.current);
    };
  }, []);

  function sincronizarScroll() {
    if (!espelhoRef.current || !textareaRef.current) return;
    espelhoRef.current.scrollTop = textareaRef.current.scrollTop;
    espelhoRef.current.scrollLeft = textareaRef.current.scrollLeft;
  }

  /**
   * O mouse está sempre sobre o textarea (o espelho está atrás e sem
   * interação). Para saber se o ponteiro está sobre uma marca, fazemos
   * hit-test com os rects dos spans do espelho (mesmo layout do textarea),
   * throttled via requestAnimationFrame.
   */
  function aoMoverMouse(x: number, y: number) {
    if (rAFHover.current != null) return;
    rAFHover.current = requestAnimationFrame(() => {
      rAFHover.current = null;
      const espelho = espelhoRef.current;
      if (!espelho) return;
      let achado: ErroRevisao | null = null;
      for (const span of espelho.querySelectorAll<HTMLElement>("[data-inicio]")) {
        const rect = span.getBoundingClientRect();
        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          const inicio = Number(span.dataset.inicio);
          achado = erros.find((er) => er.inicio === inicio) ?? null;
          break;
        }
      }
      setErroHover(achado);
      let top = y + 12;
      let left = x + 10;
      if (left + 280 > window.innerWidth) left = window.innerWidth - 280 - 8;
      if (top + 70 > window.innerHeight) top = Math.max(4, y - 70 - 8);
      setPosicaoTooltip({ top, left });
    });
  }

  function abrirPopupParaOffset(offset: number) {
    const erro = erros.find((e) => e.inicio <= offset && offset < e.fim);
    if (!erro || !espelhoRef.current) return;
    const alvo = espelhoRef.current.querySelector(
      `[data-inicio="${erro.inicio}"]`,
    );
    if (!alvo) return;
    const rect = (alvo as HTMLElement).getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + 4;
    if (left + 288 > window.innerWidth) left = window.innerWidth - 288 - 8;
    if (top + 240 > window.innerHeight) top = Math.max(4, rect.top - 244);
    setErroAberto(erro);
    setPosicaoPopup({ top, left });
  }

  function substituir(inicio: number, fim: number, sugestao: string) {
    aoSubstituir(inicio, fim, sugestao);
    setErroAberto(null);
    setPosicaoPopup(null);
  }

  const estiloEspelho: CSSProperties = {
    paddingRight: `calc(0.5rem + ${larguraScrollbar}px)`,
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Espelho (atrás): desenha o texto com as marcas, sem interação. */}
      <div
        ref={espelhoRef}
        aria-hidden="true"
        className="revisao-espelho text-sm leading-relaxed"
        style={estiloEspelho}
      >
        {renderizarMarcas(value, erros)}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChangeTexto(e.target.value)}
        onClick={(e) => abrirPopupParaOffset(e.currentTarget.selectionStart)}
        onScroll={sincronizarScroll}
        onMouseMove={(e) => aoMoverMouse(e.clientX, e.clientY)}
        onMouseLeave={() => {
          setErroHover(null);
          setPosicaoTooltip(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setErroAberto(null);
            setPosicaoPopup(null);
          }
        }}
        rows={8}
        placeholder={placeholder}
        aria-label={ariaLabel}
        spellCheck={false}
        className={`w-full resize-y rounded-md border border-line bg-transparent p-2 text-sm leading-relaxed text-foreground outline-none focus:border-faint textarea-revisao ${className}`}
      />

      {/* Tooltip com o motivo do sublinhado (hover). */}
      {erroHover && posicaoTooltip && (
        <div
          role="tooltip"
          className="revisao-tooltip"
          style={{
            top: posicaoTooltip.top,
            left: posicaoTooltip.left,
            maxWidth: 280,
          }}
        >
          {textoMotivo(erroHover)}
        </div>
      )}

      {/* Popup de sugestões (estilo Android). */}
      {erroAberto && posicaoPopup && (
        <PopupSugestoes
          erro={erroAberto}
          posicao={posicaoPopup}
          podeAdicionarDicionario={podeAdicionarDicionario}
          aoSubstituir={(sugestao) =>
            substituir(
              erroAberto.inicio,
              erroAberto.fim,
              sugestao,
            )
          }
          aoIgnorar={() => {
            aoIgnorar(erroAberto);
            setErroAberto(null);
            setPosicaoPopup(null);
          }}
          aoAdicionarDicionario={() => {
            aoAdicionarDicionario?.(erroAberto.trecho);
            setErroAberto(null);
            setPosicaoPopup(null);
          }}
          aoFechar={() => {
            setErroAberto(null);
            setPosicaoPopup(null);
          }}
        />
      )}
    </div>
  );
}