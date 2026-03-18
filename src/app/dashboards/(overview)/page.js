'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';
import OrderCard from '@/components/cards/OrderCard';
import InvoiceCard from '@/components/cards/InvoiceCard';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useProtectedRoute } from '@/app/lib/auth';
import { customerService } from '@/services/customerService';
import { feedbackService } from '@/services/feedbackService';
import { orderService } from '@/services/orderService';
import { invoiceService } from '@/services/invoiceService';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { useToast } from '@/components/providers/ToastProvider';

// Order statuses where customer can interact with briefs
const EDITABLE_ORDER_STATUSES = ['Pending', 'OrderReceived', 'FilesUploaded'];

export default function CustomerDashboard() {
  const router = useRouter();
  const { isLoading: authLoading, user } = useProtectedRoute({
    redirectTo: '/auth/sign-in'
  });
  const { showToast } = useToast();
  const { unreadCount, isConnected } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    activeOrders: 0,
    pendingInvoices: 0,
    shippingInvoices: 0,
    readyForShipping: 0,
    designsForApproval: 0,
    completedOrders: 0,
    pendingResponses: 0,
    unreadFeedbackResponses: 0,
    totalFeedback: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [unpaidShippingInvoices, setUnpaidShippingInvoices] = useState([]);
  const [ordersReadyForShipping, setOrdersReadyForShipping] = useState([]);
  const [userName, setUserName] = useState('');
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('');
  const [feedbackFiles, setFeedbackFiles] = useState([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
      fetchUserOrders();
      fetchUnreadFeedbackCount();
    }
  }, [authLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get user profile
      const profile = await customerService.getUserProfile();
      setUserName(profile.name);

      // Get dashboard stats
      const data = await customerService.getDashboardStats();
      
      setStats(prev => ({
        ...prev,
        activeOrders: data.activeOrders || 0,
        pendingInvoices: data.pendingInvoices || 0,
        completedOrders: data.completedOrders || 0
      }));

      setRecentOrders(data.recentOrders || []);
      setUnpaidInvoices(data.unpaidInvoices || []);

    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Unable to load some dashboard data. Showing available information.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      if (!user?.userId) return;
      
      const response = await orderService.getMyOrders({ limit: 50 });
      
      let orders = [];
      if (response?.order && Array.isArray(response.order)) {
        orders = response.order;
      } else if (response?.orders && Array.isArray(response.orders)) {
        orders = response.orders;
      } else if (Array.isArray(response)) {
        orders = response;
      }
      
      setUserOrders(orders);
      
      // Find orders that are completed but don't have shipping selected yet
      const readyForShipping = orders.filter(order => 
        order.status === 'Completed' && !order.shippingId
      );
      
      setOrdersReadyForShipping(readyForShipping);
      setStats(prev => ({
        ...prev,
        readyForShipping: readyForShipping.length
      }));
      
      // Fetch shipping invoices
      const invoicesResponse = await invoiceService.getMyInvoices({ limit: 50 });
      
      let invoices = [];
      if (invoicesResponse?.invoices && Array.isArray(invoicesResponse.invoices)) {
        invoices = invoicesResponse.invoices;
      } else if (invoicesResponse?.data?.invoices) {
        invoices = invoicesResponse.data.invoices;
      } else if (Array.isArray(invoicesResponse)) {
        invoices = invoicesResponse;
      }
      
      // Filter for unpaid shipping invoices
      const shippingInvoices = invoices.filter(inv => 
        inv.invoiceType === 'shipping' && 
        inv.status !== 'Paid' && 
        inv.status !== 'Cancelled'
      );
      
      setUnpaidShippingInvoices(shippingInvoices);
      setStats(prev => ({
        ...prev,
        shippingInvoices: shippingInvoices.length
      }));
      
    } catch (error) {
      console.error('Failed to fetch shipping data:', error);
    }
  };

  const fetchUnreadFeedbackCount = async () => {
    try {
      if (!user?.userId) return;
      
      const response = await feedbackService.getMyFeedback({ limit: 50 });
      
      let feedbackData = [];
      if (response?.feedback && Array.isArray(response.feedback)) {
        feedbackData = response.feedback;
      } else if (response?.data && Array.isArray(response.data)) {
        feedbackData = response.data;
      } else if (Array.isArray(response)) {
        feedbackData = response;
      }
      
      // Count feedback that has admin responses AND hasn't been viewed by customer
      const unreadResponses = feedbackData.filter(f => 
        f.adminResponse && !f.viewedByCustomer
      ).length;
      
      setStats(prev => ({
        ...prev,
        unreadFeedbackResponses: unreadResponses,
        totalFeedback: feedbackData.length
      }));
      
    } catch (error) {
      console.error('Failed to fetch unread feedback:', error);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFeedbackFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setFeedbackFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      showToast('Please enter your feedback message', 'error');
      return;
    }

    try {
      setSubmittingFeedback(true);
      
      const formData = new FormData();
      formData.append('message', feedbackMessage);
      
      if (feedbackType === 'order' && selectedOrder) {
        formData.append('orderId', selectedOrder);
      }
      
      feedbackFiles.forEach(file => {
        formData.append('attachments', file);
      });
      
      await feedbackService.create(formData);
      
      showToast('Thank you for your feedback!', 'success');
      
      // Reset form
      setShowFeedbackModal(false);
      setFeedbackMessage('');
      setFeedbackType('general');
      setSelectedOrder('');
      setFeedbackFiles([]);
      
      // Refresh feedback counts
      await fetchUnreadFeedbackCount();
      
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      showToast('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSelectShipping = (orderId) => {
    router.push(`/shipping?orderId=${orderId}`);
  };

  const getWelcomeName = () => {
    if (userName) {
        return userName.split(' ')[0];
    } else if (user?.email) {
        return user.email.split('@')[0];
    } else { 
        return 'there';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
    } catch {
      return 'Invalid date';
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {getWelcomeName()}
            </h1>
            <p className="text-gray-400">
              {stats.designsForApproval > 0 
                ? `You have ${stats.designsForApproval} design${stats.designsForApproval > 1 ? 's' : ''} awaiting your approval`
                : 'Track your orders and manage your account'
              }
            </p>
          </div>
          <div className="flex gap-3">
            {/* CREATE NEW FEEDBACK BUTTON */}
            <Button 
              variant="secondary" 
              size="md" 
              className="gap-2"
              onClick={() => setShowFeedbackModal(true)}
            >
              <span>💬</span>
              Send Feedback
            </Button>
            <Link href="/new-order">
              <Button variant="primary" size="md" className="gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-yellow-200 text-sm">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="ml-auto text-sm text-yellow-400 hover:text-yellow-300 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          <Link href="/order-history?filter=active" className="block cursor-pointer">
            <SummaryCard
              title="Active Orders"
              value={stats.activeOrders.toString()}
              icon="📦"
              color="blue"
              subtitle="In progress"
            />
          </Link>
          
          <Link href="/invoices?filter=pending" className="block cursor-pointer">
            <SummaryCard
              title="Pending Invoices"
              value={stats.pendingInvoices.toString()}
              icon="📄"
              color="red"
              subtitle="Awaiting payment"
            />
          </Link>
          
          <Link href="/shipping/orders" className="block cursor-pointer">
            <SummaryCard
              title="Ready for Shipping"
              value={stats.readyForShipping.toString()}
              icon="🚚"
              color="orange"
              subtitle={`${stats.readyForShipping} order${stats.readyForShipping !== 1 ? 's' : ''} ready`}
            />
          </Link>
          
          <Link href="/design-approval" className="block cursor-pointer">
            <SummaryCard
              title="Designs to Review"
              value={stats.designsForApproval.toString()}
              icon="🎨"
              color="green"
              subtitle="Awaiting approval"
            />
          </Link>
          
          {/* VIEW ALL FEEDBACK CARD - With unread indicator */}
          <Link href="/feedback" className="block cursor-pointer relative">
            <SummaryCard
              title="My Feedback"
              value={stats.totalFeedback.toString()}
              icon="💬"
              color="purple"
              subtitle="View all your feedback"
            />
            {stats.unreadFeedbackResponses > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[24px] h-6 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold px-1.5 border-2 border-slate-900">
                {stats.unreadFeedbackResponses}
              </span>
            )}
          </Link>
        </div>

        {/* Main Content - 2fr/1fr Layout */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          {/* Left Column - Recent Orders & Ready for Shipping */}
          <div className="space-y-8">
            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
                <Link href="/order-history" className="text-primary hover:text-primary-dark text-sm transition">
                  View All →
                </Link>
              </div>
              
              {recentOrders.length === 0 ? (
                <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-8 text-center">
                  <p className="text-gray-400 mb-3">No active orders</p>
                  <Link href="/collections">
                    <Button variant="primary" size="sm">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.slice(0, 3).map((order) => {
                    const isEditable = EDITABLE_ORDER_STATUSES.includes(order.status);
                    
                    return (
                      <div key={order._id} className="relative">
                        <OrderCard 
                          order={{
                            id: order._id,
                            orderNumber: order.orderNumber,
                            productName: order.items?.[0]?.productName || 'Multiple Items',
                            orderedDate: formatDate(order.createdAt),
                            totalAmount: order.totalAmount,
                            status: order.status,
                            itemsCount: order.items?.length || 1
                          }}
                          onClick={() => router.push(`/order-history/${order._id}`)}
                        />
                        {isEditable && (
                          <div className="absolute top-2 right-2">
                            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">
                              Editable
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ready for Shipping Section */}
            {ordersReadyForShipping.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Ready for Shipping</h2>
                  <Link href="/shipping/orders" className="text-primary hover:text-primary-dark text-sm transition">
                    View All →
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {ordersReadyForShipping.slice(0, 1).map((order) => (
                    <div key={order._id} className="bg-gradient-to-br from-orange-900/20 to-orange-950/20 border border-orange-800 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-white font-medium">{order.orderNumber}</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            {order.items?.length} item(s)
                          </p>
                        </div>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleSelectShipping(order._id)}
                        >
                          Select Shipping
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Invoices */}
          <div className="space-y-6">
            {/* Regular Invoices */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Pending Invoices</h2>
                <Link href="/invoices?filter=pending" className="text-primary hover:text-primary-dark text-sm transition">
                  View All →
                </Link>
              </div>
              
              {unpaidInvoices.length === 0 ? (
                <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-6 text-center">
                  <p className="text-gray-400 text-sm">No pending invoices</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidInvoices.slice(0, 1).map((invoice) => (
                    <InvoiceCard 
                      key={invoice._id} 
                      invoice={{
                        id: invoice._id,
                        invoiceNumber: invoice.invoiceNumber,
                        amount: invoice.totalAmount,
                        balance: invoice.remainingAmount || invoice.totalAmount,
                        status: invoice.status,
                        dueDate: invoice.dueDate,
                        createdAt: invoice.createdAt
                      }}
                      onPay={() => router.push(`/payment?invoiceId=${invoice._id}`)}
                      onDownload={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Shipping Invoices */}
            {unpaidShippingInvoices.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Shipping Invoices</h2>
                  <Link href="/invoices?filter=shipping" className="text-primary hover:text-primary-dark text-sm transition">
                    View All →
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {unpaidShippingInvoices.slice(0, 2).map((invoice) => (
                    <InvoiceCard 
                      key={invoice._id} 
                      invoice={{
                        id: invoice._id,
                        invoiceNumber: invoice.invoiceNumber,
                        amount: invoice.totalAmount,
                        balance: invoice.remainingAmount || invoice.totalAmount,
                        status: invoice.status,
                        dueDate: invoice.dueDate,
                        createdAt: invoice.createdAt,
                        type: 'shipping'
                      }}
                      onPay={() => router.push(`/payment?invoiceId=${invoice._id}`)}
                      onDownload={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/collections">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 p-4 rounded-lg border border-blue-800 hover:border-blue-600 transition cursor-pointer">
              <div className="text-3xl mb-2">🛍️</div>
              <h4 className="text-white font-medium">Browse Products</h4>
              <p className="text-xs text-gray-400 mt-1">Explore our collection</p>
            </div>
          </Link>
          
          <Link href="/order-history">
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 p-4 rounded-lg border border-purple-800 hover:border-purple-600 transition cursor-pointer">
              <div className="text-3xl mb-2">📋</div>
              <h4 className="text-white font-medium">Order History</h4>
              <p className="text-xs text-gray-400 mt-1">View all your orders</p>
            </div>
          </Link>
          
          <Link href="/invoices">
            <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 p-4 rounded-lg border border-green-800 hover:border-green-600 transition cursor-pointer">
              <div className="text-3xl mb-2">📄</div>
              <h4 className="text-white font-medium">All Invoices</h4>
              <p className="text-xs text-gray-400 mt-1">View and manage invoices</p>
            </div>
          </Link>

          <Link href="/feedback">
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 p-4 rounded-lg border border-purple-800 hover:border-purple-600 transition cursor-pointer">
              <div className="text-3xl mb-2">💬</div>
              <h4 className="text-white font-medium">My Feedback</h4>
              <p className="text-xs text-gray-400 mt-1">View your feedback history</p>
            </div>
          </Link>
        </div>

        {/* Create Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-gray-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-2xl font-bold text-white">Send New Feedback</h2>
                <p className="text-sm text-gray-400 mt-1">
                  We'd love to hear from you! Whether it's praise, a complaint, or a suggestion.
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    What would you like to give feedback about?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setFeedbackType('general');
                        setSelectedOrder('');
                      }}
                      className={`p-3 rounded-lg border text-sm transition ${
                        feedbackType === 'general'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-700 bg-slate-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      General Feedback
                    </button>
                    <button
                      onClick={() => setFeedbackType('order')}
                      className={`p-3 rounded-lg border text-sm transition ${
                        feedbackType === 'order'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-700 bg-slate-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      About an Order
                    </button>
                  </div>
                </div>

                {/* Order Selection (if feedback type is order) */}
                {feedbackType === 'order' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Order
                    </label>
                    <select
                      value={selectedOrder}
                      onChange={(e) => setSelectedOrder(e.target.value)}
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="">Choose an order...</option>
                      {userOrders.map(order => (
                        <option key={order._id} value={order._id}>
                          {order.orderNumber} - {order.items?.length} item(s)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Feedback Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Feedback <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    placeholder="Tell us what you think..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Attachments (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="feedback-attachments"
                    />
                    <label htmlFor="feedback-attachments" className="cursor-pointer">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                    </label>
                  </div>
                </div>

                {/* Selected Files */}
                {feedbackFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Selected Files:</p>
                    {feedbackFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-800 rounded-lg p-2">
                        <span className="text-white text-sm truncate max-w-[250px]">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setFeedbackMessage('');
                      setFeedbackType('general');
                      setSelectedOrder('');
                      setFeedbackFiles([]);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmitFeedback}
                    disabled={submittingFeedback || !feedbackMessage.trim()}
                    className="flex-1"
                  >
                    {submittingFeedback ? 'Sending...' : 'Send Feedback'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}