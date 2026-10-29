import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Folder, House } from "lucide-react";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { ModalShell } from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/error-message";
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
  const folderStack = useMediaStore((state) => state.folderStack);
  const pathRootDepth = useMediaStore((state) => state.pathRootDepth);
  const movableList = useMediaStore((state) => state.movableList);
  const removeFromMovableList = useMediaStore((state) => state.removeFromMovableList);
  const clearMovableList = useMediaStore((state) => state.clearMovableList);
  const disableBulkMode = useMediaStore((state) => state.disableBulkMode);
  const queryClient = useQueryClient();
  const [browseFolderId, setBrowseFolderId] = useState<number | null>(currentFolderId);

  const isOpen = activeModal === CORE_MODAL_IDS.move;
  // In a picker restricted to a folder (`restrictions.path`), destinations stay inside it.
  const pathRoot = pathRootDepth === null ? null : (folderStack[pathRootDepth - 1] ?? null);
  const rootFolderId = pathRoot?.id ?? null;

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
      toast.error(getErrorMessage(error, t));
    },
  });

  const breadcrumb = (destinationsQuery.data?.breadcrumb ?? []).slice(pathRootDepth ?? 0);

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
      <div className="emm:space-y-4">
        <div className="emm:space-y-3 emm:rounded-xl emm:border emm:border-emm-neutral-200 emm:p-3">
          <p className="emm:text-sm emm:font-medium emm:text-emm-neutral-900">{t("destination_folder")}</p>

          <div className="emm:flex emm:flex-wrap emm:items-center emm:gap-1 emm:text-sm emm:text-emm-neutral-500">
            <button
              className={cn(
                "emm:inline-flex emm:cursor-pointer emm:items-center emm:gap-1 emm:rounded emm:px-1 emm:py-0.5 emm:transition emm:hover:text-emm-neutral-900",
                browseFolderId === rootFolderId && "emm:font-medium emm:text-emm-neutral-900",
              )}
              onClick={() => setBrowseFolderId(rootFolderId)}
              type="button"
            >
              <House className="emm:h-4 emm:w-4" />
              <span>{pathRoot?.name ?? t("library")}</span>
            </button>
            {breadcrumb.map((item: FolderBreadcrumbItem, index) => (
              <button
                className={cn(
                  "emm:inline-flex emm:cursor-pointer emm:items-center emm:gap-1 emm:rounded emm:px-1 emm:py-0.5 emm:transition emm:hover:text-emm-neutral-900",
                  index === breadcrumb.length - 1 && "emm:font-medium emm:text-emm-neutral-900",
                )}
                key={item.id}
                onClick={() => setBrowseFolderId(item.id)}
                type="button"
              >
                <ChevronRight className="emm:h-4 emm:w-4" />
                {item.name}
              </button>
            ))}
          </div>

          <div className="emm:rounded-xl emm:border emm:border-emm-neutral-200">
            {destinationsQuery.isLoading ? <p className="emm:px-3 emm:py-4 emm:text-sm emm:text-emm-neutral-500">{t("loading")}</p> : null}
            {destinationsQuery.error ? <p className="emm:px-3 emm:py-4 emm:text-sm emm:text-emm-danger-600">{getErrorMessage(destinationsQuery.error, t)}</p> : null}
            {!destinationsQuery.isLoading && !destinationsQuery.error && destinationFolders.length === 0 ? (
              <p className="emm:px-3 emm:py-4 emm:text-sm emm:text-emm-neutral-500">{t("move_empty_destination_folders")}</p>
            ) : null}
            {!destinationsQuery.isLoading && !destinationsQuery.error ? (
              <ul className="emm:grid emm:gap-2 emm:p-3 emm:sm:grid-cols-2 emm:lg:grid-cols-3">
                {destinationFolders.map((folder) => {
                  const disabled = isFolderDisabled(folder);

                  return (
                    <li key={folder.id}>
                      <button
                        className={cn(
                          "emm:group emm:relative emm:flex emm:w-full emm:min-w-0 emm:items-center emm:gap-3 emm:rounded-lg emm:bg-emm-item emm:px-3 emm:py-2.5 emm:text-left emm:transition emm:hover:border-emm-neutral-400 emm:hover:bg-emm-accent-50 emm:hover:shadow-sm",
                          disabled
                            ? "emm:cursor-not-allowed emm:text-emm-neutral-400"
                            : "emm:cursor-pointer emm:text-emm-neutral-900",
                        )}
                        disabled={disabled}
                        onClick={() => setBrowseFolderId(folder.id)}
                        type="button"
                      >
                        <span
                          className={cn(
                            "emm:shrink-0 emm:text-emm-neutral-500",
                            disabled && "emm:text-emm-neutral-300",
                          )}
                        >
                          <Folder className="emm:h-10 emm:w-10 emm:fill-current" />
                        </span>
                        <span className="emm:truncate emm:text-sm emm:font-medium">{folder.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <div className="emm:flex emm:flex-wrap emm:items-center emm:justify-end emm:gap-3 emm:border-t emm:border-emm-neutral-200 emm:pt-3">
            <div className="emm:text-right">
              <p className="emm:text-xs emm:font-medium emm:uppercase emm:tracking-wide emm:text-emm-neutral-500">{t("move_selected_folder")}</p>
              <p className="emm:text-sm emm:text-emm-neutral-600">
                {destinationPath ? `/${t("library")}/${destinationPath}` : `/${t("library")}`}
              </p>
              {invalidDestination ? <p className="emm:text-sm emm:text-emm-danger-600">{t("move_unavailable")}</p> : null}
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

        <div className="emm:space-y-3 emm:rounded-xl emm:border emm:border-emm-neutral-200 emm:p-3">
          <p className="emm:text-sm emm:font-medium emm:text-emm-neutral-900">{t("files_to_move_list")}</p>
          <ul className="emm:space-y-2">
            {movableList.map((item, index) => (
              <li
                className={cn(
                  "emm:flex emm:items-center emm:justify-between emm:gap-3 emm:rounded emm:px-2 emm:py-1.5 emm:text-sm",
                  index % 2 === 0 ? "emm:bg-emm-neutral-50" : "emm:bg-emm-surface",
                )}
                key={`${item.storage_path}-${index}`}
              >
                <span className="emm:truncate">{item.name}</span>
                <button
                  className="emm:shrink-0 emm:cursor-pointer emm:text-sm emm:text-emm-accent-700 emm:underline-offset-2 emm:transition emm:hover:text-emm-accent-900 emm:hover:underline"
                  onClick={() => handleRemove(index)}
                  type="button"
                >
                  {t("remove_from_list")}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {mutation.error ? <p className="emm:text-sm emm:text-emm-danger-600">{getErrorMessage(mutation.error, t)}</p> : null}
      </div>
    </ModalShell>
  );
}
