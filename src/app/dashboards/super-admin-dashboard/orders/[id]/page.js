"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import SEOHead from "@/components/common/SEOHead";
import { useAuthCheck } from "@/app/lib/auth";
import { orderService } from "@/services/orderService";
import { customerBriefService } from "@/services/customerBriefService";
import { METADATA } from "@/lib/metadata";

export default function OrderDetailPage({ params }) {
  useAuthCheck();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setOrderId(resolvedParams.id);
    };
    
    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      const response = await orderService.getById(orderId);
      const orderData = response?.order || response?.data || response;
      setOrder(orderData);
      
      if (orderData?.items && orderData.items.length > 0) {
        const itemsWithBriefStatus = await Promise.all(
          orderData.items.map(async (item) => {
            const productId = item.productId?._id || item.productId;
            try {
              const briefResponse = await customerBriefService.getByOrderAndProduct(orderId, productId);
              const briefData = briefResponse?.data || briefResponse;
              return {
                ...item,
                hasBrief: !!briefData?.customer,
                hasAdminResponse: !!briefData?.admin,
                briefId: briefData?.customer?._id
              };
            } catch (err) {
              return {
                ...item,
                hasBrief: false,
                hasAdminResponse: false,
                briefId: null
              };
            }
          })
        );
        setItems(itemsWithBriefStatus);
      }
      
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    router.push(`/dashboards/super-admin-dashboard/invoices/create?orderId=${orderId}`);
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || "0"}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      "Pending": "yellow",
      "OrderReceived": "blue",
      "FilesUploaded": "purple",
      "DesignUploaded": "indigo",
      "UnderReview": "orange",
      "Approved": "green",
      "AwaitingPartPayment": "yellow",
      "PartPaymentMade": "blue",
      "InProduction": "purple",
      "Completed": "green",
      "ReadyForShipping": "teal",
      "Shipped": "blue",
      "Delivered": "green",
      "Cancelled": "red"
    };
    return colors[status] || "gray";
  };

  const getStringId = (id) => {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (typeof id === "object") {
      if (id._id) return id._id.toString();
      return id.toString();
    }
    return "";
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

  if (error || !order) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="py-16 text-center">
          <p className="text-red-400">{error || "Order not found"}</p>
          <button onClick={() => router.back()} className="mt-4 text-primary hover:text-primary-dark">
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const hasInvoice = order.invoiceId;
  const needsInvoice = !hasInvoice && order.status === "OrderReceived";
  const invoiceIdString = getStringId(order.invoiceId);

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title={`Order - ${order.orderNumber}`} />
      <DashboardLayout userRole="super-admin">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Orders
            </button>
            
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-white">Order #{order.orderNumber}</h1>
                <p className="text-gray-400">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex gap-3">
                {needsInvoice && (
                  <Button variant="primary" onClick={handleCreateInvoice} icon="📄">
                    Create Invoice
                  </Button>
                )}
                {hasInvoice && invoiceIdString && (
                  <Link href={`/dashboards/super-admin-dashboard/invoices/${invoiceIdString}`}>
                    <Button variant="secondary" icon="👁️">
                      View Invoice
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
              <p className="mb-1 text-sm text-gray-400">Customer</p>
              <p className="font-medium text-white">{order.userId?.email || "N/A"}</p>
              <p className="mt-2 text-sm text-gray-400">ID: {order.userId?._id?.slice(-8) || "N/A"}</p>
            </div>
            
            <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
              <p className="mb-1 text-sm text-gray-400">Order Status</p>
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-full bg-${getStatusColor(order.status)}-900/50 px-3 py-1 text-xs font-medium text-${getStatusColor(order.status)}-400`}>
                  {order.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-400">Last updated: {formatDate(order.updatedAt)}</p>
            </div>
            
            <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
              <p className="mb-1 text-sm text-gray-400">Payment Status</p>
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-full bg-${getStatusColor(order.paymentStatus)}-900/50 px-3 py-1 text-xs font-medium text-${getStatusColor(order.paymentStatus)}-400`}>
                  {order.paymentStatus || "Pending"}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Paid: {formatCurrency(order.amountPaid)} / {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-800 bg-slate-900">
            <div className="border-b border-gray-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Order Items & Customization Briefs</h2>
            </div>
            
            <div className="divide-y divide-gray-800">
              {items.map((item, index) => {
                const briefIdString = getStringId(item.briefId);
                
                return (
                  <div key={index} className="p-6">
                    <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <h3 className="text-lg font-medium text-white">{item.productName}</h3>
                        <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-gray-400">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.hasBrief && briefIdString ? (
                        <Link href={`/briefs/${briefIdString}`}>
                          <button className="flex items-center gap-1 rounded-full bg-blue-900/30 px-3 py-1.5 text-xs text-blue-400 transition hover:bg-blue-900/50">
                            <span>📋</span> View Customer Brief
                            {item.hasAdminResponse && (
                              <span className="ml-1 text-green-400">(Has Response)</span>
                            )}
                          </button>
                        </Link>
                      ) : item.hasBrief ? (
                        <span className="rounded-full bg-blue-900/30 px-3 py-1.5 text-xs text-blue-400">
                          <span>📋</span> Brief Available
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-800 px-3 py-1.5 text-xs text-gray-500">
                          No brief submitted
                        </span>
                      )}
                      
                      {item.hasAdminResponse && (
                        <Link href={`/briefs/responses?orderId=${orderId}&productId=${item.productId}`}>
                          <button className="flex items-center gap-1 rounded-full bg-green-900/30 px-3 py-1.5 text-xs text-green-400 transition hover:bg-green-900/50">
                            <span>💬</span> View Response Thread
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-gray-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Order Summary</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount Paid</span>
                <span className="text-green-400">{formatCurrency(order.amountPaid || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Remaining Balance</span>
                <span className="text-yellow-400">{formatCurrency(order.remainingBalance || order.totalAmount)}</span>
              </div>
              
              {order.requiredDeposit > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Required Deposit</span>
                  <span className="text-blue-400">{formatCurrency(order.requiredDeposit)}</span>
                </div>
              )}
              
              <div className="mt-2 border-t border-gray-700 pt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-white">Total</span>
                  <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}