import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';

const InvoiceCard = ({ invoice, onPay }) => {
  const {
    id,
    invoiceNumber,
    balance,
    status,
    dueDate,
    dueSoon = false,
  } = invoice;

  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-dark-lighter hover:border-primary/50 transition-all relative">
      {/* Due Soon Badge */}
      {dueSoon && (
        <div className="absolute top-2 right-2">
          <StatusBadge status="DUE SOON" type="due" />
        </div>
      )}

      <div className="space-y-4">
        {/* Invoice Number */}
        <div>
          <h3 className="text-lg font-medium text-white mb-1">{invoiceNumber}</h3>
          {/* {status && (
            <StatusBadge status={status} type="invoice" />
          )} */}
        </div>

        {/* Balance */}
        <div className='flex space-x-2 items-center'>
            <p className="text-xl font-bold text-white">₦{balance?.toLocaleString() || '0.00'}</p>
            <p className="text-sm text-gray-400 mb-1">Balance</p>
        </div>

        {/* Due Date */}
        {dueDate && (
          <p className="text-xs text-gray-500">Due: {dueDate}</p>
        )}

        {/* Pay Button */}
        {/* {onPay && ( */}
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => onPay(invoice)}
          >
            Pay Invoice
          </Button>
        {/* )} */}
      </div>
    </div>
  );
};

export default InvoiceCard;
