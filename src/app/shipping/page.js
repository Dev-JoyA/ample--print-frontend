'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ShippingPage() {
  const router = useRouter();
  const [shippingOption, setShippingOption] = useState('pickup');
  const [shippingData, setShippingData] = useState({
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const handleSubmit = () => {
    // In real app, this would save shipping information
    console.log('Shipping option:', shippingOption, shippingData);
    router.push('/orders/tracking');
  };

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-4xl mx-auto">
        <div className='flex items-center gap-3 mb-6'>
            <img src="/images/logo/shipping.png" alt="shipping logo" className="w-10 h-10 object-contain" />
            <h1 className="text-4xl font-semibold text-white">Logistics</h1>
        </div>
        <div className="space-y-6">
          {/* Shipping Options */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Select Shipping Option</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pickup Option */}
              <div
                onClick={() => setShippingOption('pickup')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  shippingOption === 'pickup'
                    ? 'border-primary bg-primary/10'
                    : 'border-dark-lighter hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div className="mb-2">
                    <h3 className="text-white font-semibold">Pickup</h3>
                    <p className="text-gray-400 text-sm">Collect from our office</p>
                  </div>
                  <input
                    type="radio"
                    checked={shippingOption === 'pickup'}
                    onChange={() => setShippingOption('pickup')}
                    className="w-5 h-5 text-primary"
                  />
                  {shippingOption === 'pickup' && (
                    <p className="mt-2 text-sm text-gray-400">No shipping cost</p>
                  )}
                </div>
              </div>

              {/* Delivery to Own Address */}
              <div
                onClick={() => setShippingOption('own')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  shippingOption === 'own'
                    ? 'border-primary bg-primary/10'
                    : 'border-dark-lighter hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-2xl">🏠</span>
                  </div>
                  <div className="mb-2">
                    <h3 className="text-white font-semibold">Own Address</h3>
                    <p className="text-gray-400 text-sm">Use saved address</p>
                  </div>
                  <input
                    type="radio"
                    checked={shippingOption === 'own'}
                    onChange={() => setShippingOption('own')}
                    className="w-5 h-5 text-primary"
                  />
                </div>
              </div>

              {/* Delivery to Another Address */}
              <div
                onClick={() => setShippingOption('other')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  shippingOption === 'other'
                    ? 'border-primary bg-primary/10'
                    : 'border-dark-lighter hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-2xl">📍</span>
                  </div>
                  <div className="mb-2">
                    <h3 className="text-white font-semibold">New Address</h3>
                    <p className="text-gray-400 text-sm">Enter new delivery address</p>
                  </div>
                  <input
                    type="radio"
                    checked={shippingOption === 'other'}
                    onChange={() => setShippingOption('other')}
                    className="w-5 h-5 text-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Form */}
          {(shippingOption === 'other' || shippingOption === 'own') && (
            <div className="[&_input]:bg-slate-950 bg-slate-900 rounded-lg p-6 border border-dark-lighter space-y-4">
              <h3 className="text-white font-semibold mb-4">Shipping Details</h3>
              <Input
                label="Phone Number"
                type="tel"
                placeholder="Enter phone number"
                value={shippingData.phone}
                onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                required
              />
              <Input
                label="Address"
                placeholder="Enter address"
                value={shippingData.address}
                onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Enter city"
                  value={shippingData.city}
                  onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                  required
                />
                <Input
                  label="State"
                  placeholder="Enter state"
                  value={shippingData.state}
                  onChange={(e) => setShippingData({ ...shippingData, state: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Postal Code"
                placeholder="Enter postal code"
                value={shippingData.postalCode}
                onChange={(e) => setShippingData({ ...shippingData, postalCode: e.target.value })}
              />
            </div>
          )}

          {/* Shipping Cost Estimate */}
          {shippingOption !== 'pickup' && (
            <div className="bg-slate-950 rounded-lg p-6 border border-dark-lighter">
              <div className="flex justify-between items-center">
                <span className="text-gray-50">Estimated Shipping Cost</span>
                <span className="text-xl font-bold text-white">₦2,500.00</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Final shipping cost will be calculated and added to invoice</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1 !border border-gray-800"
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}