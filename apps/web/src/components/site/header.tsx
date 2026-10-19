"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonClass } from "@/components/ui/button";
import { AUTH_LINKS, NAV } from "@/content/site";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Cabecera: fila 1 = marca + acciones; fila 2 (escritorio) = menú plano de 11 destinos; móvil = menú desplegable accesible. */
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const cur = (href: string) => (pathname === href ? ("page" as const) : undefined);

  useEffect(() => { setOpen(false); }, [pathname]);

  // Escape cierra y devuelve el foco; Tab queda atrapado dentro del menú; el fondo no se desplaza
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); toggleRef.current?.focus(); return; }
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = [toggleRef.current, ...Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))].filter(Boolean) as HTMLElement[];
    const first = items[0]!, last = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open, onKey]);

  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Link href="/" className="site-header__brand" aria-label="NEXORA, ir al inicio"><Logo width={80} priority /></Link>
        <div className="site-header__spacer" />
        <div className="site-header__actions">
          <Link href={AUTH_LINKS.login.href} className={buttonClass("ghost", "sm")}>{AUTH_LINKS.login.label}</Link>
          <Link href={AUTH_LINKS.register.href} className={buttonClass("secondary", "sm")}>{AUTH_LINKS.register.label}</Link>
          <Link href={AUTH_LINKS.demo.href} className={buttonClass("primary", "sm")}>{AUTH_LINKS.demo.label}</Link>
        </div>
        <button type="button" className="menu-toggle" ref={toggleRef} aria-expanded={open} aria-controls="menu-movil" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen((v) => !v)}>
          {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
        </button>
      </div>

      <nav aria-label="Principal" className="nav-bar">
        <div className="container"><ul>{NAV.map((l) => <li key={l.href}><Link href={l.href} aria-current={cur(l.href)}>{l.label}</Link></li>)}</ul></div>
      </nav>

      <div id="menu-movil" className="mobile-panel" ref={panelRef} hidden={!open}>
        <nav aria-label="Principal (móvil)">{NAV.map((l) => <Link key={l.href} href={l.href} className="m-link" aria-current={cur(l.href)}>{l.label}</Link>)}</nav>
        <div className="mobile-panel__actions">
          <Link href={AUTH_LINKS.demo.href} className={buttonClass("primary", "lg")}>{AUTH_LINKS.demo.label}</Link>
          <Link href={AUTH_LINKS.register.href} className={buttonClass("secondary", "lg")}>{AUTH_LINKS.register.label}</Link>
          <Link href={AUTH_LINKS.login.href} className={buttonClass("ghost", "lg")}>{AUTH_LINKS.login.label}</Link>
        </div>
      </div>
    </header>
  );
}
