import { ChevronRight, House } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
import { useMediaStore } from "@/store/media-store";

export function Breadcrumb() {
  const folderStack = useMediaStore((state) => state.folderStack);
  const pathRootDepth = useMediaStore((state) => state.pathRootDepth);
  const goToFolder = useMediaStore((state) => state.goToFolder);
  const t = useTranslations();
  // In a picker restricted to a folder, that folder is the root: its parents are not shown.
  const rootIndex = pathRootDepth === null ? -1 : pathRootDepth - 1;
  const rootLabel = rootIndex < 0 ? t("library") : folderStack[rootIndex]?.name;

  return (
    <nav className="emm:flex emm:flex-wrap emm:items-center emm:gap-1 emm:text-sm emm:text-emm-neutral-600 emm:bg-emm-neutral-100 emm:border-b emm:p-3">
      <Button onClick={() => goToFolder(rootIndex)} type="button" variant="breadcrumb">
        <House className="emm:mr-1.5 emm:h-4 emm:w-4" />
        {rootLabel}
      </Button>
      {folderStack.map((folder, index) =>
        index > rootIndex ? (
          <span className="emm:flex emm:items-center" key={`${folder.id}-${folder.name}`}>
            <ChevronRight className="emm:h-4 emm:w-4 emm:text-emm-neutral-400" />
            <Button onClick={() => goToFolder(index)} type="button" variant="breadcrumb">
              {folder.name}
            </Button>
          </span>
        ) : null,
      )}
    </nav>
  );
}
