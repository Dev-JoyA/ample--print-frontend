'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';
import OrderCard from '@/components/cards/OrderCard';
import InvoiceCard from '@/components/cards/InvoiceCard';
import Button from '@/components/ui/Button';
import { useProtectedRoute } from '@/app/lib/auth';
import { customerService } from '@/services/customerService';
import { customerBriefService } from '@/services/customerBriefService';
import { designService } from '@/services/designService'; 
import { feedbackService } from '@/services/feedbackService';
import { invoiceService } from '@/services/invoiceService';
import { orderService } from '@/services/orderService';
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
    unreadFeedbackResponses: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [unpaidShippingInvoices, setUnpaidShippingInvoices] = useState([]);
  const [ordersReadyForShipping, setOrdersReadyForShipping] = useState([]);
  const [pendingResponses, setPendingResponses] = useState([]);
  const [userName, setUserName] = useState('');
  const [viewingBrief, setViewingBrief] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
      fetchPendingResponses();
      fetchDesignsForApproval();
      fetchShippingData();
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

  const fetchShippingData = async () => {
    try {
      if (!user?.userId) return;
      
      // Fetch all orders for the user
      const ordersResponse = await orderService.getMyOrders({ limit: 50 });
      
      let orders = [];
      if (ordersResponse?.order && Array.isArray(ordersResponse.order)) {
        orders = ordersResponse.order;
      } else if (ordersResponse?.orders && Array.isArray(ordersResponse.orders)) {
        orders = ordersResponse.orders;
      } else if (Array.isArray(ordersResponse)) {
        orders = ordersResponse;
      }
      
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
      
      const response = await feedbackService.getMyFeedback({ limit: 20 });
      
      let feedbackData = [];
      if (response?.feedback && Array.isArray(response.feedback)) {
        feedbackData = response.feedback;
      } else if (response?.data && Array.isArray(response.data)) {
        feedbackData = response.data;
      } else if (Array.isArray(response)) {
        feedbackData = response;
      }
      
      const unreadResponses = feedbackData.filter(f => 
        f.adminResponse && f.adminResponseAt
      ).length;
      
      setStats(prev => ({
        ...prev,
        unreadFeedbackResponses: unreadResponses
      }));
      
    } catch (error) {
      console.error('Failed to fetch unread feedback:', error);
    }
  };

  const fetchDesignsForApproval = async () => {
    try {
      if (!user?.userId) return;
      
      const designsResponse = await designService.getByUser(user.userId);
      const designsData = designsResponse?.data || designsResponse?.designs || [];
      
      const designsWithFeedbackStatus = await Promise.all(
        designsData.map(async (design) => {
          if (design.isApproved) {
            return { ...design, hasFeedback: false };
          }
          
          try {
            const orderId = design.orderId?._id || design.orderId;
            const feedbackResponse = await feedbackService.getByOrder(orderId);
            const feedbacks = feedbackResponse?.data || [];
            
            const hasFeedback = feedbacks.some(f => 
              (f.designId?._id === design._id || f.designId === design._id)
            );
            
            return { ...design, hasFeedback };
          } catch (err) {
            return { ...design, hasFeedback: false };
          }
        })
      );
      
      const pendingForReview = designsWithFeedbackStatus.filter(
        d => !d.isApproved && !d.hasFeedback
      );
      
      setStats(prev => ({
        ...prev,
        designsForApproval: pendingForReview.length
      }));
      
    } catch (error) {
      console.error('Failed to fetch designs for approval:', error);
    }
  };

  const fetchPendingResponses = async () => {
    try {
      const response = await customerBriefService.getMyBriefs({ 
        hasAdminResponse: true,
        viewed: false,
        limit: 5
      });
      
      let briefs = [];
      let pendingCount = 0;
      
      if (response?.briefs) {
        briefs = response.briefs;
        pendingCount = response.total || briefs.length;
      } else if (response?.data?.briefs) {
        briefs = response.data.briefs;
        pendingCount = response.data.total || briefs.length;
      }
      
      setPendingResponses(briefs);
      setStats(prev => ({
        ...prev,
        pendingResponses: pendingCount
      }));
    } catch (error) {
      console.error('Failed to fetch pending responses:', error);
    }
  };

  const handleSelectShipping = (orderId) => {
    router.push(`/shipping?orderId=${orderId}`);
  };

  const getDesignsMessage = () => {
    if (stats.designsForApproval === 0) return "No designs awaiting approval";
    if (stats.designsForApproval === 1) return "You have 1 design awaiting your approval";
    return `You have ${stats.designsForApproval} designs awaiting your approval`;
  };

  const getShippingMessage = () => {
    if (stats.readyForShipping === 0) return "No orders ready for shipping";
    if (stats.readyForShipping === 1) return "1 order ready for shipping selection";
    return `${stats.readyForShipping} orders ready for shipping selection`;
  };

  const getShippingInvoiceMessage = () => {
    if (stats.shippingInvoices === 0) return "No pending shipping invoices";
    if (stats.shippingInvoices === 1) return "You have 1 shipping invoice pending";
    return `You have ${stats.shippingInvoices} shipping invoices pending`;
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
            <p className="text-gray-400">{getDesignsMessage()}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/feedback">
              <Button variant="secondary" size="md" className="gap-2 relative">
                <span>💬</span>
                Feedback
                {stats.unreadFeedbackResponses > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {stats.unreadFeedbackResponses}
                  </span>
                )}
              </Button>
            </Link>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
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
              subtitle={getShippingMessage()}
            />
          </Link>
          
          <Link href="/invoices?filter=shipping" className="block cursor-pointer">
            <SummaryCard
              title="Shipping Invoices"
              value={stats.shippingInvoices.toString()}
              icon="📋"
              color="yellow"
              subtitle={getShippingInvoiceMessage()}
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
          
          <Link href="/feedback" className="block cursor-pointer relative">
            <SummaryCard
              title="Feedback"
              value={stats.unreadFeedbackResponses.toString()}
              icon="💬"
              color="purple"
              subtitle="Messages & responses"
            />
            {stats.unreadFeedbackResponses > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold border-2 border-slate-900">
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
            {/* <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Shipping Invoices</h2>
                <Link href="/invoices?filter=shipping" className="text-primary hover:text-primary-dark text-sm transition">
                  View All →
                </Link>
              </div>
              
              {unpaidShippingInvoices.length === 0 ? (
                <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-6 text-center">
                  <p className="text-gray-400 text-sm">No pending shipping invoices</p>
                </div>
              ) : (
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
              )}
            </div> */}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      </div>
    </DashboardLayout>
  );
}