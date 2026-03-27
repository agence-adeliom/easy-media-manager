import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type {
  EasyMediaFeatureFlags,
  EasyMediaInitConfig,
  EasyMediaRoutes,
  EasyMediaTranslations,
  EasyMediaConfig,
  PickRestrictions,
} from "@/types/config";
import { getMediaItemKey, type MediaItem } from "@/types/media";

type MediaMode = "fullpage" | "modal";
type SortDirection = 1 | -1;

interface FolderStackItem {
  id: number;
  name: string;
}

interface EasyMediaHistoryPayload {
  folderId: number | null;
  folderStack: FolderStackItem[];
  currentPath: string;
}

const DEFAULT_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  archive: ["application/zip", "application/x-rar-compressed", "application/x-7z-compressed"],
};

const DEFAULT_FEATURES: EasyMediaFeatureFlags = {
  enableBulkSelection: false,
  enableDelete: false,
  enableEditor: false,
  enableGeneratingAlts: false,
  enableMetas: false,
  enableMove: false,
  enableRename: false,
  enableUpload: false,
  enableSearch: true,
  enableFilter: true,
  enableSort: true,
};

const DEFAULT_RESTRICTIONS: PickRestrictions = {};

export interface MediaStoreState {
  config: EasyMediaConfig | null;
  routes: EasyMediaRoutes | null;
  translations: EasyMediaTranslations;
  baseFeatures: EasyMediaFeatureFlags;
  features: EasyMediaFeatureFlags;
  folderStack: FolderStackItem[];
  currentFolderId: number | null;
  currentPath: string;
  selectedFile: MediaItem | null;
  selectedIndex: number | null;
  bulkMode: boolean;
  bulkList: MediaItem[];
  mode: MediaMode;
  isOpen: boolean;
  infoSidebarOpen: boolean;
  uploadPanelOpen: boolean;
  activeModal: string | null;
  isLoading: boolean;
  searchQuery: string;
  filterName: string | null;
  sortField: string | null;
  sortDirection: SortDirection;
  useRandomNames: boolean;
  isSmallScreen: boolean;
  movableList: MediaItem[];
  uploadProgress: number;
  isUploading: boolean;
  restrictions: PickRestrictions;
}

export interface MediaStoreActions {
  init(config: EasyMediaInitConfig): void;
  pushFolder(id: number, name: string): void;
  popFolder(): void;
  goToFolder(index: number): void;
  restoreFolderState(payload: EasyMediaHistoryPayload, syncHistory?: boolean): void;
  selectFile(file: MediaItem, index: number): void;
  clearSelection(): void;
  toggleBulkMode(): void;
  disableBulkMode(): void;
  toggleBulkItem(file: MediaItem): void;
  selectAll(files: MediaItem[]): void;
  deselectAll(): void;
  setMode(mode: MediaMode): void;
  openManager(): void;
  closeManager(): void;
  openModal(name: string): void;
  closeModal(): void;
  toggleInfoSidebar(): void;
  toggleUploadPanel(): void;
  setSearch(query: string): void;
  setFilter(name: string | null): void;
  setSort(field: string | null): void;
  setMovableList(items: MediaItem[]): void;
  addToMovableList(items: MediaItem[]): void;
  removeFromMovableList(index: number): void;
  clearMovableList(): void;
  setRestrictions(restrictions: PickRestrictions): void;
  setFeatureOverrides(features: Partial<EasyMediaFeatureFlags>): void;
  resetFeatureOverrides(): void;
  setLoading(isLoading: boolean): void;
  setUploadProgress(progress: number): void;
  setUploading(isUploading: boolean): void;
  setUseRandomNames(useRandomNames: boolean): void;
  setSmallScreen(isSmallScreen: boolean): void;
  t(key: string): string;
}

export type MediaStore = MediaStoreState & MediaStoreActions;

function buildCurrentPath(folderStack: FolderStackItem[]): string {
  if (folderStack.length === 0) {
    return "";
  }

  return `/${folderStack.map((folder) => folder.name).join("/")}`;
}

function readFolderIdFromUrl(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const folderId = window.location.search ? new URLSearchParams(window.location.search).get("folder_id") : null;

  if (!folderId) {
    return null;
  }

  const parsedFolderId = Number(folderId);

  return Number.isNaN(parsedFolderId) ? null : parsedFolderId;
}

function syncUrl(folderId: number | null, payload: EasyMediaHistoryPayload, mode: "push" | "replace" = "push") {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (folderId === null) {
    url.searchParams.delete("folder_id");
  } else {
    url.searchParams.set("folder_id", String(folderId));
  }

  const state = {
    ...(window.history.state ?? {}),
    easyMedia: payload,
  };

  window.history[`${mode}State`](state, "", url);
}

function applyBaseUrl(routes: EasyMediaRoutes, baseUrl: string | undefined): EasyMediaRoutes {
  if (!baseUrl) {
    return routes;
  }

  const base = baseUrl.replace(/\/$/, "");

  return Object.fromEntries(
    Object.entries(routes).map(([key, value]) => [key, `${base}${value}`]),
  ) as EasyMediaRoutes;
}

function dedupeMediaItems(items: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getMediaItemKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

const initialState: MediaStoreState = {
  config: null,
  routes: null,
  translations: {},
  baseFeatures: DEFAULT_FEATURES,
  features: DEFAULT_FEATURES,
  folderStack: [],
  currentFolderId: null,
  currentPath: "",
  selectedFile: null,
  selectedIndex: null,
  bulkMode: false,
  bulkList: [],
  mode: "fullpage",
  isOpen: false,
  infoSidebarOpen: false,
  uploadPanelOpen: false,
  activeModal: null,
  isLoading: false,
  searchQuery: "",
  filterName: null,
  sortField: null,
  sortDirection: 1,
  useRandomNames: false,
  isSmallScreen: false,
  movableList: [],
  uploadProgress: 0,
  isUploading: false,
  restrictions: DEFAULT_RESTRICTIONS,
};

export function createMediaStore() {
  return createStore<MediaStore>()((set, get) => ({
    ...initialState,
    init({ config, routes, translations, features }) {
      const resolvedFeatures = { ...DEFAULT_FEATURES, ...features };
      const currentFolderId = readFolderIdFromUrl();

      set({
        config: {
          ...config,
          hideFilesExt: config.hideFilesExt ?? [],
          mimeTypes: { ...DEFAULT_MIME_TYPES, ...config.mimeTypes },
        },
        routes: applyBaseUrl(routes, config.baseUrl),
        translations,
        baseFeatures: resolvedFeatures,
        features: resolvedFeatures,
        currentFolderId,
      });

      syncUrl(currentFolderId, { folderId: currentFolderId, folderStack: [], currentPath: "" }, "replace");
    },
    pushFolder(id, name) {
      set((state) => {
        const folderStack = [...state.folderStack, { id, name }];
        const currentPath = buildCurrentPath(folderStack);
        const payload = {
          folderId: id,
          folderStack,
          currentPath,
        };

        syncUrl(id, payload);

        return {
          folderStack,
          currentFolderId: id,
          currentPath,
          selectedFile: null,
          selectedIndex: null,
        };
      });
    },
    popFolder() {
      set((state) => {
        const folderStack = state.folderStack.slice(0, -1);
        const currentFolder = folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;
        const currentPath = buildCurrentPath(folderStack);
        const payload = {
          folderId: currentFolder?.id ?? null,
          folderStack,
          currentPath,
        };

        syncUrl(currentFolder?.id ?? null, payload);

        return {
          folderStack,
          currentFolderId: currentFolder?.id ?? null,
          currentPath,
          selectedFile: null,
          selectedIndex: null,
        };
      });
    },
    goToFolder(index) {
      set((state) => {
        if (index < 0) {
          syncUrl(null, { folderId: null, folderStack: [], currentPath: "" });

          return {
            folderStack: [],
            currentFolderId: null,
            currentPath: "",
            selectedFile: null,
            selectedIndex: null,
          };
        }

        const folderStack = state.folderStack.slice(0, index + 1);
        const currentFolder = folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;
        const currentPath = buildCurrentPath(folderStack);
        const payload = {
          folderId: currentFolder?.id ?? null,
          folderStack,
          currentPath,
        };

        syncUrl(currentFolder?.id ?? null, payload);

        return {
          folderStack,
          currentFolderId: currentFolder?.id ?? null,
          currentPath,
          selectedFile: null,
          selectedIndex: null,
        };
      });
    },
    restoreFolderState(payload, syncHistory = false) {
      if (syncHistory) {
        syncUrl(payload.folderId, payload, "replace");
      }

      set({
        folderStack: payload.folderStack,
        currentFolderId: payload.folderId,
        currentPath: payload.currentPath,
        selectedFile: null,
        selectedIndex: null,
      });
    },
    selectFile(file, index) {
      set({ selectedFile: file, selectedIndex: index });
    },
    clearSelection() {
      set({ selectedFile: null, selectedIndex: null });
    },
    toggleBulkMode() {
      set((state) => ({
        bulkMode: !state.bulkMode,
        bulkList: [],
      }));
    },
    disableBulkMode() {
      set({
        bulkMode: false,
        bulkList: [],
        selectedFile: null,
        selectedIndex: null,
      });
    },
    toggleBulkItem(file) {
      set((state) => {
        const key = getMediaItemKey(file);
        const currentSelection =
          state.bulkList.length > 0
            ? state.bulkList
            : state.selectedFile !== null
              ? [state.selectedFile]
              : [];
        const exists = currentSelection.some((item) => getMediaItemKey(item) === key);
        const bulkList = exists
          ? currentSelection.filter((item) => getMediaItemKey(item) !== key)
          : dedupeMediaItems([...currentSelection, file]);

        return {
          bulkMode: true,
          bulkList,
          selectedFile: bulkList.length > 0 ? bulkList[bulkList.length - 1] : state.selectedFile,
          selectedIndex: bulkList.length === 0 ? null : state.selectedIndex,
        };
      });
    },
    selectAll(files) {
      set({
        bulkMode: true,
        bulkList: dedupeMediaItems(files),
        selectedFile: files[0] ?? null,
        selectedIndex: files.length > 0 ? 0 : null,
      });
    },
    deselectAll() {
      set({
        bulkList: [],
        selectedFile: null,
        selectedIndex: null,
      });
    },
    setMode(mode) {
      set({ mode });
    },
    openManager() {
      set({ isOpen: true });
    },
    closeManager() {
      set({
        isOpen: false,
        activeModal: null,
        uploadPanelOpen: false,
        infoSidebarOpen: false,
      });
    },
    openModal(name) {
      set({ activeModal: name });
    },
    closeModal() {
      set({ activeModal: null });
    },
    toggleInfoSidebar() {
      set((state) => ({ infoSidebarOpen: !state.infoSidebarOpen }));
    },
    toggleUploadPanel() {
      set((state) => ({ uploadPanelOpen: !state.uploadPanelOpen }));
    },
    setSearch(query) {
      set({ searchQuery: query });
    },
    setFilter(name) {
      set({ filterName: name });
    },
    setSort(field) {
      set((state) => {
        if (field === null) {
          return {
            sortField: null,
            sortDirection: 1,
          };
        }

        if (state.sortField === field) {
          return {
            sortField: field,
            sortDirection: state.sortDirection === 1 ? -1 : 1,
          };
        }

        return {
          sortField: field,
          sortDirection: field === "name" ? 1 : -1,
        };
      });
    },
    setMovableList(items) {
      set({
        movableList: dedupeMediaItems(items),
      });
    },
    addToMovableList(items) {
      set((state) => ({
        movableList: dedupeMediaItems([...state.movableList, ...items]),
      }));
    },
    removeFromMovableList(index) {
      set((state) => ({
        movableList: state.movableList.filter((_, itemIndex) => itemIndex !== index),
      }));
    },
    clearMovableList() {
      set({ movableList: [] });
    },
    setRestrictions(restrictions) {
      set({ restrictions: { ...restrictions } });
    },
    setFeatureOverrides(features) {
      set((state) => ({
        features: {
          ...state.baseFeatures,
          ...features,
        },
      }));
    },
    resetFeatureOverrides() {
      set((state) => ({
        features: state.baseFeatures,
      }));
    },
    setLoading(isLoading) {
      set({ isLoading });
    },
    setUploadProgress(progress) {
      set({ uploadProgress: progress });
    },
    setUploading(isUploading) {
      set({ isUploading });
    },
    setUseRandomNames(useRandomNames) {
      set({ useRandomNames });
    },
    setSmallScreen(isSmallScreen) {
      set({ isSmallScreen });
    },
    t(key) {
      return get().translations[key] ?? key;
    },
  }));
}

export const mediaStore = createMediaStore();

export function useMediaStore<T>(selector: (state: MediaStore) => T): T {
  return useStore(mediaStore, selector);
}
