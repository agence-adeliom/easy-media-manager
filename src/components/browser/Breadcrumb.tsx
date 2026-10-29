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
    <nav className="flex flex-wrap items-center gap-1 text-sm text-emm-neutral-600 bg-emm-neutral-100 border-b p-3">
      <Button onClick={() => goToFolder(rootIndex)} type="button" variant="breadcrumb">
        <House className="mr-1.5 h-4 w-4" />
        {rootLabel}
      </Button>
      {folderStack.map((folder, index) =>
        index > rootIndex ? (
          <span className="flex items-center" key={`${folder.id}-${folder.name}`}>
            <ChevronRight className="h-4 w-4 text-emm-neutral-400" />
            <Button onClick={() => goToFolder(index)} type="button" variant="breadcrumb">
              {folder.name}
            </Button>
          </span>
        ) : null,
      )}
    </nav>
  );
}
