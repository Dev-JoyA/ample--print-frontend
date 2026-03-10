'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useProtectedRoute } from '@/app/lib/auth';
import { customerBriefService } from '@/services/customerBriefService';
import { useToast } from '@/components/providers/ToastProvider';

// Order statuses where customer can edit briefs
const EDITABLE_ORDER_STATUSES = ['Pending', 'OrderReceived', 'FilesUploaded'];

export default function BriefResponsePage({ params }) {
  const router = useRouter();
  // Unwrap params with React.use() to fix the warning
  const { id } = React.use(params);
  const { isLoading: authLoading, user } = useProtectedRoute({
    redirectTo: '/auth/sign-in'
  });
  const { showToast } = useToast();

  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [markingViewed, setMarkingViewed] = useState(false);
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [autoViewTimer, setAutoViewTimer] = useState(null);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchBrief();
    }
    return () => {
      if (autoViewTimer) {
        clearTimeout(autoViewTimer);
      }
    };
  }, [authLoading, user, id]);

  const fetchBrief = async () => {
    try {
      setLoading(true);
      setError('');
      setNotFound(false);
      
      const response = await customerBriefService.getById(id);
      console.log('Brief response:', response);
      
      // Handle different response structures
      const briefData = response?.data || response;
      
      if (briefData) {
        setBrief(briefData);
        
        // Check if order is still editable
        const orderStatus = briefData.orderId?.status;
        const canEdit = EDITABLE_ORDER_STATUSES.includes(orderStatus);
        setIsEditable(canEdit);
        
        // Determine if this is an admin response
        const isAdminResponse = briefData.role === 'Admin' || 
                               briefData.role === 'SuperAdmin' || 
                               briefData.uploadedBy?.role === 'Admin' || 
                               briefData.uploadedBy?.role === 'SuperAdmin';
        
        // Only auto-mark as viewed if:
        // 1. It's an admin response
        // 2. Order is still editable
        // 3. Not already viewed
        // 4. No response being typed
        if (isAdminResponse && canEdit && !briefData.viewed) {
          const timer = setTimeout(() => {
            markAsViewed();
          }, 20000); // 20 seconds
          
          setAutoViewTimer(timer);
        }
      } else {
        setNotFound(true);
        setError('Brief not found');
      }
    } catch (error) {
      console.error('Failed to fetch brief:', error);
      // Check if it's a 404 error
      if (error.message?.includes('404') || error.response?.status === 404) {
        setNotFound(true);
        setError('Brief not found');
      } else {
        setError('Failed to load brief response');
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async () => {
    if (brief?.viewed || markingViewed) return;
    
    // Clear the auto timer if it exists
    if (autoViewTimer) {
      clearTimeout(autoViewTimer);
      setAutoViewTimer(null);
    }
    
    try {
      setMarkingViewed(true);
      await customerBriefService.markAsViewed(id);
      
      setBrief(prev => ({ ...prev, viewed: true }));
      showToast('Response marked as reviewed', 'success');
      
      // Check if order is now ready for invoice (backend handles this)
      if (brief?.orderId?._id) {
        try {
          const statusResponse = await customerBriefService.getOrderBriefStatus(brief.orderId._id);
          if (statusResponse?.data?.allProductsReady) {
            showToast('✨ All responses reviewed! Order is moving to next stage.', 'success');
          }
        } catch (err) {
          console.error('Failed to check order status:', err);
        }
      }
    } catch (error) {
      console.error('Failed to mark as viewed:', error);
      showToast('Failed to mark as viewed', 'error');
    } finally {
      setMarkingViewed(false);
    }
  };

  const handleRespond = async () => {
    if (!responseText.trim()) {
      showToast('Please enter your response', 'error');
      return;
    }

    try {
      setResponding(true);
      
      // Clear auto-view timer since customer is responding
      if (autoViewTimer) {
        clearTimeout(autoViewTimer);
        setAutoViewTimer(null);
      }
      
      // Submit response - this creates a NEW customer brief
      await customerBriefService.submit(
        brief.orderId._id,
        brief.productId._id,
        { description: responseText }
      );
      
      showToast('Response sent successfully', 'success');
      
      // Refresh to show the new conversation thread
      await fetchBrief();
      setResponseText('');
      
    } catch (error) {
      console.error('Failed to send response:', error);
      showToast('Failed to send response', 'error');
    } finally {
      setResponding(false);
    }
  };

  const isAdminResponse = () => {
    return brief?.role === 'Admin' || 
           brief?.role === 'SuperAdmin' || 
           brief?.uploadedBy?.role === 'Admin' || 
           brief?.uploadedBy?.role === 'SuperAdmin';
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading response...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || error || !brief) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-red-200 text-lg mb-2">Brief Not Found</p>
            <p className="text-red-300 text-sm mb-6">
              {error || 'The brief you\'re looking for doesn\'t exist or has been deleted.'}
            </p>
            <Link href="/dashboards/customer-dashboard">
              <Button variant="primary">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const orderNumber = brief.orderId?.orderNumber || 'N/A';
  const productName = brief.productId?.name || 'Unknown Product';
  const hasDesign = !!brief.designId;
  const hasAttachments = brief.image || brief.voiceNote || brief.video;
  const isFromAdmin = isAdminResponse();
  const orderStatus = brief.orderId?.status;

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/orders/${brief.orderId?._id || brief.orderId}`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Order
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isFromAdmin ? 'Admin Response' : 'Your Message'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-400">
                  Order #{orderNumber} • {productName}
                </p>
                <StatusBadge status={orderStatus} />
              </div>
            </div>
            {isFromAdmin && !brief.viewed && isEditable && (
              <Button
                variant="primary"
                onClick={markAsViewed}
                loading={markingViewed}
              >
                Mark as Reviewed
              </Button>
            )}
            {isFromAdmin && brief.viewed && (
              <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm border border-green-700">
                ✓ Reviewed
              </span>
            )}
          </div>

          {/* Order Locked Warning */}
          {!isEditable && isFromAdmin && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-sm text-red-200">
                ⚠️ This order is no longer editable (Status: {orderStatus}). 
                You can view the response but cannot make changes.
              </p>
            </div>
          )}

          {/* Auto-view timer warning */}
          {isFromAdmin && !brief.viewed && autoViewTimer && isEditable && (
            <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-xs text-blue-200 flex items-center gap-2">
                <span className="animate-pulse">⏳</span>
                This will be automatically marked as reviewed in 20 seconds. 
                Responding will keep the conversation open.
              </p>
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="space-y-4 mb-6">
          {/* Current Message */}
          <div className={`p-6 rounded-xl ${
            isFromAdmin 
              ? 'bg-blue-900/20 border border-blue-800 ml-0 mr-12' 
              : 'bg-green-900/20 border border-green-800 ml-12 mr-0'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-white">
                {isFromAdmin ? 'Admin' : 'You'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(brief.createdAt).toLocaleString()}
              </span>
              {isFromAdmin && brief.viewed && (
                <span className="text-xs text-green-400 ml-auto">✓ Reviewed</span>
              )}
            </div>

            {/* Design Section */}
            {hasDesign && (
              <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-purple-400 mb-3">🎨 Design Uploaded</p>
                <Link href={`/design/${brief.designId}`}>
                  <Button variant="secondary" size="sm">
                    View Design
                  </Button>
                </Link>
              </div>
            )}

            {/* Message Content */}
            {brief.description && (
              <div className="mb-4">
                <p className="text-gray-300 whitespace-pre-wrap">
                  {brief.description}
                </p>
              </div>
            )}

            {/* Attachments */}
            {hasAttachments && (
              <div className="space-y-4">
                {brief.image && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Reference Image:</p>
                    <img 
                      src={brief.image} 
                      alt="Reference" 
                      className="max-w-full rounded-lg border border-gray-700"
                    />
                  </div>
                )}
                {brief.voiceNote && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Voice Note:</p>
                    <audio controls className="w-full">
                      <source src={brief.voiceNote} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                {brief.video && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Video:</p>
                    <video controls className="max-w-full rounded-lg border border-gray-700">
                      <source src={brief.video} type="video/mp4" />
                      Your browser does not support the video element.
                    </video>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Response Form - Only for admin messages when order is editable */}
        {isFromAdmin && isEditable && (
          <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your Response</h2>
            <textarea
              value={responseText}
              onChange={(e) => {
                setResponseText(e.target.value);
                // If customer starts typing, clear the auto-view timer
                if (autoViewTimer && e.target.value.length > 0) {
                  clearTimeout(autoViewTimer);
                  setAutoViewTimer(null);
                }
              }}
              placeholder="Type your response here..."
              className="w-full bg-slate-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary"
              rows="4"
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRespond}
                loading={responding}
                disabled={!responseText.trim()}
              >
                Send Response
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Note: Responding will create a new message and keep this conversation open.
            </p>
          </div>
        )}

        {/* Status Info */}
        <div className={`mt-6 rounded-lg border p-4 ${
          !isEditable ? 'bg-red-900/30 border-red-700' :
          brief.viewed ? 'bg-green-900/30 border-green-700' : 
          'bg-yellow-900/30 border-yellow-700'
        }`}>
          <div className="flex items-center gap-3">
            {!isEditable ? (
              <>
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="text-red-400 font-medium">Order Locked</p>
                  <p className="text-sm text-gray-400">
                    This order is in {orderStatus} status and cannot be modified.
                  </p>
                </div>
              </>
            ) : brief.viewed ? (
              <>
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-green-400 font-medium">Response Reviewed</p>
                  <p className="text-sm text-gray-400">
                    You've reviewed this response. The order will proceed when all items are ready.
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="text-yellow-400 font-medium">Awaiting Your Review</p>
                  <p className="text-sm text-gray-400">
                    Please review this response. You can either mark it as reviewed or respond back.
                    {autoViewTimer && " It will auto-review in 20 seconds if you don't respond."}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-6 flex justify-end gap-3">
          {brief.viewed ? (
            <Link href={`/orders/${brief.orderId?._id || brief.orderId}`}>
              <Button variant="primary">
                Continue to Order
              </Button>
            </Link>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => router.back()}
              >
                Back
              </Button>
              {isFromAdmin && isEditable && (
                <Button 
                  variant="primary" 
                  onClick={markAsViewed}
                  loading={markingViewed}
                >
                  I've Reviewed This
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}