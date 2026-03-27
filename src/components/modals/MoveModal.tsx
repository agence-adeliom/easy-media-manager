import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Folder, House } from "lucide-react";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { ModalShell } from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/cn";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { useMediaStore } from "@/store/media-store";
import type { FolderBreadcrumbItem } from "@/types/api";
import type { FolderItem, MediaItem } from "@/types/media";
import { isFolder } from "@/types/media";

function normalizeStoragePath(path: string | null | undefined): string {
  return (path ?? "").replace(/^\/+|\/+$/g, "");
}

function isPathInside(path: string, ancestorPath: string): boolean {
  if (!ancestorPath) {
    return false;
  }

  return path === ancestorPath || path.startsWith(`${ancestorPath}/`);
}

export function MoveModal() {
  const t = useTranslations();
  const routes = useMediaStore((state) => state.routes);
  const activeModal = useMediaStore((state) => state.activeModal);
  const closeModal = useMediaStore((state) => state.closeModal);
  const currentFolderId = useMediaStore((state) => state.currentFolderId);
  const movableList = useMediaStore((state) => state.movableList);
  const removeFromMovableList = useMediaStore((state) => state.removeFromMovableList);
  const clearMovableList = useMediaStore((state) => state.clearMovableList);
  const disableBulkMode = useMediaStore((state) => state.disableBulkMode);
  const queryClient = useQueryClient();
  const [browseFolderId, setBrowseFolderId] = useState<number | null>(currentFolderId);

  const isOpen = activeModal === CORE_MODAL_IDS.move;

  useEffect(() => {
    if (isOpen) {
      setBrowseFolderId(currentFolderId);
    }
  }, [currentFolderId, isOpen]);

  const destinationsQuery = useQuery({
    queryKey: ["move-destinations", browseFolderId],
    queryFn: async () => {
      if (!routes?.files) {
        throw new Error(t("routes_unavailable"));
      }

      const response = await easyMediaClient.getFiles(routes.files, {
        folder: browseFolderId,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.files;
    },
    enabled: isOpen && Boolean(routes?.files),
  });

  const destinationFolders = useMemo(
    () => (destinationsQuery.data?.items.data ?? []).filter((item): item is FolderItem => isFolder(item)),
    [destinationsQuery.data?.items.data],
  );

  const destinationPath = normalizeStoragePath(destinationsQuery.data?.path);

  const invalidDestination = useMemo(
    () =>
      movableList.some((item) => {
        if (!isFolder(item)) {
          return false;
        }

        const itemPath = normalizeStoragePath(item.storage_path);

        return item.id === browseFolderId || isPathInside(destinationPath, itemPath);
      }),
    [browseFolderId, destinationPath, movableList],
  );

  const mutation = useMutation({
    mutationFn: () => {
      if (!routes?.moveFile || movableList.length === 0) {
        throw new Error(t("move_unavailable"));
      }

      if (invalidDestination) {
        throw new Error(t("move_unavailable"));
      }

      return easyMediaClient.moveFiles(routes.moveFile, {
        destination: browseFolderId,
        moved_files: movableList.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          storage_path: item.storage_path,
        })),
      });
    },
    onSuccess: async () => {
      const movedCount = movableList.length;

      await queryClient.invalidateQueries({ queryKey: ["files"] });
      clearMovableList();

      if (movedCount > 1) {
        disableBulkMode();
      }

      closeModal();
      toast.success(t("move_success"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const breadcrumb = destinationsQuery.data?.breadcrumb ?? [];

  function isFolderDisabled(folder: FolderItem) {
    return movableList.some((item) => {
      if (!isFolder(item)) {
        return false;
      }

      const itemPath = normalizeStoragePath(item.storage_path);
      const folderPath = normalizeStoragePath(folder.storage_path);

      return item.id === folder.id || isPathInside(folderPath, itemPath);
    });
  }

  function handleClose() {
    closeModal();
    clearMovableList();
  }

  function handleRemove(index: number) {
    if (movableList.length === 1) {
      handleClose();

      return;
    }

    removeFromMovableList(index);
  }

  return (
    <ModalShell onClose={handleClose} open={isOpen} title={t("move_main")}>
      <div className="space-y-4">
        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-900">{t("destination_folder")}</p>

          <div className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
            <button
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 transition hover:text-slate-900",
                browseFolderId === null && "font-medium text-slate-900",
              )}
              onClick={() => setBrowseFolderId(null)}
              type="button"
            >
              <House className="h-4 w-4" />
              <span>{t("library")}</span>
            </button>
            {breadcrumb.map((item: FolderBreadcrumbItem, index) => (
              <button
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 transition hover:text-slate-900",
                  index === breadcrumb.length - 1 && "font-medium text-slate-900",
                )}
                key={item.id}
                onClick={() => setBrowseFolderId(item.id)}
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
                {item.name}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200">
            {destinationsQuery.isLoading ? <p className="px-3 py-4 text-sm text-slate-500">{t("loading")}</p> : null}
            {destinationsQuery.error ? <p className="px-3 py-4 text-sm text-red-600">{destinationsQuery.error.message}</p> : null}
            {!destinationsQuery.isLoading && !destinationsQuery.error && destinationFolders.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">{t("move_empty_destination_folders")}</p>
            ) : null}
            {!destinationsQuery.isLoading && !destinationsQuery.error ? (
              <ul className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {destinationFolders.map((folder) => {
                  const disabled = isFolderDisabled(folder);

                  return (
                    <li key={folder.id}>
                      <button
                        className={cn(
                          "group relative flex w-full min-w-0 items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2.5 text-left transition hover:border-slate-400 hover:bg-sky-50 hover:shadow-sm",
                          disabled
                            ? "cursor-not-allowed text-slate-400"
                            : "cursor-pointer text-slate-900",
                        )}
                        disabled={disabled}
                        onClick={() => setBrowseFolderId(folder.id)}
                        type="button"
                      >
                        <span
                          className={cn(
                            "shrink-0 text-slate-500",
                            disabled && "text-slate-300",
                          )}
                        >
                          <Folder className="h-10 w-10 fill-current" />
                        </span>
                        <span className="truncate text-sm font-medium">{folder.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-3">
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("move_selected_folder")}</p>
              <p className="text-sm text-slate-600">
                {destinationPath ? `/${t("library")}/${destinationPath}` : `/${t("library")}`}
              </p>
              {invalidDestination ? <p className="text-sm text-red-600">{t("move_unavailable")}</p> : null}
            </div>
            <Button onClick={handleClose} type="button" variant="ghost">
              {t("cancel")}
            </Button>
            <Button
              disabled={movableList.length === 0 || mutation.isPending || destinationsQuery.isLoading || invalidDestination}
              onClick={() => mutation.mutate()}
              type="button"
              variant="primary"
            >
              {t("move_main")}
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-900">{t("files_to_move_list")}</p>
          <ul className="space-y-2">
            {movableList.map((item, index) => (
              <li
                className={cn(
                  "flex items-center justify-between gap-3 rounded px-2 py-1.5 text-sm",
                  index % 2 === 0 ? "bg-slate-50" : "bg-white",
                )}
                key={`${item.storage_path}-${index}`}
              >
                <span className="truncate">{item.name}</span>
                <button
                  className="shrink-0 cursor-pointer text-sm text-sky-700 underline-offset-2 transition hover:text-sky-900 hover:underline"
                  onClick={() => handleRemove(index)}
                  type="button"
                >
                  {t("remove_from_list")}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {mutation.error ? <p className="text-sm text-red-600">{mutation.error.message}</p> : null}
      </div>
    </ModalShell>
  );
}
