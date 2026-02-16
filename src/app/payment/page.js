'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function PaymentPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [receiptFile, setReceiptFile] = useState(null);

  const orderTotal = 30000.00;

  const handlePaystackPayment = () => {
    // In real app, this would integrate with Paystack
    console.log('Processing Paystack payment...');
    router.push('/payment/success');
  };

  const handleBankTransfer = () => {
    // In real app, this would submit the receipt for admin verification
    console.log('Submitting bank transfer receipt...');
    router.push('/payment/pending');
  };

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Payment</h1>

        <div className="space-y-6">
          {/* Order Total */}
          <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Amount</span>
              <span className="text-3xl font-bold text-white">₦{orderTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
            <h2 className="text-xl font-semibold text-white mb-4">Select Payment Method</h2>
            
            <div className="space-y-4">
              {/* Paystack Option */}
              <div
                onClick={() => setPaymentMethod('paystack')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === 'paystack'
                    ? 'border-primary bg-primary/10'
                    : 'border-dark-lighter hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💳</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Paystack</h3>
                      <p className="text-gray-400 text-sm">Card, Bank Transfer, USSD</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={paymentMethod === 'paystack'}
                    onChange={() => setPaymentMethod('paystack')}
                    className="w-5 h-5 text-primary"
                  />
                </div>
              </div>

              {/* Bank Transfer Option */}
              <div
                onClick={() => setPaymentMethod('bank')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === 'bank'
                    ? 'border-primary bg-primary/10'
                    : 'border-dark-lighter hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🏦</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Bank Transfer</h3>
                      <p className="text-gray-400 text-sm">Upload payment receipt for verification</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={paymentMethod === 'bank'}
                    onChange={() => setPaymentMethod('bank')}
                    className="w-5 h-5 text-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Transfer Details */}
          {paymentMethod === 'bank' && (
            <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
              <h3 className="text-white font-semibold mb-4">Bank Transfer Details</h3>
              <div className="space-y-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Account Name</p>
                  <p className="text-white">Ampleprinthub Limited</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Account Number</p>
                  <p className="text-white">0123456789</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Bank</p>
                  <p className="text-white">Access Bank</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Payment Receipt
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files[0])}
                  className="w-full px-4 py-2 bg-dark border border-dark-lighter rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:cursor-pointer"
                />
                {receiptFile && (
                  <p className="mt-2 text-sm text-gray-400">Selected: {receiptFile.name}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment Options */}
          <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
            <h3 className="text-white font-semibold mb-4">Payment Options</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="paymentType" value="full" defaultChecked className="w-5 h-5 text-primary" />
                <span className="text-gray-300">Full Payment</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="paymentType" value="deposit" className="w-5 h-5 text-primary" />
                <span className="text-gray-300">Deposit Payment (50%)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="paymentType" value="part" className="w-5 h-5 text-primary" />
                <span className="text-gray-300">Part Payment (Custom Amount)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={paymentMethod === 'paystack' ? handlePaystackPayment : handleBankTransfer}
              className="flex-1"
              disabled={paymentMethod === 'bank' && !receiptFile}
            >
              {paymentMethod === 'paystack' ? 'Pay with Paystack' : 'Submit Receipt'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
