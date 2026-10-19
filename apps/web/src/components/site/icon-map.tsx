import { BookOpen, CalendarDays, MessageSquare, Network, Sparkles, TrendingUp, Users, Video, Wrench, type LucideIcon } from "lucide-react";
import type { IconName } from "@/content/site";

const MAP: Record<IconName, LucideIcon> = { Network, Video, BookOpen, Sparkles, Users, MessageSquare, CalendarDays, Wrench, TrendingUp };

export function FeatureIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  const Icon = MAP[name];
  return <Icon aria-hidden="true" size={size} />;
}
