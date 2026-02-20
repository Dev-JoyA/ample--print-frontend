'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import OrderCard from '@/components/cards/OrderCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';

export default function AdminOrdersPage() {
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

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    console.log('Update order status:', orderId, newStatus);
    // In real app, this would update the order status
  };

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Orders</h1>
          <p className="text-gray-400">View and manage customer orders</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id}>
              <OrderCard order={order} onClick={() => handleViewOrder(order)} />
            </div>
          ))}
        </div>

        {/* Order Detail Modal/Sidebar */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-dark-lighter max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-white">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Order Number</p>
                  <p className="text-white font-semibold">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Product</p>
                  <p className="text-white font-semibold">{selectedOrder.productName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <StatusBadge status={selectedOrder.status} type="order" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Update Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {['PENDING', 'IN DESIGN', 'APPROVED', 'IN PRODUCTION', 'READY', 'DELIVERED'].map((status) => (
                      <Button
                        key={status}
                        variant={selectedOrder.status === status ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
