import type { CSSProperties } from "react";
// Sustituto de next/image SOLO para el arnés de verificación.
export default function Image({ src, alt, width, height, priority, sizes: _s, style, className, ...rest }: { src: string; alt: string; width: number; height: number; priority?: boolean; sizes?: string; style?: CSSProperties; className?: string; [k: string]: unknown }) {
  return <img src={src} alt={alt} width={width} height={height} style={style} className={className} loading={priority ? "eager" : "lazy"} {...rest} />;
}
