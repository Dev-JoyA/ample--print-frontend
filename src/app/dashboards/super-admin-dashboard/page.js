'use client';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';

export default function SuperAdminDashboard() {
  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Super Admin Dashboard</h1>
          <p className="text-gray-400">Manage invoices, payments, and financial records</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <SummaryCard
            title="Total Revenue"
            value="₦2,450,000"
            icon="💰"
            color="green"
          />
          <SummaryCard
            title="Pending Invoices"
            value="12"
            icon="📄"
            color="yellow"
          />
          <SummaryCard
            title="Unverified Payments"
            value="05"
            icon="⏳"
            color="red"
          />
          <SummaryCard
            title="Total Orders"
            value="148"
            icon="📦"
            color="blue"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
