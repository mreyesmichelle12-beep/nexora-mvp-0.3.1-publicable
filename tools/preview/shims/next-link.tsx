import type { AnchorHTMLAttributes, ReactNode } from "react";
// Sustituto de next/link SOLO para el arnés de verificación (navegación completa de página).
export default function Link({ href, children, prefetch: _p, scroll: _s, replace: _r, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode; prefetch?: boolean; scroll?: boolean; replace?: boolean }) {
  return <a href={href} {...rest}>{children}</a>;
}
