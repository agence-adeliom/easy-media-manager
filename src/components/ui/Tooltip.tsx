import { cloneElement, isValidElement, type PropsWithChildren, type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface TooltipProps {
  content: ReactNode;
  className?: string;
}

export function Tooltip({ children, content, className }: PropsWithChildren<TooltipProps>) {
  // The tooltip is only shown on hover: a text content also names the wrapped control (icon-only buttons).
  const control =
    typeof content === "string" &&
    isValidElement<{ "aria-label"?: string }>(children) &&
    children.props["aria-label"] === undefined
      ? cloneElement(children, { "aria-label": content })
      : children;

  return (
    <span className={cn("emm:relative emm:inline-flex", className)}>
      <span className="emm:peer emm:inline-flex">{control}</span>
      <span className="emm:pointer-events-none emm:absolute emm:bottom-full emm:left-1/2 emm:z-10 emm:mb-2 emm:hidden emm:-translate-x-1/2 emm:rounded emm:bg-emm-neutral-900 emm:px-2 emm:py-1 emm:text-xs emm:text-emm-inverse emm:peer-hover:block emm:peer-focus-within:block">
        {content}
      </span>
    </span>
  );
}
