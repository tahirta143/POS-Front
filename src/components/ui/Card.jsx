import React from "react";
import { motion } from "framer-motion";

export function Card({
  children,
  className = "",
  noPadding = false,
  animate = false,
}) {
  const Component = animate ? motion.div : "div";
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <Component
      className={`bg-white/95 dark:bg-slate-900/85 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 ${className}`}
      {...animationProps}
    >
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </Component>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
  headerColor = "primary",
}) {
  const headerThemes = {
    primary:
      "border-primary-100 dark:border-primary-500/50 dark:bg-primary-600 bg-primary-50/50",
    emerald:
      "border-emerald-100 dark:border-emerald-500/50 dark:bg-emerald-600 bg-emerald-50/50",
    violet:
      "border-violet-100 dark:border-violet-500/50 dark:bg-violet-600 bg-violet-50/50",
    sky: "border-sky-100 dark:border-sky-500/50 dark:bg-sky-600 bg-sky-50/50",
    lime: "border-lime-100 dark:border-lime-500/50 dark:bg-lime-600 bg-lime-50/50",
    amber:
      "border-amber-100 dark:border-amber-500/50 dark:bg-amber-600 bg-amber-50/50",
    default: "border-slate-100 dark:border-slate-800",
  };

  return (
    <Card
      className={`flex flex-col h-full hover:-translate-y-0.5 hover:shadow-md ${className}`}
      noPadding
    >
      <div
        className={`flex items-center justify-between px-5 py-4 border-b ${headerThemes[headerColor] || headerThemes.default}`}
      >
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5 flex-1 flex flex-col">{children}</div>
    </Card>
  );
}
