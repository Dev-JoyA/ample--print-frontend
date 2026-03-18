'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import { useAuthCheck } from '@/app/lib/auth';
import { paymentService } from '@/services/paymentService';
import { invoiceService } from '@/services/invoiceService';
import { profileService } from '@/services/profileService';

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPrintMode = searchParams.get('print') === 'true';
  
  useAuthCheck();

  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [customerData, setCustomerData] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [summary, setSummary] = useState({
    totalAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    paystackCount: 0,
    bankTransferCount: 0,
    mainInvoiceCount: 0,
    shippingInvoiceCount: 0,
    depositInvoiceCount: 0
  });

  // Fix hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, filter]);

  // Auto-print when in print mode and data is loaded
  useEffect(() => {
    if (isPrintMode && !loading && transactions.length > 0 && isClient) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isPrintMode, loading, transactions, isClient]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const invoicesResponse = await invoiceService.getAll({ limit: 1000 });
      const invoices = invoicesResponse?.invoices || [];
      
      const allTransactions = invoices
        .flatMap(inv => (inv.transactions || []).map(t => ({
          ...t,
          invoiceNumber: inv.invoiceNumber,
          invoiceType: inv.invoiceType || 'main', // Add invoice type
          orderNumber: inv.orderNumber,
          invoiceId: inv._id,
          customerId: inv.userId?._id || inv.orderId?.userId?._id,
          createdAt: t.createdAt || inv.createdAt
        })))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      let filteredTransactions = allTransactions;
      if (filter !== 'all') {
        filteredTransactions = allTransactions.filter(t => t.transactionStatus === filter);
      }

      const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.transactionAmount || 0), 0);
      const completedCount = filteredTransactions.filter(t => t.transactionStatus === 'completed').length;
      const pendingCount = filteredTransactions.filter(t => t.transactionStatus === 'pending').length;
      const failedCount = filteredTransactions.filter(t => t.transactionStatus === 'failed').length;
      const paystackCount = filteredTransactions.filter(t => t.paymentMethod === 'paystack').length;
      const bankTransferCount = filteredTransactions.filter(t => t.paymentMethod === 'bank_transfer').length;
      
      // Count by invoice type
      const mainInvoiceCount = filteredTransactions.filter(t => t.invoiceType === 'main').length;
      const shippingInvoiceCount = filteredTransactions.filter(t => t.invoiceType === 'shipping').length;
      const depositInvoiceCount = filteredTransactions.filter(t => t.invoiceType === 'deposit').length;

      setSummary({
        totalAmount,
        completedCount,
        pendingCount,
        failedCount,
        paystackCount,
        bankTransferCount,
        mainInvoiceCount,
        shippingInvoiceCount,
        depositInvoiceCount
      });

      const limit = isPrintMode ? 1000 : 20;
      const start = (page - 1) * limit;
      const paginatedTransactions = filteredTransactions.slice(start, start + limit);
      const total = filteredTransactions.length;

      const uniqueUserIds = [...new Set(paginatedTransactions
        .map(t => t.customerId)
        .filter(id => id))];
      
      const customerDataMap = {};
      
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const userIdStr = userId.toString ? userId.toString() : userId;
            const profileResponse = await profileService.getUserById(userIdStr);
            const userData = profileResponse?.user || profileResponse?.data || profileResponse;
            
            if (userData) {
              customerDataMap[userId] = {
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0] || 'Customer'
              };
            }
          } catch (err) {
            console.error(`Failed to fetch customer ${userId}:`, err);
          }
        })
      );
      
      setCustomerData(customerDataMap);
      setTransactions(paginatedTransactions);
      setTotalPages(Math.ceil(total / limit));

    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'green',
      'pending': 'yellow',
      'failed': 'red',
      'refunded': 'gray'
    };
    return colors[status] || 'gray';
  };

  const getInvoiceTypeColor = (type) => {
    const colors = {
      'main': 'blue',
      'shipping': 'purple',
      'deposit': 'orange'
    };
    return colors[type] || 'gray';
  };

  const getInvoiceTypeLabel = (type) => {
    const labels = {
      'main': 'Main',
      'shipping': 'Shipping',
      'deposit': 'Deposit'
    };
    return labels[type] || type;
  };

  // Fixed date formatting to avoid hydration mismatch
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Use a fixed format that will be the same on server and client
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fixed report date that won't change during hydration
  const getReportDate = () => {
    if (!isClient) return ''; // Return empty on server
    const now = new Date();
    return `${now.toLocaleDateString('en-GB')} at ${now.toLocaleTimeString('en-GB')}`;
  };

  // Don't render anything until after hydration
  if (!isClient) {
    return null;
  }

  // Print-friendly version
  if (isPrintMode) {
    return (
      <div className="bg-white text-black p-8 max-w-7xl mx-auto">
        {/* Report Header */}
        <div className="text-center mb-8 pb-4 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold mb-2">Transaction Report</h1>
          <p className="text-gray-600">Generated on {getReportDate()}</p>
          <p className="text-gray-600">Filter: {filter === 'all' ? 'All Transactions' : `${filter} transactions`}</p>
        </div>

        {/* Summary Cards - Updated with invoice type counts */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-xl font-bold">{formatCurrency(summary.totalAmount)}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-xl font-bold text-green-600">{summary.completedCount}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{summary.pendingCount}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-xl font-bold text-red-600">{summary.failedCount}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Paystack</p>
            <p className="text-xl font-bold text-orange-600">{summary.paystackCount}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Bank Transfer</p>
            <p className="text-xl font-bold text-purple-600">{summary.bankTransferCount}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Main Invoices</p>
            <p className="text-xl font-bold text-blue-600">{summary.mainInvoiceCount}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Shipping Invoices</p>
            <p className="text-xl font-bold text-purple-600">{summary.shippingInvoiceCount}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Deposit Invoices</p>
            <p className="text-xl font-bold text-orange-600">{summary.depositInvoiceCount}</p>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="text-center py-8">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Date</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Transaction ID</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Invoice #</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Invoice Type</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Customer</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Order #</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Amount</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Payment Type</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Method</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="border border-gray-300 p-4 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => {
                    const customer = transaction.customerId ? 
                      customerData[transaction.customerId] : 
                      { fullName: transaction.customer || 'Customer' };
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 text-sm">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm font-mono">
                          {transaction.transactionId?.slice(-8) || 'N/A'}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm font-mono">
                          {transaction.invoiceNumber?.slice(-8) || 'N/A'}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs bg-${getInvoiceTypeColor(transaction.invoiceType)}-100 text-${getInvoiceTypeColor(transaction.invoiceType)}-800`}>
                            {getInvoiceTypeLabel(transaction.invoiceType)}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">
                          {customer.fullName}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">{transaction.orderNumber}</td>
                        <td className="border border-gray-300 p-2 text-sm font-medium">
                          {formatCurrency(transaction.transactionAmount)}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">
                          {transaction.transactionType === 'part' ? 'Part' : 'Full'}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">
                          {transaction.paymentMethod === 'bank_transfer' ? 'Bank' : 'Paystack'}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.transactionStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.transactionStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            transaction.transactionStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.transactionStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Total Transactions: {transactions.length} • Total Amount: {formatCurrency(summary.totalAmount)}</p>
          <p className="mt-1">This is a computer-generated document. No signature is required.</p>
        </div>
      </div>
    );
  }

  // Regular dashboard view (with layout)
  return (
    <DashboardLayout userRole="super-admin">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">All Transactions</h1>
            <p className="text-gray-400">Complete payment transaction history</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboards/super-admin-dashboard/transactions?print=true">
              <Button variant="secondary" size="sm" icon="🖨️">
                Print Report
              </Button>
            </Link>
            <Link href="/dashboards/super-admin-dashboard/financial-records">
              <Button variant="ghost" size="sm">← Back to Financial Records</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setFilter('all'); setPage(1); }}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => { setFilter('completed'); setPage(1); }}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              filter === 'completed' ? 'bg-green-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => { setFilter('pending'); setPage(1); }}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => { setFilter('failed'); setPage(1); }}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              filter === 'failed' ? 'bg-red-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Failed
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-slate-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left p-3 text-xs text-gray-400 font-medium">Date</th>
                  <th className="text-left p-3 text-xs text-gray-400 font-medium">Transaction ID</th>
                  <th className="text-left p-3 text-xs text-gray-400 font-medium">Invoice #</th>
                  <th className="text-left p-3 text-xs text-gray-400 font-medium">Invoice Type</th>
                  <th className="text-left p-3 text-xs text-gray-400 font-medium">Customer</th>
                  <th className="text-left p-3 text-xs text-gray-400 font-medium">Order #</th>
                  <th className="text-left p-3 text-xs text-gray-400 font-medium">Amount</th>
                  <th className="text-left p-3 text-xs text-gray-400 font-medium">Payment Type</th>
                  <th className="text-left p-3 text-xs text-gray-400 font-medium">Method</th>
                  <th className="text-left p-3 text-xs text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center p-4 text-gray-400 text-sm">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center p-4 text-gray-400 text-sm">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => {
                    const customer = transaction.customerId ? 
                      customerData[transaction.customerId] : 
                      { fullName: transaction.customer || 'Customer' };
                    
                    return (
                      <tr key={index} className="border-t border-gray-800 hover:bg-slate-800/50">
                        <td className="p-3 text-sm text-gray-300">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="p-3 text-sm text-white font-mono">
                          {transaction.transactionId?.slice(-8) || 'N/A'}
                        </td>
                        <td className="p-3 text-sm text-white font-mono">
                          {transaction.invoiceNumber?.slice(-8) || 'N/A'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs bg-${getInvoiceTypeColor(transaction.invoiceType)}-900/50 text-${getInvoiceTypeColor(transaction.invoiceType)}-400`}>
                            {getInvoiceTypeLabel(transaction.invoiceType)}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-300">
                          {customer.fullName}
                        </td>
                        <td className="p-3 text-sm text-gray-300">{transaction.orderNumber}</td>
                        <td className="p-3 text-sm text-white font-medium">
                          {formatCurrency(transaction.transactionAmount)}
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            transaction.transactionType === 'part' 
                              ? 'bg-blue-900/50 text-blue-400' 
                              : 'bg-green-900/50 text-green-400'
                          }`}>
                            {transaction.transactionType === 'part' ? 'Part' : 'Full'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            transaction.paymentMethod === 'bank_transfer' 
                              ? 'bg-purple-900/50 text-purple-400' 
                              : 'bg-orange-900/50 text-orange-400'
                          }`}>
                            {transaction.paymentMethod === 'bank_transfer' ? 'Bank' : 'Paystack'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs bg-${getStatusColor(transaction.transactionStatus)}-900/50 text-${getStatusColor(transaction.transactionStatus)}-400`}>
                            {transaction.transactionStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-slate-800 rounded-lg text-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-slate-800 rounded-lg text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}