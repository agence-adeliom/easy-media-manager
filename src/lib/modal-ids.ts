export const CORE_MODAL_IDS = {
  delete: "core:delete",
  editMetas: "core:edit-metas",
  editor: "core:editor",
  move: "core:move",
  newFolder: "core:new-folder",
  preview: "core:preview",
  rename: "core:rename",
  uploadLink: "core:upload-link",
} as const;

export function getPluginModalId(pluginId: string, modalId: string): string {
  return `plugin:${pluginId}:${modalId}`;
}
