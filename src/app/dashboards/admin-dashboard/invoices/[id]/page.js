'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { invoiceService } from '@/services/invoiceService';
import { profileService } from '@/services/profileService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id;
  const invoiceRef = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
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
        
        // Extract userId properly
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
        
        console.log('Extracted userId:', userId);
        
        if (userId) {
          try {
            const userIdStr = userId.toString ? userId.toString() : userId;
            console.log('Fetching profile for user ID:', userIdStr);
            
            const profileResponse = await profileService.getUserById(userIdStr);
            console.log('Profile response:', profileResponse);
            
            const userData = profileResponse?.user || profileResponse?.data || profileResponse;
            
            if (userData) {
              const firstName = userData.firstName || '';
              const lastName = userData.lastName || '';
              setCustomerFirstName(firstName);
              setCustomerLastName(lastName);
              
              const fullName = `${firstName} ${lastName}`.trim();
              setCustomerName(fullName || userData.email?.split('@')[0] || 'Customer');
              setCustomerEmail(userData.email || '');
            }
          } catch (profileErr) {
            console.error('Failed to fetch customer profile:', profileErr);
            const fallbackEmail = invoiceData.orderId?.userId?.email || 
                                 invoiceData.userId?.email || 
                                 invoiceData.customerEmail || 
                                 '';
            setCustomerName(fallbackEmail.split('@')[0] || 'Customer');
            setCustomerEmail(fallbackEmail);
          }
        } else {
          const fallbackEmail = invoiceData.orderId?.userId?.email || 
                               invoiceData.userId?.email || 
                               invoiceData.customerEmail || 
                               '';
          setCustomerName(fallbackEmail.split('@')[0] || 'Customer');
          setCustomerEmail(fallbackEmail);
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    try {
      setSending(true);
      await invoiceService.send(invoiceId);
      await fetchInvoice();
    } catch (err) {
      console.error('Failed to send invoice:', err);
      alert('Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setProperties({
      title: `Invoice ${invoice?.invoiceNumber || ''}`,
      subject: 'Invoice',
      author: 'Ample Print Hub',
      keywords: 'invoice, payment',
      creator: 'Ample Print Hub'
    });

    // Header
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text('AMPLE PRINT HUB', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('5, Boyle Street, Somolu, Lagos', 20, 30);
    doc.text('Email: ampleprinthub@gmail.com', 20, 35);

    // Invoice details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice #${invoice?.invoiceNumber || ''}`, 150, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${formatDate(invoice?.createdAt)}`, 150, 30);
    doc.text(`Status: ${invoice?.status || ''}`, 150, 35);
    doc.text(`Type: ${invoice?.invoiceType || 'main'}`, 150, 40);

    // Customer details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Bill To:', 20, 55);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    
    const fullName = customerName !== 'Customer' ? customerName : 
                    `${customerFirstName} ${customerLastName}`.trim() || 'Customer';
    doc.text(fullName, 20, 65);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(customerEmail, 20, 72);

    // Items table
    const tableColumn = ['Description', 'Quantity', 'Unit Price', 'Total'];
    const tableRows = invoice?.items?.map(item => [
      item.description,
      item.quantity.toString(),
      `₦${item.unitPrice?.toLocaleString() || '0'}`,
      `₦${item.total?.toLocaleString() || '0'}`
    ]) || [];

    autoTable(doc, {
      startY: 85,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [50, 50, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY || 150;
    const summaryY = finalY + 15;
    
    // Summary box
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
      doc.text('Deposit:', 125, lineY);
      doc.setTextColor(200, 150, 0);
      doc.text(`₦${invoice.depositAmount?.toLocaleString() || '0'}`, 170, lineY, { align: 'right' });
      doc.setTextColor(50, 50, 50);
      lineY += 8;
    }
    
    doc.setDrawColor(0, 0, 0);
    doc.line(125, lineY - 2, 190, lineY - 2);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 125, lineY + 3);
    doc.text(`₦${invoice?.totalAmount?.toLocaleString() || '0'}`, 170, lineY + 3, { align: 'right' });

    // Payment Instructions
    const paymentY = summaryY + 75;
    
    doc.setFillColor(240, 248, 255);
    doc.rect(20, paymentY - 5, 170, 35, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 100, 200);
    doc.text('Payment Instructions', 25, paymentY);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 50, 100);
    const instructions = 'Please login to your dashboard to make payment. You can make payment via bank transfer or Paystack.';
    const splitInstructions = doc.splitTextToSize(instructions, 160);
    doc.text(splitInstructions, 25, paymentY + 8);

    // Notes
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

    // Footer
    const footerY = 270;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 105, footerY, { align: 'center' });
    doc.text('Invoice is subject to change', 105, footerY + 5, { align: 'center' }); // Added this line
    doc.text('For inquiries, contact ampleprinthub@gmail.com', 105, footerY + 10, { align: 'center' });

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
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading invoice...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout userRole="admin">
        <div className="text-center py-16">
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

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Invoice Details</h1>
              <p className="text-gray-400">{invoice.invoiceNumber}</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 space-y-6">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">AMPLE PRINT HUB</h2>
              <p className="text-gray-400 text-sm mt-1">5, Boyle Street, Somolu, Lagos</p>
              <p className="text-gray-400 text-sm">Email: ampleprinthub@gmail.com</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Date: {formatDate(invoice.createdAt)}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Bill To:</h3>
            <p className="text-white font-medium">
              {customerName !== 'Customer' ? customerName : 
               `${customerFirstName} ${customerLastName}`.trim() || 'Customer'}
            </p>
            <p className="text-gray-400 text-sm">{customerEmail}</p>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-white font-medium mb-4">Items</h3>
            <div className="space-y-3">
              {invoice.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.description}</p>
                    <p className="text-sm text-gray-400">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-primary font-bold">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
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
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-white font-medium">Total Amount</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>

          {/* Invoice Type Notice */}
          {invoice.invoiceType === 'shipping' && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-400">
                ⚠️ This is a shipping invoice. Payment is required for delivery.
              </p>
            </div>
          )}

          {/* Payment Instructions */}
          <div>
            <h3 className="text-white font-medium mb-2">Payment Instructions</h3>
            <p className="text-gray-400 text-sm whitespace-pre-wrap">
              Please login to your dashboard to make payment. You can make payment via bank transfer or Paystack.
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-400 font-medium">
              ⚠️ IMPORTANT: Invoice is subject to change
            </p>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="text-white font-medium mb-2">Notes</h3>
              <p className="text-gray-400 text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            {invoice.status === 'Draft' && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleSendInvoice}
                disabled={sending}
                className="flex-1"
              >
                {sending ? 'Sending...' : 'Send to Customer'}
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="flex-1"
            >
              {downloading ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}