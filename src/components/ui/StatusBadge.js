const StatusBadge = ({ status, type = 'order', className = '' }) => {
  const statusConfig = {
    order: {
      Pending: { label: 'PENDING', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      OrderReceived: {
        label: 'ORDER RECEIVED',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      },
      FilesUploaded: {
        label: 'FILES UPLOADED',
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      },
      AwaitingInvoice: {
        label: 'AWAITING INVOICE',
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      },
      InvoiceSent: {
        label: 'INVOICE SENT',
        color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      },
      DesignUploaded: {
        label: 'DESIGN UPLOADED',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      },
      UnderReview: {
        label: 'UNDER REVIEW',
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
      Approved: { label: 'APPROVED', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      AwaitingPartPayment: {
        label: 'AWAITING PAYMENT',
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
      PartPaymentMade: {
        label: 'PART PAYMENT',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      },
      InProduction: {
        label: 'IN PRODUCTION',
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      },
      Completed: {
        label: 'COMPLETED',
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
      },
      AwaitingFinalPayment: {
        label: 'AWAITING PAYMENT',
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
      FinalPaid: { label: 'PAID', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      ReadyForShipping: {
        label: 'READY TO SHIP',
        color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      },
      Shipped: { label: 'SHIPPED', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      Delivered: {
        label: 'DELIVERED',
        color: 'bg-green-600/20 text-green-500 border-green-600/30',
      },
      Cancelled: { label: 'CANCELLED', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      Designing: { label: 'DESIGNING', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      'IN DESIGN': { label: 'DESIGNING', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      PAID: { label: 'PAID', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      'IN PRODUCTION': {
        label: 'IN PRODUCTION',
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      },
      READY: { label: 'READY', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    },
    payment: {
      Pending: { label: 'UNPAID', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      PartPayment: {
        label: 'PARTIALLY PAID',
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
      Completed: { label: 'PAID', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      UNPAID: { label: 'UNPAID', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      'PARTIALLY PAID': {
        label: 'PARTIALLY PAID',
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
      PAID: { label: 'PAID', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      Failed: { label: 'FAILED', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      Refunded: { label: 'REFUNDED', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    },
    invoice: {
      Draft: { label: 'DRAFT', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      Sent: { label: 'SENT', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      PartiallyPaid: {
        label: 'PARTIALLY PAID',
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
      Paid: { label: 'PAID', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      Overdue: { label: 'OVERDUE', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      Cancelled: { label: 'CANCELLED', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      DRAFT: { label: 'DRAFT', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      SENT: { label: 'SENT', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      CLOSED: { label: 'CLOSED', color: 'bg-gray-600/20 text-gray-500 border-gray-600/30' },
    },
    due: {
      'DUE SOON': { label: 'DUE SOON', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    },
    shipping: {
      pending: { label: 'PENDING', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      shipped: { label: 'SHIPPED', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      delivered: {
        label: 'DELIVERED',
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
      },
    },
  };

  const config = statusConfig[type]?.[status] ||
    statusConfig.order[status] || {
      label: typeof status === 'string' ? status.toUpperCase() : 'UNKNOWN',
      color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold sm:px-3 sm:py-1 sm:text-sm ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
