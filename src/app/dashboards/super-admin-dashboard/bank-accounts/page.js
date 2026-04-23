'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { api } from '@/lib/api';

export default function BankAccountsPage() {
  useAuthCheck();
  const router = useRouter();

  const [bankAccounts, setBankAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    isActive: false,
  });

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bank-accounts');
      console.log('Bank accounts response:', response);

      let accounts = [];
      if (response?.bankAccounts && Array.isArray(response.bankAccounts)) {
        accounts = response.bankAccounts;
      } else if (Array.isArray(response)) {
        accounts = response;
      }

      setBankAccounts(accounts);

      const active = accounts.find((acc) => acc.isActive);
      setActiveAccount(active);
    } catch (err) {
      console.error('Failed to fetch bank accounts:', err);
      setError('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/bank-accounts', formData);
      console.log('Create response:', response);

      setSuccess('Bank account created successfully');
      setFormData({
        accountName: '',
        accountNumber: '',
        bankName: '',
        isActive: false,
      });
      setShowForm(false);
      fetchBankAccounts();
    } catch (err) {
      console.error('Failed to create bank account:', err);
      setError(err?.data?.message || 'Failed to create bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetActive = async (id) => {
    try {
      setSubmitting(true);
      await api.patch(`/bank-accounts/${id}/active`);
      setSuccess('Bank account set as active');
      fetchBankAccounts();
    } catch (err) {
      console.error('Failed to set active:', err);
      setError('Failed to set bank account as active');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;

    try {
      setSubmitting(true);
      await api.delete(`/bank-accounts/${id}`);
      setSuccess('Bank account deleted successfully');
      fetchBankAccounts();
    } catch (err) {
      console.error('Failed to delete:', err);
      setError('Failed to delete bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  if (loading) {
    return (
      <>
        <SEOHead
          title="Bank Accounts"
          description="Manage bank accounts"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="super-admin">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Bank Accounts" description="Manage bank accounts for payments" />
      <DashboardLayout userRole="super-admin">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Bank Accounts</h1>
              <p className="mt-1 text-sm text-gray-400">
                Manage bank accounts for payment collections
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowForm(!showForm)} icon="+">
              {showForm ? 'Cancel' : 'Add Bank Account'}
            </Button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-700 bg-green-900/50 p-3 text-sm text-green-200">
              {success}
            </div>
          )}

          {showForm && (
            <div className="mb-6 rounded-xl border border-gray-800 bg-slate-900/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Add New Bank Account</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Account Name"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  placeholder="e.g., Ample Print Hub Limited"
                  required
                />
                <Input
                  label="Account Number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 0123456789"
                  required
                />
                <Input
                  label="Bank Name"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="e.g., GTBank"
                  required
                />
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-700 bg-slate-800"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-300">
                    Set as active account
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Account'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {bankAccounts.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-12 text-center">
              <div className="mb-4 text-5xl">🏦</div>
              <h3 className="mb-2 text-lg font-semibold text-white">No Bank Accounts</h3>
              <p className="text-sm text-gray-400">
                Add a bank account to start collecting payments
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div
                  key={account._id}
                  className={`rounded-xl border p-5 transition-all ${
                    account.isActive
                      ? 'border-green-500 bg-green-900/10'
                      : 'border-gray-800 bg-slate-900/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{account.bankName}</h3>
                        {account.isActive && (
                          <span className="rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-white">{account.accountName}</p>
                      <p className="text-sm text-gray-400">
                        Account Number: {account.accountNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!account.isActive && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSetActive(account._id)}
                          disabled={submitting}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(account._id)}
                        disabled={submitting}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeAccount && (
            <div className="mt-6 rounded-xl border border-blue-800 bg-blue-900/20 p-5">
              <div className="flex items-center gap-3">
                <div className="text-2xl">ℹ️</div>
                <div>
                  <p className="text-sm text-blue-300">Active Account for Customer Payments</p>
                  <p className="text-sm text-white">
                    {activeAccount.bankName} - {activeAccount.accountName} (
                    {activeAccount.accountNumber})
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
