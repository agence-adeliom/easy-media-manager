export interface MediaCodeMeta {
  html: string;
  ratio?: number;
}

export interface MediaNamedLinkMeta {
  name: string;
  url?: string;
}

export interface MediaTagsMeta {
  title?: string;
  album?: string;
  artist?: string;
  genre?: string;
  year?: string;
}

export interface MediaDimensionsMeta {
  width?: number;
  height?: number;
}

export interface MediaMetas {
  alt?: string;
  title?: string;
  description?: string;
  icon?: string;
  code?: MediaCodeMeta;
  provider?: MediaNamedLinkMeta;
  author?: MediaNamedLinkMeta;
  type?: string;
  url?: string;
  duration?: number;
  tags?: MediaTagsMeta;
  dimensions?: MediaDimensionsMeta;
  extra?: Record<string, string>;
  [key: string]: unknown;
}

export interface FolderItem {
  id: number;
  name: string;
  type: "folder";
  path: string;
  storage_path: string;
}

export interface MediaFileItem {
  id: number;
  name: string;
  type: string;
  size: number;
  path: string;
  download_url: string | null;
  storage_path: string;
  last_modified: number | string | null;
  last_modified_formated: string;
  metas: MediaMetas;
}

export type MediaItem = FolderItem | MediaFileItem;

export interface GlobalSearchItem {
  name: string;
  type: string | null;
  path: string;
  dir_path: string;
  storage_path: string;
  size: number | null;
  last_modified: number | null;
  last_modified_formated: string;
}

export type FileCategory =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "text"
  | "application"
  | "compressed"
  | "oembed"
  | "folder";

export function isFolder(item: MediaItem): item is FolderItem {
  return item.type === "folder";
}

export function isMediaFile(item: MediaItem): item is MediaFileItem {
  return item.type !== "folder";
}

export function getMediaItemKey(item: MediaItem): string {
  return `${item.type}-${item.id}`;
}
