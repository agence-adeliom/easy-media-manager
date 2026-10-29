import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { PickOptions } from "@/types/config";
import type { MediaItem } from "@/types/media";

import { type MediaStore, mediaStore } from "./media-store";

type FolderState = Parameters<MediaStore["restoreFolderState"]>[0];

export interface PickStoreState {
  pendingResolve: ((item: MediaItem | null) => void) | null;
  pickOptions: PickOptions | null;
  /** Folder shown before a `restrictions.path` session, given back when it ends. */
  folderBeforePick: FolderState | null;
}

export interface PickStoreActions {
  startPick(options: PickOptions): Promise<MediaItem | null>;
  resolvePick(item: MediaItem | null): void;
  cancelPick(): void;
}

export type PickStore = PickStoreState & PickStoreActions;

const initialState: PickStoreState = {
  pendingResolve: null,
  pickOptions: null,
  folderBeforePick: null,
};

export function createPickStore() {
  return createStore<PickStore>()((set, get) => ({
    ...initialState,
    startPick(options) {
      get().pendingResolve?.(null);

      return new Promise<MediaItem | null>((resolve) => {
        const mediaState = mediaStore.getState();
        const restrictedToPath = Boolean(options.restrictions?.path);

        set({
          pendingResolve: resolve,
          pickOptions: options,
          folderBeforePick: restrictedToPath
            ? { folderId: mediaState.currentFolderId, folderStack: mediaState.folderStack, currentPath: mediaState.currentPath }
            : null,
        });

        mediaState.setRestrictions(options.restrictions ?? {});
        if (restrictedToPath) {
          // No folder id: the files route resolves `restrictions.path`.
          mediaState.restoreFolderState({ folderId: null, folderStack: [], currentPath: "" });
        }
        mediaState.setFeatureOverrides(options.features ?? {});
        mediaState.setMode("modal");
        mediaState.openManager();
      });
    },
    resolvePick(item) {
      const { pendingResolve, folderBeforePick } = get();

      pendingResolve?.(item);
      set(initialState);

      const mediaState = mediaStore.getState();
      mediaState.setRestrictions({});
      if (folderBeforePick !== null) {
        mediaState.restoreFolderState(folderBeforePick, true);
      }
      mediaState.resetFeatureOverrides();
      mediaState.closeModal();
      mediaState.closeManager();
      mediaState.setMode("fullpage");
    },
    cancelPick() {
      get().resolvePick(null);
    },
  }));
}

export const pickStore = createPickStore();

export function usePickStore<T>(selector: (state: PickStore) => T): T {
  return useStore(pickStore, selector);
}
