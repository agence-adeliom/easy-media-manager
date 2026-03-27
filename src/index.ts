import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

import { MediaManager } from "@/components/MediaManager";
import { takeQueuedEasyMediaPlugins } from "@/plugins/queue";
import { getPluginTranslations, lockPluginRegistry, registerPlugin, registerPlugins } from "@/plugins/registry";
import type { EasyMediaPlugin } from "@/plugins/types";
import { mediaStore } from "@/store/media-store";
import { pickStore } from "@/store/pick-store";
import type { EasyMediaInitConfig, EasyMediaTranslations, PickOptions } from "@/types/config";
import type { MediaItem } from "@/types/media";
import { enTranslations } from "@/translations/en";
import { frTranslations } from "@/translations/fr";

import "./styles/main.css";

export { enTranslations, frTranslations };

interface EasyMediaWindowApi {
  use: (plugin: EasyMediaPlugin) => void;
  useMany: (plugins: EasyMediaPlugin[]) => void;
  init: (config: EasyMediaInitConfig) => void;
  pick: (options?: PickOptions) => Promise<MediaItem | null>;
  isReady: () => boolean;
  __mountFullPage: (elementId: string) => void;
  mount?: (options: EasyMediaInitConfig & { target: string | HTMLElement }) => void;
  translations?: Partial<Record<'en' | 'fr', EasyMediaTranslations>>;
}

let root: Root | null = null;
let rootElement: HTMLElement | null = null;
let initialized = false;

function ensureRoot(): Root {
  if (root === null) {
    rootElement = document.createElement("div");
    rootElement.id = "easy-media-react-root";
    rootElement.style.display = "contents";
    document.body.appendChild(rootElement);
    root = createRoot(rootElement);
  }

  return root;
}

function render() {
  ensureRoot().render(createElement(MediaManager));
}

function init(config: EasyMediaInitConfig) {
  if (initialized) {
    return;
  }

  registerPlugins(takeQueuedEasyMediaPlugins());
  lockPluginRegistry();

  mediaStore.getState().init({
    ...config,
    translations: {
      ...getPluginTranslations(config.locale),
      ...config.translations,
    },
  });
  initialized = true;
  render();
}

function pick(options: PickOptions = {}) {
  if (!initialized) {
    throw new Error("EasyMedia not initialized. Call EasyMedia.init(config) first.");
  }

  return pickStore.getState().startPick(options);
}

function mountFullPage(elementId: string) {
  if (!initialized) {
    throw new Error("EasyMedia not initialized.");
  }

  const target = document.getElementById(elementId);

  if (target === null) {
    throw new Error(`EasyMedia target not found: #${elementId}`);
  }

  mediaStore.getState().setMode("fullpage");
  mediaStore.getState().openManager();

  if (rootElement !== null && rootElement.parentElement !== target) {
    target.appendChild(rootElement);
  }
}

const api: EasyMediaWindowApi = {
  use: registerPlugin,
  useMany: registerPlugins,
  init,
  pick,
  isReady: () => initialized,
  __mountFullPage: mountFullPage,
  translations: { en: enTranslations, fr: frTranslations },
  mount(options) {
    const { target, ...config } = options;

    init(config);

    const resolvedTarget =
      typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;

    if (resolvedTarget === null) {
      throw new Error(`EasyMedia target not found: ${target}`);
    }

    if (resolvedTarget.id === "") {
      throw new Error("EasyMedia mount target must have an id.");
    }

    mountFullPage(resolvedTarget.id);
  },
};

(window as typeof window & { EasyMedia: EasyMediaWindowApi }).EasyMedia = api;

export { api as EasyMedia };
export default api;
