'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import OrderCard from '@/components/cards/OrderCard';

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);

  const handleTrack = () => {
    // In real app, this would fetch order details
    setTrackedOrder({
      orderNumber: orderNumber || 'ORD-7291',
      status: 'DESIGNING',
      paymentStatus: 'PAID',
      shippingStatus: 'PENDING',
      productName: 'Premium A5 Marketing Flyers',
      orderedDate: '2025-12-12',
      totalAmount: 4000.00,
    });
  };

  const statusSteps = [
    { label: 'Pending', status: 'completed' },
    { label: 'Paid', status: 'completed' },
    { label: 'In Design', status: 'active' },
    { label: 'Approved', status: 'pending' },
    { label: 'In Production', status: 'pending' },
    { label: 'Ready', status: 'pending' },
    { label: 'Delivered', status: 'pending' },
  ];

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Order Tracking</h1>

        {/* Search Order */}
        <div className="bg-slate-950 rounded-lg p-6 border border-dark-lighter mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Track Your Order</h2>
          <div className="flex gap-4">
            <Input
              placeholder="Enter order number (e.g., ORD-7291)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="flex-1"
            />
            <Button variant="primary" onClick={handleTrack}>
              Track Order
            </Button>
          </div>
        </div>

        {/* Order Details */}
        {trackedOrder && (
          <div className="space-y-6">
            <OrderCard order={trackedOrder} />

            {/* Status Timeline */}
            <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
              <h2 className="text-xl font-semibold text-white mb-6">Order Status</h2>
              <div className="space-y-4">
                {statusSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'active' ? 'bg-primary' : 'bg-dark-lighter'
                    }`}>
                      {step.status === 'completed' ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-white font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        step.status === 'completed' ? 'text-green-400' :
                        step.status === 'active' ? 'text-primary' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`absolute left-5 w-0.5 h-8 ${
                        step.status === 'completed' ? 'bg-green-500' : 'bg-dark-lighter'
                      }`} style={{ marginTop: '2.5rem' }}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Shipping Status */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
                <h3 className="text-white font-semibold mb-4">Payment Status</h3>
                <StatusBadge status={trackedOrder.paymentStatus} type="payment" />
              </div>
              <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
                <h3 className="text-white font-semibold mb-4">Shipping Status</h3>
                <StatusBadge status={trackedOrder.shippingStatus} type="order" />
              </div>
            </div>
          </div>
        )}

        {!trackedOrder && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Enter an order number to track your order</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
