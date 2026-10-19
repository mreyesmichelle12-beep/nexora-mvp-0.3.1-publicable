import { BadgeCheck, BookOpen, CalendarDays, Camera, Check, ChevronDown, Cookie, GraduationCap, Heart, Info, Instagram, Leaf, Lightbulb, Lock, Mail, Menu, MessageSquare, Mic, Network, Presentation, ShieldCheck, Sparkles, TrendingUp, Users, Video, X, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";

const MAP: Record<string, ComponentType<LucideProps>> = {
  network: Network, video: Video, book: BookOpen, sparkles: Sparkles, users: Users, message: MessageSquare,
  calendar: CalendarDays, badge: BadgeCheck, trend: TrendingUp, graduation: GraduationCap, presentation: Presentation,
  mic: Mic, lightbulb: Lightbulb, leaf: Leaf, heart: Heart, camera: Camera, check: Check, info: Info, shield: ShieldCheck,
  lock: Lock, mail: Mail, instagram: Instagram, menu: Menu, close: X, chevron: ChevronDown, cookie: Cookie,
};

/** Icono de una función (nombre del contenido). */
export function FeatureIcon({ name }: { name: string }) {
  return <Icon name={name} size={24} />;
}

/** Icono decorativo (aria-hidden). El significado siempre va en el texto contiguo. */
export function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const C = MAP[name] ?? Info;
  return <C aria-hidden="true" size={size} className={className} strokeWidth={1.75} />;
}
