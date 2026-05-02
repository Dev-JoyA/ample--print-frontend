'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { invoiceService } from '@/services/invoiceService';
import { profileService } from '@/services/profileService';
import { METADATA, getInvoiceMetadata } from '@/lib/metadata';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CustomerInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id;
  const invoiceRef = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      console.log('Fetching invoice with ID:', invoiceId);

      const response = await invoiceService.getById(invoiceId);
      console.log('Invoice response:', JSON.stringify(response, null, 2));

      const invoiceData = response?.data || response?.invoice || response;

      if (!invoiceData || !invoiceData._id) {
        console.error('Invalid invoice data structure:', response);
        setError('Invoice data not found');
      } else {
        setInvoice(invoiceData);

        let userId = null;
        if (invoiceData.orderId?.userId) {
          if (typeof invoiceData.orderId.userId === 'object') {
            userId = invoiceData.orderId.userId._id || invoiceData.orderId.userId;
          } else {
            userId = invoiceData.orderId.userId;
          }
        } else if (invoiceData.userId) {
          if (typeof invoiceData.userId === 'object') {
            userId = invoiceData.userId._id || invoiceData.userId;
          } else {
            userId = invoiceData.userId;
          }
        }

        if (userId) {
          try {
            const profileResponse = await profileService.getUserById(userId.toString());
            const userData = profileResponse?.user || profileResponse?.data || profileResponse;

            if (userData) {
              const firstName = userData.firstName || '';
              const lastName = userData.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim();
              setCustomerName(fullName || userData.email?.split('@')[0] || 'Customer');
              setCustomerEmail(userData.email || '');
            } else {
              setCustomerName('Customer');
              setCustomerEmail('');
            }
          } catch (err) {
            console.error('Failed to fetch customer profile:', err);
            setCustomerName('Customer');
            setCustomerEmail('');
          }
        } else {
          setCustomerName('Customer');
          setCustomerEmail('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = () => {
    router.push(
      `/payment?invoiceId=${invoice._id}&amount=${invoice.remainingAmount || invoice.totalAmount}`
    );
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setProperties({
      title: `Invoice ${invoice?.invoiceNumber || ''}`,
      subject: 'Invoice',
      author: 'Ample Print Hub',
      keywords: 'invoice, payment',
      creator: 'Ample Print Hub',
    });

    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text('AMPLE PRINT HUB', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('5, Boyle Street, Somolu, Lagos', 20, 30);
    doc.text('Email: ampleprinthub@gmail.com', 20, 35);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice #${invoice?.invoiceNumber || ''}`, 150, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${formatDate(invoice?.createdAt)}`, 150, 30);
    doc.text(`Status: ${invoice?.status || ''}`, 150, 35);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Bill To:', 20, 55);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(customerName || 'Customer', 20, 65);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(customerEmail || '', 20, 72);

    const tableColumn = ['Description', 'Quantity', 'Unit Price', 'Total'];
    const tableRows =
      invoice?.items?.map((item) => {
        let description = item.description;
        let hasDesignFee = item.needsDesignAssistance && item.designFee > 0;

        return [
          hasDesignFee
            ? `${description} (includes ₦${item.designFee?.toLocaleString()} design fee)`
            : description,
          item.quantity.toString(),
          `₦${item.unitPrice?.toLocaleString() || '0'}`,
          `₦${item.total?.toLocaleString() || '0'}`,
        ];
      }) || [];

    autoTable(doc, {
      startY: 85,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [50, 50, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
    });

    const finalY = doc.lastAutoTable.finalY || 150;
    const summaryY = finalY + 15;

    doc.setFillColor(245, 245, 245);
    doc.rect(120, summaryY - 5, 70, 65, 'F');

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 125, summaryY);

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    let lineY = summaryY + 8;

    doc.text('Subtotal:', 125, lineY);
    doc.text(`₦${invoice?.subtotal?.toLocaleString() || '0'}`, 170, lineY, { align: 'right' });

    lineY += 8;

    if (invoice?.discount > 0) {
      doc.text('Discount:', 125, lineY);
      doc.setTextColor(0, 150, 0);
      doc.text(`-₦${invoice.discount?.toLocaleString() || '0'}`, 170, lineY, { align: 'right' });
      doc.setTextColor(50, 50, 50);
      lineY += 8;
    }

    if (invoice?.depositAmount > 0) {
      doc.text('Deposit Required:', 125, lineY);
      doc.setTextColor(200, 150, 0);
      doc.text(`₦${invoice.depositAmount?.toLocaleString() || '0'}`, 170, lineY, {
        align: 'right',
      });
      doc.setTextColor(50, 50, 50);
      lineY += 8;
    }

    doc.setDrawColor(0, 0, 0);
    doc.line(125, lineY - 2, 190, lineY - 2);

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 125, lineY + 3);
    doc.text(`₦${invoice?.totalAmount?.toLocaleString() || '0'}`, 170, lineY + 3, {
      align: 'right',
    });

    const paymentY = summaryY + 80;

    doc.setFillColor(240, 248, 255);
    doc.rect(20, paymentY - 5, 170, 35, 'F');

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 100, 200);
    doc.text('Payment Instructions', 25, paymentY);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 50, 100);
    const instructions =
      'Please login to your dashboard to make payment. You can make payment via bank transfer or Paystack.';
    const splitInstructions = doc.splitTextToSize(instructions, 160);
    doc.text(splitInstructions, 25, paymentY + 8);

    if (invoice?.notes) {
      const notesY = paymentY + 45;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Notes:', 20, notesY);

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(50, 50, 50);
      const splitNotes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(splitNotes, 20, notesY + 7);
    }

    const footerY = 270;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 105, footerY, { align: 'center' });
    doc.text('For any inquiries, please contact ampleprinthub@gmail.com', 105, footerY + 5, {
      align: 'center',
    });

    doc.save(`Invoice-${invoice?.invoiceNumber || 'draft'}.pdf`);
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloading(true);
      generatePDF();
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading invoice...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout userRole="customer">
        <div className="py-16 text-center">
          <p className="text-gray-400">Invoice not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-primary hover:text-primary-dark"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const pageMetadata = getInvoiceMetadata(invoice);

  return (
    <>
      <SEOHead {...pageMetadata} title={`Invoice ${invoice.invoiceNumber}`} />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={() => router.push('/invoices')}
              className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Invoices
            </button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white sm:text-4xl">Invoice Details</h1>
                <p className="mt-1 text-sm text-gray-400">{invoice.invoiceNumber}</p>
              </div>
              <div className="self-start sm:self-auto">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          <div
            ref={invoiceRef}
            className="space-y-6 rounded-xl border border-gray-800 bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-xl font-bold text-white sm:text-2xl">AMPLE PRINT HUB</h2>
                <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                  5, Boyle Street, Somolu, Lagos
                </p>
                <p className="text-xs text-gray-400 sm:text-sm">Email: ampleprinthub@gmail.com</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-gray-400 sm:text-sm">
                  Date: {formatDate(invoice.createdAt)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-800/30 p-4">
              <h3 className="mb-2 font-medium text-white">Bill To:</h3>
              <p className="font-medium text-white">{customerName || 'Customer'}</p>
              {customerEmail && <p className="text-xs text-gray-400 sm:text-sm">{customerEmail}</p>}
            </div>

            <div>
              <h3 className="mb-4 font-medium text-white">Items</h3>
              <div className="space-y-3">
                {invoice.items?.map((item, index) => (
                  <div key={index} className="rounded-lg bg-slate-800/30 p-3">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-medium text-white">{item.description}</p>
                        <p className="text-xs text-gray-400 sm:text-sm">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-bold text-primary sm:text-right">
                        {formatCurrency(item.total)}
                      </p>
                    </div>

                    {item.needsDesignAssistance && item.designFee > 0 && (
                      <div className="mt-2 border-l-2 border-yellow-500/30 pl-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Printing:</span>
                          <span className="text-gray-300">
                            {formatCurrency(item.printingCost || item.total - item.designFee)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-yellow-400">Design Fee:</span>
                          <span className="text-yellow-400">{formatCurrency(item.designFee)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-lg bg-slate-800/30 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Discount</span>
                  <span className="text-green-400">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice.depositAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Deposit Required</span>
                  <span className="text-yellow-400">{formatCurrency(invoice.depositAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-700 pt-2">
                <span className="font-medium text-white">Total Amount</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium text-white">Payment Instructions</h3>
              <p className="whitespace-pre-wrap text-sm text-gray-400">
                Please login to your dashboard to make payment. You can make payment via bank
                transfer or Paystack.
              </p>
            </div>

            {invoice.notes && (
              <div>
                <h3 className="mb-2 font-medium text-white">Notes</h3>
                <p className="text-sm text-gray-400">{invoice.notes}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-gray-800 pt-4 sm:flex-row">
              {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handlePayInvoice}
                  className="w-full sm:flex-1"
                >
                  Pay Now
                </Button>
              )}
              <Button
                variant="secondary"
                size="lg"
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="w-full sm:flex-1"
              >
                {downloading ? 'Generating PDF...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
