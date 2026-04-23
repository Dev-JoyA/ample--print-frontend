'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { invoiceService } from '@/services/invoiceService';
import { shippingService } from '@/services/shippingService';
import { orderService } from '@/services/orderService';
import { METADATA } from '@/lib/metadata';

function CreateShippingInvoicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shippingId = searchParams.get('shippingId');
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shipping, setShipping] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

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

      const shippingResponse = await shippingService.getById(shippingId);
      const shippingData = shippingResponse?.data || shippingResponse;
      setShipping(shippingData);
      setShippingCost(shippingData?.shippingCost || 0);

      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      setOrder(orderData);

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
        shippingCost,
        dueDate: new Date(dueDate),
        notes: notes || undefined,
      };

      console.log('Creating shipping invoice:', invoiceData);

      const response = await invoiceService.createShippingInvoice(orderId, shippingId, invoiceData);

      router.push(`/dashboards/admin-dashboard/invoices/${response.data?._id || response._id}`);
    } catch (err) {
      console.error('Failed to create shipping invoice:', err);
      setError(err.message || 'Failed to create shipping invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => `₦${amount?.toLocaleString() || '0'}`;

  if (loading) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="relative text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent sm:h-12 sm:w-12"></div>
                <p className="mt-4 text-sm text-gray-400 sm:text-base">
                  Loading shipping details...
                </p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (!shipping || !order) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="px-4 py-16 text-center">
            <p className="text-gray-400">Shipping record not found</p>
            <Link
              href="/dashboards/admin-dashboard/shipping"
              className="mt-4 inline-block text-primary hover:text-primary-dark"
            >
              Back to Shipping
            </Link>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.admin} />
      <DashboardLayout userRole="admin">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm sm:text-base">Back</span>
            </button>

            <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              Create Shipping Invoice
            </h1>
            <p className="text-sm text-gray-400 sm:text-base">Order #{order.orderNumber}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-5 rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:space-y-6 sm:p-6">
            <div className="rounded-lg bg-slate-800/30 p-4">
              <h3 className="mb-3 text-sm font-medium text-white sm:text-base">Shipping Details</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-gray-400">Method:</span>
                  <span className="capitalize text-white">{shipping.shippingMethod}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-gray-400">Recipient:</span>
                  <span className="text-white">{shipping.recipientName}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span className="text-white">{shipping.recipientPhone}</span>
                </div>
                {shipping.address && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-gray-400">Address:</span>
                    <span className="text-left text-white sm:text-right">
                      {shipping.address.street}, {shipping.address.city}, {shipping.address.state}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                Shipping Cost (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                min="0"
                step="100"
                className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white"
                placeholder="Any additional information for the customer..."
              />
            </div>

            <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
              <div className="flex flex-col items-start gap-3 sm:flex-row">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-400">Important Notice</p>
                  <p className="mt-1 text-xs text-yellow-300 sm:text-sm">
                    Invoice is subject to change. Please review carefully before sending to
                    customer.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-800/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white sm:text-base">Total Amount</span>
                <span className="text-xl font-bold text-primary sm:text-2xl">
                  {formatCurrency(shippingCost)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={submitting || !shippingCost || !dueDate}
                className="flex-1 text-sm"
              >
                {submitting ? 'Creating...' : 'Create Shipping Invoice'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.back()}
                className="flex-1 text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

export default function CreateShippingInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreateShippingInvoicePageContent />
    </Suspense>
  );
}
