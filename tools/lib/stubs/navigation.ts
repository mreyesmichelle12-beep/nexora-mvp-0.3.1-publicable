// En el servidor (pre-render) la ruta la fija el build; en el navegador se lee de la URL.
export function usePathname(): string {
  return typeof window === "undefined" ? ((globalThis as { __PATH__?: string }).__PATH__ ?? "/") : window.location.pathname.replace(/\/$/, "") || "/";
}
