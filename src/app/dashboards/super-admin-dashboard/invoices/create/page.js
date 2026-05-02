// 'use client';

// import { Suspense, useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import Link from 'next/link';
// import DashboardLayout from '@/components/layouts/DashboardLayout';
// import Button from '@/components/ui/Button';
// import SEOHead from '@/components/common/SEOHead';
// import { invoiceService } from '@/services/invoiceService';
// import { orderService } from '@/services/orderService';
// import { customerBriefService } from '@/services/customerBriefService';
// import { discountService } from '@/services/discountService';
// import { METADATA } from '@/lib/metadata';

// function CreateInvoicePageContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const orderId = searchParams.get('orderId');

//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [order, setOrder] = useState(null);
//   const [items, setItems] = useState([]);
//   const [error, setError] = useState('');
//   const [showBriefModal, setShowBriefModal] = useState(null);
//   const [briefMessages, setBriefMessages] = useState([]);
//   const [loadingBrief, setLoadingBrief] = useState(false);
//   const [availableDiscounts, setAvailableDiscounts] = useState([]);

//   const [paymentType, setPaymentType] = useState('full');
//   const [depositAmount, setDepositAmount] = useState(0);
//   const [selectedDiscount, setSelectedDiscount] = useState(null);
//   const [customDiscount, setCustomDiscount] = useState(0);
//   const [discountType, setDiscountType] = useState('percentage');
//   const [notes, setNotes] = useState('');

//   const [subtotal, setSubtotal] = useState(0);
//   const [discountAmount, setDiscountAmount] = useState(0);
//   const [totalAmount, setTotalAmount] = useState(0);

//   useEffect(() => {
//     if (!orderId) {
//       router.push('/dashboards/super-admin-dashboard/invoices/ready');
//       return;
//     }
//     fetchOrderDetails();
//     fetchAvailableDiscounts();
//   }, [orderId]);

//   useEffect(() => {
//     if (order) {
//       calculateTotals();
//     }
//   }, [items, selectedDiscount, customDiscount, discountType]);

//   useEffect(() => {
//     if (paymentType === 'part' && totalAmount > 0 && depositAmount === 0) {
//       setDepositAmount(Math.round(totalAmount * 0.3));
//     }
//   }, [paymentType, totalAmount]);

//   const fetchOrderDetails = async () => {
//     try {
//       setLoading(true);
//       const orderResponse = await orderService.getById(orderId);
//       const orderData = orderResponse?.data || orderResponse?.order || orderResponse;

//       if (!orderData) {
//         throw new Error('Order not found');
//       }

//       if (orderData?.items && orderData.items.length > 0) {
//         const itemsWithBriefStatus = await Promise.all(
//           orderData.items.map(async (item) => {
//             const productId = item.productId?._id || item.productId;
//             try {
//               const briefResponse = await customerBriefService.getByOrderAndProduct(orderId, productId);
//               const briefData = briefResponse?.data || briefResponse;

//               let customerBrief = null;
//               if (Array.isArray(briefData)) {
//                 customerBrief = briefData.find(b => b.role === 'customer');
//               } else if (briefData?.customer) {
//                 customerBrief = briefData.customer;
//               }

//               const hasOwnDesign = customerBrief?.hasOwnDesign;
//               const needsDesignAssistance = hasOwnDesign === false;
//               const designFee = needsDesignAssistance ? 5000 : 0;
//               const totalWithDesign = (item.price * item.quantity) + designFee;

//               return {
//                 ...item,
//                 editableTotal: totalWithDesign,
//                 originalPrice: item.price,
//                 originalTotal: item.price * item.quantity,
//                 designFee: designFee,
//                 needsDesignAssistance: needsDesignAssistance,
//                 hasOwnDesign: hasOwnDesign,
//                 hasBrief: !!customerBrief,
//                 hasAdminResponse: !!briefData?.admin || !!briefData?.superAdmin,
//                 briefId: customerBrief?._id,
//                 briefData: briefData,
//               };
//             } catch (err) {
//               return {
//                 ...item,
//                 editableTotal: item.price * item.quantity,
//                 originalPrice: item.price,
//                 originalTotal: item.price * item.quantity,
//                 designFee: 0,
//                 needsDesignAssistance: false,
//                 hasOwnDesign: null,
//                 hasBrief: false,
//                 hasAdminResponse: false,
//                 briefId: null,
//                 briefData: null,
//               };
//             }
//           })
//         );
//         setItems(itemsWithBriefStatus);
//       }
//       setOrder(orderData);
//     } catch (err) {
//       console.error('Failed to fetch order details:', err);
//       setError(err.message || 'Failed to load order details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchAvailableDiscounts = async () => {
//     try {
//       const response = await discountService.getAllActive();
//       setAvailableDiscounts(response?.discounts || []);
//     } catch (err) {
//       console.error('Failed to fetch discounts:', err);
//     }
//   };

//   const handlePrintingCostChange = (index, newValue) => {
//     const updatedItems = [...items];
//     const newPrintingCost = parseFloat(newValue) || 0;
//     updatedItems[index].originalTotal = newPrintingCost;
//     updatedItems[index].editableTotal = newPrintingCost + (updatedItems[index].designFee || 0);
//     setItems(updatedItems);
//   };

//   const handleDesignFeeChange = (index, newValue) => {
//     const updatedItems = [...items];
//     const newDesignFee = parseFloat(newValue) || 0;
//     updatedItems[index].designFee = newDesignFee;
//     updatedItems[index].editableTotal = updatedItems[index].originalTotal + newDesignFee;
//     setItems(updatedItems);
//   };

//   const handleTotalPriceChange = (index, newTotal) => {
//     const updatedItems = [...items];
//     const total = parseFloat(newTotal) || 0;
//     updatedItems[index].editableTotal = total;
//     const printingCost = total - (updatedItems[index].designFee || 0);
//     updatedItems[index].originalTotal = printingCost > 0 ? printingCost : 0;
//     updatedItems[index].calculatedUnitPrice = total / updatedItems[index].quantity;
//     setItems(updatedItems);
//   };

//   const handleViewBrief = async (item) => {
//     if (!item.briefData) {
//       setError('No brief data available for this product');
//       return;
//     }

//     setLoadingBrief(true);
//     setShowBriefModal(item);

//     let messages = [];
//     if (Array.isArray(item.briefData)) {
//       messages = item.briefData;
//     } else {
//       if (item.briefData.customer) messages.push({ ...item.briefData.customer, role: 'customer' });
//       if (item.briefData.admin) messages.push({ ...item.briefData.admin, role: 'admin' });
//       if (item.briefData.superAdmin) messages.push({ ...item.briefData.superAdmin, role: 'super-admin' });
//     }
//     messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
//     setBriefMessages(messages);
//     setLoadingBrief(false);
//   };

//   const calculateTotals = () => {
//     const sub = items.reduce((sum, item) => sum + (item.editableTotal || 0), 0);
//     setSubtotal(sub);

//     let discAmount = 0;
//     if (selectedDiscount) {
//       if (selectedDiscount.type === 'percentage') {
//         discAmount = (sub * selectedDiscount.value) / 100;
//       } else {
//         discAmount = selectedDiscount.value;
//       }
//     } else if (customDiscount > 0) {
//       if (discountType === 'percentage') {
//         discAmount = (sub * customDiscount) / 100;
//       } else {
//         discAmount = customDiscount;
//       }
//     }
//     setDiscountAmount(discAmount);
//     setTotalAmount(sub - discAmount);
//   };

//   const handleSubmit = async () => {
//     try {
//       setSubmitting(true);
//       setError('');

//       const invoiceData = {
//         paymentType,
//         depositAmount: paymentType === 'part' ? depositAmount : undefined,
//         discount: discountAmount,
//         dueDate: new Date(),
//         notes: notes || undefined,
//         paymentInstructions: '',
//         items: items.map((item) => ({
//           productId: item.productId?._id || item.productId,
//           productName: item.productName,
//           quantity: item.quantity,
//           printingCost: item.originalTotal,
//           designFee: item.designFee || 0,
//           totalPrice: item.editableTotal,
//           originalTotal: item.originalTotal,
//           needsDesignAssistance: item.needsDesignAssistance || false,
//         })),
//       };

//       const response = await invoiceService.createForOrder(orderId, invoiceData);
//       const invoiceId = response?.data?._id || response?.data?.invoice?._id || response?.invoice?._id || response?._id;

//       if (invoiceId) {
//         router.push(`/dashboards/super-admin-dashboard/invoices/${invoiceId}`);
//       } else {
//         throw new Error('No invoice ID returned from server');
//       }
//     } catch (err) {
//       console.error('Failed to create invoice:', err);
//       setError(err.message || 'Failed to create invoice');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const formatCurrency = (amount) => {
//     return `₦${amount?.toLocaleString() || '0'}`;
//   };

//   const getCustomerName = (order) => {
//     if (order?.userId?.fullname) return order.userId.fullname;
//     if (order?.userId?.email) return order.userId.email.split('@')[0];
//     return 'Customer';
//   };

//   const getRoleBadge = (role) => {
//     const roleLower = role?.toLowerCase();
//     switch(roleLower) {
//       case 'customer':
//         return <span className="rounded-full bg-blue-600/20 px-2 py-1 text-xs font-medium text-blue-400">Customer</span>;
//       case 'admin':
//         return <span className="rounded-full bg-green-600/20 px-2 py-1 text-xs font-medium text-green-400">Admin</span>;
//       case 'super-admin':
//       case 'superadmin':
//         return <span className="rounded-full bg-purple-600/20 px-2 py-1 text-xs font-medium text-purple-400">Super Admin</span>;
//       default:
//         return null;
//     }
//   };

//   const renderAttachment = (url, label) => {
//     if (!url) return null;
//     const filename = url.split('/').pop();
//     const fileExtension = filename.split('.').pop()?.toLowerCase();
//     const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
//     const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'webm'].includes(fileExtension || '');
//     const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(fileExtension || '');

//     if (isImage) {
//       return (
//         <a href={url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 rounded bg-slate-700/50 p-2 transition hover:bg-slate-700">
//           <span className="text-blue-400">🖼️</span>
//           <span className="text-xs text-gray-300 group-hover:text-white">{label}</span>
//         </a>
//       );
//     } else if (isAudio) {
//       return (
//         <div className="flex flex-col gap-1 rounded bg-slate-700/50 p-2">
//           <div className="flex items-center gap-2">
//             <span className="text-green-400">🎤</span>
//             <span className="text-xs text-gray-300">{label}</span>
//           </div>
//           <audio controls className="mt-1 h-8 w-full">
//             <source src={url} type={`audio/${fileExtension}`} />
//           </audio>
//         </div>
//       );
//     } else if (isVideo) {
//       return (
//         <div className="flex flex-col gap-1 rounded bg-slate-700/50 p-2">
//           <div className="flex items-center gap-2">
//             <span className="text-red-400">🎥</span>
//             <span className="text-xs text-gray-300">{label}</span>
//           </div>
//           <video controls className="mt-1 max-h-40 w-full rounded">
//             <source src={url} type={`video/${fileExtension}`} />
//           </video>
//         </div>
//       );
//     } else {
//       return (
//         <a href={url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 rounded bg-slate-700/50 p-2 transition hover:bg-slate-700">
//           <span className="text-gray-400">📎</span>
//           <span className="text-xs text-gray-300 group-hover:text-white">{label}</span>
//         </a>
//       );
//     }
//   };

//   if (loading) {
//     return (
//       <DashboardLayout userRole="super-admin">
//         <div className="flex min-h-[60vh] items-center justify-center">
//           <div className="text-white">Loading order details...</div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (!order) {
//     return (
//       <DashboardLayout userRole="super-admin">
//         <div className="py-16 text-center">
//           <p className="text-gray-400">Order not found</p>
//           <Link href="/dashboards/super-admin-dashboard/orders" className="mt-4 inline-block text-primary hover:text-primary-dark">
//             Back to Orders
//           </Link>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <>
//       <SEOHead {...METADATA.dashboard.superAdmin} title="Create Invoice" />
//       <DashboardLayout userRole="super-admin">
//         <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
//           <div className="mb-8">
//             <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white">
//               <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//               </svg>
//               Back
//             </button>
//             <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Create Invoice</h1>
//             <p className="text-gray-400">Order #{order.orderNumber} • {getCustomerName(order)}</p>
//           </div>

//           {error && (
//             <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
//               {error}
//             </div>
//           )}

//           <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
//             <div className="mb-6 rounded-lg bg-slate-800/30 p-4">
//               <p className="text-sm text-gray-400">Order Number</p>
//               <p className="text-2xl font-bold text-white">{order.orderNumber}</p>
//             </div>

//             <div>
//               <h2 className="mb-4 text-lg font-semibold text-white">Products</h2>
//               <div className="space-y-6">
//                 {items.map((item, index) => (
//                   <div key={index} className="rounded-xl border border-gray-700 bg-slate-800/30 p-5 transition-all hover:border-gray-600">
//                     <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
//                       <div className="flex-1">
//                         <div className="mb-3">
//                           <p className="text-base font-semibold text-white">{item.productName}</p>
//                           <p className="text-sm text-gray-400 mt-1">Quantity: {item.quantity}</p>
//                         </div>

//                         <div className="flex flex-wrap gap-2 mb-4">
//                           {item.needsDesignAssistance && item.hasOwnDesign === false && (
//                             <span className="inline-flex items-center rounded-full bg-yellow-900/30 px-3 py-1 text-xs font-medium text-yellow-400">
//                               Design Assistance Required
//                             </span>
//                           )}
//                           {item.hasOwnDesign === true && (
//                             <span className="inline-flex items-center rounded-full bg-green-900/30 px-3 py-1 text-xs font-medium text-green-400">
//                               Customer Has Own Design
//                           </span>
//                           )}
//                           {item.hasBrief && (
//                             <button
//                               onClick={() => handleViewBrief(item)}
//                               className="inline-flex items-center gap-1 rounded-full bg-blue-900/30 px-3 py-1 text-xs text-blue-400 transition hover:bg-blue-900/50"
//                             >
//                               <span>📋</span> View Brief
//                               {item.hasAdminResponse && (
//                                 <span className="ml-1 text-green-400">(Has Response)</span>
//                               )}
//                             </button>
//                           )}
//                         </div>

//                         <div className="space-y-3">
//                           <div className="flex flex-wrap items-center gap-3">
//                             <label className="text-sm text-gray-400 w-24">Printing Cost:</label>
//                             <input
//                               type="number"
//                               value={item.originalTotal}
//                               onChange={(e) => handlePrintingCostChange(index, e.target.value)}
//                               min="0"
//                               step="100"
//                               className="w-48 rounded-lg border border-gray-600 bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
//                             />
//                             <span className="text-xs text-gray-500">
//                               Base: {formatCurrency(item.price * item.quantity)}
//                             </span>
//                           </div>

//                           {item.needsDesignAssistance && item.hasOwnDesign === false && (
//                             <div className="flex flex-wrap items-center gap-3">
//                               <label className="text-sm text-yellow-400 w-24">Design Fee:</label>
//                               <input
//                                 type="number"
//                                 value={item.designFee}
//                                 onChange={(e) => handleDesignFeeChange(index, e.target.value)}
//                                 min="0"
//                                 step="500"
//                                 className="w-48 rounded-lg border border-yellow-600 bg-slate-700 px-3 py-2 text-sm text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
//                               />
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       <div className="text-right md:text-right">
//                         <p className="text-sm text-gray-400 mb-1">Total</p>
//                         <p className="text-2xl font-bold text-primary">
//                           {formatCurrency(item.editableTotal)}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="mt-8 pt-4 border-t border-gray-700">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-6">
//                   <div>
//                     <label className="mb-2 block text-sm font-medium text-gray-300">Payment Type</label>
//                     <div className="flex gap-6">
//                       <label className="flex items-center gap-2">
//                         <input
//                           type="radio"
//                           checked={paymentType === 'full'}
//                           onChange={() => setPaymentType('full')}
//                           className="h-4 w-4 border-gray-700 bg-slate-800 text-primary"
//                         />
//                         <span className="text-white">Full Payment</span>
//                       </label>
//                       <label className="flex items-center gap-2">
//                         <input
//                           type="radio"
//                           checked={paymentType === 'part'}
//                           onChange={() => setPaymentType('part')}
//                           className="h-4 w-4 border-gray-700 bg-slate-800 text-primary"
//                         />
//                         <span className="text-white">Part Payment</span>
//                       </label>
//                     </div>
//                   </div>

//                   {paymentType === 'part' && (
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-300">Deposit Amount (₦)</label>
//                       <input
//                         type="number"
//                         value={depositAmount}
//                         onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
//                         min="0"
//                         max={totalAmount}
//                         className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
//                         placeholder="Enter deposit amount"
//                       />
//                       <p className="mt-1 text-xs text-gray-500">Amount customer needs to pay upfront (suggested: 30% of total)</p>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-6">
//                   <div>
//                     <h3 className="mb-3 text-md font-medium text-white">Apply Discount</h3>

//                     {availableDiscounts.length > 0 && (
//                       <div className="mb-4">
//                         <label className="mb-2 block text-sm font-medium text-gray-300">Select Discount Code</label>
//                         <select
//                           value={selectedDiscount?._id || ''}
//                           onChange={(e) => {
//                             const discount = availableDiscounts.find((d) => d._id === e.target.value);
//                             setSelectedDiscount(discount || null);
//                             setCustomDiscount(0);
//                           }}
//                           className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
//                         >
//                           <option value="">No discount</option>
//                           {availableDiscounts.map((discount) => (
//                             <option key={discount._id} value={discount._id}>
//                               {discount.code} - {discount.type === 'percentage' ? `${discount.value}% off` : `₦${discount.value} off`}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                     )}

//                     {!selectedDiscount && (
//                       <div className="grid grid-cols-2 gap-4">
//                         <div>
//                           <label className="mb-2 block text-sm font-medium text-gray-300">Discount Type</label>
//                           <select
//                             value={discountType}
//                             onChange={(e) => setDiscountType(e.target.value)}
//                             className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
//                           >
//                             <option value="percentage">Percentage (%)</option>
//                             <option value="fixed">Fixed Amount (₦)</option>
//                           </select>
//                         </div>
//                         <div>
//                           <label className="mb-2 block text-sm font-medium text-gray-300">
//                             {discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
//                           </label>
//                           <input
//                             type="number"
//                             value={customDiscount}
//                             onChange={(e) => setCustomDiscount(parseFloat(e.target.value) || 0)}
//                             min="0"
//                             max={discountType === 'percentage' ? 100 : subtotal}
//                             className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
//                           />
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <label className="mb-2 block text-sm font-medium text-gray-300">Additional Notes (Optional)</label>
//                 <textarea
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   rows={3}
//                   className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
//                   placeholder="Any additional information for the customer..."
//                 />
//               </div>
//             </div>

//             <div className="mt-8 rounded-xl bg-slate-800/50 p-5">
//               <div className="space-y-2">
//                 <div className="flex justify-between text-base">
//                   <span className="text-gray-400">Subtotal</span>
//                   <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
//                 </div>
//                 {discountAmount > 0 && (
//                   <div className="flex justify-between text-base">
//                     <span className="text-gray-400">Discount</span>
//                     <span className="text-green-400 font-medium">-{formatCurrency(discountAmount)}</span>
//                   </div>
//                 )}
//                 {paymentType === 'part' && (
//                   <div className="flex justify-between text-base">
//                     <span className="text-gray-400">Deposit Required</span>
//                     <span className="text-yellow-400 font-medium">{formatCurrency(depositAmount)}</span>
//                   </div>
//                 )}
//                 <div className="pt-3 mt-2 flex justify-between border-t border-gray-700">
//                   <span className="text-lg font-semibold text-white">Total Amount</span>
//                   <span className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-8 flex gap-4">
//               <Button variant="primary" size="lg" onClick={handleSubmit} disabled={submitting} className="flex-1 py-3">
//                 {submitting ? 'Creating...' : 'Create Invoice'}
//               </Button>
//               <Button variant="secondary" size="lg" onClick={() => router.back()} className="flex-1 py-3">
//                 Cancel
//               </Button>
//             </div>
//           </div>
//         </div>
//       </DashboardLayout>

//       {showBriefModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
//           <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-800 bg-slate-900">
//             <div className="sticky top-0 flex items-center justify-between border-b border-gray-800 bg-slate-900 p-6">
//               <h3 className="text-xl font-bold text-white">Conversation - {showBriefModal.productName}</h3>
//               <button onClick={() => { setShowBriefModal(null); setBriefMessages([]); }} className="text-gray-400 hover:text-white">✕</button>
//             </div>
//             <div className="p-6">
//               {loadingBrief ? (
//                 <div className="flex justify-center py-8">
//                   <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
//                 </div>
//               ) : briefMessages.length > 0 ? (
//                 <div className="space-y-4">
//                   {briefMessages.map((msg, idx) => (
//                     <div key={idx} className={`flex ${msg.role === 'customer' ? 'justify-start' : 'justify-end'}`}>
//                       <div className={`max-w-[85%] rounded-xl p-4 ${
//                         msg.role === 'customer'
//                           ? 'bg-blue-900/20 border border-blue-800/50'
//                           : 'bg-green-900/20 border border-green-800/50'
//                       }`}>
//                         <div className="mb-2 flex flex-wrap items-center gap-2">
//                           {getRoleBadge(msg.role)}
//                           <span className="text-xs text-gray-500">
//                             {new Date(msg.createdAt).toLocaleString()}
//                           </span>
//                           {msg.hasOwnDesign === true && (
//                             <span className="text-xs text-green-400">✓ Has own design</span>
//                           )}
//                           {msg.hasOwnDesign === false && (
//                             <span className="text-xs text-yellow-400">✏️ Needs design assistance</span>
//                           )}
//                         </div>
//                         {msg.description && (
//                           <p className="mb-3 whitespace-pre-line text-sm text-white">{msg.description}</p>
//                         )}
//                         <div className="flex flex-wrap gap-2">
//                           {msg.image && renderAttachment(msg.image, 'Image')}
//                           {msg.logo && renderAttachment(msg.logo, 'Logo')}
//                           {msg.voiceNote && renderAttachment(msg.voiceNote, 'Voice Note')}
//                           {msg.video && renderAttachment(msg.video, 'Video')}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="py-8 text-center text-gray-400">No conversation history available</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// export default function CreateInvoicePage() {
//   return (
//     <Suspense fallback={null}>
//       <CreateInvoicePageContent />
//     </Suspense>
//   );
// }

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { invoiceService } from '@/services/invoiceService';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import { discountService } from '@/services/discountService';
import { profileService } from '@/services/profileService';
import { METADATA } from '@/lib/metadata';
import { getImageUrl } from '@/lib/imageUtils';

function CreateInvoicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [showBriefModal, setShowBriefModal] = useState(null);
  const [briefMessages, setBriefMessages] = useState([]);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);

  const [paymentType, setPaymentType] = useState('full');
  const [depositAmount, setDepositAmount] = useState(0);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage');
  const [notes, setNotes] = useState('');

  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (!orderId) {
      router.push('/dashboards/super-admin-dashboard/invoices/ready');
      return;
    }
    fetchOrderDetails();
    fetchAvailableDiscounts();
  }, [orderId]);

  useEffect(() => {
    if (order) {
      calculateTotals();
    }
  }, [items, selectedDiscount, customDiscount, discountType]);

  useEffect(() => {
    if (paymentType === 'part' && totalAmount > 0 && depositAmount === 0) {
      setDepositAmount(Math.round(totalAmount * 0.3));
    }
  }, [paymentType, totalAmount]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.data || orderResponse?.order || orderResponse;

      if (!orderData) {
        throw new Error('Order not found');
      }

      // Fetch customer profile using the same pattern as AdminOrderDetailPage
      if (orderData?.userId) {
        const rawUserId =
          typeof orderData.userId === 'object'
            ? orderData.userId._id || orderData.userId
            : orderData.userId;
        const userIdStr = rawUserId?.toString ? rawUserId.toString() : rawUserId;

        if (userIdStr) {
          try {
            const profileResponse = await profileService.getUserById(userIdStr);
            const userData = profileResponse?.user || profileResponse?.data || profileResponse;
            if (userData) setCustomerProfile(userData);
          } catch (err) {
            console.error('Failed to fetch customer profile:', err);
          }
        }
      }

      if (orderData?.items && orderData.items.length > 0) {
        const itemsWithBriefStatus = await Promise.all(
          orderData.items.map(async (item) => {
            const productId = item.productId?._id || item.productId;
            try {
              const briefResponse = await customerBriefService.getByOrderAndProduct(
                orderId,
                productId
              );
              const briefData = briefResponse?.data || briefResponse;

              let customerBrief = null;
              if (Array.isArray(briefData)) {
                customerBrief = briefData.find((b) => b.role === 'customer');
              } else if (briefData?.customer) {
                customerBrief = briefData.customer;
              }

              const hasOwnDesign = customerBrief?.hasOwnDesign;
              const needsDesignAssistance = hasOwnDesign === false;
              const designFee = needsDesignAssistance ? 5000 : 0;
              const totalWithDesign = item.price * item.quantity + designFee;

              return {
                ...item,
                editableTotal: totalWithDesign,
                originalPrice: item.price,
                originalTotal: item.price * item.quantity,
                designFee: designFee,
                needsDesignAssistance: needsDesignAssistance,
                hasOwnDesign: hasOwnDesign,
                hasBrief: !!customerBrief,
                hasAdminResponse: !!briefData?.admin || !!briefData?.superAdmin,
                briefId: customerBrief?._id,
                briefData: briefData,
              };
            } catch (err) {
              return {
                ...item,
                editableTotal: item.price * item.quantity,
                originalPrice: item.price,
                originalTotal: item.price * item.quantity,
                designFee: 0,
                needsDesignAssistance: false,
                hasOwnDesign: null,
                hasBrief: false,
                hasAdminResponse: false,
                briefId: null,
                briefData: null,
              };
            }
          })
        );
        setItems(itemsWithBriefStatus);
      }
      setOrder(orderData);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDiscounts = async () => {
    try {
      const response = await discountService.getAllActive();
      setAvailableDiscounts(response?.discounts || []);
    } catch (err) {
      console.error('Failed to fetch discounts:', err);
    }
  };

  // Same helper functions as AdminOrderDetailPage
  const getCustomerName = () => {
    if (customerProfile?.firstName || customerProfile?.lastName) {
      return `${customerProfile.firstName || ''} ${customerProfile.lastName || ''}`.trim();
    }
    if (customerProfile?.fullname) return customerProfile.fullname;
    if (order?.userId) {
      if (typeof order.userId === 'object') {
        if (order.userId?.fullname) return order.userId.fullname;
        if (order.userId?.email) return order.userId.email.split('@')[0];
      }
    }
    return 'Customer';
  };

  const getCustomerEmail = () => {
    if (customerProfile?.email) return customerProfile.email;
    if (order?.userId && typeof order.userId === 'object' && order.userId?.email)
      return order.userId.email;
    return 'N/A';
  };

  const handlePrintingCostChange = (index, newValue) => {
    const updatedItems = [...items];
    const newPrintingCost = parseFloat(newValue) || 0;
    updatedItems[index].originalTotal = newPrintingCost;
    updatedItems[index].editableTotal = newPrintingCost + (updatedItems[index].designFee || 0);
    setItems(updatedItems);
  };

  const handleDesignFeeChange = (index, newValue) => {
    const updatedItems = [...items];
    const newDesignFee = parseFloat(newValue) || 0;
    updatedItems[index].designFee = newDesignFee;
    updatedItems[index].editableTotal = updatedItems[index].originalTotal + newDesignFee;
    setItems(updatedItems);
  };

  const handleTotalPriceChange = (index, newTotal) => {
    const updatedItems = [...items];
    const total = parseFloat(newTotal) || 0;
    updatedItems[index].editableTotal = total;
    const printingCost = total - (updatedItems[index].designFee || 0);
    updatedItems[index].originalTotal = printingCost > 0 ? printingCost : 0;
    updatedItems[index].calculatedUnitPrice = total / updatedItems[index].quantity;
    setItems(updatedItems);
  };

  const handleViewBrief = async (item) => {
    if (!item.briefData) {
      setError('No brief data available for this product');
      return;
    }

    setLoadingBrief(true);
    setShowBriefModal(item);

    let messages = [];
    if (Array.isArray(item.briefData)) {
      messages = item.briefData;
    } else {
      if (item.briefData.customer) messages.push({ ...item.briefData.customer, role: 'customer' });
      if (item.briefData.admin) messages.push({ ...item.briefData.admin, role: 'admin' });
      if (item.briefData.superAdmin)
        messages.push({ ...item.briefData.superAdmin, role: 'super-admin' });
    }
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    setBriefMessages(messages);
    setLoadingBrief(false);
  };

  const calculateTotals = () => {
    const sub = items.reduce((sum, item) => sum + (item.editableTotal || 0), 0);
    setSubtotal(sub);

    let discAmount = 0;
    if (selectedDiscount) {
      if (selectedDiscount.type === 'percentage') {
        discAmount = (sub * selectedDiscount.value) / 100;
      } else {
        discAmount = selectedDiscount.value;
      }
    } else if (customDiscount > 0) {
      if (discountType === 'percentage') {
        discAmount = (sub * customDiscount) / 100;
      } else {
        discAmount = customDiscount;
      }
    }
    setDiscountAmount(discAmount);
    setTotalAmount(sub - discAmount);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      const invoiceData = {
        paymentType,
        depositAmount: paymentType === 'part' ? depositAmount : undefined,
        discount: discountAmount,
        dueDate: new Date(),
        notes: notes || undefined,
        paymentInstructions: '',
        items: items.map((item) => ({
          productId: item.productId?._id || item.productId,
          productName: item.productName,
          quantity: item.quantity,
          printingCost: item.originalTotal,
          designFee: item.designFee || 0,
          totalPrice: item.editableTotal,
          originalTotal: item.originalTotal,
          needsDesignAssistance: item.needsDesignAssistance || false,
        })),
      };

      const response = await invoiceService.createForOrder(orderId, invoiceData);
      const invoiceId =
        response?.data?._id ||
        response?.data?.invoice?._id ||
        response?.invoice?._id ||
        response?._id;

      if (invoiceId) {
        router.push(`/dashboards/super-admin-dashboard/invoices/${invoiceId}`);
      } else {
        throw new Error('No invoice ID returned from server');
      }
    } catch (err) {
      console.error('Failed to create invoice:', err);
      setError(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const getRoleBadge = (role) => {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
      case 'customer':
        return (
          <span className="rounded-full bg-blue-600/20 px-2 py-1 text-xs font-medium text-blue-400">
            Customer
          </span>
        );
      case 'admin':
        return (
          <span className="rounded-full bg-green-600/20 px-2 py-1 text-xs font-medium text-green-400">
            Admin
          </span>
        );
      case 'super-admin':
      case 'superadmin':
        return (
          <span className="rounded-full bg-purple-600/20 px-2 py-1 text-xs font-medium text-purple-400">
            Super Admin
          </span>
        );
      default:
        return null;
    }
  };

  const renderAttachment = (url, label) => {
    if (!url) return null;
    const imageUrl = getImageUrl(url);
    const filename = url.split('/').pop();
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
    const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'webm'].includes(fileExtension || '');
    const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(fileExtension || '');

    if (isImage) {
      return (
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded bg-slate-700/50 p-2 transition hover:bg-slate-700"
        >
          <span className="text-blue-400">🖼️</span>
          <span className="text-xs text-gray-300 group-hover:text-white">{label}</span>
        </a>
      );
    } else if (isAudio) {
      return (
        <div className="flex flex-col gap-1 rounded bg-slate-700/50 p-2">
          <div className="flex items-center gap-2">
            <span className="text-green-400">🎤</span>
            <span className="text-xs text-gray-300">{label}</span>
          </div>
          <audio controls className="mt-1 h-8 w-full">
            <source src={imageUrl} type={`audio/${fileExtension}`} />
          </audio>
        </div>
      );
    } else if (isVideo) {
      return (
        <div className="flex flex-col gap-1 rounded bg-slate-700/50 p-2">
          <div className="flex items-center gap-2">
            <span className="text-red-400">🎥</span>
            <span className="text-xs text-gray-300">{label}</span>
          </div>
          <video controls className="mt-1 max-h-40 w-full rounded">
            <source src={imageUrl} type={`video/${fileExtension}`} />
          </video>
        </div>
      );
    } else {
      return (
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded bg-slate-700/50 p-2 transition hover:bg-slate-700"
        >
          <span className="text-gray-400">📎</span>
          <span className="text-xs text-gray-300 group-hover:text-white">{label}</span>
        </a>
      );
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading order details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="py-16 text-center">
          <p className="text-gray-400">Order not found</p>
          <Link
            href="/dashboards/super-admin-dashboard/orders"
            className="mt-4 inline-block text-primary hover:text-primary-dark"
          >
            Back to Orders
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title="Create Invoice" />
      <DashboardLayout userRole="super-admin">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Create Invoice</h1>
            <p className="text-gray-400">
              Order #{order.orderNumber} • {getCustomerName()}
            </p>
            <p className="mt-1 text-sm text-gray-500">Email: {getCustomerEmail()}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="mb-6 rounded-lg bg-slate-800/30 p-4">
              <p className="text-sm text-gray-400">Order Number</p>
              <p className="text-2xl font-bold text-white">{order.orderNumber}</p>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold text-white">Products</h2>
              <div className="space-y-6">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-700 bg-slate-800/30 p-5 transition-all hover:border-gray-600"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="mb-3">
                          <p className="text-base font-semibold text-white">{item.productName}</p>
                          <p className="mt-1 text-sm text-gray-400">Quantity: {item.quantity}</p>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-2">
                          {item.needsDesignAssistance && item.hasOwnDesign === false && (
                            <span className="inline-flex items-center rounded-full bg-yellow-900/30 px-3 py-1 text-xs font-medium text-yellow-400">
                              Design Assistance Required
                            </span>
                          )}
                          {item.hasOwnDesign === true && (
                            <span className="inline-flex items-center rounded-full bg-green-900/30 px-3 py-1 text-xs font-medium text-green-400">
                              Customer Has Own Design
                            </span>
                          )}
                          {item.hasBrief && (
                            <button
                              onClick={() => handleViewBrief(item)}
                              className="inline-flex items-center gap-1 rounded-full bg-blue-900/30 px-3 py-1 text-xs text-blue-400 transition hover:bg-blue-900/50"
                            >
                              <span>📋</span> View Brief
                              {item.hasAdminResponse && (
                                <span className="ml-1 text-green-400">(Has Response)</span>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="w-24 text-sm text-gray-400">Printing Cost:</label>
                            <input
                              type="number"
                              value={item.originalTotal}
                              onChange={(e) => handlePrintingCostChange(index, e.target.value)}
                              min="0"
                              step="100"
                              className="w-48 rounded-lg border border-gray-600 bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <span className="text-xs text-gray-500">
                              Base: {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>

                          {item.needsDesignAssistance && item.hasOwnDesign === false && (
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="w-24 text-sm text-yellow-400">Design Fee:</label>
                              <input
                                type="number"
                                value={item.designFee}
                                onChange={(e) => handleDesignFeeChange(index, e.target.value)}
                                min="0"
                                step="500"
                                className="w-48 rounded-lg border border-yellow-600 bg-slate-700 px-3 py-2 text-sm text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right md:text-right">
                        <p className="mb-1 text-sm text-gray-400">Total</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(item.editableTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-700 pt-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Payment Type
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={paymentType === 'full'}
                          onChange={() => setPaymentType('full')}
                          className="h-4 w-4 border-gray-700 bg-slate-800 text-primary"
                        />
                        <span className="text-white">Full Payment</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={paymentType === 'part'}
                          onChange={() => setPaymentType('part')}
                          className="h-4 w-4 border-gray-700 bg-slate-800 text-primary"
                        />
                        <span className="text-white">Part Payment</span>
                      </label>
                    </div>
                  </div>

                  {paymentType === 'part' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Deposit Amount (₦)
                      </label>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                        min="0"
                        max={totalAmount}
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
                        placeholder="Enter deposit amount"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Amount customer needs to pay upfront (suggested: 30% of total)
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-md mb-3 font-medium text-white">Apply Discount</h3>

                    {availableDiscounts.length > 0 && (
                      <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Select Discount Code
                        </label>
                        <select
                          value={selectedDiscount?._id || ''}
                          onChange={(e) => {
                            const discount = availableDiscounts.find(
                              (d) => d._id === e.target.value
                            );
                            setSelectedDiscount(discount || null);
                            setCustomDiscount(0);
                          }}
                          className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
                        >
                          <option value="">No discount</option>
                          {availableDiscounts.map((discount) => (
                            <option key={discount._id} value={discount._id}>
                              {discount.code} -{' '}
                              {discount.type === 'percentage'
                                ? `${discount.value}% off`
                                : `₦${discount.value} off`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {!selectedDiscount && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-300">
                            Discount Type
                          </label>
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value)}
                            className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (₦)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-300">
                            {discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                          </label>
                          <input
                            type="number"
                            value={customDiscount}
                            onChange={(e) => setCustomDiscount(parseFloat(e.target.value) || 0)}
                            min="0"
                            max={discountType === 'percentage' ? 100 : subtotal}
                            className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
                  placeholder="Any additional information for the customer..."
                />
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-slate-800/50 p-5">
              <div className="space-y-2">
                <div className="flex justify-between text-base">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-medium text-white">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Discount</span>
                    <span className="font-medium text-green-400">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                {paymentType === 'part' && (
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Deposit Required</span>
                    <span className="font-medium text-yellow-400">
                      {formatCurrency(depositAmount)}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-gray-700 pt-3">
                  <span className="text-lg font-semibold text-white">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3"
              >
                {submitting ? 'Creating...' : 'Create Invoice'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.back()}
                className="flex-1 py-3"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>

      {showBriefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-800 bg-slate-900">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-800 bg-slate-900 p-6">
              <h3 className="text-xl font-bold text-white">
                Conversation - {showBriefModal.productName}
              </h3>
              <button
                onClick={() => {
                  setShowBriefModal(null);
                  setBriefMessages([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {loadingBrief ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : briefMessages.length > 0 ? (
                <div className="space-y-4">
                  {briefMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'customer' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl p-4 ${
                          msg.role === 'customer'
                            ? 'border border-blue-800/50 bg-blue-900/20'
                            : 'border border-green-800/50 bg-green-900/20'
                        }`}
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {getRoleBadge(msg.role)}
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                          {msg.hasOwnDesign === true && (
                            <span className="text-xs text-green-400">✓ Has own design</span>
                          )}
                          {msg.hasOwnDesign === false && (
                            <span className="text-xs text-yellow-400">
                              ✏️ Needs design assistance
                            </span>
                          )}
                        </div>
                        {msg.description && (
                          <p className="mb-3 whitespace-pre-line text-sm text-white">
                            {msg.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {msg.image && renderAttachment(msg.image, 'Image')}
                          {msg.logo && renderAttachment(msg.logo, 'Logo')}
                          {msg.voiceNote && renderAttachment(msg.voiceNote, 'Voice Note')}
                          {msg.video && renderAttachment(msg.video, 'Video')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-gray-400">No conversation history available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreateInvoicePageContent />
    </Suspense>
  );
}
