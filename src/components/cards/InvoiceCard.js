'use client';

import StatusBadge from '../ui/StatusBadge';

const InvoiceCard = ({ invoice, onClick }) => {
  const getDueStatus = () => {
    if (invoice.dueSoon) {
      return <span className="text-xs text-yellow-400 ml-2">Due soon</span>;
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-mono text-primary">{invoice.invoiceNumber}</p>
          <div className="flex items-center mt-1">
            <StatusBadge status={invoice.status} className="text-xs" />
            {getDueStatus()}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Balance</p>
          <p className="text-lg font-bold text-primary">
            ₦{invoice.balance?.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="text-sm text-primary group-hover:text-primary-dark transition">
          Pay Now →
        </button>
      </div>
    </div>
  );
};

export default InvoiceCard;