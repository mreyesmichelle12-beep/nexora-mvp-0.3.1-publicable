import Image from "next/image";

/**
 * Logo oficial. El wordmark es navy: sobre fondos OSCUROS usa variant="mark" (sólo birrete y estrellas)
 * y escribe el nombre en HTML. Pendiente: SVG vectorial para máxima nitidez.
 */
export function Logo({ variant = "full", width, priority = false, className }: { variant?: "full" | "mark"; width?: number; priority?: boolean; className?: string }) {
  if (variant === "mark") {
    const w = width ?? 48;
    return <Image src="/brand/nexora-mark.png" alt="" aria-hidden="true" width={1155} height={743} sizes={`${w}px`} style={{ width: w, height: "auto" }} className={className} priority={priority} />;
  }
  const w = width ?? 160;
  return <Image src="/brand/nexora-logo-1000.png" alt="NEXORA" width={755} height={547} sizes={`${w}px`} style={{ width: w, height: "auto" }} className={className} priority={priority} />;
}
