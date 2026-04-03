"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SEOHead from "@/components/common/SEOHead";
import { discountService } from "@/services/discountService";
import { METADATA } from "@/lib/metadata";

export default function DiscountManagementPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newDiscount, setNewDiscount] = useState({
    code: "",
    value: 0,
    type: "percentage",
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
      console.error("Failed to fetch discounts:", err);
      setError("Failed to load discounts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async () => {
    try {
      await discountService.create(newDiscount);
      setNewDiscount({
        code: "",
        value: 0,
        type: "percentage",
        active: true
      });
      fetchDiscounts();
    } catch (err) {
      console.error("Failed to create discount:", err);
      alert("Failed to create discount");
    }
  };

  const toggleDiscount = async (discountId) => {
    try {
      await discountService.toggleActive(discountId);
      fetchDiscounts();
    } catch (err) {
      console.error("Failed to toggle discount:", err);
      alert("Failed to update discount");
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading discounts...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title="Discount Management" />
      <DashboardLayout userRole="super-admin">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Discount Management</h1>
            <p className="text-sm text-gray-400 sm:text-base">Create and manage discount codes</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mb-6 rounded-lg border border-dark-lighter bg-slate-950 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Create New Discount</h2>
            <div className="space-y-4">
              <Input
                className="[&_input]:bg-slate-800"
                label="Discount Code"
                value={newDiscount.code}
                onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                placeholder="e.g., WELCOME10"
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Discount Type
                </label>
                <select
                  value={newDiscount.type}
                  onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value })}
                  className="w-full rounded-lg border border-dark-lighter bg-slate-800 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₦)</option>
                </select>
              </div>
              {newDiscount.type === "percentage" ? (
                <Input
                  className="[&_input]:bg-slate-800"
                  label="Percentage (%)"
                  type="number"
                  value={newDiscount.value}
                  onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 10"
                />
              ) : (
                <Input
                  className="[&_input]:bg-slate-800"
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

          <div className="rounded-lg border border-dark-lighter bg-slate-950 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Existing Discounts</h2>
            {discounts.length === 0 ? (
              <p className="py-8 text-center text-gray-400">No discounts created yet</p>
            ) : (
              <div className="space-y-4">
                {discounts.map((discount) => (
                  <div key={discount._id} className="flex flex-col gap-4 rounded-lg bg-dark p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{discount.code}</p>
                      <p className="text-sm text-gray-400">
                        {discount.type === "percentage" 
                          ? `${discount.value}% off` 
                          : `₦${discount.value.toLocaleString()} off`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className={`text-sm ${discount.active ? "text-green-400" : "text-gray-400"}`}>
                        {discount.active ? "Active" : "Inactive"}
                      </span>
                      <Button
                        variant={discount.active ? "danger" : "primary"}
                        size="sm"
                        onClick={() => toggleDiscount(discount._id)}
                      >
                        {discount.active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}