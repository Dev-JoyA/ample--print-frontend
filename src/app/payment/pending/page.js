'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

export default function PaymentPendingPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(300);
  const [transactionRef, setTransactionRef] = useState('');

  useEffect(() => {
    const ref = sessionStorage.getItem('pending_payment_reference');
    if (ref) {
      setTransactionRef(ref);
    }

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
    <>
      <SEOHead
        title="Payment Pending"
        description="Your payment is pending verification. We'll notify you once confirmed."
        robots="noindex, nofollow"
      />
      <DashboardLayout userRole="customer">
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-800 bg-[#0A0A0A] p-6 text-center sm:p-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20 sm:h-24 sm:w-24">
              <svg className="h-10 w-10 text-yellow-500 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="mb-2 text-2xl font-bold text-white sm:mb-3 sm:text-3xl">
              Payment Pending Verification
            </h1>

            <p className="mb-4 text-sm text-gray-400 sm:mb-6 sm:text-base">
              Your payment receipt has been uploaded successfully. 
              Our team will verify your payment within 24 hours.
              You will receive a notification once your payment is confirmed.
            </p>

            {transactionRef && (
              <div className="mb-6 rounded-lg bg-[#0F0F0F] p-3 sm:p-4">
                <p className="mb-1 text-xs text-gray-400 sm:text-sm">Transaction Reference</p>
                <p className="font-mono text-sm text-white sm:text-lg">{transactionRef}</p>
              </div>
            )}

            <div className="mb-6 rounded-lg border border-blue-800 bg-blue-900/20 p-3 sm:mb-8 sm:p-4">
              <p className="text-xs text-blue-400 sm:text-sm">
                This page will automatically refresh in {formatTime(timeLeft)} to check verification status
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Button
                variant="primary"
                onClick={handleRefresh}
                className="min-w-[180px] sm:min-w-[200px]"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Check Status
                </span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleGoToInvoices}
                className="min-w-[180px] sm:min-w-[200px]"
              >
                Back to Invoices
              </Button>
            </div>

            <div className="mt-6 border-t border-gray-800 pt-4 sm:mt-8 sm:pt-6">
              <p className="text-xs text-gray-500 sm:text-sm">
                Having issues? Contact our support team at{' '}
                <a href="mailto:support@ampleprinthub.com" className="text-primary hover:underline">
                  support@ampleprinthub.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}