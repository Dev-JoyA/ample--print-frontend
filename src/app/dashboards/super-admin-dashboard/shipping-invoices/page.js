'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ShippingInvoicePage() {
  const [orders] = useState([
    { id: 1, orderNumber: 'ORD-7291', shippingAddress: '246 Houston Avenue, Lagos' },
    { id: 2, orderNumber: 'ORD-8822', shippingAddress: '123 Main Street, Abuja' },
  ]);

  const [selectedOrder, setSelectedOrder] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingAddress, setShippingAddress] = useState('');

  const handleCreateShippingInvoice = () => {
    console.log('Create shipping invoice:', { selectedOrder, shippingCost, shippingAddress });
    // In real app, this would create the shipping invoice
  };

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Shipping Invoice</h1>
          <p className="text-gray-400">Create shipping invoices for orders</p>
        </div>

        <div className="bg-slate-950 rounded-lg p-6 border border-dark-lighter space-y-6">
          {/* Order Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Order
            </label>
            <select
              value={selectedOrder}
              onChange={(e) => {
                setSelectedOrder(e.target.value);
                const order = orders.find(o => o.id.toString() === e.target.value);
                if (order) {
                  setShippingAddress(order.shippingAddress);
                }
              }}
              className="w-full px-4 py-2.5 bg-slate-800 border-dark-lighter rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose an order...</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.shippingAddress}
                </option>
              ))}
            </select>
          </div>

          {/* Shipping Address */}
          <div>
            <Input
                className='[&_input]:bg-slate-800 '
              label="Shipping Address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Enter shipping address"
            />
          </div>

          {/* Shipping Cost */}
          <div>
            <Input
            className='[&_input]:bg-slate-800 '
              label="Shipping Cost (₦)"
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              placeholder="Enter shipping cost"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
            className='flex-1 !border border-gray-700'
              variant="secondary"
              onClick={() => {
                setSelectedOrder('');
                setShippingCost(0);
                setShippingAddress('');
              }}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateShippingInvoice}
              disabled={!selectedOrder || !shippingAddress || shippingCost <= 0}
              className="flex-1"
            >
              Create Shipping Invoice
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
