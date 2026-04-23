'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

const InvoiceCard = ({
  invoice,
  onPay,
  onDownload,
  formatCurrency = (amount) => `₦${amount?.toLocaleString() || '0'}`,
  getStatusColor = (status) => {
    const colors = {
      Draft: 'gray',
      Sent: 'blue',
      Pending: 'yellow',
      PartiallyPaid: 'orange',
      Paid: 'green',
      Overdue: 'red',
      Cancelled: 'gray',
      Received: 'blue',
      Processing: 'gray',
    };
    return colors[status] || 'gray';
  },
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  console.log('InvoiceCard received:', {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: invoice.totalAmount,
    amountPaid: invoice.amountPaid,
    remainingAmount: invoice.remainingAmount,
    status: invoice.status,
    invoiceType: invoice.invoiceType,
    originalStatus: invoice.originalStatus,
  });

  const totalAmount = invoice.totalAmount || invoice.amount || 0;
  const paidAmount = invoice.amountPaid || 0;
  const remainingAmount = invoice.remainingAmount || totalAmount - paidAmount;
  const depositAmount = invoice.depositAmount || 0;
  const isFullyPaid = remainingAmount <= 0 || invoice.status === 'Paid';

  const getDisplayStatus = () => {
    const originalStatus = invoice.originalStatus || invoice.status;
    if (originalStatus === 'Sent') return 'Received';
    if (originalStatus === 'Draft') return 'Processing';
    return originalStatus;
  };

  const displayStatus = getDisplayStatus();

  const getBadgeColor = () => {
    const originalStatus = invoice.originalStatus || invoice.status;
    const colors = {
      Draft: 'gray',
      Sent: 'blue',
      Pending: 'yellow',
      PartiallyPaid: 'orange',
      Paid: 'green',
      Overdue: 'red',
      Cancelled: 'gray',
    };
    return colors[originalStatus] || 'gray';
  };

  const badgeColor = getBadgeColor();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50 backdrop-blur-sm transition-all hover:border-gray-700">
      <div className="border-b border-gray-800 p-4 sm:p-5 md:p-6">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2 sm:mb-4">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-xs text-gray-400 sm:text-sm">Invoice</p>
              {invoice.invoiceType === 'shipping' && (
                <span className="rounded-full border border-teal-700 bg-teal-600/20 px-2 py-0.5 text-xs text-teal-400">
                  Shipping
                </span>
              )}
              {invoice.invoiceType === 'main' && (
                <span className="rounded-full border border-blue-700 bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">
                  Order
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white sm:text-lg md:text-xl">
              {invoice.invoiceNumber || 'N/A'}
            </h3>
            {invoice.orderNumber && (
              <p className="mt-1 text-xs text-gray-500">Order: {invoice.orderNumber}</p>
            )}
          </div>
          <span
            className={`inline-block rounded-full px-2 py-1 text-xs font-medium sm:px-3 bg-${badgeColor}-900/50 text-${badgeColor}-400 border border-${badgeColor}-700`}
          >
            {displayStatus}
          </span>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-xs text-gray-400 sm:text-sm">Total:</span>
            <span className="text-base font-bold text-white sm:text-lg">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {paidAmount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs text-gray-400 sm:text-sm">Paid:</span>
              <span className="text-sm font-semibold text-green-400 sm:text-base">
                {formatCurrency(paidAmount)}
              </span>
            </div>
          )}

          {depositAmount > 0 && paidAmount === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs text-gray-400 sm:text-sm">Deposit Required:</span>
              <span className="text-sm font-semibold text-yellow-400 sm:text-base">
                {formatCurrency(depositAmount)}
              </span>
            </div>
          )}

          {!isFullyPaid && remainingAmount > 0 && (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-1 border-t border-gray-800 pt-1 sm:mt-2 sm:pt-2">
              <span className="text-xs font-medium text-gray-300 sm:text-sm">Remaining:</span>
              <span className="text-base font-bold text-primary sm:text-lg">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs sm:mt-4 sm:text-sm">
          <div className="flex flex-wrap justify-between gap-1">
            <span className="text-gray-400">Issued:</span>
            <span className="text-white">{formatDate(invoice.createdAt || invoice.issueDate)}</span>
          </div>
          {invoice.dueDate && !isFullyPaid && (
            <div className="mt-1 flex flex-wrap justify-between gap-1">
              <span className="text-gray-400">Due:</span>
              <span className="text-white">{formatDate(invoice.dueDate)}</span>
            </div>
          )}
        </div>
      </div>

      {invoice.items && invoice.items.length > 0 && (
        <div className="border-b border-gray-800">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between px-4 py-2 text-xs text-gray-400 transition-colors hover:text-white sm:px-5 sm:py-2.5 sm:text-sm md:px-6 md:py-3"
          >
            <span>View Items ({invoice.items.length})</span>
            <svg
              className={`h-4 w-4 transform transition-transform sm:h-5 sm:w-5 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {expanded && (
            <div className="space-y-2 px-4 pb-3 sm:px-5 sm:pb-4 md:px-6">
              {invoice.items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-wrap justify-between gap-1 text-xs sm:text-sm"
                >
                  <span className="text-gray-400">
                    {item.description} x{item.quantity}
                  </span>
                  <span className="text-white">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          {!isFullyPaid && invoice.status !== 'Cancelled' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPay(invoice)}
              className="w-full sm:flex-1"
            >
              Pay Now
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDownload(invoice)}
            className="w-full sm:flex-1"
            icon="📥"
          >
            Download
          </Button>
        </div>

        <div className="mt-3 text-center sm:mt-4">
          <Link
            href={`/invoices/${invoice.id}`}
            className="text-xs text-primary transition-colors hover:text-primary-dark sm:text-sm"
          >
            View Full Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;
