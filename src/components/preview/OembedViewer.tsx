import type { MediaFileItem } from "@/types/media";

export function OembedViewer({ file }: { file: MediaFileItem }) {
  const ratio = file.metas.code?.ratio;

  if (!ratio) {
    return <div className="prose emm:max-w-none" dangerouslySetInnerHTML={{ __html: String(file.metas.code?.html ?? "") }} />;
  }

  return (
    <div className="emm:relative emm:w-full emm:overflow-hidden emm:rounded-lg" style={{ paddingBottom: `${ratio}%` }}>
      <div
        className="emm:absolute emm:inset-0 emm:[&_iframe]:!h-full emm:[&_iframe]:!w-full"
        dangerouslySetInnerHTML={{ __html: String(file.metas.code?.html ?? "") }}
      />
    </div>
  );
}
