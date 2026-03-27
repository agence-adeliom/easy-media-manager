import type { MediaFileItem } from "@/types/media";

export function PdfViewer({ file }: { file: MediaFileItem }) {
  return <iframe className="h-[70vh] w-full rounded-xl" src={file.path} title={file.name} />;
}
