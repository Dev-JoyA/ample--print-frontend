"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import SEOHead from "@/components/common/SEOHead";
import { useAuthCheck } from "@/app/lib/auth";
import { invoiceService } from "@/services/invoiceService";
import { paymentService } from "@/services/paymentService";
import { orderService } from "@/services/orderService";
import { profileService } from "@/services/profileService";
import { METADATA } from "@/lib/metadata";

export default function FinancialRecordsPage() {
  const router = useRouter();
  useAuthCheck();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0]
  });
  const [customerData, setCustomerData] = useState({});
  const [financialData, setFinancialData] = useState({
    summary: {
      totalRevenue: 0,
      partPaymentsDue: 0,
      pendingAmount: 0,
      paidInvoices: 0,
      partiallyPaidInvoices: 0,
      pendingInvoices: 0,
      bankTransferPending: 0
    },
    invoices: [],
    transactions: [],
    topProducts: [],
    monthlyData: []
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError("");

      const filterParams = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 1000
      };

      console.log("🔍 Filtering invoices with:", filterParams);
      
      const invoicesResponse = await invoiceService.filter(filterParams);
      console.log("📄 Filtered invoices response:", invoicesResponse);
      
      const invoices = invoicesResponse?.invoices || [];

      const pendingTransfersResponse = await paymentService.getPendingBankTransfers({ limit: 100 });
      const pendingTransfers = pendingTransfersResponse?.transactions || [];

      const totalRevenue = invoices
        .filter(inv => inv.status === "Paid")
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      const partPaymentsDue = invoices
        .filter(inv => inv.status === "PartiallyPaid")
        .reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);

      const pendingAmount = invoices
        .filter(inv => inv.status === "Sent")
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      const paidInvoices = invoices.filter(inv => inv.status === "Paid").length;
      const partiallyPaidInvoices = invoices.filter(inv => inv.status === "PartiallyPaid").length;
      const pendingInvoices = invoices.filter(inv => inv.status === "Sent").length;
      const bankTransferPending = pendingTransfers.length;

      const allTransactions = invoices
        .flatMap(inv => (inv.transactions || []).map(t => ({
          ...t,
          invoiceId: inv._id,
          invoiceNumber: inv.invoiceNumber,
          orderNumber: inv.orderNumber,
          customer: inv.userId?.email || inv.orderId?.userId?.email || "Customer",
          invoiceStatus: inv.status,
          invoiceType: inv.invoiceType || "main",
          invoiceTotal: inv.totalAmount,
          invoicePaid: inv.amountPaid,
          invoiceRemaining: inv.remainingAmount,
          createdAt: t.createdAt || inv.createdAt
        })))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const recentTransactions = allTransactions.slice(0, 15);

      const ordersResponse = await orderService.getAll({ limit: 100 });
      const orders = ordersResponse?.order || [];

      const productRevenue = {};
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
        if (orderDate >= dateRange.startDate && orderDate <= dateRange.endDate) {
          order.items?.forEach(item => {
            const productName = item.productName;
            if (!productRevenue[productName]) {
              productRevenue[productName] = {
                name: productName,
                quantity: 0,
                revenue: 0,
                orderCount: 0
              };
            }
            productRevenue[productName].quantity += item.quantity;
            productRevenue[productName].revenue += item.price * item.quantity;
            productRevenue[productName].orderCount += 1;
          });
        }
      });

      const topProducts = Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const monthlyData = generateMonthlyData(invoices, dateRange.startDate, dateRange.endDate);

      const customerDataMap = {};
      
      await Promise.all(
        invoices.map(async (invoice) => {
          let userId = null;
          
          if (invoice.orderId?.userId) {
            if (typeof invoice.orderId.userId === "object") {
              userId = invoice.orderId.userId._id || invoice.orderId.userId;
            } else {
              userId = invoice.orderId.userId;
            }
          } else if (invoice.userId) {
            if (typeof invoice.userId === "object") {
              userId = invoice.userId._id || invoice.userId;
            } else {
              userId = invoice.userId;
            }
          }
          
          if (userId) {
            try {
              const userIdStr = userId.toString ? userId.toString() : userId;
              const profileResponse = await profileService.getUserById(userIdStr);
              const userData = profileResponse?.user || profileResponse?.data || profileResponse;
              
              if (userData) {
                customerDataMap[invoice._id] = {
                  firstName: userData.firstName || "",
                  lastName: userData.lastName || "",
                  email: userData.email || "",
                  fullName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.email?.split("@")[0] || "Customer"
                };
              }
            } catch (err) {
              console.error(`Failed to fetch customer for invoice ${invoice._id}:`, err);
              const fallbackEmail = invoice.orderId?.userId?.email || 
                                   invoice.userId?.email || 
                                   invoice.customerEmail || 
                                   "";
              customerDataMap[invoice._id] = {
                firstName: "",
                lastName: "",
                email: fallbackEmail,
                fullName: fallbackEmail.split("@")[0] || "Customer"
              };
            }
          } else {
            const fallbackEmail = invoice.orderId?.userId?.email || 
                                 invoice.userId?.email || 
                                 invoice.customerEmail || 
                                 "";
            customerDataMap[invoice._id] = {
              firstName: "",
              lastName: "",
              email: fallbackEmail,
              fullName: fallbackEmail.split("@")[0] || "Customer"
            };
          }
        })
      );
      
      setCustomerData(customerDataMap);
      
      setFinancialData({
        summary: {
          totalRevenue,
          partPaymentsDue,
          pendingAmount,
          paidInvoices,
          partiallyPaidInvoices,
          pendingInvoices,
          bankTransferPending
        },
        invoices,
        transactions: recentTransactions,
        topProducts,
        monthlyData
      });

    } catch (err) {
      console.error("Failed to fetch financial data:", err);
      setError("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (invoices, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];
    
    let current = new Date(start);
    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const monthStr = current.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate.getFullYear() === year && invDate.getMonth() === month;
      });

      const revenue = monthInvoices
        .filter(inv => inv.status === "Paid")
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      const partPaymentsDue = monthInvoices
        .filter(inv => inv.status === "PartiallyPaid")
        .reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);

      months.push({
        month: monthStr,
        revenue,
        partPaymentsDue
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || "0"}`;
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = () => {
    fetchFinancialData();
  };

  const handleExportData = () => {
    const headers = ["Date", "Invoice #", "Order #", "Customer", "Amount", "Status", "Type"];
    const csvData = financialData.transactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t.invoiceNumber,
      t.orderNumber,
      t.customer,
      t.transactionAmount,
      t.transactionStatus,
      t.transactionType === "part" ? "Part Payment" : "Full Payment"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-records-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
  };

  const getStatusColor = (status) => {
    const colors = {
      "Paid": "green",
      "PartiallyPaid": "yellow",
      "Sent": "blue",
      "Draft": "gray",
      "Overdue": "red",
      "Cancelled": "gray"
    };
    return colors[status] || "gray";
  };

  const getTransactionStatusColor = (status) => {
    const colors = {
      "completed": "green",
      "pending": "yellow",
      "failed": "red",
      "refunded": "gray"
    };
    return colors[status] || "gray";
  };

  const getOrderNumber = (invoice) => {
    if (invoice.orderNumber) return invoice.orderNumber;
    if (invoice.orderId) {
      if (typeof invoice.orderId === "object") {
        return invoice.orderId.orderNumber;
      }
    }
    return "N/A";
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading financial records...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title="Financial Records" />
      <DashboardLayout userRole="super-admin">
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Financial Records</h1>
              <p className="text-gray-400">
                {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" size="sm" onClick={handleExportData}>
                Export Data
              </Button>
              <Link href="/dashboards/super-admin-dashboard">
                <Button variant="ghost" size="sm">← Back to Dashboard</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleApplyFilter}>
                Apply Filter
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
                setDateRange({
                  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
                  endDate: new Date().toISOString().split("T")[0]
                });
                setTimeout(fetchFinancialData, 100);
              }}>
                Reset to Current Month
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Showing {financialData.invoices.length} invoices in this period
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/50 p-4 text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
              <p className="text-sm text-gray-400">💰 Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(financialData.summary.totalRevenue)}</p>
              <p className="mt-1 text-xs text-gray-500">
                From {financialData.summary.paidInvoices} paid invoices
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
              <p className="text-sm text-gray-400">⏳ Part Payments Due</p>
              <p className="text-2xl font-bold text-yellow-400">{formatCurrency(financialData.summary.partPaymentsDue)}</p>
              <p className="mt-1 text-xs text-gray-500">
                From {financialData.summary.partiallyPaidInvoices} partial payments
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
              <p className="text-sm text-gray-400">📋 Pending Amount</p>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(financialData.summary.pendingAmount)}</p>
              <p className="mt-1 text-xs text-gray-500">
                From {financialData.summary.pendingInvoices} pending invoices
              </p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
              <p className="text-sm text-gray-400">🏦 Bank Transfers</p>
              <p className="text-2xl font-bold text-purple-400">{financialData.summary.bankTransferPending}</p>
              <p className="mt-1 text-xs text-gray-500">
                Pending verification
              </p>
            </div>
          </div>

          {financialData.monthlyData.length > 0 && (
            <div className="rounded-lg border border-gray-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Monthly Breakdown</h2>
              <div className="overflow-x-auto pb-4" style={{ maxWidth: "100%" }}>
                <div className="flex gap-2" style={{ minWidth: financialData.monthlyData.length * 80 }}>
                  {financialData.monthlyData.map((item, index) => {
                    const maxRevenue = Math.max(...financialData.monthlyData.map(d => d.revenue), 1);
                    const maxPartPayments = Math.max(...financialData.monthlyData.map(d => d.partPaymentsDue), 1);
                    const revenueHeight = (item.revenue / maxRevenue) * 100;
                    const partPaymentsHeight = (item.partPaymentsDue / maxPartPayments) * 100;
                    
                    return (
                      <div key={index} className="flex min-w-[70px] flex-1 flex-col items-center gap-2">
                        <div className="relative h-40 w-full overflow-hidden rounded-lg bg-slate-800">
                          {item.partPaymentsDue > 0 && (
                            <div 
                              className="absolute bottom-0 left-0 w-full bg-yellow-600/30 transition-all duration-300"
                              style={{ height: `${partPaymentsHeight}%` }}
                            >
                              <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-full transform whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition hover:opacity-100">
                                Due: {formatCurrency(item.partPaymentsDue)}
                              </div>
                            </div>
                          )}
                          
                          {item.revenue > 0 && (
                            <div 
                              className="absolute bottom-0 left-0 z-10 w-full bg-green-600 transition-all duration-300 hover:bg-green-500"
                              style={{ height: `${revenueHeight}%` }}
                            >
                              <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-full transform whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition hover:opacity-100">
                                Revenue: {formatCurrency(item.revenue)}
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-green-600"></div>
                  <span className="text-xs text-gray-400">Revenue Received</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-yellow-600/50"></div>
                  <span className="text-xs text-gray-400">Part Payments Due</span>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-gray-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Invoices</h2>
                <p className="mt-1 text-xs text-gray-500">All invoices in selected period</p>
              </div>
              <Link 
                href="/dashboards/super-admin-dashboard/invoices"
                className="flex items-center gap-1 text-sm text-primary transition hover:text-primary-dark"
              >
                View All Invoices
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Invoice #</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Customer</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Order #</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Type</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Total</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Paid</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Remaining</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Status</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.invoices.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-4 text-center text-sm text-gray-400">
                        No invoices in this period
                      </td>
                    </tr>
                  ) : (
                    financialData.invoices.slice(0, 10).map((invoice, index) => {
                      const customer = customerData[invoice._id] || { 
                        firstName: "", 
                        lastName: "", 
                        email: "",
                        fullName: "Customer" 
                      };
                      const orderNumber = getOrderNumber(invoice);
                      
                      return (
                        <tr key={index} className="border-t border-gray-800 hover:bg-slate-800/50">
                          <td className="p-3 font-mono text-sm text-white">
                            {invoice.invoiceNumber?.slice(-8) || "N/A"}
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-medium text-white">
                              {customer.fullName || customer.email?.split("@")[0] || "Customer"}
                            </span>
                            {customer.email && (
                              <p className="text-xs text-gray-500">{customer.email}</p>
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-300">{orderNumber}</td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-1 text-xs ${
                              invoice.invoiceType === "shipping" 
                                ? "bg-blue-900/50 text-blue-400" 
                                : "bg-purple-900/50 text-purple-400"
                            }`}>
                              {invoice.invoiceType || "main"}
                            </span>
                          </td>
                          <td className="p-3 text-sm font-medium text-white">{formatCurrency(invoice.totalAmount)}</td>
                          <td className="p-3 text-sm text-green-400">{formatCurrency(invoice.amountPaid || 0)}</td>
                          <td className="p-3 text-sm text-yellow-400">{formatCurrency(invoice.remainingAmount || 0)}</td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-1 text-xs bg-${getStatusColor(invoice.status)}-900/50 text-${getStatusColor(invoice.status)}-400`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-400">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {financialData.invoices.length > 10 && (
              <div className="border-t border-gray-800 p-3 text-center">
                <Link 
                  href="/dashboards/super-admin-dashboard/invoices"
                  className="inline-flex items-center gap-1 text-xs text-primary transition hover:text-primary-dark"
                >
                  Showing 10 of {financialData.invoices.length} invoices — click to view all
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Transactions</h2>
                <p className="mt-1 text-xs text-gray-500">Payment transactions in selected period</p>
              </div>
              <Link 
                href="/dashboards/super-admin-dashboard/transactions"
                className="flex items-center gap-1 text-sm text-primary transition hover:text-primary-dark"
              >
                View All Transactions
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Date</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Invoice #</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Customer</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Order #</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Amount</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Type</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Method</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-4 text-center text-sm text-gray-400">
                        No transactions in this period
                      </td>
                    </tr>
                  ) : (
                    financialData.transactions.slice(0, 15).map((transaction, index) => {
                      const invoice = financialData.invoices.find(inv => inv._id === transaction.invoiceId);
                      const customer = invoice ? (customerData[invoice._id] || { fullName: "Customer" }) : { fullName: "Customer" };
                      
                      return (
                        <tr key={index} className="border-t border-gray-800 hover:bg-slate-800/50">
                          <td className="p-3 text-sm text-gray-300">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 font-mono text-sm text-white">
                            {transaction.invoiceNumber?.slice(-8) || "N/A"}
                          </td>
                          <td className="p-3 text-sm text-gray-300">
                            {customer.fullName || transaction.customer}
                          </td>
                          <td className="p-3 text-sm text-gray-300">{transaction.orderNumber}</td>
                          <td className="p-3 text-sm font-medium text-white">
                            {formatCurrency(transaction.transactionAmount)}
                          </td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-1 text-xs ${
                              transaction.transactionType === "part" 
                                ? "bg-blue-900/50 text-blue-400" 
                                : "bg-green-900/50 text-green-400"
                            }`}>
                              {transaction.transactionType === "part" ? "Part" : "Full"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-1 text-xs ${
                              transaction.paymentMethod === "bank_transfer" 
                                ? "bg-purple-900/50 text-purple-400" 
                                : "bg-orange-900/50 text-orange-400"
                            }`}>
                              {transaction.paymentMethod === "bank_transfer" ? "Bank" : "Paystack"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-1 text-xs bg-${getTransactionStatusColor(transaction.transactionStatus)}-900/50 text-${getTransactionStatusColor(transaction.transactionStatus)}-400`}>
                              {transaction.transactionStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {financialData.transactions.length > 15 && (
              <div className="border-t border-gray-800 p-3 text-center">
                <Link 
                  href="/dashboards/super-admin-dashboard/transactions"
                  className="inline-flex items-center gap-1 text-xs text-primary transition hover:text-primary-dark"
                >
                  Showing 15 of {financialData.transactions.length} transactions — click to view all
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-800 bg-slate-900">
            <div className="border-b border-gray-800 p-4">
              <h2 className="text-lg font-semibold text-white">Top Products</h2>
            </div>
            <div className="space-y-4 p-4">
              {financialData.topProducts.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">No product data available</p>
              ) : (
                financialData.topProducts.map((product, index) => {
                  const maxRevenue = Math.max(...financialData.topProducts.map(p => p.revenue));
                  const percentage = (product.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{product.name}</span>
                        <span className="font-medium text-white">{formatCurrency(product.revenue)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div 
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">{product.quantity} sold</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link href="/dashboards/super-admin-dashboard/invoices">
              <div className="cursor-pointer rounded-lg border border-gray-800 bg-slate-900 p-4 transition hover:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900/30">
                    <span className="text-xl">📄</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">View All Invoices</h3>
                    <p className="text-xs text-gray-400">Manage and track invoices</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboards/super-admin-dashboard/transactions">
              <div className="cursor-pointer rounded-lg border border-gray-800 bg-slate-900 p-4 transition hover:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/30">
                    <span className="text-xl">💸</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">View All Transactions</h3>
                    <p className="text-xs text-gray-400">Complete payment history</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboards/super-admin-dashboard/payment-verification">
              <div className="cursor-pointer rounded-lg border border-gray-800 bg-slate-900 p-4 transition hover:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-900/30">
                    <span className="text-xl">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Verify Payments</h3>
                    <p className="text-xs text-gray-400">{financialData.summary.bankTransferPending} pending</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}