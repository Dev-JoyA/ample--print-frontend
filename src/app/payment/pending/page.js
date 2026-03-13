'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function PaymentPendingPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [transactionRef, setTransactionRef] = useState('');

  useEffect(() => {
    // Get transaction reference from session storage if available
    const ref = sessionStorage.getItem('pending_payment_reference');
    if (ref) {
      setTransactionRef(ref);
    }

    // Countdown timer for page refresh
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoToInvoices = () => {
    router.push('/invoices');
  };

  return (
    <DashboardLayout userRole="customer">
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-[#0A0A0A] rounded-xl border border-gray-800 p-8 text-center">
          {/* Clock Icon */}
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-3">
            Payment Pending Verification
          </h1>

          {/* Message */}
          <p className="text-gray-400 mb-6">
            Your payment receipt has been uploaded successfully. 
            Our team will verify your payment within 24 hours.
            You will receive a notification once your payment is confirmed.
          </p>

          {/* Transaction Reference */}
          {transactionRef && (
            <div className="bg-[#0F0F0F] rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">Transaction Reference</p>
              <p className="text-lg font-mono text-white">{transactionRef}</p>
            </div>
          )}

          {/* Auto-refresh Info */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-400">
              This page will automatically refresh in {formatTime(timeLeft)} to check verification status
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              onClick={handleRefresh}
              className="min-w-[200px]"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Check Status
              </span>
            </Button>

            <Button
              variant="secondary"
              onClick={handleGoToInvoices}
              className="min-w-[200px]"
            >
              Back to Invoices
            </Button>
          </div>

          {/* Support Info */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Having issues? Contact our support team at{' '}
              <a href="mailto:support@ampleprinthub.com" className="text-primary hover:underline">
                support@ampleprinthub.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}