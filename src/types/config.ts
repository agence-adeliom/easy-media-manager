export interface EasyMediaMimeTypes {
  image: string[];
  archive: string[];
  [key: string]: string[];
}

export interface EasyMediaConfig {
  baseUrl?: string;
  hideFilesExt?: string[];
  mimeTypes?: EasyMediaMimeTypes;
  generatingAlts: boolean;
}

export interface EasyMediaRoutes {
  files: string;
  upload: string;
  uploadCropped: string;
  uploadLink: string;
  newFolder: string;
  deleteFile: string;
  moveFile: string;
  renameFile: string;
  editMetas: string;
  generateAlt: string;
  generateAltGroup: string;
  generateAllAlt: string;
  globalSearch: string;
  folderDownload: string;
  filesDownload: string;
}

export interface EasyMediaTranslations {
  [key: string]: string;
}

export interface EasyMediaFeatureFlags {
  enableEditor: boolean;
  enableUpload: boolean;
  enableMove: boolean;
  enableRename: boolean;
  enableMetas: boolean;
  enableDelete: boolean;
  enableBulkSelection: boolean;
  enableGeneratingAlts: boolean;
  enableSearch: boolean;
  enableFilter: boolean;
  enableSort: boolean;
}

export interface PickRestrictions {
  path?: string | null;
  uploadTypes?: string[] | null;
  uploadSize?: number | null;
}

export interface PickOptions {
  restrictions?: PickRestrictions;
  features?: Partial<EasyMediaFeatureFlags>;
}

export interface EasyMediaInitConfig {
  config: EasyMediaConfig;
  routes: EasyMediaRoutes;
  translations: EasyMediaTranslations;
  features: EasyMediaFeatureFlags;
  locale?: string;
}

export type EasyMediaConfigOverride = Partial<EasyMediaInitConfig>;

export type EasyMediaMountOptions = EasyMediaConfigOverride & {
  target: string | HTMLElement;
};
