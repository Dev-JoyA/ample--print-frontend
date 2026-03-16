'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import { invoiceService } from '@/services/invoiceService';
import { shippingService } from '@/services/shippingService';
import { orderService } from '@/services/orderService';

export default function CreateShippingInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shippingId = searchParams.get('shippingId');
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shipping, setShipping] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  // Invoice form state
  const [shippingCost, setShippingCost] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!shippingId || !orderId) {
      router.push('/dashboards/admin-dashboard/shipping-invoices');
      return;
    }

    fetchShippingDetails();
  }, [shippingId, orderId]);

  const fetchShippingDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch shipping record
      const shippingResponse = await shippingService.getById(shippingId);
      const shippingData = shippingResponse?.data || shippingResponse;
      setShipping(shippingData);
      setShippingCost(shippingData?.shippingCost || 0);
      
      // Fetch order details
      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      setOrder(orderData);
      
      // Set default due date to 7 days from now
      const date = new Date();
      date.setDate(date.getDate() + 7);
      setDueDate(date.toISOString().split('T')[0]);
      
    } catch (err) {
      console.error('Failed to fetch shipping details:', err);
      setError('Failed to load shipping details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
  try {
    setSubmitting(true);
    setError('');

    const invoiceData = {
      shippingCost, // This will update the shipping record
      dueDate: new Date(dueDate),
      notes: notes || undefined,
    };

    console.log('Creating shipping invoice:', invoiceData);

    const response = await invoiceService.createShippingInvoice(
      orderId,
      shippingId,
      invoiceData
    );
    
    // Redirect to invoice view
    router.push(`/dashboards/admin-dashboard/invoices/${response.data?._id || response._id}`);
    
  } catch (err) {
    console.error('Failed to create shipping invoice:', err);
    setError(err.message || 'Failed to create shipping invoice');
  } finally {
    setSubmitting(false);
  }
};

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-white">Loading shipping details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!shipping || !order) {
    return (
      <DashboardLayout userRole="admin">
        <div className="text-center py-16">
          <p className="text-gray-400">Shipping record not found</p>
          <Link href="/dashboards/admin-dashboard/shipping" className="mt-4 text-primary hover:text-primary-dark inline-block">
            Back to Shipping
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
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
            Back
          </button>
          
          <h1 className="text-4xl font-bold text-white mb-2">Create Shipping Invoice</h1>
          <p className="text-gray-400">
            Order #{order.orderNumber}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Main Form */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 space-y-6">
          {/* Shipping Summary */}
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Shipping Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Method:</span>
                <span className="text-white capitalize">{shipping.shippingMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recipient:</span>
                <span className="text-white">{shipping.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone:</span>
                <span className="text-white">{shipping.recipientPhone}</span>
              </div>
              {shipping.address && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Address:</span>
                  <span className="text-white text-right">
                    {shipping.address.street}, {shipping.address.city}, {shipping.address.state}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Shipping Cost (₦) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              min="0"
              step="100"
              className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              placeholder="Any additional information for the customer..."
            />
          </div>
          {/* Important Notice */}
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                <p className="text-sm font-medium text-yellow-400">Important Notice</p>
                <p className="text-sm text-yellow-300 mt-1">
                    Invoice is subject to change. Please review carefully before sending to customer.
                </p>
                </div>
            </div>
            </div>
          {/* Summary */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(shippingCost)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || !shippingCost || !dueDate}
              className="flex-1"
            >
              {submitting ? 'Creating...' : 'Create Shipping Invoice'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}