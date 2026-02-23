'use client';

import { useState } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';

export default function PaymentVerificationPage() {
  const [payments] = useState([
    {
      id: 1,
      orderNumber: 'ORD-7291',
      amount: 4000.00,
      paymentMethod: 'Bank Transfer',
      receipt: '/images/collection/nylons/1.jpg',
      submittedDate: '2025-12-12',
      status: 'PENDING',
    },
    {
      id: 2,
      orderNumber: 'ORD-8822',
      amount: 19200.00,
      paymentMethod: 'Bank Transfer',
      receipt: '/images/collection/paperbags/bagpp.webp',
      submittedDate: '2025-12-12',
      status: 'PENDING',
    },
  ]);

  const handleVerify = (paymentId, verified) => {
    console.log('Verify payment:', paymentId, verified);
    // In real app, this would update the payment status
  };

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Payment Verification</h1>
          <p className="text-gray-400">Verify bank transfer payments</p>
        </div>

        <div className="space-y-6">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-slate-950 rounded-lg p-6 border border-dark-lighter">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Order {payment.orderNumber}</h3>
                  <p className="text-gray-400 text-sm">
                    Amount: ₦{payment.amount.toLocaleString()} • {payment.paymentMethod} • Submitted on {payment.submittedDate}
                  </p>
                </div>
                <StatusBadge status={payment.status} type="payment" />
              </div>

              {/* Receipt Image */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Payment Receipt</p>
                <div className="relative w-full h-64 bg-dark rounded-lg overflow-hidden">
                  <Image
                    src={payment.receipt}
                    alt="Payment Receipt"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant="primary"
                  onClick={() => handleVerify(payment.id, true)}
                >
                  Verify Payment
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleVerify(payment.id, false)}
                >
                  Reject Payment
                </Button>
              </div>
            </div>
          ))}
        </div>

        {payments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No pending payments to verify</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
