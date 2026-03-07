'use client';

import StatusBadge from '../ui/StatusBadge';

const OrderCard = ({ order, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition cursor-pointer group"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
            📦
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-primary">
                #{order.orderNumber}
              </span>
              {order.itemsCount > 1 && (
                <span className="text-xs bg-slate-800 text-gray-400 px-2 py-0.5 rounded-full">
                  +{order.itemsCount - 1} more
                </span>
              )}
            </div>
            <h3 className="text-white font-medium group-hover:text-primary transition line-clamp-1">
              {order.productName}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Ordered: {order.orderedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-lg font-bold text-primary">
              ₦{order.totalAmount?.toLocaleString()}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>
    </div>
  );
};

export default OrderCard;