'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { invoiceService } from '@/services/invoiceService';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getById(invoiceId);
      setInvoice(response?.data);
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    try {
      setSending(true);
      await invoiceService.send(invoiceId);
      await fetchInvoice(); // Refresh to show updated status
    } catch (err) {
      console.error('Failed to send invoice:', err);
      alert('Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading invoice...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="text-center py-16">
          <p className="text-gray-400">Invoice not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Invoices
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Invoice Details</h1>
              <p className="text-gray-400">{invoice.invoiceNumber}</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
        </div>

        {/* Invoice Content */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 space-y-6">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">AMPLE PRINT HUB</h2>
              <p className="text-gray-400 text-sm mt-1">123 Business Avenue, Lagos</p>
              <p className="text-gray-400 text-sm">hello@ampleprinthub.com</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Date: {formatDate(invoice.createdAt)}</p>
              <p className="text-gray-400 text-sm">Due Date: {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Bill To:</h3>
            <p className="text-white">{invoice.userId?.email?.split('@')[0] || 'Customer'}</p>
            <p className="text-gray-400 text-sm">{invoice.userId?.email}</p>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-white font-medium mb-4">Items</h3>
            <div className="space-y-3">
              {invoice.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.description}</p>
                    <p className="text-sm text-gray-400">
                      {item.quantity} × ₦{item.unitPrice?.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-primary font-bold">
                    ₦{item.total?.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Discount</span>
              <span className="text-green-400">-{formatCurrency(invoice.discount || 0)}</span>
            </div>
            {invoice.depositAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Deposit Required</span>
                <span className="text-yellow-400">{formatCurrency(invoice.depositAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-white font-medium">Total</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>

          {/* Payment Instructions */}
          {invoice.paymentInstructions && (
            <div>
              <h3 className="text-white font-medium mb-2">Payment Instructions</h3>
              <p className="text-gray-400 text-sm whitespace-pre-wrap">
                {invoice.paymentInstructions}
              </p>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="text-white font-medium mb-2">Notes</h3>
              <p className="text-gray-400 text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            {invoice.status === 'Draft' && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleSendInvoice}
                disabled={sending}
                className="flex-1"
              >
                {sending ? 'Sending...' : 'Send to Customer'}
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.print()}
              className="flex-1"
            >
              Print Invoice
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}