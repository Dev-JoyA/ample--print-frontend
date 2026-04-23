// 'use client';

// import { Suspense, useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import DashboardLayout from '@/components/layouts/DashboardLayout';
// import Button from '@/components/ui/Button';
// import Input from '@/components/ui/Input';
// import Image from 'next/image';
// import SEOHead from '@/components/common/SEOHead';
// import { useAuthCheck } from '@/app/lib/auth';
// import { invoiceService } from '@/services/invoiceService';
// import { orderService } from '@/services/orderService';
// import { productService } from '@/services/productService';
// import { paymentService } from '@/services/paymentService';
// import { bankAccountService } from '@/services/bankAccountService';
// import { METADATA } from '@/lib/metadata';

// function PaymentPageContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const invoiceId = searchParams.get('invoiceId');

//   useAuthCheck();

//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState('');
//   const [invoice, setInvoice] = useState(null);
//   const [order, setOrder] = useState(null);
//   const [products, setProducts] = useState({});
//   const [paymentMethod, setPaymentMethod] = useState('paystack');
//   const [receiptFile, setReceiptFile] = useState(null);
//   const [paymentType, setPaymentType] = useState('full');
//   const [dataLoaded, setDataLoaded] = useState(false);
//   const [bankAccount, setBankAccount] = useState(null);

//   useEffect(() => {
//     if (!invoiceId) {
//       router.push('/invoices');
//       return;
//     }
//     fetchInvoiceDetails();
//     fetchActiveBankAccount();
//   }, [invoiceId]);

//   useEffect(() => {
//     if (order && invoice) {
//       console.log('Setting payment type based on order:', {
//         requiredPaymentType: order.requiredPaymentType,
//         requiredDeposit: order.requiredDeposit,
//         amountPaid: order.amountPaid,
//         invoiceAmountPaid: invoice.amountPaid
//       });

//       if (order.requiredPaymentType === 'part' && (order.amountPaid || 0) === 0) {
//         setPaymentType('part');
//       } else {
//         setPaymentType('full');
//       }

//       setDataLoaded(true);
//     }
//   }, [order, invoice]);

//   const fetchInvoiceDetails = async () => {
//     try {
//       setLoading(true);

//       const invoiceResponse = await invoiceService.getById(invoiceId);
//       const invoiceData = invoiceResponse?.data || invoiceResponse?.invoice || invoiceResponse;

//       if (!invoiceData) {
//         throw new Error('Invoice not found');
//       }

//       console.log('Invoice loaded:', {
//         id: invoiceData._id,
//         number: invoiceData.invoiceNumber,
//         total: invoiceData.totalAmount,
//         deposit: invoiceData.depositAmount,
//         paid: invoiceData.amountPaid
//       });
//       setInvoice(invoiceData);

//       const orderId = typeof invoiceData.orderId === 'object'
//         ? invoiceData.orderId._id
//         : invoiceData.orderId;

//       console.log('Fetching order:', orderId);
//       const orderResponse = await orderService.getById(orderId);
//       const orderData = orderResponse?.order || orderResponse?.data || orderResponse;

//       console.log('Order loaded:', {
//         id: orderData._id,
//         number: orderData.orderNumber,
//         requiredPaymentType: orderData.requiredPaymentType,
//         requiredDeposit: orderData.requiredDeposit,
//         amountPaid: orderData.amountPaid
//       });
//       setOrder(orderData);

//       if (orderData?.items) {
//         const productPromises = orderData.items.map(async (item) => {
//           const productId = item.productId?._id || item.productId;
//           try {
//             const productResponse = await productService.getById(productId);
//             const productData = productResponse?.product || productResponse?.data || productResponse;
//             return { [productId]: productData };
//           } catch (err) {
//             console.error(`Failed to fetch product ${productId}:`, err);
//             return null;
//           }
//         });

//         const productResults = await Promise.all(productPromises);
//         const productMap = productResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
//         setProducts(productMap);
//       }

//     } catch (err) {
//       console.error('Failed to fetch invoice:', err);
//       setError('Failed to load invoice details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchActiveBankAccount = async () => {
//     try {
//       const resp = await bankAccountService.getActive();
//       const acct = resp?.bankAccount ?? resp?.data?.bankAccount ?? resp?.data ?? resp;
//       setBankAccount(acct?.bankAccount ? acct.bankAccount : acct);
//     } catch (e) {
//       console.error("Failed to fetch active bank account:", e);
//       setBankAccount(null);
//     }
//   };

//   const handlePaystackPayment = async () => {
//     if (!order || !invoice) {
//       setError('Payment data not fully loaded. Please refresh and try again.');
//       return;
//     }

//     try {
//       setSubmitting(true);
//       setError('');

//       let amount;
//       let transactionType;

//       if (paymentType === 'part') {
//         amount = order.requiredDeposit || invoice.depositAmount;
//         transactionType = 'part';
//       } else if (paymentType === 'full') {
//         amount = (invoice.totalAmount || 0) - (invoice.amountPaid || 0);
//         transactionType = 'final';
//       } else if (paymentType === 'shipping') {
//         amount = order?.shippingCost || 0;
//         transactionType = 'shipping';
//       }

//       if (!amount || amount <= 0) {
//         setError('Invalid payment amount');
//         setSubmitting(false);
//         return;
//       }

//       console.log('Initializing Paystack payment:', {
//         orderId: order._id,
//         invoiceId: invoice._id,
//         amount,
//         transactionType
//       });

//       const response = await paymentService.initializePaystack({
//         orderId: order._id,
//         invoiceId: invoice._id,
//         amount,
//         transactionType
//       });

//       const authUrl = response?.data?.authorizationUrl || response?.authorizationUrl;

//       if (authUrl) {
//         const reference = response?.data?.reference || response?.reference;
//         if (reference) {
//           sessionStorage.setItem('pending_payment_reference', reference);
//           sessionStorage.setItem('pending_payment_invoice', invoice._id);
//           sessionStorage.setItem('pending_payment_amount', amount);
//           sessionStorage.setItem('pending_payment_type', transactionType);
//         }

//         window.location.href = authUrl;
//       } else {
//         throw new Error('No authorization URL received from Paystack');
//       }

//     } catch (err) {
//       console.error('Paystack payment failed:', err);
//       if (err.message?.includes('401')) {
//         setError('Authentication failed. Please log in again.');
//       } else if (err.message?.includes('email')) {
//         setError('Email is required for payment. Please update your profile.');
//       } else {
//         setError(err.message || 'Failed to initialize payment. Please try again.');
//       }
//       setSubmitting(false);
//     }
//   };

//   const handleBankTransfer = async () => {
//     if (!order || !invoice) {
//       setError('Payment data not fully loaded. Please refresh and try again.');
//       return;
//     }

//     if (!receiptFile) {
//       setError('Please upload a payment receipt');
//       return;
//     }

//     try {
//       setSubmitting(true);
//       setError('');

//       let amount;
//       let transactionType;

//       if (paymentType === 'part') {
//         amount = order.requiredDeposit || invoice.depositAmount;
//         transactionType = 'part';
//       } else if (paymentType === 'full') {
//         amount = (invoice.totalAmount || 0) - (invoice.amountPaid || 0);
//         transactionType = 'final';
//       } else if (paymentType === 'shipping') {
//         amount = order?.shippingCost || 0;
//         transactionType = 'shipping';
//       }

//       if (!amount || amount <= 0) {
//         setError('Invalid payment amount');
//         setSubmitting(false);
//         return;
//       }

//       const formData = new FormData();
//       formData.append('orderId', order._id);
//       formData.append('invoiceId', invoice._id);
//       formData.append('amount', amount.toString());
//       formData.append('transactionType', transactionType);
//       formData.append('receipt', receiptFile);

//       const response = await paymentService.uploadBankTransferReceipt(formData);

//       if (response?.data?.transactionId) {
//         sessionStorage.setItem('pending_payment_reference', response.data.transactionId);
//       } else if (response?.transactionId) {
//         sessionStorage.setItem('pending_payment_reference', response.transactionId);
//       }

//       router.push('/payment/pending');

//     } catch (err) {
//       console.error('Bank transfer submission failed:', err);
//       setError(err.message || 'Failed to upload receipt. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const formatCurrency = (amount) => {
//     return `₦${amount?.toLocaleString() || '0'}`;
//   };

//   const getProductImageUrl = (imagePath) => {
//     if (!imagePath) return '/images/dummy-images/image 3.png';
//     if (imagePath.startsWith('http')) return imagePath;
//     let filename = imagePath;
//     if (imagePath.includes('/')) {
//       filename = imagePath.split('/').pop();
//     }
//     return `http://localhost:4001/api/v1/attachments/download/${filename}`;
//   };

//   const getProductImage = (item) => {
//     const productId = item.productId?._id || item.productId;
//     const product = products[productId];

//     if (product?.image) {
//       return getProductImageUrl(product.image);
//     }

//     if (product?.images && product.images.length > 0) {
//       return getProductImageUrl(product.images[0]);
//     }

//     return '/images/dummy-images/image 3.png';
//   };

//   const hasDeposit = order?.requiredPaymentType === 'part';
//   const depositAmount = order?.requiredDeposit || invoice?.depositAmount || 0;
//   const depositPaid = (order?.amountPaid || 0) >= depositAmount;

//   const subtotal = invoice?.subtotal || 0;
//   const discount = invoice?.discount || 0;
//   const totalAmount = invoice?.totalAmount || 0;
//   const paidAmount = invoice?.amountPaid || 0;
//   const remainingBalance = totalAmount - paidAmount;

//   const getAmountToPay = () => {
//     if (paymentType === 'part') return depositAmount;
//     if (paymentType === 'full') return remainingBalance;
//     if (paymentType === 'shipping') return order?.shippingCost || 0;
//     return 0;
//   };

//   const amountToPay = getAmountToPay();

//   if (loading) {
//     return (
//       <>
//         <SEOHead
//           title="Payment"
//           description="Make payment for your invoice"
//           robots="noindex, nofollow"
//         />
//         <DashboardLayout userRole="customer">
//           <div className="mx-auto max-w-7xl px-4 py-8">
//             <div className="flex min-h-[60vh] items-center justify-center">
//               <div className="text-white">Loading payment details...</div>
//             </div>
//           </div>
//         </DashboardLayout>
//       </>
//     );
//   }

//   if (!invoice || !order) {
//     return (
//       <>
//         <SEOHead
//           title="Payment - Invoice Not Found"
//           description="The requested invoice could not be found"
//           robots="noindex, nofollow"
//         />
//         <DashboardLayout userRole="customer">
//           <div className="mx-auto max-w-7xl px-4 py-8">
//             <div className="py-16 text-center">
//               <p className="text-gray-400">Invoice not found</p>
//               <button
//                 onClick={() => router.push('/invoices')}
//                 className="mt-4 text-red-500 hover:text-red-400"
//               >
//                 Back to Invoices
//               </button>
//             </div>
//           </div>
//         </DashboardLayout>
//       </>
//     );
//   }

//   return (
//     <>
//       <SEOHead
//         title={`Payment - Invoice ${invoice.invoiceNumber}`}
//         description={`Pay invoice ${invoice.invoiceNumber} for order ${order.orderNumber}`}
//         robots="noindex, nofollow"
//       />
//       <DashboardLayout userRole="customer">
//         <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
//           <div className="mb-6 sm:mb-8">
//             <h1 className="text-2xl font-bold text-white sm:text-3xl sm:text-4xl">Payment</h1>
//             <p className="mt-1 text-sm text-gray-400 sm:mt-2 sm:text-base">
//               Invoice #{invoice.invoiceNumber} • Order #{order.orderNumber}
//             </p>
//           </div>

//           {error && (
//             <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4">
//               <p className="text-sm text-red-400">{error}</p>
//             </div>
//           )}

//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
//             <div className="space-y-6 lg:col-span-2">
//               <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] p-5 sm:p-6">
//                 <h2 className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">Select Payment Method</h2>

//                 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
//                   <div
//                     onClick={() => setPaymentMethod('paystack')}
//                     className={`cursor-pointer rounded-xl border-2 p-4 transition-all sm:p-5 ${
//                       paymentMethod === 'paystack'
//                         ? 'border-[#2D6BFF] bg-[#2D6BFF]/10'
//                         : 'border-gray-800 bg-[#0F0F0F] hover:border-[#2D6BFF]/50'
//                     }`}
//                   >
//                     <div className="flex flex-col items-center text-center">
//                       <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${
//                         paymentMethod === 'paystack' ? 'bg-[#2D6BFF]/20' : 'bg-gray-800'
//                       }`}>
//                         <span className="text-2xl sm:text-3xl">💳</span>
//                       </div>
//                       <h3 className="text-sm font-semibold text-white sm:text-base">Paystack</h3>
//                       <p className="mb-2 text-xs text-gray-400 sm:mb-3 sm:text-sm">Card, Bank Transfer, USSD</p>
//                       <input
//                         type="radio"
//                         checked={paymentMethod === 'paystack'}
//                         onChange={() => setPaymentMethod('paystack')}
//                         className="h-4 w-4 text-[#2D6BFF] sm:h-5 sm:w-5"
//                       />
//                     </div>
//                   </div>

//                   <div
//                     onClick={() => setPaymentMethod('bank')}
//                     className={`cursor-pointer rounded-xl border-2 p-4 transition-all sm:p-5 ${
//                       paymentMethod === 'bank'
//                         ? 'border-[#2D6BFF] bg-[#2D6BFF]/10'
//                         : 'border-gray-800 bg-[#0F0F0F] hover:border-[#2D6BFF]/50'
//                     }`}
//                   >
//                     <div className="flex flex-col items-center text-center">
//                       <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${
//                         paymentMethod === 'bank' ? 'bg-[#2D6BFF]/20' : 'bg-gray-800'
//                       }`}>
//                         <span className="text-2xl sm:text-3xl">🏦</span>
//                       </div>
//                       <h3 className="text-sm font-semibold text-white sm:text-base">Bank Transfer</h3>
//                       <p className="mb-2 text-xs text-gray-400 sm:mb-3 sm:text-sm">Upload payment receipt</p>
//                       <input
//                         type="radio"
//                         checked={paymentMethod === 'bank'}
//                         onChange={() => setPaymentMethod('bank')}
//                         className="h-4 w-4 text-[#2D6BFF] sm:h-5 sm:w-5"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {paymentMethod === 'bank' && (
//                 <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] p-5 sm:p-6">
//                   <h3 className="mb-4 text-base font-semibold text-white sm:mb-6 sm:text-lg">Bank Transfer Details</h3>

//                   <div className="mb-5 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-3 sm:gap-4">
//                     <div className="rounded-lg border border-gray-800 bg-[#0F0F0F] p-3 sm:p-4">
//                       <p className="text-xs text-gray-400 sm:text-sm">Account Name</p>
//                       <p className="text-sm font-medium text-white sm:text-base">
//                         {bankAccount?.accountName || "Not available"}
//                       </p>
//                     </div>
//                     <div className="rounded-lg border border-gray-800 bg-[#0F0F0F] p-3 sm:p-4">
//                       <p className="text-xs text-gray-400 sm:text-sm">Account Number</p>
//                       <p className="text-sm font-medium text-white sm:text-base">
//                         {bankAccount?.accountNumber || "Not available"}
//                       </p>
//                     </div>
//                     <div className="rounded-lg border border-gray-800 bg-[#0F0F0F] p-3 sm:p-4">
//                       <p className="text-xs text-gray-400 sm:text-sm">Bank</p>
//                       <p className="text-sm font-medium text-white sm:text-base">
//                         {bankAccount?.bankName || "Not available"}
//                       </p>
//                     </div>
//                   </div>

//                   <div>
//                     <label className="mb-2 block text-sm font-medium text-gray-300">
//                       Upload Payment Receipt
//                     </label>
//                     <div className="rounded-lg border-2 border-dashed border-gray-800 p-4 text-center transition-colors hover:border-[#2D6BFF]/50 sm:p-6">
//                       <input
//                         type="file"
//                         accept="image/*,.pdf"
//                         onChange={(e) => setReceiptFile(e.target.files[0])}
//                         className="hidden"
//                         id="receipt-upload"
//                       />
//                       <label htmlFor="receipt-upload" className="cursor-pointer">
//                         <div className="flex flex-col items-center gap-2">
//                           <span className="text-3xl sm:text-4xl">📎</span>
//                           <span className="text-sm font-medium text-[#2D6BFF]">Click to upload</span>
//                           <span className="text-xs text-gray-400">or drag and drop</span>
//                           <span className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</span>
//                         </div>
//                       </label>
//                     </div>
//                     {receiptFile && (
//                       <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-800 bg-[#0F0F0F] p-3">
//                         <span className="max-w-[180px] truncate text-xs text-gray-300 sm:max-w-[200px] sm:text-sm">{receiptFile.name}</span>
//                         <span className="text-xs text-green-500 sm:text-sm">✓ Selected</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] p-5 sm:p-6">
//                 <h3 className="mb-4 text-base font-semibold text-white sm:mb-6 sm:text-lg">Payment Options</h3>
//                 <div className="space-y-3">
//                   <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-800 bg-[#0F0F0F] p-3 transition-colors hover:border-[#2D6BFF]/50">
//                     <input
//                       type="radio"
//                       name="paymentType"
//                       value="full"
//                       checked={paymentType === 'full'}
//                       onChange={() => setPaymentType('full')}
//                       className="h-4 w-4 text-[#2D6BFF] sm:h-5 sm:w-5"
//                     />
//                     <div>
//                       <span className="text-sm font-medium text-white sm:text-base">Items Payment</span>
//                       <p className="text-xs text-gray-400 sm:text-sm">
//                         Pay {formatCurrency(remainingBalance)} now
//                         {paidAmount > 0 && ` (Remaining after ${formatCurrency(paidAmount)} paid)`}
//                         </p>
//                     </div>
//                     </label>

//                   <label className={`flex items-center gap-3 rounded-lg border border-gray-800 bg-[#0F0F0F] p-3 ${
//                     order?.shippingCost ? 'cursor-pointer hover:border-[#2D6BFF]/50' : 'cursor-not-allowed opacity-60'
//                   } transition-colors`}>
//                     <input
//                       type="radio"
//                       name="paymentType"
//                       value="shipping"
//                       checked={paymentType === 'shipping'}
//                       onChange={() => order?.shippingCost && setPaymentType('shipping')}
//                       disabled={!order?.shippingCost}
//                       className="h-4 w-4 text-[#2D6BFF] sm:h-5 sm:w-5"
//                     />
//                     <div>
//                       <span className="text-sm font-medium text-white sm:text-base">Shipping Payment</span>
//                       <p className="text-xs text-gray-400 sm:text-sm">
//                         {order?.shippingCost
//                           ? `Pay ${formatCurrency(order.shippingCost)} for shipping`
//                           : 'Shipping invoice not yet created'}
//                       </p>
//                     </div>
//                   </label>

//                   <label className={`flex items-center gap-3 rounded-lg border border-gray-800 bg-[#0F0F0F] p-3 ${
//                     hasDeposit ? 'cursor-pointer hover:border-[#2D6BFF]/50' : 'cursor-not-allowed opacity-60'
//                   } transition-colors`}>
//                     <input
//                       type="radio"
//                       name="paymentType"
//                       value="part"
//                       checked={paymentType === 'part'}
//                       onChange={() => hasDeposit && setPaymentType('part')}
//                       disabled={!hasDeposit}
//                       className="h-4 w-4 text-[#2D6BFF] sm:h-5 sm:w-5"
//                     />
//                     <div>
//                       <span className="text-sm font-medium text-white sm:text-base">
//                         {hasDeposit
//                           ? (depositPaid ? 'Balance Payment' : 'Items Part Payment')
//                           : 'Part Payment (Not Available)'}
//                       </span>
//                       <p className="text-xs text-gray-400 sm:text-sm">
//                         {hasDeposit
//                           ? (depositPaid
//                               ? `Pay remaining balance ${formatCurrency(remainingBalance)}`
//                               : `Pay deposit ${formatCurrency(depositAmount)} now, remaining ${formatCurrency(totalAmount - depositAmount)} later`)
//                           : 'Part payment not available for this invoice'}
//                       </p>
//                     </div>
//                   </label>
//                 </div>
//               </div>
//             </div>

//             <div className="lg:col-span-1">
//               <div className="sticky top-24 rounded-xl border border-gray-800 bg-[#0A0A0A] p-5 sm:p-6">
//                 <h3 className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">Order Summary</h3>

//                 <div className="mb-5 max-h-[300px] space-y-3 overflow-y-auto pr-2 sm:mb-6">
//                   {order.items?.map((item, index) => (
//                     <div key={index} className="flex gap-3 rounded-lg border border-gray-800 bg-[#0F0F0F] p-3">
//                       <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800 sm:h-16 sm:w-16">
//                         <Image
//                           src={getProductImage(item)}
//                           alt={item.productName}
//                           width={64}
//                           height={64}
//                           className="h-full w-full object-cover"
//                           onError={(e) => {
//                             e.target.src = '/images/dummy-images/image 3.png';
//                           }}
//                         />
//                       </div>
//                       <div className="flex-1">
//                         <h4 className="text-xs font-medium text-white sm:text-sm">{item.productName}</h4>
//                         <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
//                         <p className="mt-1 text-xs font-bold text-[#2D6BFF] sm:text-sm">
//                           {formatCurrency(item.price * item.quantity)}
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="mb-4 space-y-2 border-t border-gray-700 pt-4 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-gray-400">Subtotal:</span>
//                     <span className="text-white">{formatCurrency(subtotal)}</span>
//                   </div>

//                   {discount > 0 && (
//                     <div className="flex justify-between">
//                       <span className="text-gray-400">Discount:</span>
//                       <span className="text-green-400">-{formatCurrency(discount)}</span>
//                     </div>
//                   )}

//                   {hasDeposit && (
//                     <div className="flex justify-between">
//                       <span className="text-gray-400">Deposit Required:</span>
//                       <span className="text-yellow-400">{formatCurrency(depositAmount)}</span>
//                     </div>
//                   )}

//                   {paidAmount > 0 && (
//                     <div className="flex justify-between">
//                       <span className="text-gray-400">Amount Paid:</span>
//                       <span className="text-green-400">{formatCurrency(paidAmount)}</span>
//                     </div>
//                   )}

//                   <div className="flex justify-between pt-2">
//                     <span className="font-medium text-gray-300">Total Amount:</span>
//                     <span className="text-base font-bold text-white sm:text-lg">{formatCurrency(totalAmount)}</span>
//                   </div>

//                   {hasDeposit && depositPaid && (
//                     <div className="flex justify-between">
//                       <span className="text-gray-400">Balance:</span>
//                       <span className="text-yellow-400">{formatCurrency(remainingBalance)}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="mt-4 rounded-lg bg-[#2D6BFF]/20 p-3 sm:mt-6 sm:p-4">
//                   <div className="flex flex-wrap justify-between items-center gap-2">
//                     <span className="text-xs font-medium text-[#2D6BFF] sm:text-sm">
//                       {paymentType === 'part' ? (depositPaid ? 'Balance to Pay' : 'Deposit to Pay') :
//                        paymentType === 'shipping' ? 'Shipping to Pay' :
//                        'Amount to Pay'}
//                     </span>
//                     <span className="text-base font-bold text-[#2D6BFF] sm:text-xl">
//                       {formatCurrency(amountToPay)}
//                     </span>
//                   </div>
//                   {paymentType === 'part' && !depositPaid && (
//                     <p className="mt-1 text-xs text-gray-400">
//                       Remaining after deposit: {formatCurrency(totalAmount - depositAmount)}
//                     </p>
//                   )}
//                 </div>

//                 <div className="mt-5 flex flex-col gap-3 sm:mt-6">
//                   <Button
//                     variant="primary"
//                     onClick={paymentMethod === 'paystack' ? handlePaystackPayment : handleBankTransfer}
//                     disabled={submitting || (paymentMethod === 'bank' && !receiptFile) || !dataLoaded}
//                     className="w-full rounded-xl bg-[#2D6BFF] py-3 font-semibold text-white transition-colors hover:bg-[#1A4FCC] disabled:opacity-50"
//                   >
//                     {submitting
//                       ? 'Processing...'
//                       : !dataLoaded
//                         ? 'Loading...'
//                         : paymentMethod === 'paystack'
//                           ? 'Pay with Paystack'
//                           : 'Submit Receipt'}
//                   </Button>
//                   <Button
//                     variant="secondary"
//                     onClick={() => router.back()}
//                     className="w-full rounded-xl border border-gray-700 bg-transparent py-3 font-semibold text-white transition-colors hover:border-gray-600"
//                   >
//                     Back
//                   </Button>
//                 </div>

//                 <p className="mt-4 text-center text-xs text-gray-500">
//                   🔒 Secure payment. Your information is encrypted
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </DashboardLayout>
//     </>
//   );
// }

// export default function PaymentPage() {
//   return (
//     <Suspense fallback={null}>
//       <PaymentPageContent />
//     </Suspense>
//   );
// }

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { invoiceService } from '@/services/invoiceService';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { paymentService } from '@/services/paymentService';
import { bankAccountService } from '@/services/bankAccountService';
import { METADATA } from '@/lib/metadata';

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');

  // Locked payment type from URL — set by invoice card click, never changes
  const lockedPaymentType = searchParams.get('paymentType') || 'full';
  const urlInvoiceType = searchParams.get('invoiceType') || 'main';

  useAuthCheck();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [receiptFile, setReceiptFile] = useState(null);

  // paymentType is locked — no setter exposed
  const [paymentType] = useState(lockedPaymentType);

  const [dataLoaded, setDataLoaded] = useState(false);
  const [bankAccount, setBankAccount] = useState(null);

  useEffect(() => {
    if (!invoiceId) {
      router.push('/invoices');
      return;
    }
    fetchInvoiceDetails();
    fetchActiveBankAccount();
  }, [invoiceId]);

  useEffect(() => {
    if (order && invoice) {
      setDataLoaded(true);
    }
  }, [order, invoice]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);

      const invoiceResponse = await invoiceService.getById(invoiceId);
      const invoiceData = invoiceResponse?.data || invoiceResponse?.invoice || invoiceResponse;

      if (!invoiceData) throw new Error('Invoice not found');

      setInvoice(invoiceData);

      const orderId =
        typeof invoiceData.orderId === 'object' ? invoiceData.orderId._id : invoiceData.orderId;

      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;

      setOrder(orderData);

      if (orderData?.items) {
        const productPromises = orderData.items.map(async (item) => {
          const productId = item.productId?._id || item.productId;
          try {
            const productResponse = await productService.getById(productId);
            const productData =
              productResponse?.product || productResponse?.data || productResponse;
            return { [productId]: productData };
          } catch {
            return null;
          }
        });

        const productResults = await Promise.all(productPromises);
        const productMap = productResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setProducts(productMap);
      }
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveBankAccount = async () => {
    try {
      const resp = await bankAccountService.getActive();
      const acct = resp?.bankAccount ?? resp?.data?.bankAccount ?? resp?.data ?? resp;
      setBankAccount(acct?.bankAccount ? acct.bankAccount : acct);
    } catch (e) {
      console.error('Failed to fetch active bank account:', e);
      setBankAccount(null);
    }
  };

  const getPaymentAmount = () => {
    if (!order || !invoice) return 0;
    if (paymentType === 'part') return order.requiredDeposit || invoice.depositAmount || 0;
    if (paymentType === 'shipping') return order?.shippingCost || invoice?.totalAmount || 0;
    return (invoice.totalAmount || 0) - (invoice.amountPaid || 0);
  };

  const getTransactionType = () => {
    if (paymentType === 'part') return 'part';
    return 'final';
  };

  const handlePaystackPayment = async () => {
    if (!order || !invoice) {
      setError('Payment data not fully loaded. Please refresh and try again.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const amount = getPaymentAmount();
      const transactionType = getTransactionType();

      if (!amount || amount <= 0) {
        setError('Invalid payment amount');
        setSubmitting(false);
        return;
      }

      const response = await paymentService.initializePaystack({
        orderId: order._id,
        invoiceId: invoice._id,
        amount,
        transactionType,
      });

      const authUrl = response?.data?.authorizationUrl || response?.authorizationUrl;

      if (authUrl) {
        const reference = response?.data?.reference || response?.reference;
        if (reference) {
          sessionStorage.setItem('pending_payment_reference', reference);
          sessionStorage.setItem('pending_payment_invoice', invoice._id);
          sessionStorage.setItem('pending_payment_amount', amount);
          sessionStorage.setItem('pending_payment_type', transactionType);
        }
        window.location.href = authUrl;
      } else {
        throw new Error('No authorization URL received from Paystack');
      }
    } catch (err) {
      console.error('Paystack payment failed:', err);
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

      const amount = getPaymentAmount();
      const transactionType = getTransactionType();

      if (!amount || amount <= 0) {
        setError('Invalid payment amount');
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('orderId', order._id);
      formData.append('invoiceId', invoice._id);
      formData.append('amount', amount.toString());
      formData.append('transactionType', transactionType);
      formData.append('receipt', receiptFile);

      const response = await paymentService.uploadBankTransferReceipt(formData);

      if (response?.data?.transactionId) {
        sessionStorage.setItem('pending_payment_reference', response.data.transactionId);
      } else if (response?.transactionId) {
        sessionStorage.setItem('pending_payment_reference', response.transactionId);
      }

      router.push('/payment/pending');
    } catch (err) {
      console.error('Bank transfer submission failed:', err);
      setError(err.message || 'Failed to upload receipt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => `₦${amount?.toLocaleString() || '0'}`;

  const getProductImageUrl = (imagePath) => {
    if (!imagePath) return '/images/dummy-images/image 3.png';
    if (imagePath.startsWith('http')) return imagePath;
    const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  const getProductImage = (item) => {
    const productId = item.productId?._id || item.productId;
    const product = products[productId];
    if (product?.image) return getProductImageUrl(product.image);
    if (product?.images?.length > 0) return getProductImageUrl(product.images[0]);
    return '/images/dummy-images/image 3.png';
  };

  const hasDeposit = order?.requiredPaymentType === 'part';
  const depositAmount = order?.requiredDeposit || invoice?.depositAmount || 0;
  const depositPaid = (order?.amountPaid || 0) >= depositAmount;

  const subtotal = invoice?.subtotal || 0;
  const discount = invoice?.discount || 0;
  const totalAmount = invoice?.totalAmount || 0;
  const paidAmount = invoice?.amountPaid || 0;
  const remainingBalance = totalAmount - paidAmount;
  const amountToPay = getPaymentAmount();

  // Only the matching type is enabled — all others are locked out
  const isOptionEnabled = (type) => paymentType === type;

  const getAmountToPayLabel = () => {
    if (paymentType === 'part') return depositPaid ? 'Balance to Pay' : 'Deposit to Pay';
    if (paymentType === 'shipping') return 'Shipping to Pay';
    return 'Amount to Pay';
  };

  if (loading) {
    return (
      <>
        <SEOHead
          title="Payment"
          description="Make payment for your invoice"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="customer">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-white">Loading payment details...</div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (!invoice || !order) {
    return (
      <>
        <SEOHead
          title="Payment - Invoice Not Found"
          description="The requested invoice could not be found"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="customer">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="py-16 text-center">
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
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={`Payment - Invoice ${invoice.invoiceNumber}`}
        description={`Pay invoice ${invoice.invoiceNumber} for order ${order.orderNumber}`}
        robots="noindex, nofollow"
      />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl sm:text-4xl">Payment</h1>
            <p className="mt-1 text-sm text-gray-400 sm:mt-2 sm:text-base">
              Invoice #{invoice.invoiceNumber} • Order #{order.orderNumber}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-6 lg:col-span-2">
              {/* Payment Method */}
              <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">
                  Select Payment Method
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div
                    onClick={() => setPaymentMethod('paystack')}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all sm:p-5 ${
                      paymentMethod === 'paystack'
                        ? 'border-[#2D6BFF] bg-[#2D6BFF]/10'
                        : 'border-gray-800 bg-[#0F0F0F] hover:border-[#2D6BFF]/50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${paymentMethod === 'paystack' ? 'bg-[#2D6BFF]/20' : 'bg-gray-800'}`}
                      >
                        <span className="text-2xl sm:text-3xl">💳</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white sm:text-base">Paystack</h3>
                      <p className="mb-2 text-xs text-gray-400 sm:mb-3 sm:text-sm">
                        Card, Bank Transfer, USSD
                      </p>
                      <input
                        type="radio"
                        checked={paymentMethod === 'paystack'}
                        onChange={() => setPaymentMethod('paystack')}
                        className="h-4 w-4 text-[#2D6BFF] sm:h-5 sm:w-5"
                      />
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('bank')}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all sm:p-5 ${
                      paymentMethod === 'bank'
                        ? 'border-[#2D6BFF] bg-[#2D6BFF]/10'
                        : 'border-gray-800 bg-[#0F0F0F] hover:border-[#2D6BFF]/50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${paymentMethod === 'bank' ? 'bg-[#2D6BFF]/20' : 'bg-gray-800'}`}
                      >
                        <span className="text-2xl sm:text-3xl">🏦</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white sm:text-base">
                        Bank Transfer
                      </h3>
                      <p className="mb-2 text-xs text-gray-400 sm:mb-3 sm:text-sm">
                        Upload payment receipt
                      </p>
                      <input
                        type="radio"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                        className="h-4 w-4 text-[#2D6BFF] sm:h-5 sm:w-5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Transfer Details */}
              {paymentMethod === 'bank' && (
                <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] p-5 sm:p-6">
                  <h3 className="mb-4 text-base font-semibold text-white sm:mb-6 sm:text-lg">
                    Bank Transfer Details
                  </h3>
                  <div className="mb-5 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-3 sm:gap-4">
                    <div className="rounded-lg border border-gray-800 bg-[#0F0F0F] p-3 sm:p-4">
                      <p className="text-xs text-gray-400 sm:text-sm">Account Name</p>
                      <p className="text-sm font-medium text-white sm:text-base">
                        {bankAccount?.accountName || 'Not available'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-[#0F0F0F] p-3 sm:p-4">
                      <p className="text-xs text-gray-400 sm:text-sm">Account Number</p>
                      <p className="text-sm font-medium text-white sm:text-base">
                        {bankAccount?.accountNumber || 'Not available'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-[#0F0F0F] p-3 sm:p-4">
                      <p className="text-xs text-gray-400 sm:text-sm">Bank</p>
                      <p className="text-sm font-medium text-white sm:text-base">
                        {bankAccount?.bankName || 'Not available'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Upload Payment Receipt
                    </label>
                    <div className="rounded-lg border-2 border-dashed border-gray-800 p-4 text-center transition-colors hover:border-[#2D6BFF]/50 sm:p-6">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setReceiptFile(e.target.files[0])}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label htmlFor="receipt-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-3xl sm:text-4xl">📎</span>
                          <span className="text-sm font-medium text-[#2D6BFF]">
                            Click to upload
                          </span>
                          <span className="text-xs text-gray-400">or drag and drop</span>
                          <span className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</span>
                        </div>
                      </label>
                    </div>
                    {receiptFile && (
                      <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-800 bg-[#0F0F0F] p-3">
                        <span className="max-w-[180px] truncate text-xs text-gray-300 sm:max-w-[200px] sm:text-sm">
                          {receiptFile.name}
                        </span>
                        <span className="text-xs text-green-500 sm:text-sm">✓ Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Options — locked to what was passed from invoice list */}
              <div className="rounded-xl border border-gray-800 bg-[#0A0A0A] p-5 sm:p-6">
                <h3 className="mb-1 text-base font-semibold text-white sm:text-lg">
                  Payment Options
                </h3>
                <p className="mb-4 text-xs text-gray-500 sm:mb-6">
                  Your payment type has been set based on your invoice.
                </p>

                <div className="space-y-3">
                  {/* Items / Full Payment */}
                  <label
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isOptionEnabled('full')
                        ? 'cursor-pointer border-[#2D6BFF] bg-[#2D6BFF]/5'
                        : 'cursor-not-allowed border-gray-800 bg-[#0F0F0F] opacity-40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value="full"
                      checked={paymentType === 'full'}
                      disabled={!isOptionEnabled('full')}
                      readOnly
                      className="h-4 w-4 text-[#2D6BFF] sm:h-5 sm:w-5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white sm:text-base">
                        Items Payment
                      </span>
                      <p className="text-xs text-gray-400 sm:text-sm">
                        {isOptionEnabled('full')
                          ? `Pay ${formatCurrency(remainingBalance)} now${paidAmount > 0 ? ` (Remaining after ${formatCurrency(paidAmount)} paid)` : ''}`
                          : 'Unavailable for this payment'}
                      </p>
                    </div>
                    {isOptionEnabled('full') && (
                      <span className="ml-auto shrink-0 text-xs font-semibold text-[#2D6BFF]">
                        Selected
                      </span>
                    )}
                  </label>

                  {/* Shipping Payment */}
                  <label
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isOptionEnabled('shipping')
                        ? 'cursor-pointer border-[#2D6BFF] bg-[#2D6BFF]/5'
                        : 'cursor-not-allowed border-gray-800 bg-[#0F0F0F] opacity-40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value="shipping"
                      checked={paymentType === 'shipping'}
                      disabled={!isOptionEnabled('shipping')}
                      readOnly
                      className="h-4 w-4 text-[#2D6BFF] sm:h-5 sm:w-5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white sm:text-base">
                        Shipping Payment
                      </span>
                      <p className="text-xs text-gray-400 sm:text-sm">
                        {isOptionEnabled('shipping')
                          ? `Pay ${formatCurrency(order?.shippingCost || invoice?.totalAmount || 0)} for shipping`
                          : 'Unavailable for this payment'}
                      </p>
                    </div>
                    {isOptionEnabled('shipping') && (
                      <span className="ml-auto shrink-0 text-xs font-semibold text-[#2D6BFF]">
                        Selected
                      </span>
                    )}
                  </label>

                  {/* Part Payment */}
                  <label
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isOptionEnabled('part')
                        ? 'cursor-pointer border-[#2D6BFF] bg-[#2D6BFF]/5'
                        : 'cursor-not-allowed border-gray-800 bg-[#0F0F0F] opacity-40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value="part"
                      checked={paymentType === 'part'}
                      disabled={!isOptionEnabled('part')}
                      readOnly
                      className="h-4 w-4 text-[#2D6BFF] sm:h-5 sm:w-5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white sm:text-base">
                        {isOptionEnabled('part')
                          ? depositPaid
                            ? 'Balance Payment'
                            : 'Part Payment'
                          : 'Part Payment'}
                      </span>
                      <p className="text-xs text-gray-400 sm:text-sm">
                        {isOptionEnabled('part')
                          ? depositPaid
                            ? `Pay remaining balance ${formatCurrency(remainingBalance)}`
                            : `Pay deposit ${formatCurrency(depositAmount)} now, remaining ${formatCurrency(totalAmount - depositAmount)} later`
                          : 'Unavailable for this payment'}
                      </p>
                    </div>
                    {isOptionEnabled('part') && (
                      <span className="ml-auto shrink-0 text-xs font-semibold text-[#2D6BFF]">
                        Selected
                      </span>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-gray-800 bg-[#0A0A0A] p-5 sm:p-6">
                <h3 className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">
                  Order Summary
                </h3>

                <div className="mb-5 max-h-[300px] space-y-3 overflow-y-auto pr-2 sm:mb-6">
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-lg border border-gray-800 bg-[#0F0F0F] p-3"
                    >
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800 sm:h-16 sm:w-16">
                        <Image
                          src={getProductImage(item)}
                          alt={item.productName}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.src = '/images/dummy-images/image 3.png';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-medium text-white sm:text-sm">
                          {item.productName}
                        </h4>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        <p className="mt-1 text-xs font-bold text-[#2D6BFF] sm:text-sm">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4 space-y-2 border-t border-gray-700 pt-4 text-sm">
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
                  <div className="flex justify-between pt-2">
                    <span className="font-medium text-gray-300">Total Amount:</span>
                    <span className="text-base font-bold text-white sm:text-lg">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  {hasDeposit && depositPaid && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Balance:</span>
                      <span className="text-yellow-400">{formatCurrency(remainingBalance)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-lg bg-[#2D6BFF]/20 p-3 sm:mt-6 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#2D6BFF] sm:text-sm">
                      {getAmountToPayLabel()}
                    </span>
                    <span className="text-base font-bold text-[#2D6BFF] sm:text-xl">
                      {formatCurrency(amountToPay)}
                    </span>
                  </div>
                  {paymentType === 'part' && !depositPaid && (
                    <p className="mt-1 text-xs text-gray-400">
                      Remaining after deposit: {formatCurrency(totalAmount - depositAmount)}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:mt-6">
                  <Button
                    variant="primary"
                    onClick={
                      paymentMethod === 'paystack' ? handlePaystackPayment : handleBankTransfer
                    }
                    disabled={
                      submitting || (paymentMethod === 'bank' && !receiptFile) || !dataLoaded
                    }
                    className="w-full rounded-xl bg-[#2D6BFF] py-3 font-semibold text-white transition-colors hover:bg-[#1A4FCC] disabled:opacity-50"
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
                    className="w-full rounded-xl border border-gray-700 bg-transparent py-3 font-semibold text-white transition-colors hover:border-gray-600"
                  >
                    Back
                  </Button>
                </div>

                <p className="mt-4 text-center text-xs text-gray-500">
                  🔒 Secure payment. Your information is encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentPageContent />
    </Suspense>
  );
}
