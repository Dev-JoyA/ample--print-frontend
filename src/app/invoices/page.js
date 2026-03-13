'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import InvoiceCard from '@/components/cards/InvoiceCard';
import Button from '@/components/ui/Button';
import { invoiceService } from '@/services/invoiceService';
import { useAuthCheck } from '@/app/lib/auth';

export default function CustomerInvoicesPage() {
  useAuthCheck();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, paid, pending, overdue

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
  const amount = invoice.balance || invoice.remainingAmount || invoice.amount || invoice.totalAmount;
  
  // Navigate to payment page with invoice ID
  router.push(`/payment?invoiceId=${invoiceId}&amount=${amount || 0}`);
};

  const handleDownloadInvoice = async (invoice) => {
    try {
      // Generate PDF invoice
      const response = await invoiceService.downloadInvoice(invoice._id);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Failed to download invoice');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    if (filter === 'paid') return invoice.status === 'Paid';
    if (filter === 'pending') return invoice.status === 'Pending' || invoice.status === 'Sent';
    // if (filter === 'overdue') return invoice.status === 'Overdue';
    return true;
  });

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const getStatusColor = (status) => {
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
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === 'paid' ? 'bg-green-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === 'overdue' ? 'bg-red-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Overdue
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
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
                : `No ${filter} invoices found`}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredInvoices.map((invoice) => (
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
                status: invoice.status,
                dueDate: invoice.dueDate,
                createdAt: invoice.createdAt,
                items: invoice.items
                }}
                onPay={handlePayInvoice}
                onDownload={handleDownloadInvoice}
                formatCurrency={formatCurrency}
                getStatusColor={getStatusColor}
            />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}