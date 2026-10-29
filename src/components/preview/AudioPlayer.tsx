import type { MediaFileItem } from "@/types/media";

export function AudioPlayer({ file }: { file: MediaFileItem }) {
  return <audio className="emm:w-full" controls src={file.path} />;
}
