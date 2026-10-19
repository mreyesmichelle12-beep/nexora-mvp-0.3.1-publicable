import type { CSSProperties } from "react";
// Arnés: next/image reemplazado por <img> conservando alt, tamaño y estilo.
export default function Image({ src, alt, width, height, style, className, priority: _p, sizes: _s, ...rest }: { src: string; alt: string; width: number; height: number; style?: CSSProperties; className?: string; priority?: boolean; sizes?: string } & Record<string, unknown>) {
  return <img src={src} alt={alt} width={width} height={height} style={style} className={className} {...(rest as object)} />;
}
