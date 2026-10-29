import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "breadcrumb";
}

export function Button({ children, className, variant = "secondary", ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "border-emm-neutral-900 bg-emm-neutral-900 text-emm-inverse hover:bg-emm-neutral-800",
        variant === "secondary" && "border-emm-neutral-200 bg-emm-surface text-emm-neutral-900 hover:bg-emm-neutral-50",
        variant === "ghost" && "border-emm-neutral-200 bg-emm-surface text-emm-neutral-700 hover:bg-emm-neutral-50",
        variant === "danger" && "border-emm-danger-600 bg-emm-danger-600 text-emm-inverse hover:border-emm-danger-500 hover:bg-emm-danger-500",
        variant === "breadcrumb" && "border-0 px-0 py-0 text-emm-neutral-700 hover:bg-transparent shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
