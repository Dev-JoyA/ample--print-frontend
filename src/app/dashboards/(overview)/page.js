'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';
import OrderCard from '@/components/cards/OrderCard';
import InvoiceCard from '@/components/cards/InvoiceCard';
import Button from '@/components/ui/Button';

export default function CustomerDashboard() {
  const [activeOrders] = useState([
    {
      id: 1,
      orderNumber: 'ORD-7291',
      productName: 'Premium A5 Marketing Flyers',
      orderedDate: '2025-12-12',
      totalAmount: 4000.00,
      status: 'DESIGNING',
    },
    {
      id: 2,
      orderNumber: 'ORD-8822',
      productName: 'Photo Books',
      orderedDate: '2025-12-12',
      totalAmount: 19200.00,
      status: 'APPROVED',
    },
  ]);

  const [unpaidInvoices] = useState([
    {
      id: 1,
      invoiceNumber: 'INV-1022',
      balance: 4000.00,
      status: 'SENT',
      dueSoon: true,
    },
    {
      id: 2,
      invoiceNumber: 'INV-1023',
      balance: 60000.00,
      status: 'SENT',
      dueSoon: true,
    },
  ]);

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto  mt-[40px] space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white mb-2">Welcome back, James</h1>
            <p className="text-gray-400 text-md">You have 2 designs awaiting your approval today.</p>
          </div>
          <Link href="/new-order">
            <Button variant="primary" size="md" icon="→" iconPosition="right">
              Start a New Print Order
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <SummaryCard
            title="Active Orders"
            value="04"
            icon="📦"
            color="blue"
          />
          <SummaryCard
            title="Pending Invoices"
            value="₦29,025"
            icon="📄"
            color="red"
          />
          <SummaryCard
            title="Needs Approval"
            value="02"
            icon="✓"
            color="yellow"
          />
          <SummaryCard
            title="Completed"
            value="148"
            icon="✅"
            color="green"
          />
        </div>

        {/* Active Orders & Unpaid Invoices */}
        <div className="grid md:grid-cols-[2fr_1fr] gap-2">
          {/* Active Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold mt-5 text-white">Active Orders</h2>
              <Link href="/order-history" className="text-primary hover:text-primary-light text-sm">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>

          {/* Unpaid Invoices */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold mt-3 text-white">Unpaid Invoices</h2>
              <Link href="/invoices" className="text-primary hover:text-primary-light text-sm">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {unpaidInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
