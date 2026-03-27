import type { ComponentType } from "react";

import type { EasyMediaConfig, EasyMediaFeatureFlags, EasyMediaRoutes } from "@/types/config";
import type { MediaItem } from "@/types/media";

export type EasyMediaManagerMode = "fullpage" | "modal";

export interface EasyMediaPluginRuntime {
  openModal(modalId: string): void;
  closeModal(): void;
  refresh(): void;
}

export interface EasyMediaPluginContext {
  runtime: EasyMediaPluginRuntime;
  mode: EasyMediaManagerMode;
  selectedFile: MediaItem | null;
  bulkList: MediaItem[];
  bulkMode: boolean;
  features: EasyMediaFeatureFlags;
  routes: EasyMediaRoutes | null;
  config: EasyMediaConfig | null;
  currentFolderId: number | null;
  currentPath: string;
  t(key: string): string;
}

export interface EasyMediaPluginModalProps {
  close: () => void;
  context: EasyMediaPluginContext;
}

export interface EasyMediaToolbarAction {
  id: string;
  pluginId: string;
  icon: ComponentType<{ className?: string }>;
  labelKey: string;
  section?: "primary" | "selection" | "utility";
  order?: number;
  isVisible(context: EasyMediaPluginContext): boolean;
  isDisabled?(context: EasyMediaPluginContext): boolean;
  onClick(context: EasyMediaPluginContext): void;
}

export interface EasyMediaModalDefinition {
  id: string;
  pluginId: string;
  component: ComponentType<EasyMediaPluginModalProps>;
}

export interface EasyMediaPlugin {
  id: string;
  order?: number;
  translations?: Record<string, Record<string, string>>;
  toolbarActions?: EasyMediaToolbarAction[];
  modals?: EasyMediaModalDefinition[];
}
