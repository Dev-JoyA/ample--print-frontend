"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import InvoiceCard from "@/components/cards/InvoiceCard";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import SEOHead from "@/components/common/SEOHead";
import { invoiceService } from "@/services/invoiceService";
import { useAuthCheck } from "@/app/lib/auth";
import { METADATA } from "@/lib/metadata";

export default function CustomerInvoicesPage() {
  useAuthCheck();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getMyInvoices({ limit: 50 });

      let invoicesData = [];
      if (response?.invoices && Array.isArray(response.invoices)) {
        invoicesData = response.invoices;
      } else if (response?.data?.invoices && Array.isArray(response.data.invoices)) {
        invoicesData = response.data.invoices;
      } else if (Array.isArray(response)) {
        invoicesData = response;
      }

      setInvoices(invoicesData);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = (invoice) => {
  console.log("Pay invoice clicked - full invoice object:", invoice);

  const invoiceId = invoice?.id || invoice?._id;
  const invoiceType = invoice?.invoiceType || 'main';

  console.log("Extracted invoiceId:", invoiceId);
  console.log("Invoice type:", invoiceType);

  if (!invoiceId) {
    console.error("No invoice ID found in:", invoice);
    alert("Invalid invoice data - missing ID");
    return;
  }

  let amount;
  let paymentType = 'full';
  
  // For shipping invoices
  if (invoiceType === 'shipping') {
    amount = invoice.totalAmount;
    paymentType = 'shipping'; 
  }
  // For partially paid invoices
  else if (invoice.status === 'PartiallyPaid' || (invoice.amountPaid > 0 && invoice.remainingAmount > 0)) {
    amount = invoice.remainingAmount;
    paymentType = 'final';
  }
  // For invoices with deposit (part payment plan) and not paid yet
  else if (invoice.depositAmount > 0 && invoice.amountPaid === 0) {
    amount = invoice.depositAmount;
    paymentType = 'part';
  }
  // Regular full payment
  else {
    amount = invoice.remainingAmount || invoice.balance || invoice.totalAmount;
    paymentType = 'full';
  }

  router.push(`/payment?invoiceId=${invoiceId}&amount=${amount || 0}&paymentType=${paymentType}&invoiceType=${invoiceType}`);
};

//   const handlePayInvoice = (invoice) => {
//     console.log("Pay invoice clicked - full invoice object:", invoice);

//     const invoiceId = invoice?.id || invoice?._id;

//     console.log("Extracted invoiceId:", invoiceId);

//     if (!invoiceId) {
//       console.error("No invoice ID found in:", invoice);
//       alert("Invalid invoice data - missing ID");
//       return;
//     }

//     const amount = invoice.remainingAmount || invoice.balance || invoice.totalAmount;

//     router.push(`/payment?invoiceId=${invoiceId}&amount=${amount || 0}`);
//   };

  const handleDownloadInvoice = async (invoice) => {
    try {
      const invoiceId = invoice?.id || invoice?._id;

      if (!invoiceId) {
        console.error("No invoice ID found for download:", invoice);
        alert("Invalid invoice data");
        return;
      }

      const response = await invoiceService.downloadInvoice(invoiceId);

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoice.invoiceNumber || "download"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download invoice:", err);
      alert("Failed to download invoice");
    }
  };

  const getCustomerStatus = (invoice) => {
    const statusMap = {
      Draft: "Processing",
      Sent: "Received",
      Pending: "Pending",
      PartiallyPaid: "Partially Paid",
      Paid: "Paid",
      Overdue: "Overdue",
      Cancelled: "Cancelled"
    };

    const typePrefix = invoice.invoiceType === "shipping" ? "Shipping " : "";

    return {
      displayStatus: typePrefix + (statusMap[invoice.status] || invoice.status),
      originalStatus: invoice.status,
      type: invoice.invoiceType
    };
  };

  const getStatusBadgeColor = (invoice) => {
    const colors = {
      Draft: "gray",
      Sent: "blue",
      Pending: "yellow",
      PartiallyPaid: "orange",
      Paid: "green",
      Overdue: "red",
      Cancelled: "gray"
    };

    if (invoice.invoiceType === "shipping") {
      if (invoice.status === "Draft" || invoice.status === "Sent") {
        return "teal";
      }
    }

    return colors[invoice.status] || "gray";
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (filter === "all") return true;
    if (filter === "paid") return invoice.status === "Paid";
    if (filter === "pending") {
      return (
        (invoice.amountPaid === 0 || invoice.amountPaid === undefined) &&
        invoice.status !== "Paid" &&
        invoice.status !== "PartiallyPaid" &&
        invoice.status !== "Cancelled"
      );
    }
    if (filter === "partially-paid") {
      return (
        invoice.status === "PartiallyPaid" ||
        (invoice.amountPaid > 0 && invoice.remainingAmount > 0)
      );
    }
    if (filter === "shipping") {
      return invoice.invoiceType === "shipping";
    }
    return true;
  });

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || "0"}`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading invoices...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.invoices} />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">My Invoices</h1>
              <p className="mt-1 text-sm text-gray-400 sm:text-base">View and manage your invoices</p>
            </div>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter("all")}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                filter === "all"
                  ? "bg-primary text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700"
              }`}
            >
              All Invoices
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                filter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("partially-paid")}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                filter === "partially-paid"
                  ? "bg-orange-600 text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700"
              }`}
            >
              Partially Paid
            </button>
            <button
              onClick={() => setFilter("paid")}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                filter === "paid"
                  ? "bg-green-600 text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilter("shipping")}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                filter === "shipping"
                  ? "bg-teal-600 text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700"
              }`}
            >
              Shipping Invoices
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {filteredInvoices.length > 0 && (
            <div className="mb-4 text-sm text-gray-400">
              Showing {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
            </div>
          )}

          {filteredInvoices.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/30 py-16 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="mb-2 text-xl font-semibold text-white">No invoices found</h3>
              <p className="text-gray-400">
                {filter === "all"
                  ? "You don't have any invoices yet"
                  : filter === "pending"
                  ? "No pending invoices"
                  : filter === "partially-paid"
                  ? "No partially paid invoices"
                  : filter === "shipping"
                  ? "No shipping invoices"
                  : `No ${filter} invoices found`}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredInvoices.map((invoice) => {
                const customerStatus = getCustomerStatus(invoice);

                return (
                  <div key={invoice._id} className="relative">
                    <InvoiceCard
                      invoice={{
                        id: invoice._id,
                        _id: invoice._id,
                        invoiceNumber: invoice.invoiceNumber,
                        orderNumber: invoice.orderNumber,
                        totalAmount: invoice.totalAmount,
                        amountPaid: invoice.amountPaid || 0,
                        remainingAmount: invoice.remainingAmount,
                        depositAmount: invoice.depositAmount,
                        status: customerStatus.displayStatus,
                        originalStatus: invoice.status,
                        invoiceType: invoice.invoiceType,
                        dueDate: invoice.dueDate,
                        createdAt: invoice.createdAt,
                        items: invoice.items
                      }}
                      onPay={handlePayInvoice}
                      onDownload={handleDownloadInvoice}
                      formatCurrency={formatCurrency}
                      getStatusColor={() => getStatusBadgeColor(invoice)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 rounded-lg border border-gray-800 bg-slate-900/30 p-4">
            <p className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <span className="font-medium text-white">Invoice Types:</span> Regular invoices are for your order items.
                Shipping invoices (marked with a badge) are for delivery costs.
              </span>
            </p>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}