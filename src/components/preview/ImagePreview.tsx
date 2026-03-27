import type { MediaFileItem } from "@/types/media";

export function ImagePreview({ file }: { file: MediaFileItem }) {
  return (
    <a className="cursor-alias" href={file.path} rel="noreferrer noopener" target="_blank">
      <img alt={file.metas.alt ?? file.name} className="max-h-[70vh] w-auto mx-auto rounded-xl object-contain" loading="lazy" src={file.path} />
    </a>
  );
}
