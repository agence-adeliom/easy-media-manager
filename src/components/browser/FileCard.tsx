import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useEffect, useState, type MouseEvent } from "react";
import { Check, Copy } from "lucide-react";

import { FileIcon } from "@/components/ui/FileIcon";
import { useFileType } from "@/hooks/use-file-type";
import { useTranslations } from "@/hooks/use-translations";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import type { MediaItem } from "@/types/media";
import { isFolder, isMediaFile } from "@/types/media";

export interface FileCardProps {
  item: MediaItem;
  index: number;
  isSelected: boolean;
  showBulkCheckbox: boolean;
  isBulkSelected: boolean;
  dragId: string;
  dragEnabled: boolean;
  isDropTarget: boolean;
  onSelect: (item: MediaItem, index: number, event: MouseEvent) => void;
  onDoubleClick: (item: MediaItem) => void;
  onCopyLink: (path: string) => void;
}

export function FileCard({
  item,
  index,
  isSelected,
  showBulkCheckbox,
  isBulkSelected,
  dragId,
  dragEnabled,
  isDropTarget,
  onSelect,
  onDoubleClick,
  onCopyLink,
}: FileCardProps) {
  const t = useTranslations();
  const fileType = useFileType();
  const [imagePreviewAvailable, setImagePreviewAvailable] = useState(true);
  const draggable = useDraggable({
    id: dragId,
    data: { item },
    disabled: !dragEnabled,
  });
  const droppable = useDroppable({
    id: `folder-${item.id}`,
    data: isFolder(item) ? { folder: item } : undefined,
    disabled: !isFolder(item) || !dragEnabled,
  });

  const transform = draggable.transform
    ? `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`
    : undefined;
  const showImagePreview = !isFolder(item) && fileType.isImage(item) && imagePreviewAvailable;
  const oembedThumbnailUrl = isMediaFile(item) && fileType.isOembed(item) ? (item.metas.image ?? null) : null;
  const showOembedThumbnail = oembedThumbnailUrl !== null && imagePreviewAvailable;

  useEffect(() => {
    setImagePreviewAvailable(true);
  }, [item]);

  function setNodeRef(node: HTMLElement | null) {
    draggable.setNodeRef(node);
    if (isFolder(item)) {
      droppable.setNodeRef(node);
    }
  }

  return (
    <article
      ref={setNodeRef}
      className={cn(
        "emm:group emm:relative emm:flex emm:cursor-pointer emm:select-none emm:items-center emm:gap-3 emm:rounded-lg emm:bg-emm-item emm:px-3 emm:py-2.5 emm:transition emm:hover:border-emm-neutral-400 emm:hover:bg-emm-accent-50 emm:hover:shadow-sm",
        (!isFolder(item) || showBulkCheckbox) && "emm:pr-20",
        isSelected && "emm:border-emm-neutral-900 emm:bg-emm-accent-100 emm:shadow-sm",
        isBulkSelected && "emm:ring-2 emm:ring-emm-accent-400",
        dragEnabled && "emm:touch-none",
        draggable.isDragging && "emm:opacity-40",
        isDropTarget && "emm:border-emm-accent-500 emm:ring-2 emm:ring-emm-accent-300 emm:shadow-lg",
      )}
      style={{ transform }}
      {...draggable.attributes}
      {...draggable.listeners}
      onMouseDown={(event) => {
        if (event.shiftKey || event.detail > 1) {
          event.preventDefault();
        }
      }}
      onClick={(event) => onSelect(item, index, event)}
      onDoubleClick={() => onDoubleClick(item)}
    >
      <div className="emm:shrink-0 emm:text-emm-neutral-500">
        {showImagePreview ? (
          <img
            alt={item.name}
            className="emm:h-10 emm:w-10 emm:rounded emm:object-cover"
            loading="lazy"
            onError={() => setImagePreviewAvailable(false)}
            src={item.path}
          />
        ) : showOembedThumbnail ? (
          <img
            alt={item.name}
            className="emm:h-10 emm:w-10 emm:rounded emm:object-cover"
            loading="lazy"
            onError={() => setImagePreviewAvailable(false)}
            src={oembedThumbnailUrl}
          />
        ) : (
          <FileIcon item={item} />
        )}
      </div>
      <div className="emm:min-w-0 emm:flex-1">
        <p className="emm:truncate emm:text-sm emm:font-medium emm:text-emm-neutral-900 emm:m-0">{item.name}</p>
        {!isFolder(item) ? <p className="emm:truncate emm:text-xs emm:text-emm-neutral-400">{item.size ? `${(item.size / 1024).toFixed(2)} KB` : item.type}</p> : null}
      </div>
      {showBulkCheckbox ? (
        <span
          className={cn(
            "emm:absolute emm:right-2 emm:top-2 emm:flex emm:h-5 emm:w-5 emm:items-center emm:justify-center emm:rounded emm:border emm:transition",
            isBulkSelected
              ? "emm:border-emm-accent-500 emm:bg-emm-accent-500 emm:text-emm-inverse"
              : "emm:border-emm-neutral-300 emm:bg-emm-neutral-100 emm:text-emm-neutral-300",
          )}
        >
          <Check className="emm:h-3 emm:w-3" />
        </span>
      ) : null}
      {!isFolder(item) ? (
        <Tooltip className="emm:absolute emm:bottom-1.5 emm:right-2" content={t("copy_link")}>
          <button
            className="emm:rounded-md emm:p-1.5 emm:text-emm-neutral-400 emm:transition emm:hover:bg-emm-neutral-100 emm:hover:text-emm-neutral-900"
            onClick={(event) => {
              event.stopPropagation();
              onCopyLink(item.path);
            }}
            type="button"
          >
            <Copy className="emm:h-3.5 emm:w-3.5" />
          </button>
        </Tooltip>
      ) : null}
    </article>
  );
}
