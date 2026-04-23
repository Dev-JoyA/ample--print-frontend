'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { shippingService } from '@/services/shippingService';
import { METADATA } from '@/lib/metadata';

export default function ShippingInvoicesPage() {
  const router = useRouter();
  const [shippingRecords, setShippingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShippingNeedingInvoice();

    const handleRouteChange = () => {
      fetchShippingNeedingInvoice();
    };

    window.addEventListener('focus', handleRouteChange);

    return () => {
      window.removeEventListener('focus', handleRouteChange);
    };
  }, []);

  const fetchShippingNeedingInvoice = async () => {
    try {
      setLoading(true);
      const response = await shippingService.getNeedingInvoice();
      const shippingData = response?.data || [];
      setShippingRecords(shippingData);
    } catch (err) {
      console.error('Failed to fetch shipping:', err);
      setError('Failed to load shipping records');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₦${amount?.toLocaleString() || '0'}`;

  if (loading) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="relative text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent sm:h-12 sm:w-12"></div>
              <p className="mt-4 text-sm text-gray-400 sm:text-base">Loading...</p>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.admin} />
      <DashboardLayout userRole="admin">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                Shipping Invoices
              </h1>
              <p className="text-sm text-gray-400 sm:text-base">
                Generate invoices for prepaid shipping
              </p>
            </div>
            <Button variant="secondary" onClick={fetchShippingNeedingInvoice} className="text-sm">
              Refresh
            </Button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {shippingRecords.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-8 text-center sm:p-12">
              <div className="mb-4 text-5xl sm:text-6xl">📦</div>
              <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
                No shipping needs invoice
              </h3>
              <p className="text-sm text-gray-400 sm:text-base">
                All prepaid shipping invoices have been generated
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {shippingRecords.map((shipping) => {
                const orderId =
                  typeof shipping.orderId === 'object' ? shipping.orderId._id : shipping.orderId;

                return (
                  <div
                    key={shipping._id}
                    className="group rounded-lg border border-gray-800 bg-slate-900/50 p-4 transition hover:border-primary/50 sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-semibold text-white transition group-hover:text-primary sm:text-lg">
                            Order #{shipping.orderNumber}
                          </h3>
                          <StatusBadge status={shipping.status} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 sm:text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Customer</p>
                            <p className="text-sm text-white">{shipping.recipientName}</p>
                          </div>

                          {shipping.address && (
                            <div>
                              <p className="text-xs text-gray-500">Address</p>
                              <p className="text-sm text-white">
                                {shipping.address.street}, {shipping.address.city}
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-gray-500">Shipping Cost</p>
                            <p className="text-xl font-bold text-primary sm:text-2xl">
                              {formatCurrency(shipping.shippingCost)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Payment Method</p>
                            <p className="text-sm text-white">
                              {shipping.metadata?.pickupNotes?.includes('Pay on delivery')
                                ? 'Pay on Delivery'
                                : 'Prepaid'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <Link
                          href={`/dashboards/admin-dashboard/shipping-invoices/create?shippingId=${shipping._id}&orderId=${orderId}`}
                        >
                          <Button
                            variant="primary"
                            className="w-full text-sm shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 sm:w-auto"
                          >
                            <svg
                              className="mr-2 h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Generate Invoice
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
