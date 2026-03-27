import type { EasyMediaPlugin } from "@/plugins/types";

export interface EasyMediaPluginHostApi {
  use(plugin: EasyMediaPlugin): void;
  useMany(plugins: EasyMediaPlugin[]): void;
  isReady(): boolean;
}

declare global {
  interface Window {
    EasyMedia?: EasyMediaPluginHostApi;
    EasyMediaPlugins?: EasyMediaPlugin[];
  }
}

function getPluginQueue(target: Window): EasyMediaPlugin[] {
  if (!Array.isArray(target.EasyMediaPlugins)) {
    target.EasyMediaPlugins = [];
  }

  return target.EasyMediaPlugins;
}

export function defineEasyMediaPlugin<TPlugin extends EasyMediaPlugin>(plugin: TPlugin): TPlugin {
  return plugin;
}

export function registerEasyMediaPlugin(plugin: EasyMediaPlugin): EasyMediaPlugin {
  if (typeof window === "undefined") {
    return plugin;
  }

  if (window.EasyMedia?.isReady()) {
    throw new Error(`EasyMedia plugin "${plugin.id}" cannot be registered after initialization.`);
  }

  if (window.EasyMedia) {
    window.EasyMedia.use(plugin);
    return plugin;
  }

  const queue = getPluginQueue(window);

  if (queue.some((queuedPlugin) => queuedPlugin.id === plugin.id)) {
    throw new Error(`EasyMedia plugin "${plugin.id}" is already queued.`);
  }

  queue.push(plugin);

  return plugin;
}

export function takeQueuedEasyMediaPlugins(): EasyMediaPlugin[] {
  if (typeof window === "undefined" || !Array.isArray(window.EasyMediaPlugins) || window.EasyMediaPlugins.length === 0) {
    return [];
  }

  const queuedPlugins = [...window.EasyMediaPlugins];
  window.EasyMediaPlugins = [];

  return queuedPlugins;
}
