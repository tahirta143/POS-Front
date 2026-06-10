export default function AccountTabBar({ tabs, activeTab, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-3 text-[13px] font-semibold transition-all border-b-2 -mb-px ${
              isActive
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
