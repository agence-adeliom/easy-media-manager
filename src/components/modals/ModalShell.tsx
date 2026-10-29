import { type PropsWithChildren, type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";
import { getPortalTarget } from "@/lib/root";
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
  widthClassName = "emm:max-w-2xl",
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
    <div className="emm:fixed emm:inset-0 emm:z-50 emm:flex emm:items-center emm:justify-center emm:bg-emm-neutral-900/35 emm:p-4 emm:emm-dark:bg-black/60 emm:backdrop-blur-[2px]" data-easy-media-overlay="overlay">
      <button aria-label={t("close")} className="emm:absolute emm:inset-0 emm:cursor-default" onClick={onClose} type="button" />
      <section
        className={`emm:relative emm:z-10 emm:flex emm:max-h-[90vh] emm:w-full emm:flex-col emm:overflow-hidden emm:rounded-xl emm:border emm:border-emm-neutral-200/80 emm:bg-emm-surface emm:shadow-[0_24px_80px_rgba(15,23,42,0.18)] ${widthClassName}`}
      >
        <header className="emm:flex emm:items-start emm:justify-between emm:gap-4 emm:border-b emm:border-emm-neutral-100 emm:px-3 emm:py-3">
          <div className="emm:min-w-0 emm:flex emm:items-center emm:gap-3">
            {titlePrefix ? <div className="emm:shrink-0">{titlePrefix}</div> : null}
            <p className="emm:mb-0 emm:py-1 emm:text-xl emm:font-semibold emm:tracking-tight emm:text-emm-neutral-900">{title}</p>
          </div>
          <Button
            aria-label={t("close")}
            className="emm:rounded-none emm:border-0 emm:shadow-none"
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            <X className="emm:h-4 emm:w-4" />
          </Button>
        </header>
        <div className={cn("emm:overflow-y-auto emm:px-6 emm:py-3", bodyClassName)}>{children}</div>
      </section>
    </div>,
    getPortalTarget(),
  );
}
