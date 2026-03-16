'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Textarea from '@/components/ui/Textarea';
import { useAuthCheck } from '@/app/lib/auth';
import { profileService } from '@/services/profileService';
import { orderService } from '@/services/orderService';
import { shippingService } from '@/services/shippingService';

export default function ShippingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  useAuthCheck();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [order, setOrder] = useState(null);
  const [shippingOption, setShippingOption] = useState('pickup');
  const [deliveryType, setDeliveryType] = useState('own');
  const [shippingData, setShippingData] = useState({
    phone: '',
    phoneCountryCode: '+234',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      router.push('/shipping/orders');
      return;
    }
    fetchData();
  }, [orderId]);

  useEffect(() => {
    if (deliveryType === 'own' && profile) {
      setShippingData({
        phone: profile.phoneNumber || '',
        phoneCountryCode: '+234',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        country: 'Nigeria',
      });
    }
  }, [deliveryType, profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both profile and order in parallel
      const [profileResponse, orderResponse] = await Promise.all([
        profileService.getMyProfile(),
        orderService.getById(orderId)
      ]);
      
      console.log('Profile response:', profileResponse);
      console.log('Order response:', orderResponse);
      
      // Handle profile data
      const userData = profileResponse?.user || profileResponse?.data || profileResponse;
      setProfile(userData);
      
      // Handle order data
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      setOrder(orderData);
      
      // Initialize shipping data with profile info
      if (userData) {
        setShippingData({
          phone: userData.phoneNumber || '',
          phoneCountryCode: '+234',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          country: 'Nigeria',
        });
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setShippingData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');

      // Prepare shipping data based on shipping option
      let shippingPayload;
      
      if (shippingOption === 'pickup') {
        // Pickup option
        shippingPayload = {
          shippingMethod: 'pickup',
          shippingCost: 0,
          pickupNotes: pickupNotes.trim() || 'Customer will pick up from store'
        };
      } else {
        // Delivery options (pay-on-delivery or prepaid) - need address
        if (!shippingData.address || !shippingData.city || !shippingData.state) {
          setError('Please fill in all address fields');
          setSaving(false);
          return;
        }

        // Get recipient name from profile
        const recipientName = profile ? 
          `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : 
          'Customer';

        // Combine delivery notes with shipping option info
        const fullDeliveryNotes = [
          shippingOption === 'pay-on-delivery' ? 'Pay on delivery' : 'Prepaid delivery',
          deliveryNotes.trim() ? ` - ${deliveryNotes.trim()}` : ''
        ].join('');

        shippingPayload = {
          shippingMethod: 'delivery',
          shippingCost: 0,
          recipientName: recipientName,
          recipientPhone: profile?.phoneNumber || shippingData.phone,
          address: {
            street: shippingData.address,
            city: shippingData.city,
            state: shippingData.state,
            country: shippingData.country
          },
          pickupNotes: fullDeliveryNotes
        };
      }

      console.log('Saving shipping for order:', orderId, shippingPayload);

      // Use the shipping service to create shipping record
      await shippingService.create(orderId, shippingPayload);

      // Redirect based on selection
      if (shippingOption === 'pay-on-delivery') {
        router.push(`/order-history/${orderId}?message=pay-on-delivery`);
      } else if (shippingOption === 'pickup') {
        router.push(`/order-history/${orderId}?message=pickup`);
      } else {
        router.push(`/order-history/${orderId}?message=shipping-selected`);
      }

    } catch (err) {
      console.error('Failed to save shipping:', err);
      setError(err.message || 'Failed to save shipping information');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const getProductSummary = () => {
    if (!order?.items) return 'No items';
    const items = order.items;
    if (items.length === 1) {
      return `${items[0].productName} (x${items[0].quantity})`;
    }
    return `${items.length} items`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-gray-400">Order not found</p>
            <Button
              variant="primary"
              onClick={() => router.push('/shipping/orders')}
              className="mt-4"
            >
              Back to Orders
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className='flex items-center gap-3 mb-8'>
          <img src="/images/logo/shipping.png" alt="shipping logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-4xl font-bold text-white">Shipping</h1>
            <p className="text-gray-400 text-sm mt-1">Select how you want to receive your order</p>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Order Details</h2>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">{order.orderNumber}</h3>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-gray-400 text-sm mb-1">{getProductSummary()}</p>
              <p className="text-gray-400 text-sm">Total: <span className="text-primary font-bold">{formatCurrency(order.totalAmount)}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Order placed</p>
              <p className="text-sm text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Shipping Options */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Select Shipping Option for Order #{order.orderNumber}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pickup Option */}
              <div
                onClick={() => {
                  setShippingOption('pickup');
                  setDeliveryType(null);
                  setDeliveryNotes('');
                }}
                className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                  shippingOption === 'pickup'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-800 hover:border-primary/50 bg-slate-800/30'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-3">
                    <span className="text-3xl">🏢</span>
                  </div>
                  <div className="mb-3">
                    <h3 className="text-white font-semibold">Pickup</h3>
                    <p className="text-gray-400 text-xs mt-1">Collect from our office</p>
                  </div>
                  <input
                    type="radio"
                    checked={shippingOption === 'pickup'}
                    onChange={() => {
                      setShippingOption('pickup');
                      setDeliveryType(null);
                      setDeliveryNotes('');
                    }}
                    className="w-5 h-5 text-primary"
                  />
                </div>
              </div>

              {/* Pay on Delivery Option */}
              <div
                onClick={() => {
                  setShippingOption('pay-on-delivery');
                  setDeliveryType('own');
                }}
                className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                  shippingOption === 'pay-on-delivery'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-800 hover:border-green-500/50 bg-slate-800/30'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-3">
                    <span className="text-3xl">💵</span>
                  </div>
                  <div className="mb-3">
                    <h3 className="text-white font-semibold">Pay on Delivery</h3>
                    <p className="text-gray-400 text-xs mt-1">Pay delivery agent directly</p>
                  </div>
                  <input
                    type="radio"
                    checked={shippingOption === 'pay-on-delivery'}
                    onChange={() => {
                      setShippingOption('pay-on-delivery');
                      setDeliveryType('own');
                    }}
                    className="w-5 h-5 text-green-500"
                  />
                </div>
              </div>

              {/* Delivery (Prepaid) Option */}
              <div
                onClick={() => {
                  setShippingOption('delivery');
                  setDeliveryType('own');
                }}
                className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                  shippingOption === 'delivery'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-800 hover:border-primary/50 bg-slate-800/30'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-3">
                    <span className="text-3xl">🚚</span>
                  </div>
                  <div className="mb-3">
                    <h3 className="text-white font-semibold">Delivery</h3>
                    <p className="text-gray-400 text-xs mt-1">Prepaid shipping</p>
                  </div>
                  <input
                    type="radio"
                    checked={shippingOption === 'delivery'}
                    onChange={() => {
                      setShippingOption('delivery');
                      setDeliveryType('own');
                    }}
                    className="w-5 h-5 text-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Selection - Only for delivery options */}
          {shippingOption !== 'pickup' && (
            <>
              <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Delivery Address for Order #{order.orderNumber}</h3>
                
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setDeliveryType('own')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      deliveryType === 'own'
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">My Address</div>
                    <div className="text-xs mt-1">Use address from profile</div>
                  </button>
                  <button
                    onClick={() => {
                      setDeliveryType('new');
                      setShippingData({
                        phone: '',
                        phoneCountryCode: '+234',
                        address: '',
                        city: '',
                        state: '',
                        country: 'Nigeria',
                      });
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      deliveryType === 'new'
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">New Address</div>
                    <div className="text-xs mt-1">Enter different address</div>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Phone Number with Country Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={shippingData.phoneCountryCode}
                        onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
                        disabled={deliveryType === 'own' && profile?.phoneNumber}
                        className="w-24 bg-slate-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="+234">🇳🇬 +234</option>
                        <option value="+233">🇬🇭 +233</option>
                        <option value="+254">🇰🇪 +254</option>
                        <option value="+255">🇹🇿 +255</option>
                        <option value="+256">🇺🇬 +256</option>
                        <option value="+27">🇿🇦 +27</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                      </select>
                      <input
                        type="tel"
                        value={shippingData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Phone number"
                        disabled={deliveryType === 'own' && profile?.phoneNumber}
                        className="flex-1 bg-slate-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    {deliveryType === 'own' && profile?.phoneNumber && (
                      <p className="text-xs text-gray-500 mt-1">Using phone number from your profile</p>
                    )}
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter street address"
                      disabled={deliveryType === 'own' && profile?.address}
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* City and State */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Enter city"
                        disabled={deliveryType === 'own' && profile?.city}
                        className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="Enter state"
                        disabled={deliveryType === 'own' && profile?.state}
                        className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={shippingData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      disabled={deliveryType === 'own'}
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="Nigeria">Nigeria</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Uganda">Uganda</option>
                      <option value="South Africa">South Africa</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                    </select>
                  </div>

                  {/* Delivery Notes Field */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Delivery Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="Add any special instructions for delivery (e.g., landmark, gate code, preferred delivery time)"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Add any special instructions for the delivery agent
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {shippingOption === 'pay-on-delivery' && (
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-400">
                      <span className="font-bold text-green-300">Pay on Delivery: </span>
                      You'll pay the delivery agent directly when you receive your order.
                    </p>
                  </div>
                )}

                {shippingOption === 'delivery' && (
                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-400">
                      <span className="font-bold text-blue-300">Prepaid Delivery: </span>
                      Shipping cost will be calculated and an invoice will be sent to you.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Pickup Notes Field */}
          {shippingOption === 'pickup' && (
            <>
              <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Pickup Instructions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Pickup Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="Add any special instructions for pickup (e.g., preferred pickup time, alternate contact)"
                      value={pickupNotes}
                      onChange={(e) => setPickupNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Add any special instructions for when you come to pick up your order
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                <p className="text-sm text-purple-400">
                  <span className="font-bold text-purple-300">Pickup: </span>
                  Your order #{order.orderNumber} will be available for pickup at our office.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1 !border border-gray-700 hover:bg-slate-800"
              disabled={saving}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              className="flex-1"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}