'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import OrderCard from '@/components/cards/OrderCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function OrderHistoryPage() {
  const [orders] = useState([
    {
      id: 1,
      orderNumber: 'ORD-7291',
      productName: 'Premium A5 Marketing Flyers',
      orderedDate: '2025-12-12',
      totalAmount: 4000.00,
      status: 'DELIVERED',
    },
    {
      id: 2,
      orderNumber: 'ORD-8822',
      productName: 'Photo Books',
      orderedDate: '2025-12-12',
      totalAmount: 19200.00,
      status: 'DELIVERED',
    },
    {
      id: 3,
      orderNumber: 'ORD-8823',
      productName: 'Business Cards',
      orderedDate: '2025-12-10',
      totalAmount: 8000.00,
      status: 'READY',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Order History</h1>
            <p className="text-gray-400">View all your past and current orders</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search orders by order number or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No orders found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
