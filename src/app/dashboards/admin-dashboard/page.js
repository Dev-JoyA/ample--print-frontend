'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';
import OrderCard from '@/components/cards/OrderCard';
import Button from '@/components/ui/Button';

export default function AdminDashboard() {
  const [orders] = useState([
    {
      id: 1,
      orderNumber: 'ORD-7291',
      productName: 'Premium A5 Marketing Flyers',
      orderedDate: '2025-12-12',
      totalAmount: 4000.00,
      status: 'IN DESIGN',
    },
    {
      id: 2,
      orderNumber: 'ORD-8822',
      productName: 'Photo Books',
      orderedDate: '2025-12-12',
      totalAmount: 19200.00,
      status: 'PENDING',
    },
  ]);

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage orders, customer briefs, and design uploads</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <SummaryCard
            title="Total Orders"
            value="24"
            icon="📦"
            color="blue"
          />
          <SummaryCard
            title="Pending Briefs"
            value="08"
            icon="📝"
            color="yellow"
          />
          <SummaryCard
            title="Designs Uploaded"
            value="16"
            icon="🎨"
            color="green"
          />
          <SummaryCard
            title="Completed Orders"
            value="148"
            icon="✅"
            color="green"
          />
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white">Recent Orders</h2>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">
                View All →
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
