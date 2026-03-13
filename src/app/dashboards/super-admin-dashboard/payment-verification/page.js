'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { paymentService } from '@/services/paymentService';
import { invoiceService } from '@/services/invoiceService';
import { orderService } from '@/services/orderService';
import { profileService } from '@/services/profileService';
import { useAuthCheck } from '@/app/lib/auth';

export default function PaymentVerificationPage() {
  const router = useRouter();
  useAuthCheck();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'verified', 'rejected'
  const [imageErrors, setImageErrors] = useState({});
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [customerData, setCustomerData] = useState({});

  useEffect(() => {
    fetchPayments();
  }, [activeTab]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (activeTab === 'pending') {
        response = await paymentService.getPendingBankTransfers({ limit: 50 });
      } else {
        // For verified/rejected, we need to fetch all and filter
        response = await paymentService.getPendingBankTransfers({ limit: 100 });
      }
      
      console.log('Raw payments response:', response);
      
      // Handle different response structures
      let paymentsData = [];
      if (response?.transactions && Array.isArray(response.transactions)) {
        paymentsData = response.transactions;
      } else if (response?.data?.transactions && Array.isArray(response.data.transactions)) {
        paymentsData = response.data.transactions;
      } else if (Array.isArray(response)) {
        paymentsData = response;
      }
      
      // Filter based on active tab
      if (activeTab !== 'pending') {
        paymentsData = paymentsData.filter(p => {
          const status = p.transactionStatus?.toLowerCase();
          return activeTab === 'verified' ? status === 'completed' : status === 'failed';
        });
      }
      
      console.log('Processed payments data:', paymentsData);
      
      // Fetch additional details for each payment and customer data
      const paymentsWithDetails = await Promise.all(
        paymentsData.map(async (payment) => {
          try {
            // Extract invoice ID correctly
            let invoiceId = null;
            if (payment.invoiceId) {
              if (typeof payment.invoiceId === 'object') {
                invoiceId = payment.invoiceId._id || payment.invoiceId;
              } else {
                invoiceId = payment.invoiceId;
              }
            }
            
            // Extract order ID correctly
            let orderId = null;
            if (payment.orderId) {
              if (typeof payment.orderId === 'object') {
                orderId = payment.orderId._id || payment.orderId;
              } else {
                orderId = payment.orderId;
              }
            }
            
            let invoiceData = null;
            let orderData = null;
            let customerInfo = { firstName: '', lastName: '', email: '', fullName: 'Customer' };
            
            // Fetch invoice details if we have a valid ID
            if (invoiceId && typeof invoiceId === 'string' && invoiceId.length === 24) {
              try {
                const invoiceResponse = await invoiceService.getById(invoiceId);
                invoiceData = invoiceResponse?.data || invoiceResponse?.invoice || invoiceResponse;
              } catch (err) {
                console.error(`Failed to fetch invoice ${invoiceId}:`, err);
              }
            }
            
            // Fetch order details if we have a valid ID
            if (orderId && typeof orderId === 'string' && orderId.length === 24) {
              try {
                const orderResponse = await orderService.getById(orderId);
                orderData = orderResponse?.order || orderResponse?.data || orderResponse;
              } catch (err) {
                console.error(`Failed to fetch order ${orderId}:`, err);
              }
            }
            
            // Extract userId the same way as in invoices page
            let userId = null;
            if (orderData?.userId) {
              if (typeof orderData.userId === 'object') {
                userId = orderData.userId._id || orderData.userId;
              } else {
                userId = orderData.userId;
              }
            } else if (invoiceData?.userId) {
              if (typeof invoiceData.userId === 'object') {
                userId = invoiceData.userId._id || invoiceData.userId;
              } else {
                userId = invoiceData.userId;
              }
            }
            
            // Fetch customer profile if we have userId
            if (userId) {
              try {
                const userIdStr = userId.toString ? userId.toString() : userId;
                const profileResponse = await profileService.getUserById(userIdStr);
                const userData = profileResponse?.user || profileResponse?.data || profileResponse;
                
                if (userData) {
                  customerInfo = {
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0] || 'Customer'
                  };
                }
              } catch (err) {
                console.error(`Failed to fetch customer for payment ${payment._id}:`, err);
                // Fallback to email from metadata
                const fallbackEmail = payment.metadata?.uploadedBy || '';
                customerInfo = {
                  firstName: '',
                  lastName: '',
                  email: fallbackEmail,
                  fullName: fallbackEmail.split('@')[0] || 'Customer'
                };
              }
            } else {
              // No userId found, use fallback from metadata
              const fallbackEmail = payment.metadata?.uploadedBy || '';
              customerInfo = {
                firstName: '',
                lastName: '',
                email: fallbackEmail,
                fullName: fallbackEmail.split('@')[0] || 'Customer'
              };
            }
            
            return {
              ...payment,
              invoice: invoiceData,
              order: orderData,
              customerInfo,
              receiptUrl: payment.receiptUrl,
              _id: payment._id?.toString?.(),
              invoiceId: invoiceId?.toString?.(),
              orderId: orderId?.toString?.(),
            };
          } catch (err) {
            console.error(`Failed to fetch details for payment ${payment._id}:`, err);
            return {
              ...payment,
              invoice: null,
              order: null,
              customerInfo: { firstName: '', lastName: '', email: '', fullName: 'Customer' },
            };
          }
        })
      );
      
      setPayments(paymentsWithDetails);
      
      // Store customer data in a map for easy access
      const customerMap = {};
      paymentsWithDetails.forEach(payment => {
        if (payment.customerInfo) {
          customerMap[payment._id] = payment.customerInfo;
        }
      });
      setCustomerData(customerMap);
      
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = (payment, action) => {
    setSelectedPayment(payment);
    setShowModal(true);
    setShowRejectionInput(action === 'reject');
    setRejectionReason('');
  };

  const handleVerify = async () => {
    if (!selectedPayment) return;
    
    try {
      setProcessingId(selectedPayment._id);
      setError('');
      
      await paymentService.verifyBankTransfer(selectedPayment._id, {
        status: 'approve'
      });
      
      // Refresh payments
      await fetchPayments();
      setShowModal(false);
      setSelectedPayment(null);
      
    } catch (err) {
      console.error('Failed to verify payment:', err);
      setError(err.message || 'Failed to verify payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    
    try {
      setProcessingId(selectedPayment._id);
      setError('');
      
      await paymentService.verifyBankTransfer(selectedPayment._id, {
        status: 'reject',
        notes: rejectionReason || 'Payment rejected by admin'
      });
      
      // Refresh payments
      await fetchPayments();
      setShowModal(false);
      setSelectedPayment(null);
      setRejectionReason('');
      setShowRejectionInput(false);
      
    } catch (err) {
      console.error('Failed to reject payment:', err);
      setError(err.message || 'Failed to reject payment');
    } finally {
      setProcessingId(null);
    }
  };

  const getImageUrl = (receiptUrl) => {
    if (!receiptUrl) return null;
    
    // If it's already a full URL, return it
    if (receiptUrl.startsWith('http')) return receiptUrl;
    
    // Extract just the filename
    let filename = receiptUrl;
    if (receiptUrl.includes('/')) {
      filename = receiptUrl.split('/').pop();
    }
    
    // Use static file serving
    return `http://localhost:4001/uploads/receipts/${filename}`;
  };

  const handleImageError = (paymentId) => {
    setImageErrors(prev => ({ ...prev, [paymentId]: true }));
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading payments...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Payment Verification</h1>
          <p className="text-gray-400">Verify bank transfer payments from customers</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Pending Verification ({payments.filter(p => p.transactionStatus === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'verified'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Verified ({payments.filter(p => p.transactionStatus === 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'rejected'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Rejected ({payments.filter(p => p.transactionStatus === 'failed').length})
          </button>
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-white mb-2">No payments found</h3>
            <p className="text-gray-400">
              {activeTab === 'pending' 
                ? 'No pending payments to verify' 
                : `No ${activeTab} payments`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {payments.map((payment) => {
              const customer = payment.customerInfo || { firstName: '', lastName: '', email: '', fullName: 'Customer' };
              
              return (
                <div key={payment._id} className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          Order {payment.orderNumber || payment.order?.orderNumber || 'N/A'}
                        </h3>
                        <StatusBadge 
                          status={payment.transactionStatus === 'pending' ? 'Pending' : 
                                 payment.transactionStatus === 'completed' ? 'Paid' : 'Failed'} 
                          type="payment" 
                        />
                      </div>
                      <p className="text-gray-400 text-sm">
                        Customer: <span className="text-white font-medium">{customer.fullName}</span>
                      </p>
                      {customer.email && (
                        <p className="text-gray-500 text-xs">{customer.email}</p>
                      )}
                      <p className="text-gray-400 text-sm">
                        Amount: <span className="text-primary font-bold">{formatCurrency(payment.transactionAmount)}</span>
                      </p>
                      <p className="text-gray-400 text-sm">
                        Submitted: {formatDate(payment.metadata?.uploadedAt || payment.createdAt)}
                      </p>
                      {payment.invoice && (
                        <p className="text-gray-400 text-sm">
                          Invoice: #{payment.invoice.invoiceNumber || payment.invoiceNumber}
                        </p>
                      )}
                      {payment.transactionType === 'part' && (
                        <p className="text-xs text-yellow-400 mt-1">
                          ⚡ Deposit Payment
                        </p>
                      )}
                    </div>
                    
                    {/* Quick Actions - Only show for pending payments */}
                    {payment.transactionStatus === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleVerifyClick(payment, 'verify')}
                          disabled={processingId === payment._id}
                        >
                          {processingId === payment._id ? 'Processing...' : 'Verify'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleVerifyClick(payment, 'reject')}
                          disabled={processingId === payment._id}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Receipt Image */}
                  {payment.receiptUrl && (
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm mb-2">Payment Receipt</p>
                      <div className="w-full bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center p-4">
                        {!imageErrors[payment._id] ? (
                          <img
                            src={getImageUrl(payment.receiptUrl)}
                            alt="Payment Receipt"
                            className="w-full h-auto max-h-[500px] object-contain"
                            onError={() => handleImageError(payment._id)}
                          />
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-2">🖼️</div>
                            <p className="text-gray-400">Image failed to load</p>
                            <p className="text-xs text-gray-500 mt-1">{getImageUrl(payment.receiptUrl)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Verification Info */}
                  {payment.transactionStatus !== 'pending' && (
                    <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-sm">
                      <p className="text-gray-400">
                        Verified by: <span className="text-white">
                          {typeof payment.verifiedBy === 'object' 
                            ? payment.verifiedBy.email || 'Admin'
                            : payment.verifiedBy || 'Admin'}
                        </span>
                      </p>
                      <p className="text-gray-400">
                        Verified at: <span className="text-white">{formatDate(payment.verifiedAt)}</span>
                      </p>
                      {payment.metadata?.verificationNotes && (
                        <p className="text-gray-400 mt-1">
                          Notes: <span className="text-white">{payment.metadata.verificationNotes}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Verification Modal */}
        {showModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-gray-800 max-w-md w-full">
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-xl font-bold text-white">
                  {showRejectionInput ? 'Reject Payment' : 'Verify Payment'}
                </h3>
              </div>
              
              <div className="p-6">
                <p className="text-gray-300 mb-4">
                  {showRejectionInput 
                    ? 'Are you sure you want to reject this payment?' 
                    : 'Are you sure you want to verify this payment?'}
                </p>
                
                <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Order:</span>
                    <span className="text-white">{selectedPayment.orderNumber || selectedPayment.order?.orderNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-primary font-bold">{formatCurrency(selectedPayment.transactionAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-white">{selectedPayment.customerInfo?.fullName || 'Customer'}</span>
                  </div>
                </div>

                {/* Rejection Reason Input */}
                {showRejectionInput && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rejection Reason <span className="text-gray-500">(optional)</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={3}
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={showRejectionInput ? handleReject : handleVerify}
                    disabled={processingId === selectedPayment._id}
                    className="flex-1"
                  >
                    {processingId === selectedPayment._id 
                      ? 'Processing...' 
                      : showRejectionInput ? 'Reject Payment' : 'Verify Payment'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedPayment(null);
                      setRejectionReason('');
                      setShowRejectionInput(false);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}