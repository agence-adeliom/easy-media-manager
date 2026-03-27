import { useState } from "react";

export function useClipboard() {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
  }

  return {
    copiedValue,
    copy,
  };
}
