import type { MediaFileItem } from "@/types/media";

export function OembedViewer({ file }: { file: MediaFileItem }) {
  const ratio = file.metas.code?.ratio;

  if (!ratio) {
    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: String(file.metas.code?.html ?? "") }} />;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: `${ratio}%` }}>
      <div
        className="absolute inset-0 [&_iframe]:!h-full [&_iframe]:!w-full"
        dangerouslySetInnerHTML={{ __html: String(file.metas.code?.html ?? "") }}
      />
    </div>
  );
}
