'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Image from 'next/image';

export default function PaymentPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [receiptFile, setReceiptFile] = useState(null);
  const [orderId, setOrderId] = useState('');

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Payment</h1>
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Enter Order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Methods Card */}
            <div className="bg-[#0A0A0A] rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-6">Select Payment Method</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Paystack Option */}
                <div
                  onClick={() => setPaymentMethod('paystack')}
                  className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'paystack'
                      ? 'border-[#2D6BFF] bg-[#2D6BFF]/10'
                      : 'border-gray-800 hover:border-[#2D6BFF]/50 bg-[#0F0F0F]'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-3 ${
                      paymentMethod === 'paystack' ? 'bg-[#2D6BFF]/20' : 'bg-gray-800'
                    }`}>
                      <span className="text-3xl">💳</span>
                    </div>
                    <h3 className="text-white font-semibold mb-1">Paystack</h3>
                    <p className="text-gray-400 text-sm mb-3">Card, Bank Transfer, USSD</p>
                    <input
                      type="radio"
                      checked={paymentMethod === 'paystack'}
                      onChange={() => setPaymentMethod('paystack')}
                      className="w-5 h-5 text-[#2D6BFF]"
                    />
                  </div>
                </div>

                {/* Bank Transfer Option */}
                <div
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-[#2D6BFF] bg-[#2D6BFF]/10'
                      : 'border-gray-800 hover:border-[#2D6BFF]/50 bg-[#0F0F0F]'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-3 ${
                      paymentMethod === 'bank' ? 'bg-[#2D6BFF]/20' : 'bg-gray-800'
                    }`}>
                      <span className="text-3xl">🏦</span>
                    </div>
                    <h3 className="text-white font-semibold mb-1">Bank Transfer</h3>
                    <p className="text-gray-400 text-sm mb-3">Upload payment receipt</p>
                    <input
                      type="radio"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="w-5 h-5 text-[#2D6BFF]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Transfer Details */}
            {paymentMethod === 'bank' && (
              <div className="bg-[#0A0A0A] rounded-xl p-6 border border-gray-800">
                <h3 className="text-white font-semibold mb-6 text-lg">Bank Transfer Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-[#0F0F0F] p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm mb-1">Account Name</p>
                    <p className="text-white font-medium">Ampleprinthub Limited</p>
                  </div>
                  <div className="bg-[#0F0F0F] p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm mb-1">Account Number</p>
                    <p className="text-white font-medium">0123456789</p>
                  </div>
                  <div className="bg-[#0F0F0F] p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm mb-1">Bank</p>
                    <p className="text-white font-medium">Access Bank</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Payment Receipt
                  </label>
                  <div className="border-2 border-dashed border-gray-800 rounded-lg p-6 text-center hover:border-[#2D6BFF]/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setReceiptFile(e.target.files[0])}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label htmlFor="receipt-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📎</span>
                        <span className="text-[#2D6BFF] font-medium">Click to upload</span>
                        <span className="text-gray-400 text-sm">or drag and drop</span>
                        <span className="text-gray-500 text-xs">PNG, JPG, PDF up to 10MB</span>
                      </div>
                    </label>
                  </div>
                  {receiptFile && (
                    <div className="mt-3 p-3 bg-[#0F0F0F] rounded-lg border border-gray-800 flex items-center justify-between">
                      <span className="text-gray-300 text-sm truncate max-w-[200px]">{receiptFile.name}</span>
                      <span className="text-green-500 text-sm">✓ Selected</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Options */}
            <div className="bg-[#0A0A0A] rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4 text-lg">Payment Options</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-[#0F0F0F] rounded-lg border border-gray-800 cursor-pointer hover:border-[#2D6BFF]/50 transition-colors">
                  <input type="radio" name="paymentType" value="full" defaultChecked className="w-5 h-5 text-[#2D6BFF]" />
                  <div>
                    <span className="text-white font-medium">Items Payment</span>
                    <p className="text-gray-400 text-sm">Pay the total amount now</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-[#0F0F0F] rounded-lg border border-gray-800 cursor-pointer hover:border-[#2D6BFF]/50 transition-colors">
                  <input type="radio" name="paymentType" value="deposit" className="w-5 h-5 text-[#2D6BFF]" />
                  <div>
                    <span className="text-white font-medium">Shipping Payment</span>
                    <p className="text-gray-400 text-sm">Pay ₦{(orderTotal * 0.5).toLocaleString()} now</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-[#0F0F0F] rounded-lg border border-gray-800 cursor-pointer hover:border-[#2D6BFF]/50 transition-colors">
                  <input type="radio" name="paymentType" value="part" className="w-5 h-5 text-[#2D6BFF]" />
                   {/* This option is for only Customers super admin allows to pay part */}
                  <div>
                    <span className="text-white font-medium">Items Part Payment</span>
                    <p className="text-gray-400 text-sm">Pay a custom amount</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#0A0A0A] rounded-xl p-6 border border-gray-800 sticky top-24">
              <h3 className="text-xl font-semibold text-white mb-6">Order Summary</h3>
              
              {/* Product Card */}
              <div className="flex gap-4 p-4 bg-[#0F0F0F] rounded-xl border border-gray-800 mb-6">
                <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src="/images/dummy-images/image 3.png"
                    alt="Product Image"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">Luxury Brand Book</h4>
                  <ul className="flex flex-wrap gap-2 text-gray-400 text-xs mb-2">
                    <li className="flex items-center gap-1">📦 100 units</li>
                    <li className="flex items-center gap-1">✨ Matte finish</li>
                  </ul>
                  <p className="text-[#2D6BFF] font-bold text-lg">₦{orderTotal.toLocaleString()}</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">₦{orderTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-white">₦2,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">VAT (5%)</span>
                  <span className="text-white">₦1,200</span>
                </div>
              </div>

              <div className="border-t border-gray-800 my-4"></div>

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-300 font-medium">Total</span>
                <span className="text-2xl font-bold text-white">₦{(orderTotal + 2000 + 1200).toLocaleString()}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  onClick={paymentMethod === 'paystack' ? handlePaystackPayment : handleBankTransfer}
                  disabled={paymentMethod === 'bank' && !receiptFile}
                  className="w-full py-3 bg-[#2D6BFF] hover:bg-[#1A4FCC] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentMethod === 'paystack' ? 'Pay with Paystack' : 'Submit Receipt'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.back()}
                  className="w-full py-3 bg-transparent border border-gray-700 hover:border-gray-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Back
                </Button>
              </div>

              {/* Secure Payment Note */}
              <p className="text-center text-gray-500 text-xs mt-4">
                🔒 Secure payment. Your information is encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}