import type { MediaFileItem } from "@/types/media";

export function VideoPlayer({ file }: { file: MediaFileItem }) {
  return (
    <video
      className="emm:max-h-[70vh] emm:w-full emm:rounded-lg emm:bg-emm-neutral-950 emm:emm-dark:bg-black"
      controls
      preload="metadata"
      src={file.download_url ?? file.path}
    />
  );
}
