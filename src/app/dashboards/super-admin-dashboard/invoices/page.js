'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { invoiceService } from '@/services/invoiceService';
import { profileService } from '@/services/profileService';
import { socketService } from '@/services/socketService';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [sending, setSending] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerData, setCustomerData] = useState({});

  // Stats
  const [stats, setStats] = useState({
    draft: 0,
    sent: 0,
    partiallyPaid: 0,
    paid: 0,
    total: 0
  });

  useEffect(() => {
    fetchInvoices();
    
    // Set up socket listeners for real-time updates
    const handleInvoiceUpdated = (data) => {
      console.log('Invoice updated via socket:', data);
      fetchInvoices();
    };

    const handleInvoiceCreated = (data) => {
      console.log('Invoice created via socket:', data);
      fetchInvoices();
    };

    const handleInvoiceDeleted = (data) => {
      console.log('Invoice deleted via socket:', data);
      fetchInvoices();
    };

    const handleInvoiceSent = (data) => {
      console.log('Invoice sent via socket:', data);
      fetchInvoices();
    };

    socketService.on('invoice-updated', handleInvoiceUpdated);
    socketService.on('invoice-created', handleInvoiceCreated);
    socketService.on('invoice-deleted', handleInvoiceDeleted);
    socketService.on('invoice-sent', handleInvoiceSent);

    return () => {
      socketService.off('invoice-updated', handleInvoiceUpdated);
      socketService.off('invoice-created', handleInvoiceCreated);
      socketService.off('invoice-deleted', handleInvoiceDeleted);
      socketService.off('invoice-sent', handleInvoiceSent);
    };
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Always fetch all invoices first for stats
      const allResponse = await invoiceService.getAll({ limit: 1000 });
      const allInvoices = allResponse?.invoices || [];
      
      // Calculate stats from all invoices
      setStats({
        draft: allInvoices.filter(i => i.status === 'Draft').length,
        sent: allInvoices.filter(i => i.status === 'Sent').length,
        partiallyPaid: allInvoices.filter(i => i.status === 'PartiallyPaid').length,
        paid: allInvoices.filter(i => i.status === 'Paid').length,
        total: allInvoices.length
      });
      
      // Apply filter on the client side if needed
      let filteredInvoices = allInvoices;
      if (filter !== 'all') {
        filteredInvoices = allInvoices.filter(invoice => invoice.status === filter);
      }
      
      setInvoices(filteredInvoices);
      
      // Fetch customer data for all invoices
      const customerDataMap = {};
      
      await Promise.all(
        filteredInvoices.map(async (invoice) => {
          let userId = null;
          
          // Extract userId the same way as in detail page
          if (invoice.orderId?.userId) {
            if (typeof invoice.orderId.userId === 'object') {
              userId = invoice.orderId.userId._id || invoice.orderId.userId;
            } else {
              userId = invoice.orderId.userId;
            }
          } else if (invoice.userId) {
            if (typeof invoice.userId === 'object') {
              userId = invoice.userId._id || invoice.userId;
            } else {
              userId = invoice.userId;
            }
          }
          
          if (userId) {
            try {
              const userIdStr = userId.toString ? userId.toString() : userId;
              const profileResponse = await profileService.getUserById(userIdStr);
              const userData = profileResponse?.user || profileResponse?.data || profileResponse;
              
              if (userData) {
                customerDataMap[invoice._id] = {
                  firstName: userData.firstName || '',
                  lastName: userData.lastName || '',
                  email: userData.email || '',
                  fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
                };
              }
            } catch (err) {
              console.error(`Failed to fetch customer for invoice ${invoice._id}:`, err);
              // Fallback to email from invoice
              const fallbackEmail = invoice.orderId?.userId?.email || 
                                   invoice.userId?.email || 
                                   invoice.customerEmail || 
                                   '';
              customerDataMap[invoice._id] = {
                firstName: '',
                lastName: '',
                email: fallbackEmail,
                fullName: fallbackEmail.split('@')[0] || 'Customer'
              };
            }
          } else {
            // No userId found, use fallback
            const fallbackEmail = invoice.orderId?.userId?.email || 
                                 invoice.userId?.email || 
                                 invoice.customerEmail || 
                                 '';
            customerDataMap[invoice._id] = {
              firstName: '',
              lastName: '',
              email: fallbackEmail,
              fullName: fallbackEmail.split('@')[0] || 'Customer'
            };
          }
        })
      );
      
      setCustomerData(customerDataMap);
      
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = (invoiceId) => {
    router.push(`/dashboards/super-admin-dashboard/invoices/${invoiceId}/edit`);
  };

  const handleViewInvoice = (invoiceId) => {
    router.push(`/dashboards/super-admin-dashboard/invoices/${invoiceId}`);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this draft invoice? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleting(invoiceId);
      await invoiceService.delete(invoiceId);
      await fetchInvoices();
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      alert('Failed to delete invoice. Only draft invoices can be deleted.');
    } finally {
      setDeleting(null);
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    if (!confirm('Send this invoice to the customer?')) {
      return;
    }
    
    try {
      setSending(invoiceId);
      await invoiceService.send(invoiceId);
      await fetchInvoices();
    } catch (err) {
      console.error('Failed to send invoice:', err);
      alert('Failed to send invoice');
    } finally {
      setSending(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'gray',
      'Sent': 'blue',
      'PartiallyPaid': 'yellow',
      'Paid': 'green',
      'Cancelled': 'gray'
    };
    return colors[status] || 'gray';
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get order number
  const getOrderNumber = (invoice) => {
    if (invoice.orderNumber) return invoice.orderNumber;
    if (invoice.orderId) {
      if (typeof invoice.orderId === 'object') {
        return invoice.orderId.orderNumber;
      }
    }
    return 'N/A';
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customer = customerData[invoice._id] || { fullName: '', email: '' };
    const orderNumber = getOrderNumber(invoice).toLowerCase();
    const invoiceNumber = invoice.invoiceNumber?.toLowerCase() || '';
    
    return (
      invoiceNumber.includes(searchLower) ||
      orderNumber.includes(searchLower) ||
      customer.fullName.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Invoices</h1>
            <p className="text-gray-400">Manage and track all invoices</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboards/super-admin-dashboard/invoices/ready">
              <Button variant="primary" className="gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by invoice number, order number, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <svg
              className="absolute left-3 top-3.5 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div 
            onClick={() => setFilter('all')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'all' ? 'border-primary' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div 
            onClick={() => setFilter('Draft')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'Draft' ? 'border-gray-500' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">Draft</p>
            <p className="text-2xl font-bold text-white">{stats.draft}</p>
          </div>
          <div 
            onClick={() => setFilter('Sent')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'Sent' ? 'border-blue-500' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">Sent</p>
            <p className="text-2xl font-bold text-blue-400">{stats.sent}</p>
          </div>
          <div 
            onClick={() => setFilter('PartiallyPaid')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'PartiallyPaid' ? 'border-yellow-500' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">Partially Paid</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.partiallyPaid}</p>
          </div>
          <div 
            onClick={() => setFilter('Paid')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'Paid' ? 'border-green-500' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">Paid</p>
            <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            All Invoices
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
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? 'No matching invoices found' : 'No invoices found'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? 'Try adjusting your search term'
                : filter !== 'all' 
                  ? `No ${filter.toLowerCase()} invoices at the moment` 
                  : 'Create your first invoice to get started'}
            </p>
            {!searchTerm && filter === 'all' && (
              <Link href="/dashboards/super-admin-dashboard/invoices/ready">
                <Button variant="primary">Create Invoice</Button>
              </Link>
            )}
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
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredInvoices.map((invoice) => {
                    const customer = customerData[invoice._id] || { 
                      firstName: '', 
                      lastName: '', 
                      email: '',
                      fullName: 'Customer' 
                    };
                    const orderNumber = getOrderNumber(invoice);
                    
                    return (
                      <tr key={invoice._id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4">
                          <span className="text-white font-mono text-sm">
                            {invoice.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">
                            {customer.fullName || customer.email?.split('@')[0] || 'Customer'}
                          </span>
                          {customer.email && (
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 font-mono text-sm">
                            {orderNumber}
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
                          <span className="text-gray-400 text-sm">
                            {formatDate(invoice.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewInvoice(invoice._id)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            
                            {/* Edit button for all invoice types */}
                            <button
                              onClick={() => handleEditInvoice(invoice._id)}
                              className="text-yellow-400 hover:text-yellow-300 text-sm"
                            >
                              Edit
                            </button>
                            
                            {/* Send button for draft invoices */}
                            {invoice.status === 'Draft' && (
                              <button
                                onClick={() => handleSendInvoice(invoice._id)}
                                disabled={sending === invoice._id}
                                className="text-green-400 hover:text-green-300 text-sm disabled:opacity-50"
                              >
                                {sending === invoice._id ? '...' : 'Send'}
                              </button>
                            )}
                            
                            {/* Delete button only for draft invoices */}
                            {invoice.status === 'Draft' && (
                              <button
                                onClick={() => handleDeleteInvoice(invoice._id)}
                                disabled={deleting === invoice._id}
                                className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                              >
                                {deleting === invoice._id ? '...' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}