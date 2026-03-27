interface InfiniteLoaderProps {
  isLoading: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

export function InfiniteLoader({ isLoading, sentinelRef }: InfiniteLoaderProps) {
  return (
    <div className="flex justify-center py-4">
      <div ref={sentinelRef} className="h-6 w-6">
        {isLoading ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" /> : null}
      </div>
    </div>
  );
}
