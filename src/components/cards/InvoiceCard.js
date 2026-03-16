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
      'Draft': 'gray',
      'Sent': 'blue',
      'Pending': 'yellow',
      'PartiallyPaid': 'orange',
      'Paid': 'green',
      'Overdue': 'red',
      'Cancelled': 'gray',
      'Received': 'blue', // Customer-friendly version of Sent
      'Processing': 'gray'
    };
    return colors[status] || 'gray';
  }
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Debug log to see what data is being received
  console.log('InvoiceCard received:', {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: invoice.totalAmount,
    amountPaid: invoice.amountPaid,
    remainingAmount: invoice.remainingAmount,
    status: invoice.status,
    invoiceType: invoice.invoiceType,
    originalStatus: invoice.originalStatus
  });

  // Calculate amounts from invoice data
  const totalAmount = invoice.totalAmount || invoice.amount || 0;
  const paidAmount = invoice.amountPaid || 0;
  const remainingAmount = invoice.remainingAmount || (totalAmount - paidAmount);
  const depositAmount = invoice.depositAmount || 0;

  // Determine if invoice is fully paid
  const isFullyPaid = remainingAmount <= 0 || invoice.status === 'Paid';

  // Get customer-friendly status display based on original status
  const getDisplayStatus = () => {
    // If we have the original status, use that to determine display
    const originalStatus = invoice.originalStatus || invoice.status;
    
    // Transform admin status to customer-friendly terms
    if (originalStatus === 'Sent') return 'Received';
    if (originalStatus === 'Draft') return 'Processing';
    
    return originalStatus;
  };

  const displayStatus = getDisplayStatus();

  // Get badge color based on original status
  const getBadgeColor = () => {
    const originalStatus = invoice.originalStatus || invoice.status;
    
    // if (invoice.invoiceType === 'shipping') {
    //   if (originalStatus === 'Draft' || originalStatus === 'Sent') {
    //     return 'teal';
    //   }
    // }
    
    const colors = {
      'Draft': 'gray',
      'Sent': 'blue',
      'Pending': 'yellow',
      'PartiallyPaid': 'orange',
      'Paid': 'green',
      'Overdue': 'red',
      'Cancelled': 'gray'
    };
    return colors[originalStatus] || 'gray';
  };

  const badgeColor = getBadgeColor();

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-gray-400">Invoice</p>
              {invoice.invoiceType === 'shipping' && (
                <span className="text-xs bg-teal-600/20 text-teal-400 px-2 py-0.5 rounded-full border border-teal-700">
                  Shipping
                </span>
              )}
              {invoice.invoiceType === 'main' && (
                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-700">
                  Order
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white">{invoice.invoiceNumber || 'N/A'}</h3>
            {invoice.orderNumber && (
              <p className="text-xs text-gray-500 mt-1">Order: {invoice.orderNumber}</p>
            )}
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${badgeColor}-900/50 text-${badgeColor}-400 border border-${badgeColor}-700`}>
            {displayStatus}
          </span>
        </div>

        {/* Amount Section */}
        <div className="space-y-2">
          {/* Total Amount */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Total:</span>
            <span className="text-lg font-bold text-white">{formatCurrency(totalAmount)}</span>
          </div>

          {/* Paid Amount - Only show if > 0 */}
          {paidAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Paid:</span>
              <span className="text-md font-semibold text-green-400">{formatCurrency(paidAmount)}</span>
            </div>
          )}

          {/* Deposit Required - Only show if deposit exists and not paid */}
          {depositAmount > 0 && paidAmount === 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Deposit Required:</span>
              <span className="text-md font-semibold text-yellow-400">{formatCurrency(depositAmount)}</span>
            </div>
          )}

          {/* Remaining Balance - Only show if not fully paid */}
          {!isFullyPaid && remainingAmount > 0 && (
            <div className="flex justify-between items-center pt-1 border-t border-gray-800 mt-1">
              <span className="text-sm font-medium text-gray-300">Remaining:</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(remainingAmount)}</span>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="mt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Issued:</span>
            <span className="text-white">{formatDate(invoice.createdAt || invoice.issueDate)}</span>
          </div>
          {invoice.dueDate && !isFullyPaid && (
            <div className="flex justify-between mt-1">
              <span className="text-gray-400">Due:</span>
              <span className="text-white">{formatDate(invoice.dueDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items (expandable) */}
      {invoice.items && invoice.items.length > 0 && (
        <div className="border-b border-gray-800">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span>View Items ({invoice.items.length})</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expanded && (
            <div className="px-6 pb-4 space-y-2">
              {invoice.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
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

      {/* Actions */}
      <div className="p-6 mt-auto">
        <div className="flex gap-3">
          {!isFullyPaid && invoice.status !== 'Cancelled' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPay(invoice)}
              className="flex-1"
            >
              Pay Now
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDownload(invoice)}
            className="flex-1"
            icon="📥"
          >
            Download
          </Button>
        </div>

        {/* View Details Link */}
        <div className="mt-4 text-center">
          <Link 
            href={`/invoices/${invoice.id}`}
            className="text-sm text-primary hover:text-primary-dark transition-colors"
          >
            View Full Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;