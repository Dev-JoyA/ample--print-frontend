'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import { paymentService } from '@/services/paymentService';

export default function PaymentVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref'); // Paystack sometimes uses this

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
        
        // Clear pending payment from session
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
      <DashboardLayout userRole="customer">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment</h2>
            <p className="text-gray-400">Please wait while we confirm your payment...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {success ? (
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-400 mb-8">
              Your payment has been confirmed. Your order is now in production.
            </p>
            
            {transaction && (
              <div className="bg-[#0F0F0F] rounded-lg p-4 mb-8 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-bold">
                    ₦{transaction.transactionAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Reference:</span>
                  <span className="text-white font-mono text-sm">{transaction.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <Button
                variant="primary"
                onClick={handleViewInvoice}
              >
                View Invoice
              </Button>
              <Button
                variant="secondary"
                onClick={handleViewOrder}
              >
                Track Order
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 p-8 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">Payment Failed</h2>
            <p className="text-gray-400 mb-8">
              {error || 'We could not verify your payment. Please try again or contact support.'}
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => router.push('/invoices')}
              >
                Back to Invoices
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/support')}
              >
                Contact Support
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}