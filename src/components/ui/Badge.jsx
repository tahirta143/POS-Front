import React from 'react';

export function Badge({ children, tone = "slate", className = "" }) {
  const tones = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    rose: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    primary: "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800",
    slate: "bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  };

  const selectedTone = tones[tone] || tones.slate;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-solid ${selectedTone} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = "" }) {
  const statusMap = {
    Completed: "emerald",
    Pending: "amber",
    Rejected: "rose",
    Paid: "emerald",
    Partial: "amber",
    Active: "primary",
    Inactive: "rose"
  };
  
  return (
    <Badge tone={statusMap[status] || "slate"} className={className}>
      {status}
    </Badge>
  );
}
