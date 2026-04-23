'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { paymentService } from '@/services/paymentService';
import { METADATA } from '@/lib/metadata';

function PaymentVerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const ref = reference || trxref;

      if (!ref) {
        setError('No payment reference found');
        setVerifying(false);
        return;
      }

      console.log('Verifying payment with reference:', ref);

      const response = await paymentService.verifyPaystack(ref);
      console.log('Verification response:', response);

      const transactionData = response?.data || response;

      if (transactionData?.transactionStatus === 'completed') {
        setSuccess(true);
        setTransaction(transactionData);
        sessionStorage.removeItem('pending_payment_reference');
        sessionStorage.removeItem('pending_payment_invoice');
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    } catch (err) {
      console.error('Payment verification failed:', err);
      setError(err.message || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleViewInvoice = () => {
    if (transaction?.invoiceId) {
      router.push(`/invoices/${transaction.invoiceId}`);
    } else {
      router.push('/invoices');
    }
  };

  const handleViewOrder = () => {
    if (transaction?.orderId) {
      router.push(`/orders/${transaction.orderId}`);
    } else {
      router.push('/order-history');
    }
  };

  if (verifying) {
    return (
      <>
        <SEOHead
          title="Verifying Payment"
          description="Please wait while we verify your payment"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="customer">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent sm:h-20 sm:w-20"></div>
              <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl">Verifying Payment</h2>
              <p className="text-sm text-gray-400 sm:text-base">
                Please wait while we confirm your payment...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={success ? 'Payment Successful' : 'Payment Failed'}
        description={
          success ? 'Your payment has been confirmed successfully' : 'Payment verification failed'
        }
        robots="noindex, nofollow"
      />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 lg:py-16">
          {success ? (
            <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] p-6 text-center sm:p-8">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 sm:h-20 sm:w-20">
                <svg
                  className="h-8 w-8 text-green-500 sm:h-10 sm:w-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
                Payment Successful!
              </h2>
              <p className="mb-6 text-sm text-gray-400 sm:mb-8 sm:text-base">
                Your payment has been confirmed. Your order is now in production.
              </p>

              {transaction && (
                <div className="mb-6 rounded-lg bg-[#0F0F0F] p-4 text-left sm:mb-8">
                  <div className="mb-2 flex flex-wrap justify-between gap-2">
                    <span className="text-sm text-gray-400 sm:text-base">Amount:</span>
                    <span className="text-sm font-bold text-white sm:text-base">
                      ₦{transaction.transactionAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="mb-2 flex flex-wrap justify-between gap-2">
                    <span className="text-sm text-gray-400 sm:text-base">Reference:</span>
                    <span className="break-all font-mono text-xs text-white sm:text-sm">
                      {transaction.transactionId}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-sm text-gray-400 sm:text-base">Date:</span>
                    <span className="text-sm text-white sm:text-base">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Button variant="primary" onClick={handleViewInvoice} className="w-full sm:w-auto">
                  View Invoice
                </Button>
                <Button variant="secondary" onClick={handleViewOrder} className="w-full sm:w-auto">
                  Track Order
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] p-6 text-center sm:p-8">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 sm:h-20 sm:w-20">
                <svg
                  className="h-8 w-8 text-red-500 sm:h-10 sm:w-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Payment Failed</h2>
              <p className="mb-6 text-sm text-gray-400 sm:mb-8 sm:text-base">
                {error || 'We could not verify your payment. Please try again or contact support.'}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Button
                  variant="primary"
                  onClick={() => router.push('/invoices')}
                  className="w-full sm:w-auto"
                >
                  Back to Invoices
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/support')}
                  className="w-full sm:w-auto"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={null}>
      <PaymentVerifyPageContent />
    </Suspense>
  );
}
