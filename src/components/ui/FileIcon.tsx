import { Archive, FileAudio2, FileCode2, FileImage, FileText, FileVideo2, Globe, Paperclip } from "lucide-react";

import { useFileType } from "@/hooks/use-file-type";
import type { MediaItem } from "@/types/media";
import { isFolder } from "@/types/media";

export function FileIcon({ item, className = "h-10 w-10" }: { item: MediaItem; className?: string }) {
  const fileType = useFileType();

  if (isFolder(item)) {
    return (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
          fill="#62748e"
        />
      </svg>
    );
  }

  if (fileType.isImage(item)) {
    return <FileImage className={className} />;
  }

  if (fileType.isVideo(item)) {
    return <FileVideo2 className={className} />;
  }

  if (fileType.isAudio(item)) {
    return <FileAudio2 className={className} />;
  }

  if (fileType.isPdf(item)) {
    return <FileText className={className} />;
  }

  if (fileType.isOembed(item)) {
    return <Globe className={className} />;
  }

  if (fileType.isCompressed(item)) {
    return <Archive className={className} />;
  }

  if (item.type.includes("text")) {
    return <FileCode2 className={className} />;
  }

  return <Paperclip className={className} />;
}
