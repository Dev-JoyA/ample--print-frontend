"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import SEOHead from "@/components/common/SEOHead";
import { paymentService } from "@/services/paymentService";
import { invoiceService } from "@/services/invoiceService";
import { orderService } from "@/services/orderService";
import { profileService } from "@/services/profileService";
import { useAuthCheck } from "@/app/lib/auth";
import { METADATA } from "@/lib/metadata";

export default function PaymentVerificationPage() {
  const router = useRouter();
  useAuthCheck();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [imageErrors, setImageErrors] = useState({});
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [customerData, setCustomerData] = useState({});

  useEffect(() => {
    fetchPayments();
  }, [activeTab]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      
      let response;
      if (activeTab === "pending") {
        response = await paymentService.getPendingBankTransfers({ limit: 50 });
      } else {
        response = await paymentService.getPendingBankTransfers({ limit: 100 });
      }
      
      console.log("Raw payments response:", response);
      
      let paymentsData = [];
      if (response?.transactions && Array.isArray(response.transactions)) {
        paymentsData = response.transactions;
      } else if (response?.data?.transactions && Array.isArray(response.data.transactions)) {
        paymentsData = response.data.transactions;
      } else if (Array.isArray(response)) {
        paymentsData = response;
      }
      
      if (activeTab !== "pending") {
        paymentsData = paymentsData.filter(p => {
          const status = p.transactionStatus?.toLowerCase();
          return activeTab === "verified" ? status === "completed" : status === "failed";
        });
      }
      
      console.log("Processed payments data:", paymentsData);
      
      const paymentsWithDetails = await Promise.all(
        paymentsData.map(async (payment) => {
          try {
            let invoiceId = null;
            if (payment.invoiceId) {
              if (typeof payment.invoiceId === "object") {
                invoiceId = payment.invoiceId._id || payment.invoiceId;
              } else {
                invoiceId = payment.invoiceId;
              }
            }
            
            let orderId = null;
            if (payment.orderId) {
              if (typeof payment.orderId === "object") {
                orderId = payment.orderId._id || payment.orderId;
              } else {
                orderId = payment.orderId;
              }
            }
            
            let invoiceData = null;
            let orderData = null;
            let customerInfo = { firstName: "", lastName: "", email: "", fullName: "Customer" };
            
            if (invoiceId && typeof invoiceId === "string" && invoiceId.length === 24) {
              try {
                const invoiceResponse = await invoiceService.getById(invoiceId);
                invoiceData = invoiceResponse?.data || invoiceResponse?.invoice || invoiceResponse;
              } catch (err) {
                console.error(`Failed to fetch invoice ${invoiceId}:`, err);
              }
            }
            
            if (orderId && typeof orderId === "string" && orderId.length === 24) {
              try {
                const orderResponse = await orderService.getById(orderId);
                orderData = orderResponse?.order || orderResponse?.data || orderResponse;
              } catch (err) {
                console.error(`Failed to fetch order ${orderId}:`, err);
              }
            }
            
            let userId = null;
            if (orderData?.userId) {
              if (typeof orderData.userId === "object") {
                userId = orderData.userId._id || orderData.userId;
              } else {
                userId = orderData.userId;
              }
            } else if (invoiceData?.userId) {
              if (typeof invoiceData.userId === "object") {
                userId = invoiceData.userId._id || invoiceData.userId;
              } else {
                userId = invoiceData.userId;
              }
            }
            
            if (userId) {
              try {
                const userIdStr = userId.toString ? userId.toString() : userId;
                const profileResponse = await profileService.getUserById(userIdStr);
                const userData = profileResponse?.user || profileResponse?.data || profileResponse;
                
                if (userData) {
                  customerInfo = {
                    firstName: userData.firstName || "",
                    lastName: userData.lastName || "",
                    email: userData.email || "",
                    fullName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.email?.split("@")[0] || "Customer"
                  };
                }
              } catch (err) {
                console.error(`Failed to fetch customer for payment ${payment._id}:`, err);
                const fallbackEmail = payment.metadata?.uploadedBy || "";
                customerInfo = {
                  firstName: "",
                  lastName: "",
                  email: fallbackEmail,
                  fullName: fallbackEmail.split("@")[0] || "Customer"
                };
              }
            } else {
              const fallbackEmail = payment.metadata?.uploadedBy || "";
              customerInfo = {
                firstName: "",
                lastName: "",
                email: fallbackEmail,
                fullName: fallbackEmail.split("@")[0] || "Customer"
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
              customerInfo: { firstName: "", lastName: "", email: "", fullName: "Customer" },
            };
          }
        })
      );
      
      setPayments(paymentsWithDetails);
      
      const customerMap = {};
      paymentsWithDetails.forEach(payment => {
        if (payment.customerInfo) {
          customerMap[payment._id] = payment.customerInfo;
        }
      });
      setCustomerData(customerMap);
      
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = (payment, action) => {
    setSelectedPayment(payment);
    setShowModal(true);
    setShowRejectionInput(action === "reject");
    setRejectionReason("");
  };

  const handleVerify = async () => {
    if (!selectedPayment) return;
    
    try {
      setProcessingId(selectedPayment._id);
      setError("");
      
      await paymentService.verifyBankTransfer(selectedPayment._id, {
        status: "approve"
      });
      
      await fetchPayments();
      setShowModal(false);
      setSelectedPayment(null);
      
    } catch (err) {
      console.error("Failed to verify payment:", err);
      setError(err.message || "Failed to verify payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    
    try {
      setProcessingId(selectedPayment._id);
      setError("");
      
      await paymentService.verifyBankTransfer(selectedPayment._id, {
        status: "reject",
        notes: rejectionReason || "Payment rejected by admin"
      });
      
      await fetchPayments();
      setShowModal(false);
      setSelectedPayment(null);
      setRejectionReason("");
      setShowRejectionInput(false);
      
    } catch (err) {
      console.error("Failed to reject payment:", err);
      setError(err.message || "Failed to reject payment");
    } finally {
      setProcessingId(null);
    }
  };

  const getImageUrl = (receiptUrl) => {
    if (!receiptUrl) return null;
    if (receiptUrl.startsWith("http")) return receiptUrl;
    let filename = receiptUrl;
    if (receiptUrl.includes("/")) {
      filename = receiptUrl.split("/").pop();
    }
    return `http://localhost:4001/uploads/receipts/${filename}`;
  };

  const handleImageError = (paymentId) => {
    setImageErrors(prev => ({ ...prev, [paymentId]: true }));
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || "0"}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading payments...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title="Payment Verification" />
      <DashboardLayout userRole="super-admin">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Payment Verification</h1>
            <p className="text-sm text-gray-400">Verify bank transfer payments from customers</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-6 flex gap-2 border-b border-gray-800">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "pending"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Pending Verification ({payments.filter(p => p.transactionStatus === "pending").length})
            </button>
            <button
              onClick={() => setActiveTab("verified")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "verified"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Verified ({payments.filter(p => p.transactionStatus === "completed").length})
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "rejected"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Rejected ({payments.filter(p => p.transactionStatus === "failed").length})
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/30 py-16 text-center">
              <div className="mb-4 text-6xl">📄</div>
              <h3 className="mb-2 text-xl font-semibold text-white">No payments found</h3>
              <p className="text-gray-400">
                {activeTab === "pending" 
                  ? "No pending payments to verify" 
                  : `No ${activeTab} payments`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {payments.map((payment) => {
                const customer = payment.customerInfo || { firstName: "", lastName: "", email: "", fullName: "Customer" };
                
                return (
                  <div key={payment._id} className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-gray-700">
                    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold text-white">
                            Order {payment.orderNumber || payment.order?.orderNumber || "N/A"}
                          </h3>
                          <StatusBadge 
                            status={payment.transactionStatus === "pending" ? "Pending" : 
                                   payment.transactionStatus === "completed" ? "Paid" : "Failed"} 
                            type="payment" 
                          />
                        </div>
                        <p className="text-sm text-gray-400">
                          Customer: <span className="font-medium text-white">{customer.fullName}</span>
                        </p>
                        {customer.email && (
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        )}
                        <p className="text-sm text-gray-400">
                          Amount: <span className="font-bold text-primary">{formatCurrency(payment.transactionAmount)}</span>
                        </p>
                        <p className="text-sm text-gray-400">
                          Submitted: {formatDate(payment.metadata?.uploadedAt || payment.createdAt)}
                        </p>
                        {payment.invoice && (
                          <p className="text-sm text-gray-400">
                            Invoice: #{payment.invoice.invoiceNumber || payment.invoiceNumber}
                          </p>
                        )}
                        {payment.transactionType === "part" && (
                          <p className="mt-1 text-xs text-yellow-400">
                            ⚡ Deposit Payment
                          </p>
                        )}
                      </div>
                      
                      {payment.transactionStatus === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleVerifyClick(payment, "verify")}
                            disabled={processingId === payment._id}
                          >
                            {processingId === payment._id ? "Processing..." : "Verify"}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleVerifyClick(payment, "reject")}
                            disabled={processingId === payment._id}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>

                    {payment.receiptUrl && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm text-gray-400">Payment Receipt</p>
                        <div className="flex w-full items-center justify-center overflow-hidden rounded-lg bg-slate-800 p-4">
                          {!imageErrors[payment._id] ? (
                            <img
                              src={getImageUrl(payment.receiptUrl)}
                              alt="Payment Receipt"
                              className="max-h-[500px] w-full object-contain"
                              onError={() => handleImageError(payment._id)}
                            />
                          ) : (
                            <div className="py-8 text-center">
                              <div className="mb-2 text-4xl">🖼️</div>
                              <p className="text-gray-400">Image failed to load</p>
                              <p className="mt-1 text-xs text-gray-500">{getImageUrl(payment.receiptUrl)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {payment.transactionStatus !== "pending" && (
                      <div className="mt-4 rounded-lg bg-slate-800/50 p-3 text-sm">
                        <p className="text-gray-400">
                          Verified by: <span className="text-white">
                            {typeof payment.verifiedBy === "object" 
                              ? payment.verifiedBy.email || "Admin"
                              : payment.verifiedBy || "Admin"}
                          </span>
                        </p>
                        <p className="text-gray-400">
                          Verified at: <span className="text-white">{formatDate(payment.verifiedAt)}</span>
                        </p>
                        {payment.metadata?.verificationNotes && (
                          <p className="mt-1 text-gray-400">
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
        </div>
      </DashboardLayout>

      {showModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-slate-900">
            <div className="border-b border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white">
                {showRejectionInput ? "Reject Payment" : "Verify Payment"}
              </h3>
            </div>
            
            <div className="p-6">
              <p className="mb-4 text-gray-300">
                {showRejectionInput 
                  ? "Are you sure you want to reject this payment?" 
                  : "Are you sure you want to verify this payment?"}
              </p>
              
              <div className="mb-4 rounded-lg bg-slate-800/50 p-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-gray-400">Order:</span>
                  <span className="text-white">{selectedPayment.orderNumber || selectedPayment.order?.orderNumber || "N/A"}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="font-bold text-primary">{formatCurrency(selectedPayment.transactionAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer:</span>
                  <span className="text-white">{selectedPayment.customerInfo?.fullName || "Customer"}</span>
                </div>
              </div>

              {showRejectionInput && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Rejection Reason <span className="text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={showRejectionInput ? handleReject : handleVerify}
                  disabled={processingId === selectedPayment._id}
                  className="flex-1"
                >
                  {processingId === selectedPayment._id 
                    ? "Processing..." 
                    : showRejectionInput ? "Reject Payment" : "Verify Payment"}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPayment(null);
                    setRejectionReason("");
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
    </>
  );
}