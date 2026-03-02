'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function DiscountManagementPage() {
  const [discounts] = useState([
    { id: 1, code: 'WELCOME10', percentage: 10, active: true },
    { id: 2, code: 'BULK20', percentage: 20, active: true },
  ]);

  const [newDiscount, setNewDiscount] = useState({
    code: '',
    percentage: 0,
    amount: 0,
    type: 'percentage',
  });

  const handleCreateDiscount = () => {
    console.log('Create discount:', newDiscount);
    // In real app, this would create the discount
  };

  const toggleDiscount = (discountId) => {
    console.log('Toggle discount:', discountId);
    // In real app, this would toggle the discount status
  };

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Discount Management</h1>
          <p className="text-gray-400">Create and manage discount codes</p>
        </div>

        {/* Create Discount */}
        <div className="bg-slate-950 rounded-lg p-6 border border-dark-lighter mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Create New Discount</h2>
          <div className="space-y-4">
            <Input
            className='[&_input]:bg-slate-800 '
              label="Discount Code"
              value={newDiscount.code}
              onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value })}
              placeholder="e.g., WELCOME10"
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount Type
              </label>
              <select
                value={newDiscount.type}
                onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-dark-lighter rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="percentage">Percentage</option>
                <option value="amount">Fixed Amount</option>
              </select>
            </div>
            {newDiscount.type === 'percentage' ? (
              <Input
              className='[&_input]:bg-slate-800 '
                label="Percentage (%)"
                type="number"
                value={newDiscount.percentage}
                onChange={(e) => setNewDiscount({ ...newDiscount, percentage: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 10"
              />
            ) : (
              <Input
              className='[&_input]:bg-slate-800 '
                label="Amount (₦)"
                type="number"
                value={newDiscount.amount}
                onChange={(e) => setNewDiscount({ ...newDiscount, amount: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 5000"
              />
            )}
            <Button
              variant="primary"
              onClick={handleCreateDiscount}
              disabled={!newDiscount.code || (newDiscount.type === 'percentage' && newDiscount.percentage <= 0) || (newDiscount.type === 'amount' && newDiscount.amount <= 0)}
              className="w-full"
            >
              Create Discount
            </Button>
          </div>
        </div>

        {/* Existing Discounts */}
        <div className="bg-slate-950 rounded-lg p-6 border border-dark-lighter">
          <h2 className="text-xl font-semibold text-white mb-4">Existing Discounts</h2>
          <div className="space-y-4">
            {discounts.map((discount) => (
              <div key={discount.id} className="flex items-center justify-between bg-dark rounded-lg p-4">
                <div>
                  <p className="text-white font-semibold">{discount.code}</p>
                  <p className="text-gray-400 text-sm">{discount.percentage}% off</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${discount.active ? 'text-green-400' : 'text-gray-400'}`}>
                    {discount.active ? 'Active' : 'Inactive'}
                  </span>
                  <Button
                    variant={discount.active ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => toggleDiscount(discount.id)}
                  >
                    {discount.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
