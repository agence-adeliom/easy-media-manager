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
  headers?: Record<string, string>;
  /** Colors and font of the manager, see docs/THEMING.md. */
  theme?: EasyMediaTheme;
}

export type EasyMediaThemeShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/** A theme token, without the `--emm-` prefix of its custom property: `accent-600`, `surface`… */
export type EasyMediaThemeToken =
  | `${"neutral" | "accent" | "danger"}-${EasyMediaThemeShade}`
  | "surface"
  | "background"
  | "inverse"
  | "toolbar"
  | "item"
  | "font";

/** `auto` follows the system setting (`prefers-color-scheme`). */
export type EasyMediaThemeMode = "light" | "dark" | "auto";

export interface EasyMediaTheme {
  /** Light (default), dark, or the system setting. */
  mode?: EasyMediaThemeMode;
  /**
   * One color for the whole accent scale: it is shade `500`, the other shades are mixed with white or
   * black (the other way round in dark mode, where `50` is the darkest shade).
   */
  accent?: string;
  /** One color for the whole neutral scale (text, borders), same rule as `accent`. */
  neutral?: string;
  /** One color for the whole danger scale (errors, delete), same rule as `accent`. */
  danger?: string;
  /** `font-family` of the manager. */
  font?: string;
  /** Any token by name, set after the scales so it can adjust one of their shades. */
  tokens?: Partial<Record<EasyMediaThemeToken, string>>;
}

export interface EasyMediaRoutes {
  files: string;
  /** File of an id (`GET ?item=<id>`), read by `EasyMedia.getFile()`. */
  fileInfos?: string;
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

/** A MIME type (`application/pdf`) or a MIME wildcard (`image/*`). */
export type PickMimeType = `${string}/${string}`;

export type PickFileType =
  | PickMimeType
  | "all"
  | "image"
  | "images"
  | "video"
  | "videos"
  | "audio"
  | "folder"
  | "folders"
  | "text"
  | "pdf"
  | "application"
  | "applications"
  | "archive"
  | "archives"
  | "compressed"
  | "oembed";

export interface PickRestrictions {
  types?: PickFileType | PickFileType[] | null;
  /** Folder the picker opens in and cannot leave, e.g. `/products/doors`. */
  path?: string | null;
  uploadSize?: number | null;
}

export interface PickOptions {
  restrictions?: PickRestrictions;
  features?: Partial<EasyMediaFeatureFlags>;
}

export interface EasyMediaInitConfig {
  config?: EasyMediaConfig;
  routes: EasyMediaRoutes;
  translations: EasyMediaTranslations;
  features: EasyMediaFeatureFlags;
  locale?: string;
}

export type EasyMediaConfigOverride = Partial<EasyMediaInitConfig>;

export type EasyMediaMountOptions = EasyMediaConfigOverride & {
  target: string | HTMLElement;
};
