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
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-500">{icon ?? <FolderSearch className="h-10 w-10" />}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5 gap-2" onClick={onAction} type="button" variant="secondary">
          <Filter className="h-4 w-4" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
