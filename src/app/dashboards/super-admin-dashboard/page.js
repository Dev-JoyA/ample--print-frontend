"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import SummaryCard from "@/components/cards/SummaryCard";
import Button from "@/components/ui/Button";
import Link from "next/link";
import SEOHead from "@/components/common/SEOHead";
import { useAuthCheck } from "@/app/lib/auth";
import { orderService } from "@/services/orderService";
import { invoiceService } from "@/services/invoiceService";
import { paymentService } from "@/services/paymentService";
import { adminService } from "@/services/adminService";
import { METADATA } from "@/lib/metadata";

export default function SuperAdminDashboard() {
  useAuthCheck();

  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingInvoices: 0,
    unverifiedPayments: 0,
    totalOrders: 0,
    activeAdmins: 0,
    paidOrders: 0,
    partPaidOrders: 0,
    overdueInvoices: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePrintReport = () => {
    const printWindow = window.open("/dashboards/super-admin-dashboard/transactions?print=true", "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const ordersResponse = await orderService.getAll({ limit: 100 });
      const orders = ordersResponse?.order || [];
      
      const totalOrders = ordersResponse?.total || orders.length;
      const paidOrders = orders.filter(o => o.paymentStatus === "Completed").length;
      const partPaidOrders = orders.filter(o => o.paymentStatus === "PartPayment").length;
      
      const totalRevenue = orders
        .filter(o => o.paymentStatus === "Completed")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      let pendingInvoices = 0;
      try {
        const ordersReadyForInvoiceResponse = await orderService.getOrdersReadyForInvoice();
        console.log("Orders ready for invoice:", ordersReadyForInvoiceResponse);
        
        if (ordersReadyForInvoiceResponse?.orders && Array.isArray(ordersReadyForInvoiceResponse.orders)) {
          pendingInvoices = ordersReadyForInvoiceResponse.orders.length;
        } else if (ordersReadyForInvoiceResponse?.order && Array.isArray(ordersReadyForInvoiceResponse.order)) {
          pendingInvoices = ordersReadyForInvoiceResponse.order.length;
        } else if (Array.isArray(ordersReadyForInvoiceResponse)) {
          pendingInvoices = ordersReadyForInvoiceResponse.length;
        } else if (ordersReadyForInvoiceResponse?.data?.orders) {
          pendingInvoices = ordersReadyForInvoiceResponse.data.orders.length;
        }
      } catch (err) {
        console.error("Failed to fetch orders ready for invoice:", err);
        pendingInvoices = 0;
      }
      
      let overdueInvoices = 0;
      try {
        const overdueResponse = await invoiceService.getAll({ status: "overdue", limit: 100 });
        overdueInvoices = overdueResponse?.invoices?.length || 
                         overdueResponse?.data?.invoices?.length || 
                         (Array.isArray(overdueResponse) ? overdueResponse.length : 0);
      } catch (err) {
        console.error("Failed to fetch overdue invoices:", err);
        overdueInvoices = 0;
      }

      let unverifiedPayments = 0;
      let transactions = [];
      try {
        const paymentsResponse = await paymentService.getPendingBankTransfers({ limit: 100 });
        console.log("Payments response:", paymentsResponse);
        
        if (paymentsResponse?.transactions && Array.isArray(paymentsResponse.transactions)) {
          unverifiedPayments = paymentsResponse.transactions.length;
          transactions = paymentsResponse.transactions;
        } else if (paymentsResponse?.data?.transactions) {
          unverifiedPayments = paymentsResponse.data.transactions.length;
          transactions = paymentsResponse.data.transactions;
        } else if (Array.isArray(paymentsResponse)) {
          unverifiedPayments = paymentsResponse.length;
          transactions = paymentsResponse;
        }
      } catch (err) {
        console.error("Failed to fetch pending payments:", err);
        unverifiedPayments = 0;
        transactions = [];
      }

      let activeAdmins = 0;
      try {
        const adminsResponse = await adminService.getAllAdmins();
        if (Array.isArray(adminsResponse)) {
          activeAdmins = adminsResponse.filter(a => a.isActive).length;
        } else if (adminsResponse?.data && Array.isArray(adminsResponse.data)) {
          activeAdmins = adminsResponse.data.filter(a => a.isActive).length;
        }
      } catch (err) {
        console.error("Failed to fetch admins:", err);
        activeAdmins = 0;
      }

      let invoices = [];
      try {
        const invoicesResponse = await invoiceService.getAll({ limit: 5 });
        if (invoicesResponse?.invoices && Array.isArray(invoicesResponse.invoices)) {
          invoices = invoicesResponse.invoices;
        } else if (invoicesResponse?.data?.invoices) {
          invoices = invoicesResponse.data.invoices;
        } else if (Array.isArray(invoicesResponse)) {
          invoices = invoicesResponse;
        }
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
        invoices = [];
      }

      setStats({
        totalRevenue,
        pendingInvoices,
        unverifiedPayments,
        totalOrders,
        activeAdmins,
        paidOrders,
        partPaidOrders,
        overdueInvoices
      });

      setPendingVerifications(transactions.slice(0, 5).map(t => ({
        id: t._id,
        customer: t.userId?.email?.split("@")[0] || t.customerName || "Customer",
        amount: `₦${(t.amount || 0).toLocaleString()}`,
        orderId: t.orderNumber ? `#${t.orderNumber}` : `#${t.orderId?.slice(-6) || "N/A"}`,
        date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "N/A"
      })));

      setRecentInvoices(invoices.slice(0, 3).map(i => ({
        id: i._id,
        number: i.invoiceNumber || `INV-${i._id?.slice(-6)}`,
        customer: i.orderId?.userId?.email?.split("@")[0] || i.customerName || "Customer",
        amount: `₦${(i.totalAmount || 0).toLocaleString()}`,
        status: i.status?.toLowerCase() || "pending"
      })));

      const activities = [];
      
      orders.slice(0, 2).forEach(o => {
        activities.push({
          id: o._id,
          action: "New order created",
          user: o.orderNumber,
          time: o.createdAt ? new Date(o.createdAt).toLocaleString() : "Recently",
          status: "info"
        });
      });
      
      transactions.slice(0, 2).forEach(t => {
        activities.push({
          id: t._id,
          action: "Payment received",
          user: t.orderNumber ? `Order #${t.orderNumber}` : "Bank transfer",
          time: t.createdAt ? new Date(t.createdAt).toLocaleString() : "Recently",
          status: "success"
        });
      });
      
      activities.push({ 
        id: "stats", 
        action: "Dashboard updated", 
        user: "System", 
        time: "Just now", 
        status: "info" 
      });
      
      setRecentActivities(activities);

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || "0"}`;
  };

  const handleVerifyPayment = async (transactionId) => {
    try {
      await paymentService.verifyBankTransfer(transactionId, { status: "approve" });
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to verify payment:", err);
      alert("Failed to verify payment");
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title="Dashboard" />
      <DashboardLayout userRole="super-admin">
        <div className="space-y-8 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-400">Welcome back! Here's what's happening with your business today.</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/dashboards/super-admin-dashboard/transactions?print=true" 
                target="_blank"
                className="inline-block"
              >
                <Button variant="primary" size="md" icon="📊">
                  Generate Report
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/50 p-4 text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon="💰"
              color="green"
              subtitle="All time revenue"
            />
            <Link href="/dashboards/super-admin-dashboard/orders?filter=needs-invoice">
              <SummaryCard
                title="Pending Invoices"
                value={stats.pendingInvoices.toString()}
                icon="📄"
                color="yellow"
                subtitle="Awaiting invoice generation"
              />
            </Link>
            <Link href="/dashboards/super-admin-dashboard/payment-verification">
              <SummaryCard
                title="Unverified Payments"
                value={stats.unverifiedPayments.toString()}
                icon="⏳"
                color="red"
                subtitle="Need attention"
              />
            </Link>
            <Link href="/dashboards/super-admin-dashboard/orders">
              <SummaryCard
                title="Total Orders"
                value={stats.totalOrders.toString()}
                icon="📦"
                color="blue"
                subtitle={`${stats.paidOrders} paid, ${stats.partPaidOrders} partial`}
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Link href="/dashboards/super-admin-dashboard/admin-management">
              <SummaryCard
                title="Active Admins"
                value={stats.activeAdmins.toString()}
                icon="👥"
                color="purple"
                subtitle="Currently managing system"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-lg border border-gray-800 bg-slate-900 p-6">
                <h2 className="mb-4 text-xl font-bold text-white">Quick Actions</h2>
                <div className="space-y-3">
                  <Link href="/dashboards/super-admin-dashboard/admin-management/create-admin">
                    <Button variant="secondary" size="md" className="w-full justify-start" icon="➕">
                      Create New Admin
                    </Button>
                  </Link>
                  <Link href="/dashboards/super-admin-dashboard/payment-verification">
                    <Button variant="secondary" size="md" className="w-full justify-start" icon="✓">
                      Verify Payments ({stats.unverifiedPayments})
                    </Button>
                  </Link>
                  <Link href="/dashboards/super-admin-dashboard/discounts">
                    <Button variant="secondary" size="md" className="w-full justify-start" icon="🏷️">
                      Manage Discounts
                    </Button>
                  </Link>
                  <Link href="/dashboards/super-admin-dashboard/invoices/create">
                    <Button variant="secondary" size="md" className="w-full justify-start" icon="📄">
                      Generate Invoice
                    </Button>
                  </Link>
                  <Link href="/dashboards/super-admin-dashboard/shipping-invoices">
                    <Button variant="secondary" size="md" className="w-full justify-start" icon="🚚">
                      Shipping Invoices
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-gray-800 bg-slate-900 p-6">
                <h2 className="mb-4 text-xl font-bold text-white">System Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">API Status</span>
                    <span className="flex items-center text-green-400">
                      <span className="mr-2 h-2 w-2 rounded-full bg-green-400"></span>
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Database</span>
                    <span className="flex items-center text-green-400">
                      <span className="mr-2 h-2 w-2 rounded-full bg-green-400"></span>
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active Users</span>
                    <span className="flex items-center text-blue-400">
                      <span className="mr-2 h-2 w-2 rounded-full bg-blue-400"></span>
                      {stats.activeAdmins + 50}+
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-lg border border-gray-800 bg-slate-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Pending Payment Verifications</h2>
                <Link href="/dashboards/super-admin-dashboard/payment-verification" className="text-sm text-red-500 hover:text-red-400">
                  View All →
                </Link>
              </div>
              {pendingVerifications.length === 0 ? (
                <p className="py-8 text-center text-gray-400">No pending verifications</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="py-3 text-left font-medium text-gray-400">Customer</th>
                        <th className="py-3 text-left font-medium text-gray-400">Order ID</th>
                        <th className="py-3 text-left font-medium text-gray-400">Amount</th>
                        <th className="py-3 text-left font-medium text-gray-400">Date</th>
                        <th className="py-3 text-left font-medium text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingVerifications.map((item) => (
                        <tr key={item.id} className="border-b border-gray-800">
                          <td className="py-3 text-white">{item.customer}</td>
                          <td className="py-3 text-gray-300">{item.orderId}</td>
                          <td className="py-3 text-gray-300">{item.amount}</td>
                          <td className="py-3 text-gray-300">{item.date}</td>
                          <td className="py-3">
                            <button 
                              onClick={() => handleVerifyPayment(item.id)}
                              className="text-sm font-medium text-red-500 hover:text-red-400"
                            >
                              Verify
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="py-4 text-center text-gray-400">No recent activity</p>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`mt-2 h-2 w-2 rounded-full ${
                        activity.status === "success" ? "bg-green-500" :
                        activity.status === "warning" ? "bg-yellow-500" :
                        "bg-blue-500"
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-800 bg-slate-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Recent Invoices</h2>
                <Link href="/dashboards/super-admin-dashboard/invoices" className="text-sm text-red-500 hover:text-red-400">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {recentInvoices.length === 0 ? (
                  <p className="py-4 text-center text-gray-400">No recent invoices</p>
                ) : (
                  recentInvoices.map((invoice) => (
                    <Link key={invoice.id} href={`/dashboards/super-admin-dashboard/invoices/${invoice.id}`}>
                      <div className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-800 p-3 transition hover:bg-slate-700">
                        <div>
                          <p className="font-medium text-white">{invoice.number}</p>
                          <p className="text-sm text-gray-400">{invoice.customer}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">{invoice.amount}</p>
                          <span className={`rounded-full px-2 py-1 text-xs ${
                            invoice.status === "paid" ? "bg-green-900/50 text-green-400" :
                            invoice.status === "pending" ? "bg-yellow-900/50 text-yellow-400" :
                            "bg-red-900/50 text-red-400"
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboards/super-admin-dashboard/admin-management">
              <div className="group cursor-pointer rounded-lg border border-purple-800 bg-gradient-to-br from-purple-900/50 to-purple-950/50 p-6 transition hover:border-purple-600">
                <div className="mb-3 text-4xl">👥</div>
                <h3 className="text-lg font-bold text-white transition group-hover:text-purple-400">Admin Management</h3>
                <p className="mt-2 text-sm text-gray-400">Create, activate, or deactivate administrators</p>
                <p className="mt-3 text-xs text-purple-400">{stats.activeAdmins} active admins</p>
              </div>
            </Link>

            <Link href="/dashboards/super-admin-dashboard/discounts">
              <div className="group cursor-pointer rounded-lg border border-blue-800 bg-gradient-to-br from-blue-900/50 to-blue-950/50 p-6 transition hover:border-blue-600">
                <div className="mb-3 text-4xl">🏷️</div>
                <h3 className="text-lg font-bold text-white transition group-hover:text-blue-400">Discounts</h3>
                <p className="mt-2 text-sm text-gray-400">Manage promotional codes and discounts</p>
              </div>
            </Link>

            <Link href="/dashboards/super-admin-dashboard/invoices">
              <div className="group cursor-pointer rounded-lg border border-green-800 bg-gradient-to-br from-green-900/50 to-green-950/50 p-6 transition hover:border-green-600">
                <div className="mb-3 text-4xl">📄</div>
                <h3 className="text-lg font-bold text-white transition group-hover:text-green-400">Invoices</h3>
                <p className="mt-2 text-sm text-gray-400">View and manage all invoices</p>
                <p className="mt-3 text-xs text-green-400">{stats.pendingInvoices} pending</p>
              </div>
            </Link>

            <Link href="/dashboards/super-admin-dashboard/payment-verification">
              <div className="group cursor-pointer rounded-lg border border-red-800 bg-gradient-to-br from-red-900/50 to-red-950/50 p-6 transition hover:border-red-600">
                <div className="mb-3 text-4xl">✓</div>
                <h3 className="text-lg font-bold text-white transition group-hover:text-red-400">Payment Verification</h3>
                <p className="mt-2 text-sm text-gray-400">Verify customer payments</p>
                <p className="mt-3 text-xs text-red-400">{stats.unverifiedPayments} pending</p>
              </div>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}