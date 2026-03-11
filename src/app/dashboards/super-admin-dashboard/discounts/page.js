'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { discountService } from '@/services/discountService';

export default function DiscountManagementPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newDiscount, setNewDiscount] = useState({
    code: '',
    value: 0,
    type: 'percentage',
    active: true
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await discountService.getAll();
      setDiscounts(response?.discounts || []);
    } catch (err) {
      console.error('Failed to fetch discounts:', err);
      setError('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async () => {
    try {
      await discountService.create(newDiscount);
      // Reset form
      setNewDiscount({
        code: '',
        value: 0,
        type: 'percentage',
        active: true
      });
      // Refresh list
      fetchDiscounts();
    } catch (err) {
      console.error('Failed to create discount:', err);
      alert('Failed to create discount');
    }
  };

  const toggleDiscount = async (discountId) => {
    try {
      await discountService.toggleActive(discountId);
      fetchDiscounts();
    } catch (err) {
      console.error('Failed to toggle discount:', err);
      alert('Failed to update discount');
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading discounts...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Discount Management</h1>
          <p className="text-gray-400">Create and manage discount codes</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Create Discount */}
        <div className="bg-slate-950 rounded-lg p-6 border border-dark-lighter mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Create New Discount</h2>
          <div className="space-y-4">
            <Input
              className='[&_input]:bg-slate-800'
              label="Discount Code"
              value={newDiscount.code}
              onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
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
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₦)</option>
              </select>
            </div>
            {newDiscount.type === 'percentage' ? (
              <Input
                className='[&_input]:bg-slate-800'
                label="Percentage (%)"
                type="number"
                value={newDiscount.value}
                onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 10"
              />
            ) : (
              <Input
                className='[&_input]:bg-slate-800'
                label="Amount (₦)"
                type="number"
                value={newDiscount.value}
                onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 5000"
              />
            )}
            <Button
              variant="primary"
              onClick={handleCreateDiscount}
              disabled={!newDiscount.code || newDiscount.value <= 0}
              className="w-full"
            >
              Create Discount
            </Button>
          </div>
        </div>

        {/* Existing Discounts */}
        <div className="bg-slate-950 rounded-lg p-6 border border-dark-lighter">
          <h2 className="text-xl font-semibold text-white mb-4">Existing Discounts</h2>
          {discounts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No discounts created yet</p>
          ) : (
            <div className="space-y-4">
              {discounts.map((discount) => (
                <div key={discount._id} className="flex items-center justify-between bg-dark rounded-lg p-4">
                  <div>
                    <p className="text-white font-semibold">{discount.code}</p>
                    <p className="text-gray-400 text-sm">
                      {discount.type === 'percentage' 
                        ? `${discount.value}% off` 
                        : `₦${discount.value.toLocaleString()} off`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${discount.active ? 'text-green-400' : 'text-gray-400'}`}>
                      {discount.active ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      variant={discount.active ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => toggleDiscount(discount._id)}
                    >
                      {discount.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}