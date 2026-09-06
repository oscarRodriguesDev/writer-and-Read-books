/**
 * Estado vazio com a composição cômica gerada no Gemini.
 * Centraliza o layout: imagem + mensagem opcional + ação opcional.
 */
export function EstadoVazio({
  src,
  alt,
  mensagem,
  acao,
}: {
  src: string;
  alt: string;
  mensagem?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-40 w-auto max-w-full object-contain opacity-90"
        loading="lazy"
      />
      {mensagem && <p className="text-sm text-muted">{mensagem}</p>}
      {acao}
    </div>
  );
}