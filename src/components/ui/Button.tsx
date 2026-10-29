import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "breadcrumb";
}

export function Button({ children, className, variant = "secondary", ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "emm:inline-flex emm:cursor-pointer emm:items-center emm:justify-center emm:rounded-lg emm:border emm:px-4 emm:py-2.5 emm:text-sm emm:font-semibold emm:shadow-sm emm:transition-colors emm:disabled:cursor-not-allowed emm:disabled:opacity-60",
        variant === "primary" && "emm:border-emm-neutral-900 emm:bg-emm-neutral-900 emm:text-emm-inverse emm:hover:bg-emm-neutral-800",
        variant === "secondary" && "emm:border-emm-neutral-200 emm:bg-emm-surface emm:text-emm-neutral-900 emm:hover:bg-emm-neutral-50",
        variant === "ghost" && "emm:border-emm-neutral-200 emm:bg-emm-surface emm:text-emm-neutral-700 emm:hover:bg-emm-neutral-50",
        variant === "danger" && "emm:border-emm-danger-600 emm:bg-emm-danger-600 emm:text-emm-inverse emm:hover:border-emm-danger-500 emm:hover:bg-emm-danger-500",
        variant === "breadcrumb" && "emm:border-0 emm:px-0 emm:py-0 emm:text-emm-neutral-700 emm:hover:bg-transparent emm:shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
