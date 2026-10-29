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
    <div className="emm:fixed emm:inset-0 emm:z-40 emm:flex emm:items-center emm:justify-center emm:bg-emm-neutral-950/70 emm:p-4 emm:emm-dark:bg-black/70" data-easy-media-overlay="overlay">
      <button aria-label={t("close")} className="emm:absolute emm:inset-0" onClick={() => cancelPick()} type="button" />
      <div className="emm:relative emm:z-10 emm:flex emm:min-h-0 emm:w-full emm:max-w-[80vw] emm:h-full emm:max-h-[80vh] emm:flex-col emm:overflow-hidden emm:rounded-xl emm:bg-emm-neutral-50 emm:shadow-2xl">
        {children}
        <footer className="emm:flex emm:items-center emm:justify-end emm:gap-3 emm:border-t emm:border-emm-neutral-200 emm:bg-emm-surface emm:px-6 emm:py-4">
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
