const StatusBadge = ({ status, type = 'order' }) => {
  const statusConfig = {
    order: {
      PENDING: { label: 'PENDING', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      PAID: { label: 'PAID', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      'IN DESIGN': { label: 'DESIGNING', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      APPROVED: { label: 'APPROVED', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      'IN PRODUCTION': { label: 'IN PRODUCTION', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      READY: { label: 'READY', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      DELIVERED: { label: 'DELIVERED', color: 'bg-green-600/20 text-green-500 border-green-600/30' },
      DESIGNING : { label: 'DESIGNING', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    },
    payment: {
      UNPAID: { label: 'UNPAID', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      'PARTIALLY PAID': { label: 'PARTIALLY PAID', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      PAID: { label: 'PAID', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    },
    invoice: {
      DRAFT: { label: 'DRAFT', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      SENT: { label: 'SENT', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      PAID: { label: 'PAID', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      CLOSED: { label: 'CLOSED', color: 'bg-gray-600/20 text-gray-500 border-gray-600/30' },
    },
    due: {
      'DUE SOON': { label: 'DUE SOON', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    },
  };

  const config = statusConfig[type]?.[status] || statusConfig.order[status] || {
    label: status,
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
