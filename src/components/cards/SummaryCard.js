const SummaryCard = ({ title, value, icon, color = 'blue', onClick }) => {
  const colorClasses = {
    blue: 'text-status-blue',
    yellow: 'text-status-yellow',
    green: 'text-status-green',
    red: 'text-status-red',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    teal: 'text-teal-400',
    indigo: 'text-indigo-400',
  };

  const bgColorClasses = {
    blue: 'bg-blue-500/20',
    yellow: 'bg-yellow-500/20',
    green: 'bg-green-500/20',
    red: 'bg-red-500/20',
    purple: 'bg-purple-500/20',
    orange: 'bg-orange-500/20',
    teal: 'bg-teal-500/20',
    indigo: 'bg-indigo-500/20',
  };

  const borderColorClasses = {
    blue: 'hover:border-blue-500/50',
    yellow: 'hover:border-yellow-500/50',
    green: 'hover:border-green-500/50',
    red: 'hover:border-red-500/50',
    purple: 'hover:border-purple-500/50',
    orange: 'hover:border-orange-500/50',
    teal: 'hover:border-teal-500/50',
    indigo: 'hover:border-indigo-500/50',
  };

  return (
    <div
      className={`group cursor-pointer rounded-lg border border-dark-lighter bg-slate-900 p-4 transition-all hover:${borderColorClasses[color]} sm:p-5 md:p-6`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <p className="mb-1 text-xs text-gray-400 sm:mb-2 sm:text-sm">{title}</p>
          <p className={`text-base font-bold ${colorClasses[color]} sm:text-lg md:text-xl`}>
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColorClasses[color]} sm:h-12 sm:w-12`}
        >
          <span className="text-lg sm:text-xl md:text-2xl">{icon}</span>
        </div>
      </div>
      {onClick && (
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 transition-colors group-hover:text-primary sm:mt-4 sm:gap-2 sm:text-sm">
          <span>View Details</span>
          <svg
            className="h-3 w-3 sm:h-4 sm:w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
