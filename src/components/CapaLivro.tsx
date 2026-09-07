interface CapaLivroProps {
  titulo?: string;
  autor?: string | null;
  genero?: string;
  /** URL definida pelo usuário; quando ausente, renderiza a capa default em CSS. */
  capaUrl?: string | null;
  className?: string;
  /** Versão condensada para cards pequenos (grids com 4–5 colunas). */
  compacto?: boolean;
}

/**
 * Capa de livro: se o usuário definiu uma imagem, mostra a foto;
 * caso contrário, desenha uma capa default só com CSS (proporção 2:3,
 * lombada, brilho diagonal, textura e filetes dourados).
 */
export function CapaLivro({ titulo, autor, genero, capaUrl, className = "w-44", compacto = false }: CapaLivroProps) {
  if (capaUrl) {
    return (
      <div className={`${className} overflow-hidden rounded-r-lg border border-line bg-surface shadow-lg`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={capaUrl} alt={`Capa de ${titulo || "obra"}`} className="aspect-[2/3] w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${className} overflow-hidden rounded-r-lg shadow-xl`} style={{ aspectRatio: "2 / 3" }}>
      <div className="relative flex h-full w-full flex-col bg-gradient-to-br from-sky-900 via-indigo-900 to-slate-950 text-white">
        {/* brilho diagonal (luz vinda do canto superior esquerdo) */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0)_40%)]" />

        {/* textura fina pontilhada */}
        <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:13px_13px]" />

        {/* lombada: dobra escura à esquerda com brilho de vinco */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[10px] bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-[10px] w-px bg-white/15" />

        {/* filetes dourados superior e inferior */}
        <div
          className={`absolute inset-x-0 border-t border-amber-200/50 ${
            compacto ? "top-1.5 mx-3" : "top-2 mx-5"
          }`}
        />
        <div
          className={`absolute inset-x-0 border-t border-amber-200/50 ${
            compacto ? "bottom-1.5 mx-3" : "bottom-2 mx-5"
          }`}
        />

        {/* miolo: gênero, título, ornamento */}
        <div className={`flex flex-1 flex-col items-center justify-center gap-2.5 text-center ${compacto ? "px-4" : "px-6"}`}>
          {genero && (
            <p className={`font-semibold uppercase tracking-[0.3em] text-amber-100/80 ${compacto ? "text-[8px]" : "text-[9px]"}`}>
              {genero}
            </p>
          )}
          {genero && <div className="h-px w-8 bg-amber-200/60" />}
          <h2
            className={`line-clamp-5 font-serif font-bold leading-snug drop-shadow-md ${
              compacto ? "text-base" : "text-lg"
            }`}
          >
            {titulo || "Sem título"}
          </h2>
          <span className="inline-block h-1.5 w-1.5 rotate-45 bg-amber-200/80" />
        </div>

        {/* rodapé com o autor */}
        <div className={compacto ? "px-5 pb-3" : "px-7 pb-5"}>
          <div className="border-t border-amber-200/30 pt-2 text-center">
            <p className={`line-clamp-1 font-serif italic text-amber-50/90 ${compacto ? "text-[10px]" : "text-xs"}`}>
              {autor || "Autor desconhecido"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}