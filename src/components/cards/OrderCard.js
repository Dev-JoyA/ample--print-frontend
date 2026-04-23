'use client';

import StatusBadge from '../ui/StatusBadge';

const OrderCard = ({ order, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-gray-800 bg-slate-900/50 p-4 transition hover:border-primary/50 hover:shadow-lg sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-lg sm:h-12 sm:w-12 sm:text-xl">
            📦
          </div>

          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-primary sm:text-sm">
                #{order.orderNumber}
              </span>
              {order.itemsCount > 1 && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-gray-400">
                  +{order.itemsCount - 1} more
                </span>
              )}
            </div>
            <h3 className="line-clamp-1 text-sm font-medium text-white transition group-hover:text-primary sm:text-base">
              {order.productName}
            </h3>
            <p className="mt-1 text-xs text-gray-400 sm:text-sm">Ordered: {order.orderedDate}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4 md:gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-400 sm:text-sm">Total</p>
            <p className="text-base font-bold text-primary sm:text-lg">
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
