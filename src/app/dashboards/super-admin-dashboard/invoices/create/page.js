'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatusBadge from '@/components/ui/StatusBadge';
import { invoiceService } from '@/services/invoiceService';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  // Invoice form state
  const [paymentType, setPaymentType] = useState('full');
  const [depositAmount, setDepositAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState(
    'Bank transfer to:\nAccount Name: Ample Print Hub\nAccount Number: 0123456789\nBank: GTBank'
  );

  // Calculations
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (!orderId) {
      router.push('/dashboards/super-admin-dashboard/invoices/ready');
      return;
    }

    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (order) {
      calculateTotals();
    }
  }, [order, discount, discountType, paymentType, depositAmount]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch order
      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      
      // Fetch briefs for each item
      const itemsWithBriefs = await Promise.all(
        orderData.items.map(async (item) => {
          const productId = item.productId._id || item.productId;
          try {
            const briefResponse = await customerBriefService.getByOrderAndProduct(orderId, productId);
            return {
              ...item,
              briefs: briefResponse?.data
            };
          } catch (err) {
            return {
              ...item,
              briefs: null
            };
          }
        })
      );
      
      setOrder(orderData);
      setItems(itemsWithBriefs);
      
      // Set default due date to 7 days from now
      const date = new Date();
      date.setDate(date.getDate() + 7);
      setDueDate(date.toISOString().split('T')[0]);
      
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    // Calculate subtotal
    const sub = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(sub);

    // Calculate discount
    let discAmount = 0;
    if (discountType === 'percentage') {
      discAmount = (sub * discount) / 100;
    } else {
      discAmount = discount;
    }
    setDiscountAmount(discAmount);

    // Calculate total
    let total = sub - discAmount;
    setTotalAmount(total);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      const invoiceData = {
        paymentType,
        dueDate: new Date(dueDate),
        notes,
        paymentInstructions,
        discount: discountAmount,
        ...(paymentType === 'part' && { depositAmount })
      };

      const response = await invoiceService.createForOrder(orderId, invoiceData);
      
      // Redirect to invoice view
      router.push(`/dashboards/super-admin-dashboard/invoices/${response.data._id}`);
      
    } catch (err) {
      console.error('Failed to create invoice:', err);
      setError(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const getCustomerName = (order) => {
    if (order?.userId?.fullname) return order.userId.fullname;
    if (order?.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading order details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="text-center py-16">
          <p className="text-gray-400">Order not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="super-admin">
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
          
          <h1 className="text-4xl font-bold text-white mb-2">Create Invoice</h1>
          <p className="text-gray-400">
            Order #{order.orderNumber} • {getCustomerName(order)}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Main Form */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 space-y-6">
          {/* Products Summary */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Order Items</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-400">
                      {item.quantity} × ₦{item.price.toLocaleString()}
                    </p>
                    {item.briefs?.customer && (
                      <span className="text-xs text-green-400">✓ Has brief</span>
                    )}
                  </div>
                  <p className="text-primary font-bold">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Payment Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={paymentType === 'full'}
                  onChange={() => setPaymentType('full')}
                  className="w-4 h-4 text-primary bg-slate-800 border-gray-700"
                />
                <span className="text-white">Full Payment</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={paymentType === 'part'}
                  onChange={() => setPaymentType('part')}
                  className="w-4 h-4 text-primary bg-slate-800 border-gray-700"
                />
                <span className="text-white">Part Payment</span>
              </label>
            </div>
          </div>

          {/* Deposit Amount (for part payment) */}
          {paymentType === 'part' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Deposit Amount (₦)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                min="0"
                max={totalAmount}
                className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum deposit amount
              </p>
            </div>
          )}

          {/* Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₦)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {discountType === 'percentage' ? 'Discount %' : 'Discount Amount (₦)'}
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                max={discountType === 'percentage' ? 100 : subtotal}
                className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          {/* Payment Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Payment Instructions
            </label>
            <textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              rows={4}
              className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              placeholder="Any additional information for the customer..."
            />
          </div>

          {/* Summary */}
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Discount</span>
              <span className="text-green-400">-{formatCurrency(discountAmount)}</span>
            </div>
            {paymentType === 'part' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Deposit Required</span>
                <span className="text-yellow-400">{formatCurrency(depositAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-white font-medium">Total Amount</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || !dueDate}
              className="flex-1"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}