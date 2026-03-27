import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { PickOptions } from "@/types/config";
import type { MediaItem } from "@/types/media";

import { mediaStore } from "./media-store";

export interface PickStoreState {
  pendingResolve: ((item: MediaItem | null) => void) | null;
  pickOptions: PickOptions | null;
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
};

export function createPickStore() {
  return createStore<PickStore>()((set, get) => ({
    ...initialState,
    startPick(options) {
      get().pendingResolve?.(null);

      return new Promise<MediaItem | null>((resolve) => {
        set({
          pendingResolve: resolve,
          pickOptions: options,
        });

        const mediaState = mediaStore.getState();
        mediaState.setRestrictions(options.restrictions ?? {});
        mediaState.setFeatureOverrides(options.features ?? {});
        mediaState.setMode("modal");
        mediaState.openManager();
      });
    },
    resolvePick(item) {
      const { pendingResolve } = get();

      pendingResolve?.(item);
      set(initialState);

      const mediaState = mediaStore.getState();
      mediaState.setRestrictions({});
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
