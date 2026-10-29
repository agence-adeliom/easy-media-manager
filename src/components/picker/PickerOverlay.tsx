import type { PropsWithChildren } from "react";

import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
import { usePickStore } from "@/store/pick-store";
import type { MediaItem } from "@/types/media";

interface PickerOverlayProps {
  selectedItem: MediaItem | null;
}

export function PickerOverlay({ children, selectedItem }: PropsWithChildren<PickerOverlayProps>) {
  const t = useTranslations();
  const resolvePick = usePickStore((state) => state.resolvePick);
  const cancelPick = usePickStore((state) => state.cancelPick);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-emm-neutral-950/70 p-4 emm-dark:bg-black/70" data-easy-media-overlay="overlay">
      <button aria-label={t("close")} className="absolute inset-0" onClick={() => cancelPick()} type="button" />
      <div className="relative z-10 flex min-h-0 w-full max-w-[80vw] h-full max-h-[80vh] flex-col overflow-hidden rounded-xl bg-emm-neutral-50 shadow-2xl">
        {children}
        <footer className="flex items-center justify-end gap-3 border-t border-emm-neutral-200 bg-emm-surface px-6 py-4">
          <Button onClick={() => cancelPick()} type="button" variant="ghost">
            {t("cancel")}
          </Button>
          <Button disabled={selectedItem === null} onClick={() => resolvePick(selectedItem)} type="button" variant="primary">
            {t("select_main")}
          </Button>
        </footer>
      </div>
    </div>
  );
}
