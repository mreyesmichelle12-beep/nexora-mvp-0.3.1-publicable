export function usePathname(): string { return typeof location === "undefined" ? "/" : location.pathname; }
