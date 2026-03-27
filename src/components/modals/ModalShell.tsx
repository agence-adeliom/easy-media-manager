import { type PropsWithChildren, type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";

interface ModalShellProps {
  open: boolean;
  title: string;
  onClose: () => void;
  widthClassName?: string;
  bodyClassName?: string;
  titlePrefix?: ReactNode;
}

export function ModalShell({
  children,
  open,
  title,
  onClose,
  widthClassName = "max-w-2xl",
  bodyClassName,
  titlePrefix,
}: PropsWithChildren<ModalShellProps>) {
  const t = useTranslations();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[2px]">
      <button aria-label={t("close")} className="absolute inset-0 cursor-default" onClick={onClose} type="button" />
      <section
        className={`relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] ${widthClassName}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-3 py-3">
          <div className="min-w-0 flex items-center gap-3">
            {titlePrefix ? <div className="shrink-0">{titlePrefix}</div> : null}
            <p className="mb-0 py-1 text-xl font-semibold tracking-tight text-slate-900">{title}</p>
          </div>
          <Button
            aria-label={t("close")}
            className="rounded-none border-0 shadow-none"
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className={cn("overflow-y-auto px-6 py-3", bodyClassName)}>{children}</div>
      </section>
    </div>,
    document.body,
  );
}
