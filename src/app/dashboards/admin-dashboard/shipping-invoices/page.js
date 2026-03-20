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
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="relative text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 mt-4 text-sm sm:text-base">Loading...</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Shipping Invoices</h1>
              <p className="text-gray-400 text-sm sm:text-base">Generate invoices for prepaid shipping</p>
            </div>
            <Button variant="secondary" onClick={fetchShippingNeedingInvoice} className="text-sm">
              Refresh
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {shippingRecords.length === 0 ? (
            <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-6xl mb-4">📦</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No shipping needs invoice</h3>
              <p className="text-gray-400 text-sm sm:text-base">All prepaid shipping invoices have been generated</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shippingRecords.map((shipping) => {
                const orderId = typeof shipping.orderId === 'object' 
                  ? shipping.orderId._id 
                  : shipping.orderId;
                
                return (
                  <div key={shipping._id} className="bg-slate-900/50 border border-gray-800 rounded-lg p-4 sm:p-6 hover:border-primary/50 transition group">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-primary transition">
                            Order #{shipping.orderNumber}
                          </h3>
                          <StatusBadge status={shipping.status} />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Customer</p>
                            <p className="text-white text-sm">{shipping.recipientName}</p>
                          </div>
                          
                          {shipping.address && (
                            <div>
                              <p className="text-gray-500 text-xs">Address</p>
                              <p className="text-white text-sm">
                                {shipping.address.street}, {shipping.address.city}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-gray-500 text-xs">Shipping Cost</p>
                            <p className="text-xl sm:text-2xl font-bold text-primary">
                              {formatCurrency(shipping.shippingCost)}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500 text-xs">Payment Method</p>
                            <p className="text-white text-sm">
                              {shipping.metadata?.pickupNotes?.includes('Pay on delivery') 
                                ? 'Pay on Delivery' 
                                : 'Prepaid'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <Link href={`/dashboards/admin-dashboard/shipping-invoices/create?shippingId=${shipping._id}&orderId=${orderId}`}>
                          <Button 
                            variant="primary" 
                            className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all text-sm w-full sm:w-auto"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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