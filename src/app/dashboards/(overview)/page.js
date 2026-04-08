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
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { useProtectedRoute } from '@/app/lib/auth';
import { customerService } from '@/services/customerService';
import { feedbackService } from '@/services/feedbackService';
import { orderService } from '@/services/orderService';
import { invoiceService } from '@/services/invoiceService';
import { customerBriefService } from '@/services/customerBriefService';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { useToast } from '@/components/providers/ToastProvider';

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
    totalFeedback: 0,
    pendingBriefResponses: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [unpaidShippingInvoices, setUnpaidShippingInvoices] = useState([]);
  const [ordersReadyForShipping, setOrdersReadyForShipping] = useState([]);
  const [pendingBriefResponses, setPendingBriefResponses] = useState([]);
  const [userName, setUserName] = useState('');
  
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
      fetchPendingBriefResponses();
    }
  }, [authLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const profile = await customerService.getUserProfile();
      setUserName(profile.name);

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
      
      const readyForShipping = orders.filter(order => 
        order.status === 'Completed' && !order.shippingId
      );
      
      setOrdersReadyForShipping(readyForShipping);
      setStats(prev => ({
        ...prev,
        readyForShipping: readyForShipping.length
      }));
      
      const invoicesResponse = await invoiceService.getMyInvoices({ limit: 50 });
      
      let invoices = [];
      if (invoicesResponse?.invoices && Array.isArray(invoicesResponse.invoices)) {
        invoices = invoicesResponse.invoices;
      } else if (invoicesResponse?.data?.invoices) {
        invoices = invoicesResponse.data.invoices;
      } else if (Array.isArray(invoicesResponse)) {
        invoices = invoicesResponse;
      }
      
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

  const fetchPendingBriefResponses = async () => {
    try {
      if (!user?.userId) return;
      
      const response = await orderService.getMyOrders({ limit: 100 });
      
      let orders = [];
      if (response?.order && Array.isArray(response.order)) {
        orders = response.order;
      } else if (response?.orders && Array.isArray(response.orders)) {
        orders = response.orders;
      } else if (Array.isArray(response)) {
        orders = response;
      }
      
      const briefResponsePromises = orders.map(async (order) => {
        if (!order.items || order.items.length === 0) return [];
        
        const productResponses = [];
        
        for (const item of order.items) {
          const productId = item.productId?._id || item.productId;
          try {
            const briefResponse = await customerBriefService.getByOrderAndProduct(order._id, productId);
            const briefData = briefResponse?.data || briefResponse;
            
            if (briefData?.admin && !briefData.admin.viewed) {
              const hasNewerCustomerResponse = briefData.customer && 
                new Date(briefData.customer.createdAt) > new Date(briefData.admin.createdAt);
              
              if (!hasNewerCustomerResponse) {
                productResponses.push({
                  orderId: order._id,
                  orderNumber: order.orderNumber,
                  productName: item.productName,
                  briefId: briefData.admin._id,
                  respondedAt: briefData.admin.createdAt,
                  hasDesign: !!briefData.admin.designId,
                  description: briefData.admin.description
                });
              }
            }
          } catch (err) {
            // No brief found for this product
          }
        }
        
        return productResponses;
      });
      
      const results = await Promise.all(briefResponsePromises);
      const pendingResponses = results.flat().filter(r => r !== null);
      
      pendingResponses.sort((a, b) => new Date(b.respondedAt) - new Date(a.respondedAt));
      
      setPendingBriefResponses(pendingResponses);
      setStats(prev => ({
        ...prev,
        pendingBriefResponses: pendingResponses.length
      }));
      
    } catch (error) {
      console.error('Failed to fetch pending brief responses:', error);
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
      
      setShowFeedbackModal(false);
      setFeedbackMessage('');
      setFeedbackType('general');
      setSelectedOrder('');
      setFeedbackFiles([]);
      
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

  const handleViewBriefResponse = (briefId) => {
    router.push(`/briefs/${briefId}`);
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
        <SEOHead {...METADATA.dashboard.customer} />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-gray-400">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <SEOHead {...METADATA.dashboard.customer} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Welcome back, {getWelcomeName()}
            </h1>
            <p className="text-sm text-gray-400 sm:text-base">
              {stats.designsForApproval > 0 
                ? `You have ${stats.designsForApproval} design${stats.designsForApproval > 1 ? 's' : ''} awaiting your approval`
                : stats.pendingBriefResponses > 0
                ? `You have ${stats.pendingBriefResponses} new brief response${stats.pendingBriefResponses > 1 ? 's' : ''} from our team`
                : 'Track your orders and manage your account'
              }
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button 
              variant="secondary" 
              size="md" 
              className="w-full gap-2 sm:w-auto"
              onClick={() => setShowFeedbackModal(true)}
            >
              <span>💬</span>
              Send Feedback
            </Button>
            <Link href="/collections" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full gap-2 sm:w-auto">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-yellow-700 bg-yellow-900/30 p-4 sm:flex-row sm:items-center">
            <svg className="h-5 w-5 flex-shrink-0 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="flex-1 text-sm text-yellow-200">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="text-sm text-yellow-400 underline hover:text-yellow-300"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
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

          <Link href="/briefs/responses" className="block cursor-pointer relative">
            <SummaryCard
              title="Brief Responses"
              value={stats.pendingBriefResponses.toString()}
              icon="📝"
              color="purple"
              subtitle="Need your attention"
            />
            {stats.pendingBriefResponses > 0 && (
              <span className="absolute -right-1 -top-1 h-5 w-5 animate-pulse rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                {stats.pendingBriefResponses}
              </span>
            )}
          </Link>
          
          <Link href="/feedback" className="block cursor-pointer relative">
            <SummaryCard
              title="My Feedback"
              value={stats.totalFeedback.toString()}
              icon="💬"
              color="teal"
              subtitle="View all your feedback"
            />
            {stats.unreadFeedbackResponses > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[22px] h-5 rounded-full bg-red-500 text-xs flex items-center justify-center text-white font-bold px-1.5">
                {stats.unreadFeedbackResponses}
              </span>
            )}
          </Link>
        </div>

        {pendingBriefResponses.length > 0 && (
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white sm:text-xl">Recent Brief Responses</h2>
              <Link href="/briefs/responses" className="text-sm text-primary transition hover:text-primary-dark">
                View All →
              </Link>
            </div>
            
            <div className="space-y-3">
              {pendingBriefResponses.slice(0, 3).map((response, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleViewBriefResponse(response.briefId)}
                  className="cursor-pointer rounded-lg border border-purple-800 bg-gradient-to-br from-purple-900/20 to-purple-950/20 p-4 transition hover:border-purple-600"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white">Order #{response.orderNumber}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                        <span className="text-xs text-purple-400">New Response</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-300">
                        Admin responded to your brief for <span className="font-medium">{response.productName}</span>
                      </p>
                      {response.hasDesign && (
                        <p className="mt-1 text-xs text-green-400">✓ Includes design preview</p>
                      )}
                      {response.description && (
                        <p className="mt-1 text-xs text-gray-400 line-clamp-1">{response.description}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        {new Date(response.respondedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Button variant="primary" size="sm" className="w-full sm:w-auto">
                      View Response
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:gap-8">
          <div className="space-y-6 sm:space-y-8">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white sm:text-xl">Recent Orders</h2>
                <Link href="/order-history" className="text-sm text-primary transition hover:text-primary-dark">
                  View All →
                </Link>
              </div>
              
              {recentOrders.length === 0 ? (
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 text-center sm:p-8">
                  <p className="mb-3 text-gray-400">No active orders</p>
                  <Link href="/collections">
                    <Button variant="primary" size="sm">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
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
                          <div className="absolute right-2 top-2">
                            <span className="rounded-full bg-green-600/20 px-2 py-1 text-xs text-green-400">
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

            {ordersReadyForShipping.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white sm:text-xl">Ready for Shipping</h2>
                  <Link href="/shipping/orders" className="text-sm text-primary transition hover:text-primary-dark">
                    View All →
                  </Link>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  {ordersReadyForShipping.slice(0, 1).map((order) => (
                    <div key={order._id} className="rounded-lg border border-orange-800 bg-gradient-to-br from-orange-900/20 to-orange-950/20 p-3 sm:p-4">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <h3 className="text-sm font-medium text-white sm:text-base">{order.orderNumber}</h3>
                          <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                            {order.items?.length} item(s)
                          </p>
                        </div>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleSelectShipping(order._id)}
                          className="w-full sm:w-auto"
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

          <div className="space-y-6">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white sm:text-xl">Pending Invoices</h2>
                <Link href="/invoices?filter=pending" className="text-sm text-primary transition hover:text-primary-dark">
                  View All →
                </Link>
              </div>
              
              {unpaidInvoices.length === 0 ? (
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-4 text-center sm:p-6">
                  <p className="text-sm text-gray-400">No pending invoices</p>
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

            {unpaidShippingInvoices.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white sm:text-xl">Shipping Invoices</h2>
                  <Link href="/invoices?filter=shipping" className="text-sm text-primary transition hover:text-primary-dark">
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

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
          <Link href="/collections">
            <div className="cursor-pointer rounded-lg border border-blue-800 bg-gradient-to-br from-blue-900/30 to-blue-950/30 p-3 transition hover:border-blue-600 sm:p-4">
              <div className="mb-2 text-2xl sm:text-3xl">🛍️</div>
              <h4 className="text-sm font-medium text-white sm:text-base">Browse Products</h4>
              <p className="mt-1 hidden text-xs text-gray-400 sm:block">Explore our collection</p>
            </div>
          </Link>
          
          <Link href="/order-history">
            <div className="cursor-pointer rounded-lg border border-purple-800 bg-gradient-to-br from-purple-900/30 to-purple-950/30 p-3 transition hover:border-purple-600 sm:p-4">
              <div className="mb-2 text-2xl sm:text-3xl">📋</div>
              <h4 className="text-sm font-medium text-white sm:text-base">Order History</h4>
              <p className="mt-1 hidden text-xs text-gray-400 sm:block">View all your orders</p>
            </div>
          </Link>
          
          <Link href="/invoices">
            <div className="cursor-pointer rounded-lg border border-green-800 bg-gradient-to-br from-green-900/30 to-green-950/30 p-3 transition hover:border-green-600 sm:p-4">
              <div className="mb-2 text-2xl sm:text-3xl">📄</div>
              <h4 className="text-sm font-medium text-white sm:text-base">All Invoices</h4>
              <p className="mt-1 hidden text-xs text-gray-400 sm:block">View and manage invoices</p>
            </div>
          </Link>

          <Link href="/feedback">
            <div className="cursor-pointer rounded-lg border border-teal-800 bg-gradient-to-br from-teal-900/30 to-teal-950/30 p-3 transition hover:border-teal-600 sm:p-4">
              <div className="mb-2 text-2xl sm:text-3xl">💬</div>
              <h4 className="text-sm font-medium text-white sm:text-base">My Feedback</h4>
              <p className="mt-1 hidden text-xs text-gray-400 sm:block">View your feedback history</p>
            </div>
          </Link>
        </div>

        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-800 bg-slate-900">
              <div className="border-b border-gray-800 p-4 sm:p-6">
                <h2 className="text-xl font-bold text-white sm:text-2xl">Send New Feedback</h2>
                <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                  We'd love to hear from you! Whether it's praise, a complaint, or a suggestion.
                </p>
              </div>

              <div className="space-y-4 p-4 sm:p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    What would you like to give feedback about?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setFeedbackType('general');
                        setSelectedOrder('');
                      }}
                      className={`rounded-lg border p-2 text-sm transition sm:p-3 ${
                        feedbackType === 'general'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-700 bg-slate-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      General Feedback
                    </button>
                    <button
                      onClick={() => setFeedbackType('order')}
                      className={`rounded-lg border p-2 text-sm transition sm:p-3 ${
                        feedbackType === 'order'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-700 bg-slate-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      About an Order
                    </button>
                  </div>
                </div>

                {feedbackType === 'order' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Select Order
                    </label>
                    <select
                      value={selectedOrder}
                      onChange={(e) => setSelectedOrder(e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white"
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Your Feedback <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    placeholder="Tell us what you think..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Attachments (Optional)
                  </label>
                  <div className="rounded-lg border-2 border-dashed border-gray-700 p-4 text-center transition-colors hover:border-primary/50">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="feedback-attachments"
                    />
                    <label htmlFor="feedback-attachments" className="block cursor-pointer">
                      <svg className="mx-auto mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                    </label>
                  </div>
                </div>

                {feedbackFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Selected Files:</p>
                    {feedbackFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg bg-slate-800 p-2">
                        <span className="max-w-[200px] truncate text-sm text-white sm:max-w-[250px]">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

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