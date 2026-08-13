import React from 'react';

export const SidebarSkeleton: React.FC = () => {
  return (
    <nav className="skeleton-rail flex h-full w-16 flex-shrink-0 flex-col items-center gap-2 py-4" aria-hidden="true">
      <div className="skeleton-block skeleton-rail__logo h-10 w-10" />
      <div className="mt-3 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton-block h-10 w-10 skeleton-rail__item" />
        ))}
      </div>
      <div className="mt-auto flex flex-col items-center gap-3 pb-2">
        <div className="skeleton-block h-10 w-10" />
        <div className="skeleton-block h-10 w-10" />
      </div>
    </nav>
  );
};

const WelcomeHeroSkeleton: React.FC = () => {
  return (
    <div className="skeleton-hero flex h-full w-full items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="flex justify-center">
          <div className="skeleton-block h-20 w-20" />
        </div>

        <div className="space-y-3">
          <div className="skeleton-block mx-auto h-9 w-44" />
          <div className="skeleton-block mx-auto h-5 w-[520px] max-w-full" />
          <div className="skeleton-block mx-auto h-5 w-[420px] max-w-full" />
        </div>

        <div className="pt-4">
          <div className="skeleton-block mx-auto mb-4 h-4 w-24" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {['', '', ''].map((_, index) => (
              <div key={index} className="skeleton-hero__card p-4 text-left">
                <div className="skeleton-block mb-3 h-10 w-10" />
                <div className="skeleton-block mb-2 h-4 w-32" />
                <div className="skeleton-block h-3 w-full" />
                <div className="skeleton-block mt-1 h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          <div className="skeleton-block h-12 w-52" />
          <div className="skeleton-block h-12 w-44" />
        </div>
      </div>
    </div>
  );
};

export const HomePageSkeleton: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[rgb(var(--bg))] text-fg">
      <div className="flex h-full w-full">
        <SidebarSkeleton />
        <WelcomeHeroSkeleton />
      </div>
    </div>
  );
};
