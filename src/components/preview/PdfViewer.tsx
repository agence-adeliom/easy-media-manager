import type { MediaFileItem } from "@/types/media";

export function PdfViewer({ file }: { file: MediaFileItem }) {
  return <iframe className="emm:h-[70vh] emm:w-full emm:rounded-xl" src={file.path} title={file.name} />;
}
