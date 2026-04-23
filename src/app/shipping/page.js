'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Textarea from '@/components/ui/Textarea';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { profileService } from '@/services/profileService';
import { orderService } from '@/services/orderService';
import { shippingService } from '@/services/shippingService';
import { METADATA } from '@/lib/metadata';

function ShippingPageContent() {
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

      const [profileResponse, orderResponse] = await Promise.all([
        profileService.getMyProfile(),
        orderService.getById(orderId),
      ]);

      console.log('Profile response:', profileResponse);
      console.log('Order response:', orderResponse);

      const userData = profileResponse?.user || profileResponse?.data || profileResponse;
      setProfile(userData);

      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      setOrder(orderData);

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
    setShippingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');

      let shippingPayload;

      if (shippingOption === 'pickup') {
        shippingPayload = {
          shippingMethod: 'pickup',
          deliveryType: 'pickup',
          shippingCost: 0,
          pickupNotes: pickupNotes.trim() || 'Customer will pick up from store',
        };
      } else {
        if (!shippingData.address || !shippingData.city || !shippingData.state) {
          setError('Please fill in all address fields');
          setSaving(false);
          return;
        }

        const recipientName = profile
          ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
          : 'Customer';

        const fullDeliveryNotes = [
          shippingOption === 'pay-on-delivery' ? 'Pay on delivery' : 'Prepaid delivery',
          deliveryNotes.trim() ? ` - ${deliveryNotes.trim()}` : '',
        ].join('');

        shippingPayload = {
          shippingMethod: 'delivery',
          deliveryType: shippingOption === 'pay-on-delivery' ? 'pay_on_delivery' : 'prepaid',
          shippingCost: 0,
          recipientName: recipientName,
          recipientPhone: profile?.phoneNumber || shippingData.phone,
          address: {
            street: shippingData.address,
            city: shippingData.city,
            state: shippingData.state,
            country: shippingData.country,
          },
          pickupNotes: fullDeliveryNotes,
        };
      }

      console.log('Saving shipping for order:', orderId, shippingPayload);

      await shippingService.create(orderId, shippingPayload);

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
      <>
        <SEOHead
          title="Shipping Options"
          description="Select shipping method for your order"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="customer">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-white">Loading...</div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <SEOHead
          title="Order Not Found"
          description="The requested order could not be found"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="customer">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="py-16 text-center">
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
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Shipping Options"
        description={`Select shipping method for order ${order.orderNumber}`}
      />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex items-center gap-3 sm:mb-8">
            <img
              src="/images/logo/shipping.png"
              alt="shipping logo"
              className="h-10 w-10 object-contain sm:h-12 sm:w-12"
            />
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl sm:text-4xl">Shipping</h1>
              <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                Select how you want to receive your order
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4 sm:p-6">
            <h2 className="mb-3 text-base font-semibold text-white sm:mb-4 sm:text-lg">
              Order Details
            </h2>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                  <h3 className="text-base font-bold text-white sm:text-xl">{order.orderNumber}</h3>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-xs text-gray-400 sm:text-sm">{getProductSummary()}</p>
                <p className="text-xs text-gray-400 sm:text-sm">
                  Total:{' '}
                  <span className="font-bold text-primary">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Order placed</p>
                <p className="text-xs text-white sm:text-sm">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-5 sm:space-y-6">
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-white sm:mb-6 sm:text-xl">
                Select Shipping Option for Order #{order.orderNumber}
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div
                  onClick={() => {
                    setShippingOption('pickup');
                    setDeliveryType(null);
                    setDeliveryNotes('');
                  }}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all sm:p-5 ${
                    shippingOption === 'pickup'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-800 bg-slate-800/30 hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 sm:mb-3 sm:h-14 sm:w-14">
                      <span className="text-2xl sm:text-3xl">🏢</span>
                    </div>
                    <div className="mb-2 sm:mb-3">
                      <h3 className="text-sm font-semibold text-white sm:text-base">Pickup</h3>
                      <p className="text-xs text-gray-400 sm:text-sm">Collect from our office</p>
                    </div>
                    <input
                      type="radio"
                      checked={shippingOption === 'pickup'}
                      onChange={() => {
                        setShippingOption('pickup');
                        setDeliveryType(null);
                        setDeliveryNotes('');
                      }}
                      className="h-4 w-4 text-primary sm:h-5 sm:w-5"
                    />
                  </div>
                </div>

                <div
                  onClick={() => {
                    setShippingOption('pay-on-delivery');
                    setDeliveryType('own');
                  }}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all sm:p-5 ${
                    shippingOption === 'pay-on-delivery'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-800 bg-slate-800/30 hover:border-green-500/50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 sm:mb-3 sm:h-14 sm:w-14">
                      <span className="text-2xl sm:text-3xl">💵</span>
                    </div>
                    <div className="mb-2 sm:mb-3">
                      <h3 className="text-sm font-semibold text-white sm:text-base">
                        Pay on Delivery
                      </h3>
                      <p className="text-xs text-gray-400 sm:text-sm">
                        Pay delivery agent directly
                      </p>
                    </div>
                    <input
                      type="radio"
                      checked={shippingOption === 'pay-on-delivery'}
                      onChange={() => {
                        setShippingOption('pay-on-delivery');
                        setDeliveryType('own');
                      }}
                      className="h-4 w-4 text-green-500 sm:h-5 sm:w-5"
                    />
                  </div>
                </div>

                <div
                  onClick={() => {
                    setShippingOption('delivery');
                    setDeliveryType('own');
                  }}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all sm:p-5 ${
                    shippingOption === 'delivery'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-800 bg-slate-800/30 hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 sm:mb-3 sm:h-14 sm:w-14">
                      <span className="text-2xl sm:text-3xl">🚚</span>
                    </div>
                    <div className="mb-2 sm:mb-3">
                      <h3 className="text-sm font-semibold text-white sm:text-base">Delivery</h3>
                      <p className="text-xs text-gray-400 sm:text-sm">Prepaid shipping</p>
                    </div>
                    <input
                      type="radio"
                      checked={shippingOption === 'delivery'}
                      onChange={() => {
                        setShippingOption('delivery');
                        setDeliveryType('own');
                      }}
                      className="h-4 w-4 text-primary sm:h-5 sm:w-5"
                    />
                  </div>
                </div>
              </div>
            </div>

            {shippingOption !== 'pickup' && (
              <>
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
                  <h3 className="mb-3 text-base font-semibold text-white sm:mb-4 sm:text-lg">
                    Delivery Address for Order #{order.orderNumber}
                  </h3>

                  <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:gap-4">
                    <button
                      onClick={() => setDeliveryType('own')}
                      className={`rounded-lg border-2 px-3 py-2 transition-all sm:flex-1 sm:px-4 sm:py-3 ${
                        deliveryType === 'own'
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-sm font-medium sm:text-base">My Address</div>
                      <div className="text-xs sm:text-sm">Use address from profile</div>
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
                      className={`rounded-lg border-2 px-3 py-2 transition-all sm:flex-1 sm:px-4 sm:py-3 ${
                        deliveryType === 'new'
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-sm font-medium sm:text-base">New Address</div>
                      <div className="text-xs sm:text-sm">Enter different address</div>
                    </button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300 sm:mb-2 sm:text-sm">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={shippingData.phoneCountryCode}
                          onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
                          disabled={deliveryType === 'own' && profile?.phoneNumber}
                          className="w-20 rounded-lg border border-gray-700 bg-slate-800 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 sm:w-24 sm:px-3 sm:py-3"
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
                          className="flex-1 rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 sm:px-4 sm:py-3"
                        />
                      </div>
                      {deliveryType === 'own' && profile?.phoneNumber && (
                        <p className="mt-1 text-xs text-gray-500">
                          Using phone number from your profile
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300 sm:mb-2 sm:text-sm">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter street address"
                        disabled={deliveryType === 'own' && profile?.address}
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 sm:px-4 sm:py-3"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-300 sm:mb-2 sm:text-sm">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Enter city"
                          disabled={deliveryType === 'own' && profile?.city}
                          className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 sm:px-4 sm:py-3"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-300 sm:mb-2 sm:text-sm">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="Enter state"
                          disabled={deliveryType === 'own' && profile?.state}
                          className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 sm:px-4 sm:py-3"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300 sm:mb-2 sm:text-sm">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={shippingData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        disabled={deliveryType === 'own'}
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 sm:px-4 sm:py-3"
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

                    <div className="mt-3 sm:mt-4">
                      <label className="mb-1 block text-xs font-medium text-gray-300 sm:mb-2 sm:text-sm">
                        Delivery Notes (Optional)
                      </label>
                      <Textarea
                        placeholder="Add any special instructions for delivery (e.g., landmark, gate code, preferred delivery time)"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Add any special instructions for the delivery agent
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {shippingOption === 'pay-on-delivery' && (
                    <div className="rounded-lg border border-green-800 bg-green-900/20 p-3 sm:p-4">
                      <p className="text-xs text-green-400 sm:text-sm">
                        <span className="font-bold text-green-300">Pay on Delivery: </span>
                        You'll pay the delivery agent directly when you receive your order.
                      </p>
                    </div>
                  )}

                  {shippingOption === 'delivery' && (
                    <div className="rounded-lg border border-blue-800 bg-blue-900/20 p-3 sm:p-4">
                      <p className="text-xs text-blue-400 sm:text-sm">
                        <span className="font-bold text-blue-300">Prepaid Delivery: </span>
                        Shipping cost will be calculated and an invoice will be sent to you.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {shippingOption === 'pickup' && (
              <>
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
                  <h3 className="mb-3 text-base font-semibold text-white sm:mb-4 sm:text-lg">
                    Pickup Instructions
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300 sm:mb-2 sm:text-sm">
                        Pickup Notes (Optional)
                      </label>
                      <Textarea
                        placeholder="Add any special instructions for pickup (e.g., preferred pickup time, alternate contact)"
                        value={pickupNotes}
                        onChange={(e) => setPickupNotes(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Add any special instructions for when you come to pick up your order
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-purple-800 bg-purple-900/20 p-3 sm:p-4">
                  <p className="text-xs text-purple-400 sm:text-sm">
                    <span className="font-bold text-purple-300">Pickup: </span>
                    Your order #{order.orderNumber} will be available for pickup at our office.
                  </p>
                </div>
              </>
            )}

            <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:gap-4 sm:pt-4">
              <Button
                variant="secondary"
                onClick={() => router.back()}
                className="flex-1 border border-gray-700 hover:bg-slate-800"
                disabled={saving}
              >
                Back
              </Button>
              <Button variant="primary" onClick={handleSubmit} className="flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

export default function ShippingPage() {
  return (
    <Suspense fallback={null}>
      <ShippingPageContent />
    </Suspense>
  );
}
