import { useEffect } from "react";

import type { MediaItem } from "@/types/media";

interface UseKeyboardOptions {
  items: MediaItem[];
  disabled?: boolean;
  hasModalOpen: boolean;
  hasInputFocus: boolean;
  hasUploadPreview?: boolean;
  onOpenSelection: () => void;
  onGoToParent: () => void;
  onMoveSelection: (nextIndex: number) => void;
  onPreviewToggle: () => void;
  onOpenEditor: () => void;
  onRefresh: () => void;
  onToggleUpload: () => void;
  onOpenNewFolder: () => void;
  onToggleBulk: () => void;
  onToggleSelectAll: () => void;
  onDelete: () => void;
  onAddToMovable: () => void;
  onOpenMoveModal: () => void;
  onToggleSidebar: () => void;
  onEscape: () => void;
  canGoToParent: boolean;
  canPreview: boolean;
  canEdit: boolean;
  canRefresh: boolean;
  canUpload: boolean;
  canCreateFolder: boolean;
  canBulk: boolean;
  isBulk: boolean;
  canDelete: boolean;
  canMove: boolean;
  canToggleSidebar: boolean;
  selectedIndex: number | null;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function nextIndexForArrow(index: number | null, key: string, length: number) {
  const currentIndex = index ?? 0;

  switch (key) {
    case "ArrowLeft":
    case "ArrowUp":
      return Math.max(0, currentIndex - 1);
    case "ArrowRight":
    case "ArrowDown":
      return Math.min(length - 1, currentIndex + 1);
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return currentIndex;
  }
}

export function useKeyboard({
  items,
  disabled = false,
  hasModalOpen,
  hasInputFocus,
  onOpenSelection,
  onGoToParent,
  onMoveSelection,
  onPreviewToggle,
  onOpenEditor,
  onRefresh,
  onToggleUpload,
  onOpenNewFolder,
  onToggleBulk,
  onToggleSelectAll,
  onDelete,
  onAddToMovable,
  onOpenMoveModal,
  onToggleSidebar,
  onEscape,
  canGoToParent,
  canPreview,
  canEdit,
  canRefresh,
  canUpload,
  canCreateFolder,
  canBulk,
  isBulk,
  canDelete,
  canMove,
  canToggleSidebar,
  selectedIndex,
}: UseKeyboardOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        disabled ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        hasInputFocus ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (hasModalOpen) {
        if (event.key === "Escape") {
          onEscape();
        }

        if (event.key === " " && canPreview) {
          event.preventDefault();
          onPreviewToggle();
        }

        if (items.length > 0 && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
          onMoveSelection(nextIndexForArrow(selectedIndex, event.key, items.length));
        }

        return;
      }

      if (event.key === "Enter") {
        onOpenSelection();
      }

      if (event.key === "Backspace" && canGoToParent) {
        event.preventDefault();
        onGoToParent();
      }

      if (items.length > 0 && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        onMoveSelection(nextIndexForArrow(selectedIndex, event.key, items.length));
      }

      if (event.key === " " && canPreview) {
        event.preventDefault();
        onPreviewToggle();
      }

      if ((event.key === "e" || event.key === "E") && canEdit) {
        onOpenEditor();
      }

      if ((event.key === "r" || event.key === "R") && canRefresh) {
        onRefresh();
      }

      if ((event.key === "u" || event.key === "U") && canUpload) {
        onToggleUpload();
      }

      if ((event.key === "n" || event.key === "N") && canCreateFolder) {
        onOpenNewFolder();
      }

      if ((event.key === "b" || event.key === "B") && canBulk) {
        onToggleBulk();
      }

      if ((event.key === "a" || event.key === "A") && isBulk) {
        onToggleSelectAll();
      }

      if ((event.key === "Delete" || event.key === "d" || event.key === "D") && canDelete) {
        onDelete();
      }

      if ((event.key === "c" || event.key === "C" || event.key === "x" || event.key === "X") && canDelete) {
        onAddToMovable();
      }

      if ((event.key === "m" || event.key === "M" || event.key === "p" || event.key === "P") && canMove) {
        onOpenMoveModal();
      }

      if ((event.key === "t" || event.key === "T") && canToggleSidebar) {
        onToggleSidebar();
      }

      if (event.key === "Escape") {
        onEscape();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    canBulk,
    canCreateFolder,
    canDelete,
    canEdit,
    canGoToParent,
    canMove,
    canPreview,
    canRefresh,
    canToggleSidebar,
    canUpload,
    disabled,
    hasInputFocus,
    hasModalOpen,
    isBulk,
    items,
    onAddToMovable,
    onDelete,
    onEscape,
    onGoToParent,
    onMoveSelection,
    onOpenEditor,
    onOpenMoveModal,
    onOpenNewFolder,
    onOpenSelection,
    onPreviewToggle,
    onRefresh,
    onToggleBulk,
    onToggleSelectAll,
    onToggleSidebar,
    onToggleUpload,
    selectedIndex,
  ]);
}
