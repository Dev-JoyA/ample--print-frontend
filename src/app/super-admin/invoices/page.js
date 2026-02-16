'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import StatusBadge from '@/components/ui/StatusBadge';

export default function InvoiceCreationPage() {
  const [orders] = useState([
    { id: 1, orderNumber: 'ORD-7291', total: 4000.00, status: 'PAID' },
    { id: 2, orderNumber: 'ORD-8822', total: 19200.00, status: 'PENDING' },
  ]);

  const [selectedOrder, setSelectedOrder] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [deposit, setDeposit] = useState(0);

  const handleCreateInvoice = () => {
    console.log('Create invoice:', { selectedOrder, invoiceItems, discount, deposit });
    // In real app, this would create the invoice
  };

  const calculateTotal = () => {
    const itemsTotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return itemsTotal - discount;
  };

  const calculateRemaining = () => {
    return calculateTotal() - deposit;
  };

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create Invoice</h1>
          <p className="text-gray-400">Generate invoices for orders</p>
        </div>

        <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter space-y-6">
          {/* Order Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Order
            </label>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark border border-dark-lighter rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose an order...</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - ₦{order.total.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Invoice Items</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInvoiceItems([...invoiceItems, { description: '', quantity: 1, unitPrice: 0 }])}
              >
                Add Item
              </Button>
            </div>
            <div className="space-y-4">
              {invoiceItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4">
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...invoiceItems];
                        newItems[index].description = e.target.value;
                        setInvoiceItems(newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...invoiceItems];
                        newItems[index].quantity = parseInt(e.target.value) || 0;
                        setInvoiceItems(newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const newItems = [...invoiceItems];
                        newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                        setInvoiceItems(newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== index))}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div>
            <Input
              label="Discount (₦)"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Deposit */}
          <div>
            <Input
              label="Deposit Amount (₦)"
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Totals */}
          <div className="bg-dark rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Total Amount</span>
              <span>₦{calculateTotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Deposit</span>
              <span>₦{deposit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-dark-lighter">
              <span>Remaining Amount</span>
              <span>₦{calculateRemaining().toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedOrder('');
                setInvoiceItems([]);
                setDiscount(0);
                setDeposit(0);
              }}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateInvoice}
              disabled={!selectedOrder || invoiceItems.length === 0}
              className="flex-1"
            >
              Generate Invoice
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
