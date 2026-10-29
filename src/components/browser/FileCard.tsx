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
        "group relative flex cursor-pointer select-none items-center gap-3 rounded-lg bg-emm-item px-3 py-2.5 transition hover:border-emm-neutral-400 hover:bg-emm-accent-50 hover:shadow-sm",
        (!isFolder(item) || showBulkCheckbox) && "pr-20",
        isSelected && "border-emm-neutral-900 bg-emm-accent-100 shadow-sm",
        isBulkSelected && "ring-2 ring-emm-accent-400",
        dragEnabled && "touch-none",
        draggable.isDragging && "opacity-40",
        isDropTarget && "border-emm-accent-500 ring-2 ring-emm-accent-300 shadow-lg",
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
      <div className="shrink-0 text-emm-neutral-500">
        {showImagePreview ? (
          <img
            alt={item.name}
            className="h-10 w-10 rounded object-cover"
            loading="lazy"
            onError={() => setImagePreviewAvailable(false)}
            src={item.path}
          />
        ) : showOembedThumbnail ? (
          <img
            alt={item.name}
            className="h-10 w-10 rounded object-cover"
            loading="lazy"
            onError={() => setImagePreviewAvailable(false)}
            src={oembedThumbnailUrl}
          />
        ) : (
          <FileIcon item={item} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-emm-neutral-900 m-0">{item.name}</p>
        {!isFolder(item) ? <p className="truncate text-xs text-emm-neutral-400">{item.size ? `${(item.size / 1024).toFixed(2)} KB` : item.type}</p> : null}
      </div>
      {showBulkCheckbox ? (
        <span
          className={cn(
            "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded border transition",
            isBulkSelected
              ? "border-emm-accent-500 bg-emm-accent-500 text-emm-inverse"
              : "border-emm-neutral-300 bg-emm-neutral-100 text-emm-neutral-300",
          )}
        >
          <Check className="h-3 w-3" />
        </span>
      ) : null}
      {!isFolder(item) ? (
        <Tooltip className="absolute bottom-1.5 right-2" content={t("copy_link")}>
          <button
            className="rounded-md p-1.5 text-emm-neutral-400 transition hover:bg-emm-neutral-100 hover:text-emm-neutral-900"
            onClick={(event) => {
              event.stopPropagation();
              onCopyLink(item.path);
            }}
            type="button"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      ) : null}
    </article>
  );
}
