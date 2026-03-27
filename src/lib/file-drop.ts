import type { DragEvent as ReactDragEvent } from "react";

export function hasDraggedFiles(event: DragEvent | ReactDragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}
