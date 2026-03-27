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
        variant === "primary" && "border-slate-900 bg-slate-900 text-white hover:bg-slate-800",
        variant === "secondary" && "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
        variant === "ghost" && "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        variant === "danger" && "border-red-600 bg-red-600 text-white hover:border-red-500 hover:bg-red-500",
        variant === "breadcrumb" && "border-0 px-0 py-0 text-slate-700 hover:bg-transparent shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
