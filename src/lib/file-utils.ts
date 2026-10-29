import type { EasyMediaConfig, PickFileType, PickMimeType } from "@/types/config";
import type { FileCategory, MediaItem } from "@/types/media";

type MimeTypes = EasyMediaConfig["mimeTypes"];
type HideExtensionConfig = boolean | string[];

function compareValues(left: number | string | null, right: number | string | null, direction: 1 | -1): number {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  if (typeof left === "number" && typeof right === "number") {
    return (left - right) * direction;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  }) * direction;
}

function resolveSortValue(item: MediaItem, field: string): number | string | null {
  switch (field) {
    case "size":
      return "size" in item ? item.size : null;
    case "last_modified":
      return "last_modified" in item ? item.last_modified : null;
    case "type":
      return item.type;
    case "name":
    default:
      return item.name;
  }
}

export function fileTypeIs(
  item: MediaItem,
  category: FileCategory | string,
  mimeTypes: MimeTypes,
): boolean {
  if (category === "folder") {
    return item.type === "folder";
  }

  const type = item?.type;

  if (!type || !mimeTypes) {
    return false;
  }

  let normalizedCategory = category;
  if (normalizedCategory.includes("/*")) {
    normalizedCategory = normalizedCategory.split("/")[0] ?? normalizedCategory;
  }

  if (normalizedCategory === "image" && mimeTypes.image.includes(type)) {
    return true;
  }

  if (type.includes("oembed") && normalizedCategory !== "oembed") {
    return false;
  }

  if (type.includes("pdf") && normalizedCategory !== "pdf") {
    return false;
  }

  if (type.includes("compressed") || mimeTypes.archive.includes(type)) {
    return normalizedCategory === "compressed";
  }

  return type.includes(normalizedCategory);
}

export function getFileSize(bytes: number): string {
  if (bytes === 0) {
    return "N/A";
  }

  const k = 1000;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const index = Math.floor(Math.log(bytes) / Math.log(k));
  const result = Number.parseFloat((bytes / Math.pow(k, index)).toFixed(2));

  return `${result} ${sizes[index]}`;
}

export function getExtension(filename: string): string | null {
  const index = filename.lastIndexOf(".");

  return index > 0 ? filename.substring(index + 1) : null;
}

function hasExtension(item: MediaItem, extensions: string[]): boolean {
  const extension = getExtension(item.name)?.toLowerCase();
  return extension ? extensions.includes(extension) : false;
}

export function getFileName(filename: string, hideExt: HideExtensionConfig): string {
  if (hideExt === false) {
    return filename;
  }

  const extension = getExtension(filename);
  if (extension === null) {
    return filename;
  }

  if (Array.isArray(hideExt) && !hideExt.includes(extension)) {
    return filename;
  }

  return filename.replace(/(.[^.]*)$/, "");
}

export function isImageFile(item: MediaItem, mimeTypes: MimeTypes): boolean {
  return fileTypeIs(item, "image", mimeTypes) || hasExtension(item, ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"]);
}

export function isVideoFile(item: MediaItem): boolean {
  return item.type.includes("video") || hasExtension(item, ["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv"]);
}

export function isAudioFile(item: MediaItem): boolean {
  return item.type.includes("audio") || hasExtension(item, ["mp3", "wav", "ogg", "m4a", "aac", "flac"]);
}

export function isPdfFile(item: MediaItem): boolean {
  return item.type.includes("pdf") || hasExtension(item, ["pdf"]);
}

export function isOembedFile(item: MediaItem): boolean {
  return item.type.includes("oembed");
}

export function isCompressedFile(item: MediaItem, mimeTypes: MimeTypes): boolean {
  return fileTypeIs(item, "compressed", mimeTypes);
}

export function filterByHiddenExt(files: MediaItem[], hideFilesExt: string[]): MediaItem[] {
  if (hideFilesExt.length === 0) {
    return files;
  }

  const lower = hideFilesExt.map((ext) => ext.toLowerCase());

  return files.filter((item) => {
    if (item.type === "folder") {
      return true;
    }

    return !lower.some((ext) => item.name.toLowerCase().endsWith(ext));
  });
}

const FILE_CATEGORIES: FileCategory[] = ["image", "video", "audio", "pdf", "text", "application", "compressed", "oembed", "folder"];

function isPickMimeType(type: PickFileType): type is PickMimeType {
  return type.includes("/");
}

/**
 * `image/*` matches every `image/…` type, `application/pdf` only itself. A backend that returns the category as
 * `type` (`image`) also matches the wildcard of that category.
 */
export function matchesMimeType(type: string, mimeType: PickMimeType): boolean {
  const normalizedType = type.toLowerCase();
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.endsWith("/*")) {
    const family = normalizedMimeType.slice(0, -2);

    return normalizedType === family || normalizedType.startsWith(`${family}/`);
  }

  return normalizedType === normalizedMimeType;
}

function toPickTypeList(pickTypes: PickFileType | PickFileType[] | null | undefined): PickFileType[] {
  if (!pickTypes) {
    return [];
  }

  return Array.isArray(pickTypes) ? pickTypes : [pickTypes];
}

function resolvePickMimeTypes(pickTypes: PickFileType | PickFileType[] | null | undefined): PickMimeType[] {
  return toPickTypeList(pickTypes).filter(isPickMimeType);
}

function normalizePickFileType(type: PickFileType): FileCategory | null {
  if (isPickMimeType(type)) {
    return null;
  }

  switch (type) {
    case "all":
      return null;
    case "images":
      return "image";
    case "videos":
      return "video";
    case "folders":
      return "folder";
    case "applications":
      return "application";
    case "archive":
    case "archives":
      return "compressed";
    default:
      return type;
  }
}

function resolvePickCategories(pickTypes: PickFileType | PickFileType[] | null | undefined): FileCategory[] {
  const categories = toPickTypeList(pickTypes)
    .map(normalizePickFileType)
    .filter((type): type is FileCategory => type !== null);

  return Array.from(new Set(categories));
}

/** Categories of the toolbar filter allowed by `restrictions.types`, MIME types included; `null` when all are. */
export function resolvePickFilterTypes(
  pickTypes: PickFileType | PickFileType[] | null | undefined,
  mimeTypes: MimeTypes,
): FileCategory[] | null {
  const categories = resolvePickCategories(pickTypes);

  for (const mimeType of resolvePickMimeTypes(pickTypes)) {
    const sample = { type: mimeType } as MediaItem;

    categories.push(...FILE_CATEGORIES.filter((category) => fileTypeIs(sample, category, mimeTypes)));
  }

  return categories.length === 0 ? null : Array.from(new Set(categories));
}

/** Whether `restrictions.types` allows a file of this type; `true` when there is no restriction. */
export function isPickTypeAllowed(
  type: string,
  pickTypes: PickFileType | PickFileType[] | null | undefined,
  mimeTypes: MimeTypes,
): boolean {
  const categories = resolvePickCategories(pickTypes);
  const pickMimeTypes = resolvePickMimeTypes(pickTypes);

  if (categories.length === 0 && pickMimeTypes.length === 0) {
    return true;
  }

  const sample = { type } as MediaItem;

  return (
    categories.some((category) => fileTypeIs(sample, category, mimeTypes)) ||
    pickMimeTypes.some((mimeType) => matchesMimeType(type, mimeType))
  );
}

const ACCEPT_BY_CATEGORY: Partial<Record<FileCategory, string>> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  pdf: "application/pdf",
  text: "text/*",
};

/** `accept` attribute of the upload input for `restrictions.types`; `undefined` when a type cannot be expressed. */
export function resolvePickAccept(pickTypes: PickFileType | PickFileType[] | null | undefined): string | undefined {
  const categories = resolvePickCategories(pickTypes).filter((category) => category !== "folder");
  const accepted = categories.map((category) => ACCEPT_BY_CATEGORY[category]);

  if (accepted.includes(undefined)) {
    return undefined;
  }

  const values = [...accepted, ...resolvePickMimeTypes(pickTypes)];

  return values.length > 0 ? values.join(",") : undefined;
}

export function filterByPickTypes(
  files: MediaItem[],
  pickTypes: PickFileType | PickFileType[] | null | undefined,
  mimeTypes: MimeTypes,
): MediaItem[] {
  const categories = resolvePickCategories(pickTypes);
  const pickMimeTypes = resolvePickMimeTypes(pickTypes);

  if (categories.length === 0 && pickMimeTypes.length === 0) {
    return [...files];
  }

  const onlyFolders = pickMimeTypes.length === 0 && categories.length === 1 && categories[0] === "folder";

  return files.filter((item) => {
    if (item.type === "folder" && !onlyFolders) {
      return true;
    }

    return isPickTypeAllowed(item.type, pickTypes, mimeTypes);
  });
}

export function sortFiles(files: MediaItem[], field: string | null, direction: 1 | -1): MediaItem[] {
  if (field === null) {
    return [...files];
  }

  return [...files].sort((left, right) =>
    compareValues(resolveSortValue(left, field), resolveSortValue(right, field), direction),
  );
}

export function filterByType(
  files: MediaItem[],
  filterName: string | null,
  mimeTypes: MimeTypes,
): MediaItem[] {
  if (filterName === null || filterName === "non" || filterName === "selected") {
    return [...files];
  }

  switch (filterName) {
    default:
      return files.filter((item) => fileTypeIs(item, filterName, mimeTypes));
  }
}
