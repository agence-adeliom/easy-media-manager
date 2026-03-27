import { getPluginModalId } from "@/lib/modal-ids";
import type { EasyMediaModalDefinition, EasyMediaPlugin, EasyMediaToolbarAction } from "@/plugins/types";

let registryLocked = false;
let registeredPlugins: EasyMediaPlugin[] = [];

function sortPlugins(plugins: EasyMediaPlugin[]): EasyMediaPlugin[] {
  return [...plugins].sort((left, right) => {
    const leftOrder = left.order ?? 100;
    const rightOrder = right.order ?? 100;

    if (leftOrder === rightOrder) {
      return left.id.localeCompare(right.id);
    }

    return leftOrder - rightOrder;
  });
}

function sortToolbarActions(actions: EasyMediaToolbarAction[]): EasyMediaToolbarAction[] {
  return [...actions].sort((left, right) => {
    const leftOrder = left.order ?? 100;
    const rightOrder = right.order ?? 100;

    if (leftOrder === rightOrder) {
      if (left.pluginId === right.pluginId) {
        return left.id.localeCompare(right.id);
      }

      return left.pluginId.localeCompare(right.pluginId);
    }

    return leftOrder - rightOrder;
  });
}

function assertPluginDefinitions(plugin: EasyMediaPlugin): void {
  for (const action of plugin.toolbarActions ?? []) {
    if (action.pluginId !== plugin.id) {
      throw new Error(`EasyMedia plugin "${plugin.id}" has a toolbar action with a mismatched pluginId.`);
    }
  }

  for (const modal of plugin.modals ?? []) {
    if (modal.pluginId !== plugin.id) {
      throw new Error(`EasyMedia plugin "${plugin.id}" has a modal with a mismatched pluginId.`);
    }
  }
}

export function registerPlugin(plugin: EasyMediaPlugin): void {
  if (registryLocked) {
    throw new Error(`EasyMedia plugin "${plugin.id}" cannot be registered after initialization.`);
  }

  if (registeredPlugins.some((registeredPlugin) => registeredPlugin.id === plugin.id)) {
    throw new Error(`EasyMedia plugin "${plugin.id}" is already registered.`);
  }

  assertPluginDefinitions(plugin);
  registeredPlugins = sortPlugins([...registeredPlugins, plugin]);
}

export function registerPlugins(plugins: EasyMediaPlugin[]): void {
  plugins.forEach(registerPlugin);
}

export function lockPluginRegistry(): void {
  registryLocked = true;
}

export function getRegisteredPlugins(): EasyMediaPlugin[] {
  return registeredPlugins;
}

export function getPluginTranslations(locale: string = 'en'): Record<string, string> {
  return registeredPlugins.reduce<Record<string, string>>((translations, plugin) => {
    if (!plugin.translations) {
      return translations;
    }

    const localeTranslations = plugin.translations[locale] ?? plugin.translations['en'] ?? {};

    return {
      ...translations,
      ...localeTranslations,
    };
  }, {});
}

export function getPluginToolbarActions(): EasyMediaToolbarAction[] {
  return sortToolbarActions(
    registeredPlugins.flatMap((plugin) => plugin.toolbarActions ?? []),
  );
}

export function getPluginModalById(modalId: string): EasyMediaModalDefinition | null {
  for (const plugin of registeredPlugins) {
    for (const modal of plugin.modals ?? []) {
      if (getPluginModalId(plugin.id, modal.id) === modalId) {
        return modal;
      }
    }
  }

  return null;
}
