"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import SEOHead from "@/components/common/SEOHead";
import { invoiceService } from "@/services/invoiceService";
import { orderService } from "@/services/orderService";
import { customerBriefService } from "@/services/customerBriefService";
import { profileService } from "@/services/profileService";
import { socketService } from "@/services/socketService";
import { METADATA } from "@/lib/metadata";

export default function ReadyForInvoicePage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [customerData, setCustomerData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReadyOrders();

    const handleNewOrder = (data) => {
      console.log("New order via socket:", data);
      fetchReadyOrders();
    };

    const handleOrderUpdated = (data) => {
      console.log("Order updated via socket:", data);
      fetchReadyOrders();
    };

    socketService.on("new-order", handleNewOrder);
    socketService.on("order-status-updated", handleOrderUpdated);
    socketService.on("order-ready-for-invoice", handleNewOrder);

    return () => {
      socketService.off("new-order", handleNewOrder);
      socketService.off("order-status-updated", handleOrderUpdated);
      socketService.off("order-ready-for-invoice", handleNewOrder);
    };
  }, []);

  const fetchReadyOrders = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getOrdersReadyForInvoice({ limit: 50 });
      const ordersList = response?.orders || [];
      setOrders(ordersList);
      await fetchCustomerData(ordersList);
    } catch (err) {
      console.error("Failed to fetch ready orders:", err);
      setError("Failed to load orders ready for invoice");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerData = async (ordersList) => {
    const customerDataMap = {};
    
    await Promise.all(
      ordersList.map(async (order) => {
        let userId = null;
        
        if (order.userId) {
          if (typeof order.userId === "object") {
            userId = order.userId._id || order.userId;
          } else {
            userId = order.userId;
          }
        }
        
        if (userId) {
          try {
            const userIdStr = userId.toString ? userId.toString() : userId;
            const profileResponse = await profileService.getUserById(userIdStr);
            const userData = profileResponse?.user || profileResponse?.data || profileResponse;
            
            if (userData) {
              customerDataMap[order._id] = {
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                email: userData.email || "",
                fullName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.email?.split("@")[0] || "Customer"
              };
            }
          } catch (err) {
            console.error(`Failed to fetch customer for order ${order._id}:`, err);
            const fallbackEmail = order.userId?.email || "";
            customerDataMap[order._id] = {
              firstName: "",
              lastName: "",
              email: fallbackEmail,
              fullName: fallbackEmail.split("@")[0] || "Customer"
            };
          }
        } else {
          const fallbackEmail = order.userId?.email || "";
          customerDataMap[order._id] = {
            firstName: "",
            lastName: "",
            email: fallbackEmail,
            fullName: fallbackEmail.split("@")[0] || "Customer"
          };
        }
      })
    );
    
    setCustomerData(customerDataMap);
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      setSelectedOrder(orderId);
      
      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      
      const itemsWithBriefs = await Promise.all(
        orderData.items.map(async (item) => {
          const productId = item.productId._id || item.productId;
          try {
            const briefResponse = await customerBriefService.getByOrderAndProduct(orderId, productId);
            const briefs = briefResponse?.data;
            
            let briefStatus = "no-brief";
            if (briefs?.customer) {
              if (briefs.admin || briefs.superAdmin) {
                briefStatus = "responded";
              } else {
                briefStatus = "pending";
              }
            }
            
            return {
              ...item,
              briefs: briefs,
              briefStatus
            };
          } catch (err) {
            console.log(`No brief for product ${productId}`);
            return {
              ...item,
              briefs: null,
              briefStatus: "no-brief"
            };
          }
        })
      );
      
      setOrderDetails({
        ...orderData,
        items: itemsWithBriefs
      });
    } catch (err) {
      console.error("Failed to fetch order details:", err);
      alert("Failed to load order details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateInvoice = (orderId) => {
    router.push(`/dashboards/super-admin-dashboard/invoices/create?orderId=${orderId}`);
  };

  const getBriefStatusColor = (status) => {
    switch(status) {
      case "pending": return "bg-yellow-600/20 text-yellow-400";
      case "responded": return "bg-green-600/20 text-green-400";
      default: return "bg-gray-600/20 text-gray-400";
    }
  };

  const getBriefStatusText = (status) => {
    switch(status) {
      case "pending": return "Needs Response";
      case "responded": return "Admin Responded";
      default: return "No Brief Required";
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || "0"}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customer = customerData[order._id] || { fullName: "", email: "" };
    const orderNumber = order.orderNumber?.toLowerCase() || "";
    
    return (
      orderNumber.includes(searchLower) ||
      customer.fullName.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title="Ready for Invoice" />
      <DashboardLayout userRole="super-admin">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Ready for Invoice</h1>
              <p className="text-sm text-gray-400">Orders that are ready for invoice generation</p>
            </div>
            <Button variant="secondary" onClick={() => router.push("/dashboards/super-admin-dashboard/invoices")}>
              View All Invoices
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by order number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-800 bg-slate-900 py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/30 py-16 text-center">
              <div className="mb-4 text-6xl">📄</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                {searchTerm ? "No matching orders found" : "No orders ready for invoice"}
              </h3>
              <p className="text-gray-400">
                {searchTerm 
                  ? "Try adjusting your search term"
                  : "Orders become ready when they are received and waiting for invoice"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => {
                const customer = customerData[order._id] || { 
                  firstName: "", 
                  lastName: "", 
                  email: "",
                  fullName: "Customer" 
                };
                
                return (
                  <div
                    key={order._id}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50 backdrop-blur-sm transition hover:border-primary/50"
                    onClick={() => fetchOrderDetails(order._id)}
                  >
                    <div className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <p className="font-mono text-sm text-primary">#{order.orderNumber}</p>
                          <h3 className="mt-1 font-semibold text-white">
                            {customer.fullName}
                          </h3>
                          {customer.email && (
                            <p className="mt-0.5 text-xs text-gray-500">{customer.email}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                      </div>

                      <div className="mb-4 space-y-2">
                        <p className="text-sm text-gray-400">
                          {order.items?.length} product{order.items?.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateInvoice(order._id);
                        }}
                      >
                        Create Invoice
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>

      {selectedOrder && orderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-800 bg-slate-900">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-800 bg-slate-900 p-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Order Products & Briefs</h2>
                <p className="mt-1 text-sm text-gray-400">Order #{orderDetails.orderNumber}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setOrderDetails(null);
                }}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-slate-800 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 p-6">
              {loadingDetails ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <>
                  <div className="rounded-lg bg-slate-800/30 p-4">
                    <h3 className="mb-2 font-medium text-white">Customer</h3>
                    <p className="text-white">
                      {customerData[orderDetails._id]?.fullName || "Customer"}
                    </p>
                    <p className="text-sm text-gray-400">{orderDetails.userId?.email}</p>
                  </div>

                  <div>
                    <h3 className="mb-4 font-medium text-white">Products & Briefs</h3>
                    <div className="space-y-4">
                      {orderDetails.items.map((item, index) => (
                        <div key={index} className="rounded-lg bg-slate-800/30 p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-white">{item.productName}</h4>
                              <p className="text-sm text-gray-400">
                                Quantity: {item.quantity} × ₦{item.price.toLocaleString()}
                              </p>
                            </div>
                            <p className="font-bold text-primary">
                              ₦{(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>

                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-sm text-gray-400">Brief status:</span>
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${getBriefStatusColor(item.briefStatus)}`}>
                              {getBriefStatusText(item.briefStatus)}
                            </span>
                          </div>

                          {item.briefs?.customer && (
                            <div className="mt-3 border-t border-gray-700 pt-3">
                              <p className="mb-2 text-xs text-primary">Customer Brief:</p>
                              <p className="line-clamp-2 text-sm text-gray-300">
                                {item.briefs.customer.description || "No description"}
                              </p>
                              {item.briefs.customer.image && (
                                <span className="mt-1 inline-block text-xs text-blue-400">📷 Has image</span>
                              )}
                              {item.briefs.customer.voiceNote && (
                                <span className="ml-2 inline-block text-xs text-green-400">🎤 Has voice note</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-800/30 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">Order Total</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(orderDetails.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1"
                      onClick={() => {
                        setSelectedOrder(null);
                        setOrderDetails(null);
                        handleCreateInvoice(orderDetails._id);
                      }}
                    >
                      Create Invoice
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="flex-1"
                      onClick={() => {
                        setSelectedOrder(null);
                        setOrderDetails(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}