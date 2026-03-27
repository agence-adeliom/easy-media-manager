import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface TooltipProps {
  content: ReactNode;
  className?: string;
}

export function Tooltip({ children, content, className }: PropsWithChildren<TooltipProps>) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <span className="peer inline-flex">{children}</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-xs text-white peer-hover:block peer-focus-within:block">
        {content}
      </span>
    </span>
  );
}
