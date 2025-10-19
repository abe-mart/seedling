// Skeleton loader components for better loading UX

export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-slate-200 rounded-lg p-4">
        <div className="h-5 bg-slate-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-300 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function SkeletonBookCard() {
  return (
    <div className="animate-pulse bg-slate-100 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-slate-300 rounded"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-300 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonElementCard() {
  return (
    <div className="animate-pulse border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-full"></div>
      <div className="h-4 bg-slate-200 rounded w-5/6 mt-1"></div>
    </div>
  );
}

export function SkeletonPromptCard() {
  return (
    <div className="animate-pulse border border-slate-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>
      <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-5/6 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-4/5"></div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 rounded"
          style={{ width: i === lines - 1 ? '80%' : '100%' }}
        ></div>
      ))}
    </div>
  );
}

export function SkeletonDashboardStats() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full">
        <div className="w-4 h-4 bg-slate-300 rounded"></div>
        <div className="w-8 h-4 bg-slate-300 rounded"></div>
        <div className="w-16 h-4 bg-slate-300 rounded"></div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full">
        <div className="w-4 h-4 bg-slate-300 rounded"></div>
        <div className="w-8 h-4 bg-slate-300 rounded"></div>
        <div className="w-16 h-4 bg-slate-300 rounded"></div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full">
        <div className="w-4 h-4 bg-slate-300 rounded"></div>
        <div className="w-8 h-4 bg-slate-300 rounded"></div>
        <div className="w-16 h-4 bg-slate-300 rounded"></div>
      </div>
    </div>
  );
}

export function SkeletonPromptGeneration() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          <div className="h-5 bg-slate-200 rounded w-1/4"></div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-11/12"></div>
          <div className="h-4 bg-slate-200 rounded w-10/12"></div>
          <div className="h-4 bg-slate-200 rounded w-9/12"></div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="h-6 bg-slate-200 rounded-full w-20"></div>
          <div className="h-6 bg-slate-200 rounded-full w-24"></div>
          <div className="h-6 bg-slate-200 rounded-full w-16"></div>
        </div>
      </div>
    </div>
  );
}
