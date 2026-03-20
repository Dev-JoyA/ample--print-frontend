"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import SEOHead from "@/components/common/SEOHead";
import { useAuthCheck } from "@/app/lib/auth";
import { orderService } from "@/services/orderService";
import { invoiceService } from "@/services/invoiceService";
import { shippingService } from "@/services/shippingService";
import { METADATA, getOrderMetadata } from "@/lib/metadata";

export default function OrderHistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;
  useAuthCheck();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [orderInvoice, setOrderInvoice] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      setOrder(orderData);

      if (orderData?.invoiceId) {
        try {
          const invoiceId = typeof orderData.invoiceId === "object"
            ? orderData.invoiceId._id || orderData.invoiceId
            : orderData.invoiceId;

          console.log("Fetching order invoice with ID:", invoiceId);

          if (invoiceId && typeof invoiceId === "string") {
            const invoiceResponse = await invoiceService.getById(invoiceId);
            const invoiceData = invoiceResponse?.data || invoiceResponse;
            setOrderInvoice(invoiceData);
          }
        } catch (err) {
          console.error("Failed to fetch order invoice:", err);
        }
      }

      if (orderData?.shippingId) {
        try {
          const shippingId = typeof orderData.shippingId === "object"
            ? orderData.shippingId._id || orderData.shippingId
            : orderData.shippingId;

          console.log("Fetching shipping with ID:", shippingId);

          if (shippingId && typeof shippingId === "string") {
            const shippingResponse = await shippingService.getById(shippingId);
            const shippingData = shippingResponse?.data || shippingResponse;
            setShipping(shippingData);
          }
        } catch (err) {
          console.error("Failed to fetch shipping:", err);
        }
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || "0"}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "yellow",
      OrderReceived: "blue",
      FilesUploaded: "purple",
      AwaitingInvoice: "orange",
      InvoiceSent: "red",
      DesignUploaded: "indigo",
      UnderReview: "yellow",
      Approved: "green",
      InProduction: "blue",
      Completed: "green",
      Shipped: "teal",
      Delivered: "green",
      Cancelled: "red"
    };
    return colors[status] || "gray";
  };

  const getMessageFromUrl = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("message");
    }
    return null;
  };

  const message = getMessageFromUrl();

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-white">Loading order details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="py-16 text-center">
            <p className="text-red-400">{error || "Order not found"}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-primary hover:text-primary-dark"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pageMetadata = getOrderMetadata(order);

  return (
    <>
      <SEOHead {...pageMetadata} title={`Order ${order.orderNumber}`} />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Order History
            </button>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white sm:text-4xl">Order Details</h1>
                <p className="mt-1 text-sm text-gray-400">Order #{order.orderNumber}</p>
              </div>
              <div className="self-start md:self-auto">
                <StatusBadge status={order.status} />
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-lg border border-green-800 bg-green-900/20 p-4">
              <p className="text-green-400">
                ✓ Shipping information saved successfully! An admin will review your shipping selection.
              </p>
            </div>
          )}

          <div className="mb-6 rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-white">Order Summary</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Order Date</p>
                  <p className="text-white">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Payment Status</p>
                  <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${
                    order.paymentStatus === "Completed"
                      ? "border-green-700 bg-green-900/50 text-green-400"
                      : order.paymentStatus === "PartPayment"
                      ? "border-yellow-700 bg-yellow-900/50 text-yellow-400"
                      : "border-gray-700 bg-gray-900/50 text-gray-400"
                  }`}>
                    {order.paymentStatus || "Pending"}
                  </span>
                </div>
                {order.amountPaid > 0 && (
                  <div>
                    <p className="text-sm text-gray-400">Amount Paid</p>
                    <p className="text-green-400">{formatCurrency(order.amountPaid)}</p>
                  </div>
                )}
                {order.remainingBalance > 0 && (
                  <div>
                    <p className="text-sm text-gray-400">Remaining Balance</p>
                    <p className="text-yellow-400">{formatCurrency(order.remainingBalance)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-white">Items</h2>

            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex flex-col justify-between gap-4 rounded-lg bg-slate-800/30 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium text-white">{item.productName}</p>
                    <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-primary">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {shipping && (
            <div className="mb-6 rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold text-white">Shipping Information</h2>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${
                    shipping.shippingMethod === "pickup"
                      ? "border-purple-700 bg-purple-900/50 text-purple-400"
                      : "border-blue-700 bg-blue-900/50 text-blue-400"
                  }`}>
                    {shipping.shippingMethod === "pickup" ? "Pickup" : "Delivery"}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-yellow-400">Awaiting Invoice</span>
                </div>

                {shipping.shippingMethod === "delivery" && shipping.address && (
                  <>
                    <div>
                      <p className="mb-1 text-sm text-gray-400">Delivery Address</p>
                      <p className="text-white">
                        {shipping.address.street}, {shipping.address.city}, {shipping.address.state}, {shipping.address.country}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-400">Recipient</p>
                      <p className="text-white">{shipping.recipientName}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-400">Phone</p>
                      <p className="text-white">{shipping.recipientPhone}</p>
                    </div>
                  </>
                )}

                {shipping.shippingMethod === "pickup" && (
                  <div>
                    <p className="mb-1 text-sm text-gray-400">Pickup Location</p>
                    <p className="text-white">Our Office - 5, Boyle Street, Somolu, Lagos</p>
                  </div>
                )}

                {shipping.metadata?.pickupNotes && (
                  <div>
                    <p className="mb-1 text-sm text-gray-400">Notes</p>
                    <p className="rounded-lg bg-slate-800/50 p-3 text-sm text-white">
                      {shipping.metadata.pickupNotes}
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-yellow-800 bg-yellow-900/20 p-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-yellow-400">
                      <span className="font-medium">Shipping invoice pending:</span> An admin will generate a shipping invoice soon. You'll be notified when it's ready for payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {orderInvoice && (
            <div className="mb-6 rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold text-white">Order Invoice</h2>

              <div className="space-y-3">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <p className="text-sm text-gray-400">Invoice Number</p>
                  <p className="text-white">{orderInvoice.invoiceNumber}</p>
                </div>
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <p className="text-sm text-gray-400">Status</p>
                  <StatusBadge status={orderInvoice.status} />
                </div>
                {orderInvoice.remainingAmount > 0 && (
                  <div className="flex flex-col justify-between gap-2 sm:flex-row">
                    <p className="text-sm text-gray-400">Amount Due</p>
                    <p className="font-bold text-yellow-400">{formatCurrency(orderInvoice.remainingAmount)}</p>
                  </div>
                )}
                {orderInvoice.status !== "Paid" && orderInvoice.status !== "Cancelled" && (
                  <div className="mt-4">
                    <Link href={`/payment?invoiceId=${orderInvoice._id}`}>
                      <Button variant="primary" size="sm">
                        Pay Now
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/order-history">
              <Button variant="secondary">Back to Order History</Button>
            </Link>

            {order.status === "Completed" && !order.shippingId && (
              <Link href={`/shipping?orderId=${order._id}`}>
                <Button variant="warning">Select Shipping Method</Button>
              </Link>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}