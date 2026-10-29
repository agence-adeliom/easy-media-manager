import { cloneElement, isValidElement, type PropsWithChildren, type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface TooltipProps {
  content: ReactNode;
  className?: string;
  // "bottom" for the toolbar: a host page usually puts the manager right under its header, and its first buttons
  // sit on the left edge of the manager, so the tooltip starts at the left edge of the control instead of centering.
  side?: "top" | "bottom";
}

export function Tooltip({ children, content, className, side = "top" }: PropsWithChildren<TooltipProps>) {
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
      <span
        className={cn(
          "emm:pointer-events-none emm:absolute emm:z-10 emm:hidden emm:whitespace-nowrap emm:rounded emm:bg-emm-neutral-900 emm:px-2 emm:py-1 emm:text-xs emm:text-emm-inverse emm:peer-hover:block emm:peer-focus-within:block",
          side === "top" ? "emm:bottom-full emm:left-1/2 emm:mb-2 emm:-translate-x-1/2" : "emm:top-full emm:left-0 emm:mt-2",
        )}
      >
        {content}
      </span>
    </span>
  );
}
