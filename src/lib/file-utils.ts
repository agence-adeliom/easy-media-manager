import type { EasyMediaConfig } from "@/types/config";
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
    case "text":
      return files.filter((item) => fileTypeIs(item, "text", mimeTypes) || fileTypeIs(item, "pdf", mimeTypes));
    case "application":
      return files.filter(
        (item) => fileTypeIs(item, "application", mimeTypes) || fileTypeIs(item, "compressed", mimeTypes),
      );
    default:
      return files.filter((item) => fileTypeIs(item, filterName, mimeTypes));
  }
}
