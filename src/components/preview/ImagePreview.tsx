import type { MediaFileItem } from "@/types/media";

export function ImagePreview({ file }: { file: MediaFileItem }) {
  return (
    <a className="emm:cursor-alias" href={file.path} rel="noreferrer noopener" target="_blank">
      <img alt={file.metas.alt ?? file.name} className="emm:max-h-[70vh] emm:w-auto emm:mx-auto emm:rounded-xl emm:object-contain" loading="lazy" src={file.path} />
    </a>
  );
}
