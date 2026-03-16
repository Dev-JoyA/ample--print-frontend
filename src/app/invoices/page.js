'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import InvoiceCard from '@/components/cards/InvoiceCard';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { invoiceService } from '@/services/invoiceService';
import { useAuthCheck } from '@/app/lib/auth';

export default function CustomerInvoicesPage() {
  useAuthCheck();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, paid, pending, partially-paid

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getMyInvoices({ limit: 50 });
      
      // Handle different response structures
      let invoicesData = [];
      if (response?.invoices && Array.isArray(response.invoices)) {
        invoicesData = response.invoices;
      } else if (response?.data?.invoices && Array.isArray(response.data.invoices)) {
        invoicesData = response.data.invoices;
      } else if (Array.isArray(response)) {
        invoicesData = response;
      }
      
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = (invoice) => {
    console.log('Pay invoice clicked - full invoice object:', invoice);
    
    // The invoice object might be coming from InvoiceCard with transformed properties
    // Let's extract the ID correctly
    const invoiceId = invoice?.id || invoice?._id;
    
    console.log('Extracted invoiceId:', invoiceId);
    
    if (!invoiceId) {
      console.error('No invoice ID found in:', invoice);
      alert('Invalid invoice data - missing ID');
      return;
    }
    
    // Get the amount - check multiple possible fields
    const amount = invoice.remainingAmount || invoice.balance || invoice.totalAmount;
    
    // Navigate to payment page with invoice ID
    router.push(`/payment?invoiceId=${invoiceId}&amount=${amount || 0}`);
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      const invoiceId = invoice?.id || invoice?._id;
      
      if (!invoiceId) {
        console.error('No invoice ID found for download:', invoice);
        alert('Invalid invoice data');
        return;
      }
      
      // Generate PDF invoice
      const response = await invoiceService.downloadInvoice(invoiceId);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber || 'download'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Failed to download invoice');
    }
  };

  // Helper function to get customer-friendly status display
  const getCustomerStatus = (invoice) => {
    // For customer display, transform admin statuses to customer-friendly terms
    const statusMap = {
      'Draft': 'Processing',
      'Sent': 'Received',           // Changed from 'Sent' to 'Received'
      'Pending': 'Pending',
      'PartiallyPaid': 'Partially Paid',
      'Paid': 'Paid',
      'Overdue': 'Overdue',
      'Cancelled': 'Cancelled'
    };
    
    // If it's a shipping invoice, add a prefix
    const typePrefix = invoice.invoiceType === 'shipping' ? 'Shipping ' : "";
    
    return {
      displayStatus: typePrefix + (statusMap[invoice.status] || invoice.status),
      originalStatus: invoice.status,
      type: invoice.invoiceType
    };
  };

  // Helper function to get badge color based on status
  const getStatusBadgeColor = (invoice) => {
    const colors = {
      'Draft': 'gray',
      'Sent': 'blue',
      'Pending': 'yellow',
      'PartiallyPaid': 'orange',
      'Paid': 'green',
      'Overdue': 'red',
      'Cancelled': 'gray'
    };
    
    // Special colors for different invoice types
    if (invoice.invoiceType === 'shipping') {
      if (invoice.status === 'Draft' || invoice.status === 'Sent') {
        return 'teal'; // Different color for shipping invoices
      }
    }
    
    return colors[invoice.status] || 'gray';
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    if (filter === 'paid') return invoice.status === 'Paid';
    if (filter === 'pending') {
      // Pending = invoices that are fully unpaid (amountPaid === 0) and not paid
      return (invoice.amountPaid === 0 || invoice.amountPaid === undefined) && 
             invoice.status !== 'Paid' && 
             invoice.status !== 'PartiallyPaid' &&
             invoice.status !== 'Cancelled';
    }
    if (filter === 'partially-paid') {
      // Partially paid = invoices with some payment but not fully paid
      return invoice.status === 'PartiallyPaid' || 
             (invoice.amountPaid > 0 && invoice.remainingAmount > 0);
    }
    if (filter === 'shipping') {
      // Shipping invoices filter
      return invoice.invoiceType === 'shipping';
    }
    return true;
  });

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading invoices...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Invoices</h1>
            <p className="text-gray-400">View and manage your invoices</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('partially-paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === 'partially-paid' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Partially Paid
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === 'paid' ? 'bg-green-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setFilter('shipping')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === 'shipping' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Shipping Invoices
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Invoice Count Summary */}
        {filteredInvoices.length > 0 && (
          <div className="mb-4 text-sm text-gray-400">
            Showing {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Invoices Grid */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-white mb-2">No invoices found</h3>
            <p className="text-gray-400">
              {filter === 'all' 
                ? "You don't have any invoices yet" 
                : filter === 'pending'
                ? 'No pending invoices'
                : filter === 'partially-paid'
                ? 'No partially paid invoices'
                : filter === 'shipping'
                ? 'No shipping invoices'
                : `No ${filter} invoices found`}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((invoice) => {
              const customerStatus = getCustomerStatus(invoice);
              
              return (
                <div key={invoice._id} className="relative">
                  {/* Invoice Type Badge */}
                  {/* {invoice.invoiceType === 'shipping' && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                        Shipping
                      </span>
                    </div>
                  )} */}
                  
                  <InvoiceCard
                    key={invoice._id}
                    invoice={{
                      id: invoice._id,
                      _id: invoice._id, 
                      invoiceNumber: invoice.invoiceNumber,
                      orderNumber: invoice.orderNumber,
                      totalAmount: invoice.totalAmount,      
                      amountPaid: invoice.amountPaid || 0,   
                      remainingAmount: invoice.remainingAmount,
                      depositAmount: invoice.depositAmount,
                      status: customerStatus.displayStatus, // Use transformed status
                      originalStatus: invoice.status, // Keep original for internal use
                      invoiceType: invoice.invoiceType,
                      dueDate: invoice.dueDate,
                      createdAt: invoice.createdAt,
                      items: invoice.items
                    }}
                    onPay={handlePayInvoice}
                    onDownload={handleDownloadInvoice}
                    formatCurrency={formatCurrency}
                    getStatusColor={() => getStatusBadgeColor(invoice)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 bg-slate-900/30 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <span className="text-white font-medium">Invoice Types:</span> Regular invoices are for your order items. 
              Shipping invoices (marked with a badge) are for delivery costs.
            </span>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}