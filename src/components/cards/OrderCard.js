import StatusBadge from '../ui/StatusBadge';
import Image from 'next/image';

const OrderCard = ({ order, onClick }) => {
  const {
    id,
    orderNumber,
    productName,
    productImage,
    orderedDate,
    totalAmount,
    status,
  } = order;

  return (
    <div
      className="bg-dark-light rounded-lg p-4 border border-dark-lighter hover:border-primary/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Product Image/Icon */}
        <div className="w-16 h-16 bg-dark rounded-lg flex items-center justify-center flex-shrink-0">
          {productImage ? (
            <Image
              src={productImage}
              alt={productName}
              width={64}
              height={64}
              className="object-cover rounded-lg"
            />
          ) : (
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>

        {/* Order Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">
            {productName}
          </h3>
          <p className="text-sm text-gray-400 mb-2">
            {orderNumber} • Ordered on {orderedDate}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Amount</p>
              <p className="text-lg font-bold text-white">₦{totalAmount?.toLocaleString() || '0.00'}</p>
            </div>
            <StatusBadge status={status} type="order" />
          </div>
        </div>

        {/* Arrow Icon */}
        <button className="w-8 h-8 rounded-full bg-dark hover:bg-primary flex items-center justify-center transition-colors flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
