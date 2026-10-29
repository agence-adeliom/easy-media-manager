interface InfiniteLoaderProps {
  isLoading: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

export function InfiniteLoader({ isLoading, sentinelRef }: InfiniteLoaderProps) {
  return (
    <div className="emm:flex emm:justify-center emm:py-4">
      <div ref={sentinelRef} className="emm:h-6 emm:w-6">
        {isLoading ? <div className="emm:h-6 emm:w-6 emm:animate-spin emm:rounded-full emm:border-2 emm:border-emm-neutral-300 emm:border-t-emm-neutral-900" /> : null}
      </div>
    </div>
  );
}
