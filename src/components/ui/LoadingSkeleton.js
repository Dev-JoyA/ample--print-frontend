const LoadingSkeleton = ({ type = 'card', count = 4 }) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-dark-lighter bg-slate-900">
            <div className="h-40 animate-pulse bg-slate-800 sm:h-48"></div>
            <div className="space-y-2 p-3 sm:p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-slate-800 sm:h-6"></div>
              <div className="h-3 w-full animate-pulse rounded bg-slate-800 sm:h-4"></div>
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800 sm:h-4"></div>
              <div className="mt-2 h-4 w-24 animate-pulse rounded bg-primary/20 sm:mt-4 sm:h-5"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (type === 'product') {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-slate-900/50 p-4">
            <div className="mb-4 h-48 animate-pulse rounded-lg bg-slate-800"></div>
            <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-slate-800"></div>
            <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-slate-800"></div>
            <div className="h-6 w-1/3 animate-pulse rounded bg-primary/20"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (type === 'order') {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-6 w-32 animate-pulse rounded bg-slate-800"></div>
              <div className="h-6 w-24 animate-pulse rounded bg-slate-800"></div>
            </div>
            <div className="mb-4 h-4 w-full animate-pulse rounded bg-slate-800"></div>
            <div className="flex justify-between">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-800"></div>
              <div className="h-4 w-24 animate-pulse rounded bg-slate-800"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return null;
};

export default LoadingSkeleton;