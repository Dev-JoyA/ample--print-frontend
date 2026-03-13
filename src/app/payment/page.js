'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Image from 'next/image';
import { useAuthCheck } from '@/app/lib/auth';
import { invoiceService } from '@/services/invoiceService';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { paymentService } from '@/services/paymentService';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  
  useAuthCheck();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [receiptFile, setReceiptFile] = useState(null);
  const [paymentType, setPaymentType] = useState('full'); // 'full', 'part', 'shipping'
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      router.push('/invoices');
      return;
    }
    fetchInvoiceDetails();
  }, [invoiceId]);

  useEffect(() => {
    // Set default payment type based on order data - ONLY when order exists
    if (order && invoice) {
      console.log('✅ Setting payment type based on order:', {
        requiredPaymentType: order.requiredPaymentType,
        requiredDeposit: order.requiredDeposit,
        amountPaid: order.amountPaid,
        invoiceAmountPaid: invoice.amountPaid
      });
      
      // If deposit is available and not paid, default to part payment
      if (order.requiredPaymentType === 'part' && (order.amountPaid || 0) === 0) {
        setPaymentType('part');
        console.log('🎯 Setting default payment type to: part (deposit required)');
      } else {
        setPaymentType('full');
        console.log('🎯 Setting default payment type to: full');
      }
      
      setDataLoaded(true);
    }
  }, [order, invoice]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch invoice details
      const invoiceResponse = await invoiceService.getById(invoiceId);
      const invoiceData = invoiceResponse?.data || invoiceResponse?.invoice || invoiceResponse;
      
      if (!invoiceData) {
        throw new Error('Invoice not found');
      }
      
      console.log('📄 Invoice loaded:', {
        id: invoiceData._id,
        number: invoiceData.invoiceNumber,
        total: invoiceData.totalAmount,
        deposit: invoiceData.depositAmount,
        paid: invoiceData.amountPaid
      });
      setInvoice(invoiceData);
      
      // Get order ID from invoice
      const orderId = typeof invoiceData.orderId === 'object' 
        ? invoiceData.orderId._id 
        : invoiceData.orderId;
      
      // Fetch order details
      console.log('📦 Fetching order:', orderId);
      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      
      console.log('📦 Order loaded:', {
        id: orderData._id,
        number: orderData.orderNumber,
        requiredPaymentType: orderData.requiredPaymentType,
        requiredDeposit: orderData.requiredDeposit,
        amountPaid: orderData.amountPaid
      });
      setOrder(orderData);
      
      // Fetch product images for each item
      if (orderData?.items) {
        const productPromises = orderData.items.map(async (item) => {
          const productId = item.productId?._id || item.productId;
          try {
            const productResponse = await productService.getById(productId);
            const productData = productResponse?.product || productResponse?.data || productResponse;
            return { [productId]: productData };
          } catch (err) {
            console.error(`Failed to fetch product ${productId}:`, err);
            return null;
          }
        });
        
        const productResults = await Promise.all(productPromises);
        const productMap = productResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setProducts(productMap);
      }
      
    } catch (err) {
      console.error('❌ Failed to fetch invoice:', err);
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    // Safety check - make sure order and invoice are loaded
    if (!order || !invoice) {
      setError('Payment data not fully loaded. Please refresh and try again.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Determine amount and transaction type based on payment type
      let amount;
      let transactionType;
      
      if (paymentType === 'part') {
        amount = order.requiredDeposit || invoice.depositAmount;
        transactionType = 'part';
      } else if (paymentType === 'full') {
        amount = (invoice.totalAmount || 0) - (invoice.amountPaid || 0);
        transactionType = 'final';
      } else if (paymentType === 'shipping') {
        amount = order?.shippingCost || 0;
        transactionType = 'shipping';
      }

      // Validate amount
      if (!amount || amount <= 0) {
        setError('Invalid payment amount');
        setSubmitting(false);
        return;
      }

      console.log('🔍 Payment Type Selected:', paymentType);
      console.log('💰 Amount to pay:', amount);
      console.log('📝 Transaction Type:', transactionType);
      console.log('📦 Order Data:', {
        requiredDeposit: order.requiredDeposit,
        amountPaid: order.amountPaid,
        id: order._id
      });
      console.log('📄 Invoice Data:', {
        totalAmount: invoice.totalAmount,
        depositAmount: invoice.depositAmount,
        amountPaid: invoice.amountPaid,
        id: invoice._id
      });

      console.log('🚀 Initializing Paystack payment:', { 
        orderId: order._id, 
        invoiceId: invoice._id, 
        amount, 
        transactionType 
      });

      const response = await paymentService.initializePaystack({
        orderId: order._id,
        invoiceId: invoice._id,
        amount,
        transactionType
      });

      console.log('✅ Paystack initialization response:', response);

      // Extract authorization URL from response
      const authUrl = response?.data?.authorizationUrl || response?.authorizationUrl;
      
      if (authUrl) {
        // Store transaction reference in session for verification on return
        const reference = response?.data?.reference || response?.reference;
        if (reference) {
          sessionStorage.setItem('pending_payment_reference', reference);
          sessionStorage.setItem('pending_payment_invoice', invoice._id);
          sessionStorage.setItem('pending_payment_amount', amount);
          sessionStorage.setItem('pending_payment_type', transactionType);
        }
        
        console.log('➡️ Redirecting to Paystack:', authUrl);
        // Redirect to Paystack
        window.location.href = authUrl;
      } else {
        throw new Error('No authorization URL received from Paystack');
      }

    } catch (err) {
      console.error('❌ Paystack payment failed:', err);
      
      // Check for specific error messages
      if (err.message?.includes('401')) {
        setError('Authentication failed. Please log in again.');
      } else if (err.message?.includes('email')) {
        setError('Email is required for payment. Please update your profile.');
      } else {
        setError(err.message || 'Failed to initialize payment. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const handleBankTransfer = async () => {
    // Safety check - make sure order and invoice are loaded
    if (!order || !invoice) {
      setError('Payment data not fully loaded. Please refresh and try again.');
      return;
    }

    if (!receiptFile) {
      setError('Please upload a payment receipt');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Determine amount and transaction type based on payment type
      let amount;
      let transactionType;
      
      if (paymentType === 'part') {
        amount = order.requiredDeposit || invoice.depositAmount;
        transactionType = 'part';
      } else if (paymentType === 'full') {
        amount = (invoice.totalAmount || 0) - (invoice.amountPaid || 0);
        transactionType = 'final';
      } else if (paymentType === 'shipping') {
        amount = order?.shippingCost || 0;
        transactionType = 'shipping';
      }

      // Validate amount
      if (!amount || amount <= 0) {
        setError('Invalid payment amount');
        setSubmitting(false);
        return;
      }

      console.log('📤 Uploading bank transfer receipt:', {
        orderId: order._id,
        invoiceId: invoice._id,
        amount,
        transactionType,
        fileName: receiptFile.name
      });

      const formData = new FormData();
      formData.append('orderId', order._id);
      formData.append('invoiceId', invoice._id);
      formData.append('amount', amount.toString());
      formData.append('transactionType', transactionType);
      formData.append('receipt', receiptFile);

        const response = await paymentService.uploadBankTransferReceipt(formData);
  
        // Store transaction reference
        if (response?.data?.transactionId) {
            sessionStorage.setItem('pending_payment_reference', response.data.transactionId);
        } else if (response?.transactionId) {
            sessionStorage.setItem('pending_payment_reference', response.transactionId);
        }
      
      console.log('✅ Receipt uploaded successfully');
      router.push('/payment/pending');

    } catch (err) {
      console.error('❌ Bank transfer submission failed:', err);
      setError(err.message || 'Failed to upload receipt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const getProductImageUrl = (imagePath) => {
    if (!imagePath) return '/images/dummy-images/image 3.png';
    
    if (imagePath.startsWith('http')) return imagePath;
    
    let filename = imagePath;
    if (imagePath.includes('/')) {
      filename = imagePath.split('/').pop();
    }
    
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  const getProductImage = (item) => {
    const productId = item.productId?._id || item.productId;
    const product = products[productId];
    
    if (product?.image) {
      return getProductImageUrl(product.image);
    }
    
    if (product?.images && product.images.length > 0) {
      return getProductImageUrl(product.images[0]);
    }
    
    return '/images/dummy-images/image 3.png';
  };

  // Get deposit info from ORDER (not invoice)
  const hasDeposit = order?.requiredPaymentType === 'part';
  const depositAmount = order?.requiredDeposit || invoice?.depositAmount || 0;
  const depositPaid = (order?.amountPaid || 0) >= depositAmount;
  
  // Calculate amounts
  const subtotal = invoice?.subtotal || 0;
  const discount = invoice?.discount || 0;
  const totalAmount = invoice?.totalAmount || 0;
  const paidAmount = invoice?.amountPaid || 0;
  const remainingBalance = totalAmount - paidAmount;

  // Log state for debugging
  console.log('📊 Payment state:', { 
    hasDeposit, 
    depositAmount, 
    depositPaid, 
    remainingBalance,
    paymentType,
    orderRequiredPaymentType: order?.requiredPaymentType,
    dataLoaded
  });

  // Determine amount to pay based on selected payment type
  const getAmountToPay = () => {
    if (paymentType === 'part') return depositAmount;
    if (paymentType === 'full') return remainingBalance;
    if (paymentType === 'shipping') return order?.shippingCost || 0;
    return 0;
  };

  const amountToPay = getAmountToPay();

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-white">Loading payment details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice || !order) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-gray-400">Invoice not found</p>
            <button
              onClick={() => router.push('/invoices')}
              className="mt-4 text-red-500 hover:text-red-400"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Payment</h1>
          <p className="text-gray-400">
            Invoice #{invoice.invoiceNumber} • Order #{order.orderNumber}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

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

            {/* Payment Options - ALL VISIBLE */}
            <div className="bg-[#0A0A0A] rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4 text-lg">Payment Options</h3>
              <div className="space-y-3">
                {/* Items Payment - Always visible */}
                <label className="flex items-center gap-3 p-3 bg-[#0F0F0F] rounded-lg border border-gray-800 cursor-pointer hover:border-[#2D6BFF]/50 transition-colors">
                  <input 
                    type="radio" 
                    name="paymentType" 
                    value="full" 
                    checked={paymentType === 'full'}
                    onChange={() => setPaymentType('full')}
                    className="w-5 h-5 text-[#2D6BFF]" 
                  />
                  <div>
                    <span className="text-white font-medium">Items Payment</span>
                    <p className="text-gray-400 text-sm">
                      Pay {formatCurrency(remainingBalance)} now
                      {paidAmount > 0 && ` (Remaining after ${formatCurrency(paidAmount)} paid)`}
                    </p>
                  </div>
                </label>

                {/* Shipping Payment - Always visible (disabled if not available) */}
                <label className={`flex items-center gap-3 p-3 bg-[#0F0F0F] rounded-lg border border-gray-800 ${
                  order?.shippingCost ? 'cursor-pointer hover:border-[#2D6BFF]/50' : 'cursor-not-allowed opacity-60'
                } transition-colors`}>
                  <input 
                    type="radio" 
                    name="paymentType" 
                    value="shipping"
                    checked={paymentType === 'shipping'}
                    onChange={() => order?.shippingCost && setPaymentType('shipping')}
                    disabled={!order?.shippingCost}
                    className="w-5 h-5 text-[#2D6BFF]" 
                  />
                  <div>
                    <span className="text-white font-medium">Shipping Payment</span>
                    <p className="text-gray-400 text-sm">
                      {order?.shippingCost 
                        ? `Pay ${formatCurrency(order.shippingCost)} for shipping` 
                        : 'Shipping invoice not yet created'}
                    </p>
                  </div>
                </label>

                {/* Items Part Payment - Based on ORDER data */}
                <label className={`flex items-center gap-3 p-3 bg-[#0F0F0F] rounded-lg border border-gray-800 ${
                  hasDeposit ? 'cursor-pointer hover:border-[#2D6BFF]/50' : 'cursor-not-allowed opacity-60'
                } transition-colors`}>
                  <input 
                    type="radio" 
                    name="paymentType" 
                    value="part"
                    checked={paymentType === 'part'}
                    onChange={() => hasDeposit && setPaymentType('part')}
                    disabled={!hasDeposit}
                    className="w-5 h-5 text-[#2D6BFF]" 
                  />
                  <div>
                    <span className="text-white font-medium">
                      {hasDeposit 
                        ? (depositPaid ? 'Balance Payment' : 'Items Part Payment')
                        : 'Part Payment (Not Available)'}
                    </span>
                    <p className="text-gray-400 text-sm">
                      {hasDeposit 
                        ? (depositPaid 
                            ? `Pay remaining balance ${formatCurrency(remainingBalance)}`
                            : `Pay deposit ${formatCurrency(depositAmount)} now, remaining ${formatCurrency(totalAmount - depositAmount)} later`)
                        : 'Part payment not available for this invoice'}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#0A0A0A] rounded-xl p-6 border border-gray-800 sticky top-24">
              <h3 className="text-xl font-semibold text-white mb-6">Order Summary</h3>
              
              {/* Product Cards */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-[#0F0F0F] rounded-lg border border-gray-800">
                    <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={getProductImage(item)}
                        alt={item.productName}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.target.src = '/images/dummy-images/image 3.png';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-medium mb-1">{item.productName}</h4>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      <p className="text-[#2D6BFF] font-bold text-sm mt-1">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full Breakdown */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Discount:</span>
                    <span className="text-green-400">-{formatCurrency(discount)}</span>
                  </div>
                )}
                
                {/* Show Deposit from ORDER */}
                {hasDeposit && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deposit Required:</span>
                    <span className="text-yellow-400">{formatCurrency(depositAmount)}</span>
                  </div>
                )}
                
                {paidAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid:</span>
                    <span className="text-green-400">{formatCurrency(paidAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-300 font-medium">Total Amount:</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(totalAmount)}</span>
                </div>

                {/* Show balance if deposit paid */}
                {hasDeposit && depositPaid && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Balance:</span>
                    <span className="text-yellow-400">{formatCurrency(remainingBalance)}</span>
                  </div>
                )}
              </div>

              {/* Amount to Pay Now */}
              <div className="bg-[#2D6BFF]/20 rounded-lg p-3 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#2D6BFF]">
                    {paymentType === 'part' ? (depositPaid ? 'Balance to Pay' : 'Deposit to Pay') : 
                     paymentType === 'shipping' ? 'Shipping to Pay' : 
                     'Amount to Pay'}
                  </span>
                  <span className="text-xl font-bold text-[#2D6BFF]">
                    {formatCurrency(amountToPay)}
                  </span>
                </div>
                {paymentType === 'part' && !depositPaid && (
                  <p className="text-xs text-gray-400 mt-1">
                    Remaining after deposit: {formatCurrency(totalAmount - depositAmount)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-6">
                <Button
                  variant="primary"
                  onClick={paymentMethod === 'paystack' ? handlePaystackPayment : handleBankTransfer}
                  disabled={submitting || (paymentMethod === 'bank' && !receiptFile) || !dataLoaded}
                  className="w-full py-3 bg-[#2D6BFF] hover:bg-[#1A4FCC] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting 
                    ? 'Processing...' 
                    : !dataLoaded
                      ? 'Loading...'
                      : paymentMethod === 'paystack' 
                        ? 'Pay with Paystack' 
                        : 'Submit Receipt'}
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