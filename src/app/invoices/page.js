'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import InvoiceCard from '@/components/cards/InvoiceCard';
import Button from '@/components/ui/Button';

export default function InvoicesPage() {
  const [invoices] = useState([
    {
      id: 1,
      invoiceNumber: 'INV-1022',
      balance: 4000.00,
      status: 'SENT',
      dueDate: '2025-12-20',
      dueSoon: true,
    },
    {
      id: 2,
      invoiceNumber: 'INV-1023',
      balance: 60000.00,
      status: 'SENT',
      dueDate: '2025-12-22',
      dueSoon: true,
    },
  ]);

  const handlePayInvoice = (invoice) => {
    console.log('Pay invoice:', invoice);
    // Navigate to payment page with invoice ID
  };

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Invoices</h1>
            <p className="text-gray-400">View and manage your invoices</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onPay={handlePayInvoice}
            />
          ))}
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No invoices found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
