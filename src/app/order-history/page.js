"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OrderCard from "@/components/cards/OrderCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SEOHead from "@/components/common/SEOHead";
import { orderService } from "@/services/orderService";
import { useAuth, useAuthCheck } from "@/app/lib/auth";
import { METADATA } from "@/lib/metadata";

const OrderStatus = {
  Pending: "Pending",
  OrderReceived: "OrderReceived",
  FilesUploaded: "FilesUploaded",
  AwaitingInvoice: "AwaitingInvoice",
  InvoiceSent: "InvoiceSent",
  DesignUploaded: "DesignUploaded",
  UnderReview: "UnderReview",
  Approved: "Approved",
  AwaitingPartPayment: "AwaitingPartPayment",
  PartPaymentMade: "PartPaymentMade",
  InProduction: "InProduction",
  Completed: "Completed",
  AwaitingFinalPayment: "AwaitingFinalPayment",
  FinalPaid: "FinalPaid",
  ReadyForShipping: "ReadyForShipping",
  Shipped: "Shipped",
  Cancelled: "Cancelled",
  Delivered: "Delivered"
};

const StatusDisplayNames = {
  Pending: "Pending",
  OrderReceived: "Order Received",
  FilesUploaded: "Files Uploaded",
  AwaitingInvoice: "Awaiting Invoice",
  InvoiceSent: "Invoice Sent",
  DesignUploaded: "Design Uploaded",
  UnderReview: "Under Review",
  Approved: "Approved",
  AwaitingPartPayment: "Awaiting Part Payment",
  PartPaymentMade: "Part Payment Made",
  InProduction: "In Production",
  Completed: "Completed",
  AwaitingFinalPayment: "Awaiting Final Payment",
  FinalPaid: "Final Paid",
  ReadyForShipping: "Ready For Shipping",
  Shipped: "Shipped",
  Cancelled: "Cancelled",
  Delivered: "Delivered"
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  useAuthCheck();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    inProduction: 0,
    pending: 0,
    paymentDue: 0
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchOrders();
      fetchAllOrderCounts();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setCurrentPage(1);
        fetchOrders();
      }, 500);

      setSearchTimeout(timeout);

      return () => clearTimeout(timeout);
    }
  }, [searchTerm, authLoading, isAuthenticated]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && filterStatus !== "stats-click") {
      fetchOrders();
    }
  }, [filterStatus, currentPage, authLoading, isAuthenticated]);

  const handleStatsClick = (filterType) => {
    switch (filterType) {
      case "delivered":
        setFilterStatus("Delivered");
        break;
      case "inProduction":
        setFilterStatus("InProduction");
        break;
      case "pending":
        setFilterStatus("pending");
        break;
      case "paymentDue":
        setFilterStatus("paymentDue");
        break;
      default:
        setFilterStatus("all");
    }
    setCurrentPage(1);
  };

  const fetchAllOrderCounts = async () => {
    try {
      const response = await orderService.getMyOrders({ limit: 1000 });

      let allOrders = [];
      if (response?.order && Array.isArray(response.order)) {
        allOrders = response.order;
      } else if (Array.isArray(response)) {
        allOrders = response;
      } else if (response?.data?.order) {
        allOrders = response.data.order;
      }

      const total = allOrders.length;
      const delivered = allOrders.filter((o) => o.status === "Delivered").length;
      const inProduction = allOrders.filter((o) => o.status === "InProduction").length;
      const pending = allOrders.filter((o) =>
        ["Pending", "OrderReceived", "FilesUploaded"].includes(o.status)
      ).length;
      const paymentDue = allOrders.filter((o) =>
        ["InvoiceSent", "AwaitingPartPayment", "AwaitingFinalPayment"].includes(o.status)
      ).length;

      setStats({
        total,
        delivered,
        inProduction,
        pending,
        paymentDue
      });
    } catch (err) {
      console.error("Failed to fetch order counts:", err);
    }
  };

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: 10
      };

      if (filterStatus === "pending" || filterStatus === "paymentDue") {
        params.limit = 100;
      } else if (filterStatus !== "all" && filterStatus !== "stats-click") {
        params.status = filterStatus;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log("Fetching orders with params:", params);

      const response = await orderService.getMyOrders(params);
      console.log("Orders response:", response);

      let ordersData = [];
      let total = 0;
      let limit = 10;

      if (response?.order && Array.isArray(response.order)) {
        ordersData = response.order;
        total = response.total || ordersData.length;
        limit = response.limit || 10;
      } else if (Array.isArray(response)) {
        ordersData = response;
        total = ordersData.length;
      } else if (response?.data?.order) {
        ordersData = response.data.order;
        total = response.data.total || ordersData.length;
        limit = response.data.limit || 10;
      }

      let filteredOrders = ordersData;
      let filteredTotal = total;

      if (filterStatus === "pending") {
        filteredOrders = ordersData.filter((o) =>
          ["Pending", "OrderReceived", "FilesUploaded"].includes(o.status)
        );
        filteredTotal = filteredOrders.length;
      } else if (filterStatus === "paymentDue") {
        filteredOrders = ordersData.filter((o) =>
          ["InvoiceSent", "AwaitingPartPayment", "AwaitingFinalPayment"].includes(o.status)
        );
        filteredTotal = filteredOrders.length;
      }

      setOrders(filteredOrders);
      setTotalOrders(filteredTotal);
      setTotalPages(Math.ceil(filteredTotal / (params.limit || 10)) || 1);
      setError("");

      await fetchAllOrderCounts();
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      if (err.status === 401) {
        console.log("Unauthorized, will redirect to login");
      } else {
        setError("Failed to load order history");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    let filename = imagePath;
    if (imagePath.includes("/")) {
      filename = imagePath.split("/").pop();
    }
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (authLoading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
              <p className="text-gray-400">Checking authentication...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
              <p className="text-gray-400">Loading your order history...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.orderHistory} />
      <DashboardLayout userRole={user?.role}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">Order History</h1>
              <p className="mt-1 text-sm text-gray-400">View all your past and current orders</p>
            </div>
            <Link href="/collections/all/products">
              <Button variant="primary" className="gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Order
              </Button>
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            <div
              onClick={() => setFilterStatus("all")}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-blue-500 ${
                filterStatus === "all" ? "border-blue-500 bg-blue-900/20" : "border-gray-800 bg-slate-900/50 backdrop-blur-sm"
              }`}
            >
              <p className="mb-1 text-sm text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>

            <div
              onClick={() => handleStatsClick("delivered")}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-green-500 ${
                filterStatus === "Delivered" ? "border-green-500 bg-green-900/20" : "border-gray-800 bg-slate-900/50 backdrop-blur-sm"
              }`}
            >
              <p className="mb-1 text-sm text-gray-400">Delivered</p>
              <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
            </div>

            <div
              onClick={() => handleStatsClick("inProduction")}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-purple-500 ${
                filterStatus === "InProduction" ? "border-purple-500 bg-purple-900/20" : "border-gray-800 bg-slate-900/50 backdrop-blur-sm"
              }`}
            >
              <p className="mb-1 text-sm text-gray-400">In Production</p>
              <p className="text-2xl font-bold text-purple-400">{stats.inProduction}</p>
            </div>

            <div
              onClick={() => handleStatsClick("pending")}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-yellow-500 ${
                filterStatus === "pending" ? "border-yellow-500 bg-yellow-900/20" : "border-gray-800 bg-slate-900/50 backdrop-blur-sm"
              }`}
            >
              <p className="mb-1 text-sm text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>

            <div
              onClick={() => handleStatsClick("paymentDue")}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-orange-500 ${
                filterStatus === "paymentDue" ? "border-orange-500 bg-orange-900/20" : "border-gray-800 bg-slate-900/50 backdrop-blur-sm"
              }`}
            >
              <p className="mb-1 text-sm text-gray-400">Payment Due</p>
              <p className="text-2xl font-bold text-orange-400">{stats.paymentDue}</p>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Search by order number or product name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full"
                icon={
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <select
              value={filterStatus}
              onChange={handleFilterChange}
              className="min-w-[200px] rounded-lg border border-gray-700 bg-slate-900 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending (New Orders)</option>
              <option value="InProduction">In Production</option>
              <option value="paymentDue">Payment Due</option>
              <option value="Delivered">Delivered</option>
              <option value="Approved">Approved</option>
              <option value="Shipped">Shipped</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {(searchTerm || filterStatus !== "all") && (
            <div className="mb-4 flex items-center gap-2 text-sm">
              <span className="text-gray-400">Active filters:</span>
              {searchTerm && (
                <span className="rounded-full border border-red-800 bg-red-900/30 px-2 py-1 text-xs text-red-400">
                  Search: "{searchTerm}"
                </span>
              )}
              {filterStatus !== "all" && (
                <span className="rounded-full border border-red-800 bg-red-900/30 px-2 py-1 text-xs text-red-400">
                  {filterStatus === "pending"
                    ? "Pending (New Orders)"
                    : filterStatus === "paymentDue"
                    ? "Payment Due"
                    : filterStatus === "InProduction"
                    ? "In Production"
                    : StatusDisplayNames[filterStatus] || filterStatus}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setCurrentPage(1);
                }}
                className="text-xs text-gray-400 underline hover:text-white"
              >
                Clear all
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-red-200">
              {error}
            </div>
          )}

          {loading && orders.length > 0 && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
            </div>
          )}

          {orders.length > 0 ? (
            <div className="space-y-4">
              {(searchTerm || filterStatus !== "all") && (
                <div className="mb-4 rounded-lg border border-red-800/30 bg-red-900/10 p-4">
                  <p className="text-gray-300">
                    Found <span className="font-bold text-red-400">{orders.length}</span> orders
                    {searchTerm && (
                      <span>
                        {" "}
                        matching "<span className="font-medium text-red-400">{searchTerm}</span>"
                      </span>
                    )}
                    {filterStatus !== "all" && (
                      <span>
                        {" "}
                        with filter{" "}
                        <span className="font-medium text-red-400">
                          {filterStatus === "pending"
                            ? "Pending (New Orders)"
                            : filterStatus === "paymentDue"
                            ? "Payment Due"
                            : filterStatus === "InProduction"
                            ? "In Production"
                            : StatusDisplayNames[filterStatus] || filterStatus}
                        </span>
                      </span>
                    )}
                    {totalOrders > orders.length && (
                      <span>
                        {" "}
                        (showing page {currentPage} of {totalPages})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={{
                    id: order._id,
                    orderNumber: order.orderNumber,
                    productName: order.items?.[0]?.productName || "Multiple Items",
                    productImage: getImageUrl(order.items?.[0]?.productId?.images?.[0] || order.items?.[0]?.productSnapshot?.image),
                    orderedDate: new Date(order.createdAt)
                      .toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      })
                      .replace(/\//g, "-"),
                    totalAmount: order.totalAmount,
                    status: order.status,
                    itemsCount: order.items?.length || 1,
                    paymentStatus: order.paymentStatus
                  }}
                  onClick={() => router.push(`/orders/${order._id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 bg-slate-900/30 py-16 text-center">
              <div className="mb-4 text-6xl">📦</div>
              <p className="mb-2 text-lg text-gray-400">No orders found</p>
              <p className="mb-6 text-sm text-gray-500">
                {searchTerm || filterStatus !== "all"
                  ? `No orders matching your ${searchTerm ? "search" : "filter"} criteria`
                  : "Start by creating your first order"}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Link href="/collections/all/products">
                  <Button variant="primary">Browse Products</Button>
                </Link>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  currentPage === 1
                    ? "cursor-not-allowed text-gray-600"
                    : "text-white hover:bg-slate-800"
                }`}
              >
                ← Previous
              </button>

              <div className="flex items-center gap-2">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                  }
                  if (pageNum <= totalPages && pageNum > 0) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`h-10 w-10 rounded-lg text-sm font-medium transition ${
                          currentPage === pageNum
                            ? "bg-red-600 text-white"
                            : "text-gray-400 hover:bg-slate-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  currentPage === totalPages
                    ? "cursor-not-allowed text-gray-600"
                    : "text-white hover:bg-slate-800"
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}