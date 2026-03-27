import { ChevronRight, House } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useMediaStore } from "@/store/media-store";

export function Breadcrumb() {
  const folderStack = useMediaStore((state) => state.folderStack);
  const goToFolder = useMediaStore((state) => state.goToFolder);

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-600 bg-slate-100 border-b p-3">
      <Button onClick={() => goToFolder(-1)} type="button" variant="breadcrumb">
        <House className="mr-1.5 h-4 w-4" />
        Home
      </Button>
      {folderStack.map((folder, index) => (
        <span className="flex items-center" key={`${folder.id}-${folder.name}`}>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <Button onClick={() => goToFolder(index)} type="button" variant="breadcrumb">
            {folder.name}
          </Button>
        </span>
      ))}
    </nav>
  );
}
