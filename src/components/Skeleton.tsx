import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-white/5 animate-pulse ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-70" />
    </div>
  );
};

export const SidebarSkeleton: React.FC = () => {
  return (
    <nav className="flex h-full w-16 flex-shrink-0 flex-col items-center gap-2 border-r border-white/10 bg-black/20 py-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="mt-3 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-10 rounded-xl" />
        ))}
      </div>
      <div className="mt-auto flex flex-col items-center gap-3 pb-2">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </nav>
  );
};

const WelcomeHeroSkeleton: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="flex justify-center">
          <Skeleton className="h-20 w-20 rounded-2xl" />
        </div>

        <div className="space-y-3">
          <Skeleton className="mx-auto h-9 w-44 rounded-lg" />
          <Skeleton className="mx-auto h-5 w-[520px] max-w-full rounded-lg" />
          <Skeleton className="mx-auto h-5 w-[420px] max-w-full rounded-lg" />
        </div>

        <div className="pt-4">
          <Skeleton className="mx-auto mb-4 h-4 w-24 rounded-full" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {['', '', ''].map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left"
              >
                <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
                <Skeleton className="mb-2 h-4 w-32 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="mt-1 h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          <Skeleton className="h-12 w-52 rounded-xl" />
          <Skeleton className="h-12 w-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const HomePageSkeleton: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#050505] text-white">
      <div className="flex h-full w-full">
        <SidebarSkeleton />
        <WelcomeHeroSkeleton />
      </div>
    </div>
  );
};
