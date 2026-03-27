import type { PropsWithChildren, ReactNode } from "react";

import { ModalShell } from "./ModalShell";

interface PluginModalShellProps {
  close: () => void;
  title: string;
  widthClassName?: string;
  bodyClassName?: string;
  titlePrefix?: ReactNode;
}

export function PluginModalShell({ close, children, ...rest }: PropsWithChildren<PluginModalShellProps>) {
  return (
    <ModalShell open onClose={close} {...rest}>
      {children}
    </ModalShell>
  );
}
