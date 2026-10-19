import type { AnchorHTMLAttributes } from "react";
// Arnés: <Link> de Next reemplazado por <a> (navegación completa del navegador).
export default function Link({ href, children, prefetch: _p, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }) {
  return <a href={href} {...rest}>{children}</a>;
}
