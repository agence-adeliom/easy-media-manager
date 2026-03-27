import type { MediaFileItem } from "@/types/media";

export function VideoPlayer({ file }: { file: MediaFileItem }) {
  return (
    <video
      className="max-h-[70vh] w-full rounded-lg bg-slate-950"
      controls
      preload="metadata"
      src={file.download_url ?? file.path}
    />
  );
}
