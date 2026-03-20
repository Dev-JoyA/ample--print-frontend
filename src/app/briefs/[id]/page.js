'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { useProtectedRoute } from '@/app/lib/auth';
import { customerBriefService } from '@/services/customerBriefService';
import { useToast } from '@/components/providers/ToastProvider';

const EDITABLE_ORDER_STATUSES = ['Pending', 'OrderReceived', 'FilesUploaded'];

export default function BriefResponsePage({ params }) {
  const router = useRouter();
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
      
      const briefData = response?.data || response;
      
      if (briefData) {
        setBrief(briefData);
        const orderStatus = briefData.orderId?.status;
        const canEdit = EDITABLE_ORDER_STATUSES.includes(orderStatus);
        setIsEditable(canEdit);
        
        const isAdminResponse = briefData.role === 'Admin' || 
                               briefData.role === 'SuperAdmin' || 
                               briefData.uploadedBy?.role === 'Admin' || 
                               briefData.uploadedBy?.role === 'SuperAdmin';
        
        if (isAdminResponse && canEdit && !briefData.viewed) {
          const timer = setTimeout(() => {
            markAsViewed();
          }, 20000);
          setAutoViewTimer(timer);
        }
      } else {
        setNotFound(true);
        setError('Brief not found');
      }
    } catch (error) {
      console.error('Failed to fetch brief:', error);
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
    
    if (autoViewTimer) {
      clearTimeout(autoViewTimer);
      setAutoViewTimer(null);
    }
    
    try {
      setMarkingViewed(true);
      await customerBriefService.markAsViewed(id);
      
      setBrief(prev => ({ ...prev, viewed: true }));
      showToast('Response marked as reviewed', 'success');
      
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
      
      if (autoViewTimer) {
        clearTimeout(autoViewTimer);
        setAutoViewTimer(null);
      }
      
      await customerBriefService.submit(
        brief.orderId._id,
        brief.productId._id,
        { description: responseText }
      );
      
      showToast('Response sent successfully', 'success');
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
        <SEOHead {...METADATA.briefs} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex justify-center items-center min-h-[50vh] md:min-h-[60vh]">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm md:text-base">Loading response...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || error || !brief) {
    return (
      <DashboardLayout userRole="customer">
        <SEOHead {...METADATA.briefs} noIndex={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 md:p-8 text-center">
            <div className="text-5xl md:text-6xl mb-4">😕</div>
            <p className="text-red-200 text-lg md:text-xl mb-2">Brief Not Found</p>
            <p className="text-red-300 text-sm md:text-base mb-6">
              {error || 'The brief you\'re looking for doesn\'t exist or has been deleted.'}
            </p>
            <Link href="/dashboards">
              <Button variant="primary" size="md">
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
      <SEOHead {...METADATA.briefs} title={`Brief Response | ${productName}`} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        <div className="mb-4 md:mb-6">
          <Link href={`/orders/${brief.orderId?._id || brief.orderId}`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-3 md:mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Order
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                {isFromAdmin ? 'Admin Response' : 'Your Message'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-gray-400 text-sm md:text-base">
                  Order #{orderNumber} • {productName}
                </p>
                <StatusBadge status={orderStatus} />
              </div>
            </div>
            {isFromAdmin && !brief.viewed && isEditable && (
              <Button
                variant="primary"
                size="sm"
                onClick={markAsViewed}
                loading={markingViewed}
                className="w-full sm:w-auto"
              >
                Mark as Reviewed
              </Button>
            )}
            {isFromAdmin && brief.viewed && (
              <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs sm:text-sm border border-green-700 text-center">
                ✓ Reviewed
              </span>
            )}
          </div>

          {!isEditable && isFromAdmin && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-sm text-red-200">
                ⚠️ This order is no longer editable (Status: {orderStatus}). 
                You can view the response but cannot make changes.
              </p>
            </div>
          )}

          {isFromAdmin && !brief.viewed && autoViewTimer && isEditable && (
            <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-xs text-blue-200 flex flex-wrap items-center gap-2">
                <span className="animate-pulse">⏳</span>
                This will be automatically marked as reviewed in 20 seconds. 
                Responding will keep the conversation open.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div className={`p-4 sm:p-6 rounded-xl ${
            isFromAdmin 
              ? 'bg-blue-900/20 border border-blue-800 ml-0 mr-4 sm:mr-8 md:mr-12' 
              : 'bg-green-900/20 border border-green-800 ml-4 sm:ml-8 md:ml-12 mr-0'
          }`}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
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

            {hasDesign && (
              <div className="mb-4 p-3 sm:p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-purple-400 mb-3">🎨 Design Uploaded</p>
                <Link href={`/design/${brief.designId}`}>
                  <Button variant="secondary" size="sm">
                    View Design
                  </Button>
                </Link>
              </div>
            )}

            {brief.description && (
              <div className="mb-4">
                <p className="text-gray-300 whitespace-pre-line text-sm sm:text-base">
                  {brief.description}
                </p>
              </div>
            )}

            {hasAttachments && (
              <div className="space-y-4">
                {brief.image && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Reference Image:</p>
                    <img 
                      src={brief.image} 
                      alt="Reference" 
                      className="max-w-full rounded-lg border border-gray-700 max-h-64 md:max-h-96 object-contain"
                    />
                  </div>
                )}
                {brief.voiceNote && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Voice Note:</p>
                    <audio controls className="w-full max-w-full">
                      <source src={brief.voiceNote} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                {brief.video && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Video:</p>
                    <video controls className="max-w-full rounded-lg border border-gray-700 max-h-64 md:max-h-96">
                      <source src={brief.video} type="video/mp4" />
                      Your browser does not support the video element.
                    </video>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isFromAdmin && isEditable && (
          <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your Response</h2>
            <textarea
              value={responseText}
              onChange={(e) => {
                setResponseText(e.target.value);
                if (autoViewTimer && e.target.value.length > 0) {
                  clearTimeout(autoViewTimer);
                  setAutoViewTimer(null);
                }
              }}
              placeholder="Type your response here..."
              className="w-full bg-slate-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary text-sm sm:text-base"
              rows={4}
            />
            
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
              <Button
                variant="outline"
                size="md"
                onClick={() => router.back()}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleRespond}
                loading={responding}
                disabled={!responseText.trim()}
                className="w-full sm:w-auto"
              >
                Send Response
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Note: Responding will create a new message and keep this conversation open.
            </p>
          </div>
        )}

        <div className={`mt-6 rounded-lg border p-3 sm:p-4 ${
          !isEditable ? 'bg-red-900/30 border-red-700' :
          brief.viewed ? 'bg-green-900/30 border-green-700' : 
          'bg-yellow-900/30 border-yellow-700'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-2xl">{!isEditable ? '🔒' : brief.viewed ? '✅' : '⏳'}</span>
            <div>
              {!isEditable ? (
                <>
                  <p className="text-red-400 font-medium text-sm sm:text-base">Order Locked</p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    This order is in {orderStatus} status and cannot be modified.
                  </p>
                </>
              ) : brief.viewed ? (
                <>
                  <p className="text-green-400 font-medium text-sm sm:text-base">Response Reviewed</p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    You've reviewed this response. The order will proceed when all items are ready.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-yellow-400 font-medium text-sm sm:text-base">Awaiting Your Review</p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Please review this response. You can either mark it as reviewed or respond back.
                    {autoViewTimer && " It will auto-review in 20 seconds if you don't respond."}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
          {brief.viewed ? (
            <Link href={`/orders/${brief.orderId?._id || brief.orderId}`} className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto">
                Continue to Order
              </Button>
            </Link>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="md"
                onClick={() => router.back()}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
              {isFromAdmin && isEditable && (
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={markAsViewed}
                  loading={markingViewed}
                  className="w-full sm:w-auto"
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