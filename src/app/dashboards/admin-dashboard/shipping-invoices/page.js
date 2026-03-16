'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { shippingService } from '@/services/shippingService';

export default function ShippingInvoicesPage() {
  const router = useRouter();
  const [shippingRecords, setShippingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShippingNeedingInvoice();
    
    // Refresh when returning to this page
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

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Shipping Invoices</h1>
            <p className="text-gray-400">Generate invoices for prepaid shipping</p>
          </div>
          <Button variant="secondary" onClick={fetchShippingNeedingInvoice}>
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {shippingRecords.length === 0 ? (
          <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-white mb-2">No shipping needs invoice</h3>
            <p className="text-gray-400">All prepaid shipping invoices have been generated</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shippingRecords.map((shipping) => {
              const orderId = typeof shipping.orderId === 'object' 
                ? shipping.orderId._id 
                : shipping.orderId;
              
              return (
                <div key={shipping._id} className="bg-slate-900/50 border border-gray-800 rounded-lg p-6 hover:border-primary/50 transition group">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition">
                          Order #{shipping.orderNumber}
                        </h3>
                        <StatusBadge status={shipping.status} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Customer</p>
                          <p className="text-white">{shipping.recipientName}</p>
                        </div>
                        
                        {shipping.address && (
                          <div>
                            <p className="text-gray-500 text-xs">Address</p>
                            <p className="text-white">
                              {shipping.address.street}, {shipping.address.city}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-gray-500 text-xs">Shipping Cost</p>
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(shipping.shippingCost)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500 text-xs">Payment Method</p>
                          <p className="text-white">
                            {shipping.metadata?.pickupNotes?.includes('Pay on delivery') 
                              ? 'Pay on Delivery' 
                              : 'Prepaid'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link href={`/dashboards/admin-dashboard/shipping-invoices/create?shippingId=${shipping._id}&orderId=${orderId}`}>
                      <Button 
                        variant="primary" 
                        className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Generate Invoice
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}