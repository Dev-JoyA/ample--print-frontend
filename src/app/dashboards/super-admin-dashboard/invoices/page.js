'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { invoiceService } from '@/services/invoiceService';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await invoiceService.getAll(params);
      setInvoices(response?.invoices || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'gray',
      'Sent': 'blue',
      'PartiallyPaid': 'yellow',
      'Paid': 'green',
      'Overdue': 'red',
      'Cancelled': 'gray'
    };
    return colors[status] || 'gray';
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Invoices</h1>
            <p className="text-gray-400">Manage and track all invoices</p>
          </div>
          <Link href="/dashboards/super-admin-dashboard/invoices/ready">
            <Button variant="primary" className="gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Invoice
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('Draft')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'Draft' ? 'bg-gray-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => setFilter('Sent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'Sent' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setFilter('PartiallyPaid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'PartiallyPaid' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Partially Paid
          </button>
          <button
            onClick={() => setFilter('Paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'Paid' ? 'bg-green-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setFilter('Overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'Overdue' ? 'bg-red-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-white mb-2">No invoices found</h3>
            <p className="text-gray-400 mb-6">Create your first invoice to get started</p>
            <Link href="/dashboards/super-admin-dashboard/invoices/ready">
              <Button variant="primary">Create Invoice</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <span className="text-white font-mono text-sm">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">
                          {invoice.userId?.email?.split('@')[0] || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 font-mono text-sm">
                          {invoice.orderId?.orderNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">
                          {formatCurrency(invoice.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(invoice.status)}-600/20 text-${getStatusColor(invoice.status)}-400`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${
                          invoice.status === 'Overdue' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboards/super-admin-dashboard/invoices/${invoice._id}`}>
                          <button className="text-primary hover:text-primary-dark text-sm">
                            View
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}