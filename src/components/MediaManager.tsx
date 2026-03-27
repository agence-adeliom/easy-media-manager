import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FolderUp } from "lucide-react";
import { Toaster } from "sonner";

import { Breadcrumb } from "@/components/browser/Breadcrumb";
import { FileGrid } from "@/components/browser/FileGrid";
import { ImageEditor } from "@/components/editor/ImageEditor";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { EditMetasModal } from "@/components/modals/EditMetasModal";
import { MoveModal } from "@/components/modals/MoveModal";
import { NewFolderModal } from "@/components/modals/NewFolderModal";
import { RenameModal } from "@/components/modals/RenameModal";
import { UploadLinkModal } from "@/components/modals/UploadLinkModal";
import { PickerOverlay } from "@/components/picker/PickerOverlay";
import { PreviewModal } from "@/components/preview/PreviewModal";
import { InfoSidebar } from "@/components/sidebar/InfoSidebar";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { UploadZone } from "@/components/upload/UploadZone";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useFileType } from "@/hooks/use-file-type";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useResponsive } from "@/hooks/use-responsive";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/cn";
import { hasDraggedFiles } from "@/lib/file-drop";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { createPluginContext } from "@/plugins/context";
import { getPluginModalById } from "@/plugins/registry";
import { useMediaStore } from "@/store/media-store";
import { usePickStore } from "@/store/pick-store";
import type { MediaItem } from "@/types/media";
import { isFolder, isMediaFile } from "@/types/media";

function MediaManagerBody() {
  const t = useTranslations();
  const mode = useMediaStore((state) => state.mode);
  const isOpen = useMediaStore((state) => state.isOpen);
  const folderStack = useMediaStore((state) => state.folderStack);
  const selectedFile = useMediaStore((state) => state.selectedFile);
  const selectedIndex = useMediaStore((state) => state.selectedIndex);
  const features = useMediaStore((state) => state.features);
  const infoSidebarOpen = useMediaStore((state) => state.infoSidebarOpen);
  const bulkMode = useMediaStore((state) => state.bulkMode);
  const bulkList = useMediaStore((state) => state.bulkList);
  const isSmallScreen = useMediaStore((state) => state.isSmallScreen);
  const activeModal = useMediaStore((state) => state.activeModal);
  const searchQuery = useMediaStore((state) => state.searchQuery);
  const pushFolder = useMediaStore((state) => state.pushFolder);
  const popFolder = useMediaStore((state) => state.popFolder);
  const selectFile = useMediaStore((state) => state.selectFile);
  const openModal = useMediaStore((state) => state.openModal);
  const closeModal = useMediaStore((state) => state.closeModal);
  const toggleUploadPanel = useMediaStore((state) => state.toggleUploadPanel);
  const toggleInfoSidebar = useMediaStore((state) => state.toggleInfoSidebar);
  const toggleBulkMode = useMediaStore((state) => state.toggleBulkMode);
  const selectAll = useMediaStore((state) => state.selectAll);
  const deselectAll = useMediaStore((state) => state.deselectAll);
  const setMovableList = useMediaStore((state) => state.setMovableList);
  const restoreFolderState = useMediaStore((state) => state.restoreFolderState);
  const setSearch = useMediaStore((state) => state.setSearch);
  const uploadPanelOpen = useMediaStore((state) => state.uploadPanelOpen);
  const resolvePick = usePickStore((state) => state.resolvePick);
  const fileType = useFileType();
  const { uploadInputFiles } = useFileUpload();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragDepthRef = useRef(0);

  useResponsive();

  useEffect(() => {
    if (!features.enableUpload) {
      setIsDraggingFiles(false);
      dragDepthRef.current = 0;
      return;
    }

    function preventBrowserFileDrop(event: DragEvent) {
      if (!hasDraggedFiles(event)) {
        return;
      }

      event.preventDefault();
    }

    window.addEventListener("dragover", preventBrowserFileDrop);
    window.addEventListener("drop", preventBrowserFileDrop);

    return () => {
      window.removeEventListener("dragover", preventBrowserFileDrop);
      window.removeEventListener("drop", preventBrowserFileDrop);
    };
  }, [features.enableUpload]);

  useEffect(() => {
    function readFolderIdFromUrl() {
      const folderId = new URLSearchParams(window.location.search).get("folder_id");

      if (!folderId) {
        return null;
      }

      const parsedFolderId = Number(folderId);

      return Number.isNaN(parsedFolderId) ? null : parsedFolderId;
    }

    function handlePopState(event: PopStateEvent) {
      const historyState = event.state as { easyMedia?: { folderId: number | null; folderStack: { id: number; name: string }[]; currentPath: string } } | null;

      if (historyState?.easyMedia) {
        restoreFolderState(historyState.easyMedia);
        return;
      }

      restoreFolderState({
        folderId: readFolderIdFromUrl(),
        folderStack: [],
        currentPath: "",
      });
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [restoreFolderState]);

  const canPreview = useMemo(() => {
    if (selectedFile === null || !isMediaFile(selectedFile)) {
      return false;
    }

    return (
      fileType.isImage(selectedFile) ||
      fileType.isVideo(selectedFile) ||
      fileType.isAudio(selectedFile) ||
      fileType.isPdf(selectedFile) ||
      selectedFile.type.includes("text")
    );
  }, [fileType, selectedFile]);

  useKeyboard({
    items,
    hasModalOpen: activeModal !== null,
    hasInputFocus: false,
    onOpenSelection: () => {
      if (selectedFile === null) {
        return;
      }

      if (isFolder(selectedFile)) {
        pushFolder(selectedFile.id, selectedFile.name);
        return;
      }

      if (mode === "modal") {
        resolvePick(selectedFile);
      }
    },
    onGoToParent: popFolder,
    onMoveSelection: (nextIndex) => {
      const item = items[nextIndex];
      if (item) {
        selectFile(item, nextIndex);
      }
    },
    onPreviewToggle: () => {
      if (activeModal === CORE_MODAL_IDS.preview) {
        closeModal();
        return;
      }

      openModal(CORE_MODAL_IDS.preview);
    },
    onOpenEditor: () => openModal(CORE_MODAL_IDS.editor),
    onRefresh: () => window.dispatchEvent(new CustomEvent("easy-media:refresh")),
    onToggleUpload: toggleUploadPanel,
    onOpenNewFolder: () => openModal(CORE_MODAL_IDS.newFolder),
    onToggleBulk: toggleBulkMode,
    onToggleSelectAll: () => {
      if (bulkList.length === items.length) {
        deselectAll();
      } else {
        selectAll(items);
      }
    },
    onDelete: () => openModal(CORE_MODAL_IDS.delete),
    onAddToMovable: () => {
      if (bulkMode && bulkList.length > 0) {
        setMovableList(bulkList);
        return;
      }

      if (selectedFile) {
        setMovableList([selectedFile]);
      }
    },
    onOpenMoveModal: () => {
      if (bulkMode && bulkList.length > 0) {
        setMovableList(bulkList);
        openModal(CORE_MODAL_IDS.move);
        return;
      }

      if (selectedFile) {
        setMovableList([selectedFile]);
        openModal(CORE_MODAL_IDS.move);
      }
    },
    onToggleSidebar: toggleInfoSidebar,
    onEscape: () => {
      if (activeModal !== null) {
        closeModal();
        return;
      }

      if (uploadPanelOpen) {
        toggleUploadPanel();
        return;
      }

      if (searchQuery) {
        setSearch("");
        return;
      }

      if (bulkMode) {
        toggleBulkMode();
        return;
      }
    },
    canGoToParent: folderStack.length > 0,
    canPreview,
    canEdit: features.enableEditor && selectedFile !== null && isMediaFile(selectedFile) && fileType.isImage(selectedFile),
    canRefresh: true,
    canUpload: features.enableUpload,
    canCreateFolder: features.enableUpload,
    canBulk: items.length > 0,
    isBulk: bulkMode,
    canDelete: selectedFile !== null,
    canMove: (bulkMode && bulkList.length > 0) || selectedFile !== null,
    canToggleSidebar: !isSmallScreen && !bulkMode,
    selectedIndex,
  });

  if (!isOpen) {
    return null;
  }

  function handleNativeDragEnter(event: ReactDragEvent<HTMLElement>) {
    if (!features.enableUpload || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingFiles(true);
  }

  function handleNativeDragOver(event: ReactDragEvent<HTMLElement>) {
    if (!features.enableUpload || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleNativeDragLeave(event: ReactDragEvent<HTMLElement>) {
    if (!features.enableUpload || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDraggingFiles(false);
    }
  }

  function handleNativeDrop(event: ReactDragEvent<HTMLElement>) {
    if (!features.enableUpload || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFiles(false);
    void uploadInputFiles(event.dataTransfer.files);
  }

  const shell = (
    <div className="easy-media flex min-h-screen flex-col text-slate-900">
      <div className="mx-auto flex w-full flex-1 flex-col">
        <Toolbar />
        <Breadcrumb />
        <UploadZone />
        <UploadProgress />
        <div
          className={cn(
            "relative flex flex-1 gap-3 p-4",
            features.enableUpload && isDraggingFiles && "bg-sky-50/60",
          )}
          onDragEnter={handleNativeDragEnter}
          onDragLeave={handleNativeDragLeave}
          onDragOver={handleNativeDragOver}
          onDrop={handleNativeDrop}
        >
          <main className="min-w-0 flex-1">
            <FileGrid onItemsChange={setItems} />
          </main>
          {infoSidebarOpen && !isSmallScreen ? <InfoSidebar /> : null}
          {features.enableUpload && isDraggingFiles ? (
            <div className="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-sky-500 bg-sky-100/90 p-6">
              <div className="flex items-center gap-3 rounded-full bg-white/95 px-5 py-3 text-sm font-medium text-sky-900 shadow-lg">
                <FolderUp className="h-5 w-5" />
                {t("upload_to_folder_hint")}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <PreviewModal items={items} />
      <ImageEditor />
      <NewFolderModal />
      <RenameModal />
      <DeleteConfirmModal />
      <MoveModal />
      <EditMetasModal />
      <UploadLinkModal />
      <PluginModalRenderer />
    </div>
  );

  if (mode === "modal") {
    return <PickerOverlay selectedItem={selectedFile}>{shell}</PickerOverlay>;
  }

  return shell;
}

function PluginModalRenderer() {
  const store = useMediaStore((state) => state);
  const activeModal = useMediaStore((state) => state.activeModal);

  if (activeModal === null) {
    return null;
  }

  const modal = getPluginModalById(activeModal);

  if (modal === null) {
    return null;
  }

  const PluginModalComponent = modal.component;

  return <PluginModalComponent close={store.closeModal} context={createPluginContext(store)} />;
}

export function MediaManager() {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <MediaManagerBody />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
