const SummaryCard = ({ title, value, icon, color = 'blue', onClick }) => {
  const colorClasses = {
    blue: 'text-status-blue',
    yellow: 'text-status-yellow',
    green: 'text-status-green',
    red: 'text-status-red',
  };

  return (
    <div
      className={`bg-slate-900 rounded-lg p-6  border border-dark-lighter hover:border-${color}-500/50 transition-all cursor-pointer group`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-2">{title}</p>
          <p className={`text-xl font-bold ${colorClasses[color]}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full bg-${color}-500/20 flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      {onClick && (
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 group-hover:text-primary transition-colors">
          <span>View Details</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
