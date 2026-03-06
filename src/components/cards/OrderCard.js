'use client';

import StatusBadge from '../ui/StatusBadge';

const OrderCard = ({ order, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 hover:border-primary/50 hover:shadow-xl transition cursor-pointer group"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Product Image */}
          <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
            {order.productImage ? (
              <img
                src={order.productImage}
                alt={order.productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/64?text=📦';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                📦
              </div>
            )}
          </div>

          {/* Order Info */}
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-primary transition">
              {order.orderNumber}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {order.productName} • {order.itemsCount > 1 ? `${order.itemsCount} items` : '1 item'}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="text-right">
            <p className="text-sm text-gray-400">Order Date</p>
            <p className="text-white font-medium">{order.orderedDate}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total Amount</p>
            <p className="text-lg font-bold text-primary">
              ₦{order.totalAmount?.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            {order.paymentStatus && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                order.paymentStatus === 'Completed' ? 'bg-green-600/20 text-green-400' :
                order.paymentStatus === 'PartPayment' ? 'bg-yellow-600/20 text-yellow-400' :
                'bg-gray-600/20 text-gray-400'
              }`}>
                {order.paymentStatus}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;