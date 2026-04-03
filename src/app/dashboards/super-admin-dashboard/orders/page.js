"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import SEOHead from "@/components/common/SEOHead";
import { useAuthCheck } from "@/app/lib/auth";
import { orderService } from "@/services/orderService";
import { METADATA } from "@/lib/metadata";

export default function SuperAdminOrdersPage() {
  useAuthCheck();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "all";
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState(filterParam);
  const [stats, setStats] = useState({
    total: 0,
    needsInvoice: 0,
    paid: 0,
    partPaid: 0,
    inProduction: 0,
    completed: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let ordersData = [];
      
      if (filter === "needs-invoice") {
        const response = await orderService.getOrdersReadyForInvoice();
        console.log("Orders ready for invoice:", response);
        
        if (response?.orders && Array.isArray(response.orders)) {
          ordersData = response.orders;
        } else if (response?.order && Array.isArray(response.order)) {
          ordersData = response.order;
        } else if (Array.isArray(response)) {
          ordersData = response;
        } else if (response?.data?.orders) {
          ordersData = response.data.orders;
        }
      } else {
        const params = { limit: 50 };
        if (filter !== "all") {
          params.status = filter;
        }
        const response = await orderService.getAll(params);
        ordersData = response?.order || [];
      }
      
      setOrders(ordersData);
      await fetchStats();
      
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [allOrders, needsInvoiceOrders, paidOrders, partPaidOrders, productionOrders, completedOrders] = await Promise.all([
        orderService.getAll({ limit: 1 }).catch(() => ({ total: 0 })),
        orderService.getOrdersReadyForInvoice().catch(() => ({ orders: [] })),
        orderService.filter({ paymentStatus: "Completed", limit: 1 }).catch(() => ({ total: 0 })),
        orderService.filter({ paymentStatus: "PartPayment", limit: 1 }).catch(() => ({ total: 0 })),
        orderService.filter({ status: "InProduction", limit: 1 }).catch(() => ({ total: 0 })),
        orderService.filter({ status: "Completed", limit: 1 }).catch(() => ({ total: 0 }))
      ]);

      let needsInvoiceCount = 0;
      if (needsInvoiceOrders?.orders && Array.isArray(needsInvoiceOrders.orders)) {
        needsInvoiceCount = needsInvoiceOrders.orders.length;
      } else if (needsInvoiceOrders?.order && Array.isArray(needsInvoiceOrders.order)) {
        needsInvoiceCount = needsInvoiceOrders.order.length;
      } else if (Array.isArray(needsInvoiceOrders)) {
        needsInvoiceCount = needsInvoiceOrders.length;
      }

      setStats({
        total: allOrders?.total || 0,
        needsInvoice: needsInvoiceCount,
        paid: paidOrders?.total || 0,
        partPaid: partPaidOrders?.total || 0,
        inProduction: productionOrders?.total || 0,
        completed: completedOrders?.total || 0
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleViewOrder = (orderId) => {
    router.push(`/dashboards/super-admin-dashboard/orders/${orderId}`);
  };

  const handleCreateInvoice = (orderId) => {
    router.push(`/dashboards/super-admin-dashboard/invoices/create?orderId=${orderId}`);
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || "0"}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
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

  const getPaymentStatusColor = (status) => {
    const colors = {
      "Pending": "yellow",
      "PartPayment": "blue",
      "Completed": "green",
      "Failed": "red",
      "Refunded": "gray"
    };
    return colors[status] || "gray";
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading orders...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title="Orders" />
      <DashboardLayout userRole="super-admin">
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Orders</h1>
              <p className="text-sm text-gray-400">Manage and track all orders</p>
            </div>
            <Link href="/dashboards/super-admin-dashboard">
              <Button variant="ghost" size="sm">← Back to Dashboard</Button>
            </Link>
          </div>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/50 p-4 text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div 
              onClick={() => setFilter("all")}
              className={`cursor-pointer rounded-lg border p-4 transition hover:bg-slate-800/50 ${
                filter === "all" ? "border-red-500 bg-slate-900" : "border-gray-800 bg-slate-900"
              }`}
            >
              <p className="text-sm text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div 
              onClick={() => setFilter("needs-invoice")}
              className={`cursor-pointer rounded-lg border p-4 transition hover:bg-slate-800/50 ${
                filter === "needs-invoice" ? "border-yellow-500 bg-slate-900" : "border-gray-800 bg-slate-900"
              }`}
            >
              <p className="text-sm text-gray-400">Need Invoice</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.needsInvoice}</p>
            </div>
            <div 
              onClick={() => setFilter("paid")}
              className={`cursor-pointer rounded-lg border p-4 transition hover:bg-slate-800/50 ${
                filter === "paid" ? "border-green-500 bg-slate-900" : "border-gray-800 bg-slate-900"
              }`}
            >
              <p className="text-sm text-gray-400">Paid</p>
              <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
            </div>
            <div 
              onClick={() => setFilter("part-paid")}
              className={`cursor-pointer rounded-lg border p-4 transition hover:bg-slate-800/50 ${
                filter === "part-paid" ? "border-blue-500 bg-slate-900" : "border-gray-800 bg-slate-900"
              }`}
            >
              <p className="text-sm text-gray-400">Part Paid</p>
              <p className="text-2xl font-bold text-blue-400">{stats.partPaid}</p>
            </div>
            <div 
              onClick={() => setFilter("in-production")}
              className={`cursor-pointer rounded-lg border p-4 transition hover:bg-slate-800/50 ${
                filter === "in-production" ? "border-purple-500 bg-slate-900" : "border-gray-800 bg-slate-900"
              }`}
            >
              <p className="text-sm text-gray-400">In Production</p>
              <p className="text-2xl font-bold text-purple-400">{stats.inProduction}</p>
            </div>
            <div 
              onClick={() => setFilter("completed")}
              className={`cursor-pointer rounded-lg border p-4 transition hover:bg-slate-800/50 ${
                filter === "completed" ? "border-green-500 bg-slate-900" : "border-gray-800 bg-slate-900"
              }`}
            >
              <p className="text-sm text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-800 bg-slate-900">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No orders found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-800 bg-slate-950">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Order #</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Customer</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Items</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Total</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Payment</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Status</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Date</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-800 transition hover:bg-slate-800/50">
                        <td className="p-4">
                          <span className="font-mono text-sm font-medium text-white">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-white">
                            {order.userId?.email?.split("@")[0] || order.userId?.fullname || "N/A"}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-300">
                          {order.items?.length || 0} item(s)
                        </td>
                        <td className="p-4 text-sm font-medium text-white">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block rounded-full px-2 py-1 text-xs bg-${getPaymentStatusColor(order.paymentStatus)}-900/50 text-${getPaymentStatusColor(order.paymentStatus)}-400`}>
                            {order.paymentStatus || "Pending"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block rounded-full px-2 py-1 text-xs bg-${getStatusColor(order.status)}-900/50 text-${getStatusColor(order.status)}-400`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleViewOrder(order._id)}
                              className="text-sm text-blue-500 hover:text-blue-400"
                            >
                              View
                            </button>
                            {filter === "needs-invoice" && !order.invoiceId && (
                              <button
                                onClick={() => handleCreateInvoice(order._id)}
                                className="text-sm font-medium text-green-500 hover:text-green-400"
                              >
                                Create Invoice
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}