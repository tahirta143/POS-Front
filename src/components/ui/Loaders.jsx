import React from 'react';

export function Spinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "w-4 h-4 border-[2px]",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-[4px]"
  };
  
  return (
    <div className={`flex items-center justify-center py-6 ${className}`}>
      <div className={`${sizes[size] || sizes.md} border-teal-200 border-t-teal-600 rounded-full animate-spin`} />
    </div>
  );
}

export function Skeleton({ className = "", variant = "rectangular" }) {
  const baseClasses = "bg-slate-200 dark:bg-slate-800 animate-pulse";
  
  const variants = {
    text: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-xl"
  };

  return (
    <div className={`${baseClasses} ${variants[variant] || variants.rectangular} ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-3 w-20" variant="text" />
        <Skeleton className="h-8 w-8" variant="circular" />
      </div>
      <Skeleton className="h-7 w-16 mb-2" variant="text" />
      <Skeleton className="h-3 w-24" variant="text" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full">
      <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="h-4 flex-1 mx-2" variant="text" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex py-3 border-b border-slate-50 dark:border-slate-800/50">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={`cell-${rowIdx}-${colIdx}`} className="h-4 flex-1 mx-2" variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
}
