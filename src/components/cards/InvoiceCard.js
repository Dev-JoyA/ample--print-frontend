// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import Button from '../ui/Button';

// const InvoiceCard = ({ 
//   invoice, 
//   onPay, 
//   onDownload,
//   formatCurrency = (amount) => `₦${amount?.toLocaleString() || '0'}`,
//   getStatusColor = (status) => {
//     const colors = {
//       'Draft': 'gray',
//       'Sent': 'blue',
//       'Pending': 'yellow',
//       'PartiallyPaid': 'yellow',
//       'Paid': 'green',
//       'Overdue': 'red',
//       'Cancelled': 'gray'
//     };
//     return colors[status] || 'gray';
//   }
// }) => {
//   const [expanded, setExpanded] = useState(false);

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   // Calculate amounts from invoice data
//   const totalAmount = invoice.totalAmount || invoice.amount || 0;
//   const paidAmount = invoice.amountPaid || 0;
//   const balanceAmount = totalAmount - paidAmount;

//   const isFullyPaid = balanceAmount <= 0 || invoice.status === 'Paid';

//   return (
//     <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all">
//       {/* Header */}
//       <div className="p-6 border-b border-gray-800">
//         <div className="flex justify-between items-start mb-4">
//           <div>
//             <p className="text-sm text-gray-400">Invoice</p>
//             <h3 className="text-xl font-bold text-white">{invoice.invoiceNumber || 'N/A'}</h3>
//             {invoice.orderNumber && (
//               <p className="text-xs text-gray-500 mt-1">Order: {invoice.orderNumber}</p>
//             )}
//           </div>
//           <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(invoice.status)}-900/50 text-${getStatusColor(invoice.status)}-400`}>
//             {invoice.status}
//           </span>
//         </div>

//         {/* Amount Section - Total, Paid, Balance */}
//         <div className="space-y-3">
//           {/* Total Amount */}
//           <div className="flex justify-between items-center">
//             <span className="text-sm text-gray-400">Total:</span>
//             <span className="text-lg font-bold text-white">{formatCurrency(totalAmount)}</span>
//           </div>

//           {/* Paid Amount */}
//           <div className="flex justify-between items-center">
//             <span className="text-sm text-gray-400">Paid:</span>
//             <span className="text-md font-semibold text-green-400">{formatCurrency(paidAmount)}</span>
//           </div>

//           {/* Balance Amount */}
//           <div className="flex justify-between items-center pt-1 border-t border-gray-800">
//             <span className="text-sm font-medium text-gray-300">Balance:</span>
//             <span className="text-lg font-bold text-primary">{formatCurrency(balanceAmount)}</span>
//           </div>
//         </div>

//         {/* Date - Removed due date, keeping only issued date */}
//         <div className="mt-4 text-sm">
//           <div className="flex justify-between">
//             <span className="text-gray-400">Issued:</span>
//             <span className="text-white">{formatDate(invoice.createdAt || invoice.issueDate)}</span>
//           </div>
//         </div>
//       </div>

//       {/* Items (expandable) */}
//       {invoice.items && invoice.items.length > 0 && (
//         <div className="border-b border-gray-800">
//           <button
//             onClick={() => setExpanded(!expanded)}
//             className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-400 hover:text-white transition-colors"
//           >
//             <span>View Items ({invoice.items.length})</span>
//             <svg
//               className={`w-5 h-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//             </svg>
//           </button>
          
//           {expanded && (
//             <div className="px-6 pb-4 space-y-2">
//               {invoice.items.map((item, index) => (
//                 <div key={index} className="flex justify-between text-sm">
//                   <span className="text-gray-400">
//                     {item.description} x{item.quantity}
//                   </span>
//                   <span className="text-white">{formatCurrency(item.total)}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Actions */}
//       <div className="p-6 flex gap-3">
//         {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && balanceAmount > 0 && (
//           <Button
//             variant="primary"
//             size="sm"
//             onClick={() => onPay(invoice)}
//             className="flex-1"
//           >
//             Pay Now
//           </Button>
//         )}
//         <Button
//           variant="secondary"
//           size="sm"
//           onClick={() => onDownload(invoice)}
//           className="flex-1"
//           icon="📥"
//         >
//           Download
//         </Button>
//       </div>

//       {/* View Details Link */}
//       <div className="px-6 pb-6">
//         <Link 
//           href={`/invoices/${invoice.id}`}
//           className="text-sm text-primary hover:text-primary-dark transition-colors"
//         >
//           View Full Details →
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default InvoiceCard;

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
      'PartiallyPaid': 'yellow',
      'Paid': 'green',
      'Overdue': 'red',
      'Cancelled': 'gray'
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
    status: invoice.status
  });

  // Calculate amounts from invoice data
  const totalAmount = invoice.totalAmount || invoice.amount || 0;
  const paidAmount = invoice.amountPaid || 0;
  const balanceAmount = totalAmount - paidAmount;

  // Determine if invoice is fully paid
  const isFullyPaid = balanceAmount <= 0 || invoice.status === 'Paid';

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-400">Invoice</p>
            <h3 className="text-xl font-bold text-white">{invoice.invoiceNumber || 'N/A'}</h3>
            {invoice.orderNumber && (
              <p className="text-xs text-gray-500 mt-1">Order: {invoice.orderNumber}</p>
            )}
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(invoice.status)}-900/50 text-${getStatusColor(invoice.status)}-400`}>
            {invoice.status}
          </span>
        </div>

        {/* Amount Section - Total, Paid, Balance */}
        <div className="space-y-3">
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

          {/* Balance Amount - Only show if not fully paid */}
          {!isFullyPaid && (
            <div className="flex justify-between items-center pt-1 border-t border-gray-800">
              <span className="text-sm font-medium text-gray-300">Balance:</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(balanceAmount)}</span>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="mt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Issued:</span>
            <span className="text-white">{formatDate(invoice.createdAt || invoice.issueDate)}</span>
          </div>
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
      <div className="p-6 flex gap-3">
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
      <div className="px-6 pb-6">
        <Link 
          href={`/invoices/${invoice.id}`}
          className="text-sm text-primary hover:text-primary-dark transition-colors"
        >
          View Full Details →
        </Link>
      </div>
    </div>
  );
};

export default InvoiceCard;