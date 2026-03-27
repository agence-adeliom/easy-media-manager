import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, FolderX, SearchX, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { EmptyState } from "@/components/browser/EmptyState";
import { FileCard } from "@/components/browser/FileCard";
import { InfiniteLoader } from "@/components/browser/InfiniteLoader";
import { useClipboard } from "@/hooks/use-clipboard";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useTranslations } from "@/hooks/use-translations";
import { filterByHiddenExt, filterByType, sortFiles } from "@/lib/file-utils";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { useMediaStore } from "@/store/media-store";
import { usePickStore } from "@/store/pick-store";
import type { FolderBreadcrumbItem } from "@/types/api";
import type { MediaItem } from "@/types/media";
import { getMediaItemKey, isFolder } from "@/types/media";

interface FileGridProps {
  onItemsChange: (items: MediaItem[]) => void;
}

export function FileGrid({ onItemsChange }: FileGridProps) {
  const t = useTranslations();
  const routes = useMediaStore((state) => state.routes);
  const currentFolderId = useMediaStore((state) => state.currentFolderId);
  const searchQuery = useMediaStore((state) => state.searchQuery);
  const currentPath = useMediaStore((state) => state.currentPath);
  const folderStack = useMediaStore((state) => state.folderStack);
  const filterName = useMediaStore((state) => state.filterName);
  const sortField = useMediaStore((state) => state.sortField);
  const sortDirection = useMediaStore((state) => state.sortDirection);
  const config = useMediaStore((state) => state.config);
  const selectedFile = useMediaStore((state) => state.selectedFile);
  const bulkList = useMediaStore((state) => state.bulkList);
  const bulkMode = useMediaStore((state) => state.bulkMode);
  const features = useMediaStore((state) => state.features);
  const mode = useMediaStore((state) => state.mode);
  const restrictions = useMediaStore((state) => state.restrictions);
  const pushFolder = useMediaStore((state) => state.pushFolder);
  const selectFile = useMediaStore((state) => state.selectFile);
  const toggleBulkItem = useMediaStore((state) => state.toggleBulkItem);
  const clearSelection = useMediaStore((state) => state.clearSelection);
  const deselectAll = useMediaStore((state) => state.deselectAll);
  const openModal = useMediaStore((state) => state.openModal);
  const setLoading = useMediaStore((state) => state.setLoading);
  const setFilter = useMediaStore((state) => state.setFilter);
  const restoreFolderState = useMediaStore((state) => state.restoreFolderState);
  const resolvePick = usePickStore((state) => state.resolvePick);
  const queryClient = useQueryClient();
  const { copy } = useClipboard();
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [activeDragItem, setActiveDragItem] = useState<MediaItem | null>(null);
  const [draggedItems, setDraggedItems] = useState<MediaItem[]>([]);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const query = useInfiniteQuery({
    queryKey: ["files", currentFolderId, searchQuery, currentPath, restrictions.path ?? "", refreshIndex],
    queryFn: async ({ pageParam }) => {
      const response = await easyMediaClient.getFiles(String(pageParam || routes?.files), {
        folder: currentFolderId,
        search: searchQuery || undefined,
        path: restrictions.path ?? undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    },
    getNextPageParam: (lastPage) => lastPage.files.items.next_page_url,
    initialPageParam: null as string | null,
    enabled: Boolean(routes?.files),
  });

  useEffect(() => {
    setLoading(query.isLoading || query.isFetchingNextPage);
  }, [query.isFetchingNextPage, query.isLoading, setLoading]);

  useEffect(() => {
    const response = query.data?.pages[0];

    if (!response) {
      return;
    }

    const breadcrumb = response.files.breadcrumb ?? [];
    const nextPath = breadcrumb.length > 0 ? `/${breadcrumb.map((item: FolderBreadcrumbItem) => item.name).join("/")}` : "";
    const stackChanged =
      folderStack.length !== breadcrumb.length ||
      folderStack.some((item, index) => item.id !== breadcrumb[index]?.id || item.name !== breadcrumb[index]?.name);

    if (!stackChanged && currentPath === nextPath) {
      return;
    }

    restoreFolderState(
      {
        folderId: currentFolderId,
        folderStack: breadcrumb,
        currentPath: nextPath,
      },
      true,
    );
  }, [currentFolderId, currentPath, folderStack, query.data, restoreFolderState]);

  useEffect(() => {
    const onRefresh = () => {
      setRefreshIndex((value) => value + 1);
      void queryClient.invalidateQueries({ queryKey: ["files"] });
    };

    window.addEventListener("easy-media:refresh", onRefresh as EventListener);

    return () => {
      window.removeEventListener("easy-media:refresh", onRefresh as EventListener);
    };
  }, [queryClient]);

  const pagedItems = useMemo(() => query.data?.pages.flatMap((page) => page.files.items.data) ?? [], [query.data?.pages]);

  const items = useMemo(() => {
    if (!config) {
      return pagedItems;
    }

    const visible = filterByHiddenExt(pagedItems, config.hideFilesExt);

    return sortFiles(filterByType(visible, filterName, config.mimeTypes), sortField, sortDirection);
  }, [config, filterName, pagedItems, sortDirection, sortField]);

  const canResetFilterFromEmptyState = !searchQuery && Boolean(filterName) && pagedItems.length > 0 && items.length === 0;

  useEffect(() => {
    onItemsChange(items);
  }, [items, onItemsChange]);

  useEffect(() => {
    if (selectedFile && !items.some((item) => getMediaItemKey(item) === getMediaItemKey(selectedFile))) {
      clearSelection();
    }
  }, [clearSelection, items, selectedFile]);

  const moveMutation = useMutation({
    mutationFn: async ({ destinationId, filesToMove }: { destinationId: number; filesToMove: MediaItem[] }) => {
      if (!routes?.moveFile) {
        throw new Error("Deplacement impossible.");
      }

      return easyMediaClient.moveFiles(routes.moveFile, {
        destination: destinationId,
        moved_files: filesToMove.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          storage_path: item.storage_path,
        })),
      });
    },
    onSuccess: async (result) => {
      const failedMessages = result
        .filter((item) => item.success === false && item.message)
        .map((item) => item.message as string);

      await queryClient.invalidateQueries({ queryKey: ["files"] });
      clearSelection();
      deselectAll();
      setMoveError(failedMessages.length > 0 ? failedMessages.join(" ") : null);

      if (failedMessages.length > 0) {
        toast.error(failedMessages.join(" "));
        return;
      }

      toast.success("Elements deplaces.");
    },
    onError: (error: Error) => {
      setMoveError(error.message);
      toast.error(error.message);
    },
  });

  const sentinelRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage),
    isLoading: query.isFetchingNextPage,
    onLoadMore: () => {
      void query.fetchNextPage();
    },
  });

  function resolveDraggedItems(item: MediaItem) {
    const itemKey = getMediaItemKey(item);
    const isBulkItem = bulkList.some((entry) => getMediaItemKey(entry) === itemKey);

    if (bulkMode && isBulkItem) {
      return bulkList;
    }

    return [item];
  }

  function resetDragState() {
    setActiveDragItem(null);
    setDraggedItems([]);
    setDropTargetId(null);
  }

  function handleDragStart(event: DragStartEvent) {
    if (!features.enableMove) {
      return;
    }

    const item = event.active.data.current?.item as MediaItem | undefined;

    if (!item) {
      return;
    }

    setMoveError(null);
    setActiveDragItem(item);
    setDraggedItems(resolveDraggedItems(item));
  }

  function handleDragEnd(event: DragEndEvent) {
    const overFolder = event.over?.data.current?.folder as MediaItem | undefined;
    const activeItem = event.active.data.current?.item as MediaItem | undefined;
    const draggedSelection = activeItem ? resolveDraggedItems(activeItem) : [];

    resetDragState();

    if (!features.enableMove || !overFolder || draggedSelection.length === 0 || !isFolder(overFolder)) {
      return;
    }

    const isSelfDrop = draggedSelection.some((item) => isFolder(item) && item.id === overFolder.id);

    if (isSelfDrop) {
      return;
    }

    moveMutation.mutate({
      destinationId: overFolder.id,
      filesToMove: draggedSelection,
    });
  }

  const dragOverlayLabel =
    draggedItems.length > 1 ? `${draggedItems.length} elements` : activeDragItem?.name ?? null;

  function handleSelect(item: MediaItem, index: number, event: MouseEvent) {
    if (bulkMode || event.metaKey || event.ctrlKey) {
      toggleBulkItem(item);
      return;
    }

    selectFile(item, index);
  }

  function handleDoubleClick(item: MediaItem) {
    if (isFolder(item)) {
      pushFolder(item.id, item.name);
      return;
    }

    if (mode === "modal") {
      resolvePick(item);
      return;
    }

    openModal(CORE_MODAL_IDS.preview);
  }

  async function handleCopy(path: string) {
    await copy(path);
    toast.success(t("path_copied"));
  }

  const gridContent =
    items.length === 0 ? (
      <EmptyState
        actionLabel={canResetFilterFromEmptyState ? t("empty.reset_filters") : undefined}
        description={searchQuery ? t("empty_search_description") : t("empty_folder_description")}
        icon={searchQuery ? <SearchX className="h-10 w-10" /> : <FolderOpen className="h-10 w-10" />}
        onAction={canResetFilterFromEmptyState ? () => setFilter(null) : undefined}
        title={searchQuery ? t("empty_search_title") : t("empty_folder_title")}
      />
    ) : (
      <DndContext
        onDragCancel={resetDragState}
        onDragEnd={handleDragEnd}
        onDragOver={(event) => {
          const folder = event.over?.data.current?.folder as MediaItem | undefined;
          setDropTargetId(folder && isFolder(folder) ? folder.id : null);
        }}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => {
            const isBulkSelected = bulkList.some((entry) => getMediaItemKey(entry) === getMediaItemKey(item));
            const isSelected = !isBulkSelected && selectedFile !== null && getMediaItemKey(selectedFile) === getMediaItemKey(item);

            return (
              <FileCard
                dragEnabled={features.enableMove}
                dragId={getMediaItemKey(item)}
                index={index}
                isBulkSelected={isBulkSelected}
                isDropTarget={isFolder(item) && dropTargetId === item.id}
                isSelected={isSelected}
                item={item}
                key={getMediaItemKey(item)}
                onCopyLink={(path) => void handleCopy(path)}
                onDoubleClick={handleDoubleClick}
                onSelect={handleSelect}
                showBulkCheckbox={bulkMode}
              />
            );
          })}
        </div>
        <DragOverlay>
          {dragOverlayLabel ? (
            <div className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900 shadow-xl">
              {dragOverlayLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );

  if (query.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
        {t("loading")}
      </div>
    );
  }

  if (query.error) {
    if (currentFolderId !== null) {
      return (
        <EmptyState
          description={t("empty_folder_not_found_description")}
          icon={<FolderX className="h-10 w-10" />}
          title={t("empty_folder_not_found_title")}
        />
      );
    }

    return <EmptyState description={query.error.message} icon={<TriangleAlert className="h-10 w-10" />} title={t("loading_error_title")} />;
  }

  return (
    <div className="space-y-4">
      {moveError ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{moveError}</p> : null}
      <div className="rounded-2xl">{gridContent}</div>
      <InfiniteLoader isLoading={query.isFetchingNextPage} sentinelRef={sentinelRef} />
    </div>
  );
}
