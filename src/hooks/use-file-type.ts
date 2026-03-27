import { useMediaStore } from "@/store/media-store";
import {
  fileTypeIs,
  isAudioFile,
  isCompressedFile,
  isImageFile,
  isOembedFile,
  isPdfFile,
  isVideoFile,
} from "@/lib/file-utils";
import type { FileCategory, MediaItem } from "@/types/media";

const DEFAULT_MIME_TYPES = { image: [], archive: [] };

export function useFileType() {
  const config = useMediaStore((state) => state.config);
  const mimeTypes = config?.mimeTypes ?? DEFAULT_MIME_TYPES;

  return {
    isType(item: MediaItem, category: FileCategory | string) {
      return fileTypeIs(item, category, mimeTypes);
    },
    isImage(item: MediaItem) {
      return isImageFile(item, mimeTypes);
    },
    isVideo(item: MediaItem) {
      return isVideoFile(item);
    },
    isAudio(item: MediaItem) {
      return isAudioFile(item);
    },
    isPdf(item: MediaItem) {
      return isPdfFile(item);
    },
    isOembed(item: MediaItem) {
      return isOembedFile(item);
    },
    isCompressed(item: MediaItem) {
      return isCompressedFile(item, mimeTypes);
    },
  };
}
