// Legacy UI classes - use new components from @/components/ui instead
// This file is kept for backward compatibility during migration

import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-lg border border-inputline bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-fast placeholder:text-faint hover:border-muted focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed";

export const labelCls = "mb-1.5 block text-sm font-medium text-soft";

export const btnPrimario =
  "inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-onaccent hover:bg-accent-hover transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

export const btnSecundario =
  "inline-flex items-center justify-center rounded-lg border border-inputline bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-hoverbg hover:border-soft transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

export const btnPerigo =
  "inline-flex items-center justify-center rounded-lg bg-danger px-4 py-2.5 text-sm font-medium text-white hover:bg-danger-hover transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

export const btnGhost =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-soft hover:bg-hoverbg hover:text-foreground transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

export const cardCls =
  "rounded-xl border border-line bg-surface p-5 shadow-sm";

export const cardInterativo =
  "rounded-xl border border-line bg-surface p-5 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-normal cursor-pointer";

export { cn };