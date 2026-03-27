import type { MediaStore } from "@/store/media-store";

import type { EasyMediaPluginContext } from "@/plugins/types";

export function createPluginContext(store: MediaStore): EasyMediaPluginContext {
  return {
    runtime: {
      openModal: store.openModal,
      closeModal: store.closeModal,
      refresh: () => window.dispatchEvent(new CustomEvent("easy-media:refresh")),
    },
    mode: store.mode,
    selectedFile: store.selectedFile,
    bulkList: store.bulkList,
    bulkMode: store.bulkMode,
    features: store.features,
    routes: store.routes,
    config: store.config,
    currentFolderId: store.currentFolderId,
    currentPath: store.currentPath,
    t: store.t,
  };
}
