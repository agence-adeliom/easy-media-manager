import type { ReactNode } from "react";
import { Filter, FolderSearch } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="emm:flex emm:min-h-[280px] emm:flex-col emm:items-center emm:justify-center emm:rounded-2xl emm:border emm:border-dashed emm:border-emm-neutral-300 emm:bg-emm-surface emm:px-6 emm:text-center">
      <div className="emm:mb-4 emm:rounded-full emm:bg-emm-neutral-100 emm:p-4 emm:text-emm-neutral-500">{icon ?? <FolderSearch className="emm:h-10 emm:w-10" />}</div>
      <h3 className="emm:text-lg emm:font-semibold emm:text-emm-neutral-900">{title}</h3>
      <p className="emm:mt-2 emm:max-w-md emm:text-sm emm:text-emm-neutral-600">{description}</p>
      {actionLabel && onAction ? (
        <Button className="emm:mt-5 emm:gap-2" onClick={onAction} type="button" variant="secondary">
          <Filter className="emm:h-4 emm:w-4" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
