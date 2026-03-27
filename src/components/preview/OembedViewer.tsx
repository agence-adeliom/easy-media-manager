import type { MediaFileItem } from "@/types/media";

export function OembedViewer({ file }: { file: MediaFileItem }) {
  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: String(file.metas.code?.html ?? "") }} />;
}
