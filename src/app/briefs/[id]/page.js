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

export default function BriefResponseDetailPage({ params }) {
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
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchBrief();
    }
  }, [authLoading, user, id]);

  const fetchBrief = async () => {
    try {
      setLoading(true);
      setError('');
      setNotFound(false);
      
      const response = await customerBriefService.getById(id);
      console.log('Brief detail response:', response);
      
      const briefData = response?.data || response;
      
      if (briefData) {
        setBrief(briefData);
        
        const orderStatus = briefData.orderId?.status;
        const canEdit = EDITABLE_ORDER_STATUSES.includes(orderStatus);
        setIsEditable(canEdit);
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
    
    try {
      setMarkingViewed(true);
      
      await customerBriefService.markAsViewed(id);
      
      setBrief(prev => ({ ...prev, viewed: true }));
      showToast('Response marked as reviewed', 'success');
      
      // Navigate back to order page after marking as viewed
      if (brief?.orderId?._id) {
        router.push(`/orders/${brief.orderId._id}`);
      }
      
    } catch (error) {
      console.error('Failed to mark as viewed:', error);
      showToast(error.message || 'Failed to mark as viewed', 'error');
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
      
      // Submit customer response (creates new customer brief)
      await customerBriefService.submit(
        brief.orderId._id,
        brief.productId._id,
        { description: responseText }
      );
      
      showToast('Response sent successfully', 'success');
      
      // Navigate to the conversation thread to see the full history
      router.push(`/orders/${brief.orderId._id}/products/${brief.productId._id}/briefs`);
      
    } catch (error) {
      console.error('Failed to send response:', error);
      showToast('Failed to send response', 'error');
    } finally {
      setResponding(false);
    }
  };

  const isAdminResponse = () => {
    return brief?.role === 'admin' || brief?.role === 'superAdmin';
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <SEOHead {...METADATA.briefs} />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 md:py-12">
          <div className="flex min-h-[50vh] items-center justify-center md:min-h-[60vh]">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent md:h-16 md:w-16"></div>
              <p className="text-sm text-gray-400 md:text-base">Loading response...</p>
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 md:py-12">
          <div className="rounded-lg border border-red-700 bg-red-900/30 p-6 text-center md:p-8">
            <div className="mb-4 text-5xl md:text-6xl">😕</div>
            <p className="mb-2 text-lg text-red-200 md:text-xl">Brief Not Found</p>
            <p className="mb-6 text-sm text-red-300 md:text-base">
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
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="mb-4 md:mb-6">
          <Link href={`/orders/${brief.orderId?._id || brief.orderId}`}>
            <Button variant="ghost" size="sm" className="mb-3 gap-2 md:mb-4">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Order
            </Button>
          </Link>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                {isFromAdmin ? 'Admin Response' : 'Your Message'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-400 md:text-base">
                  Order #{orderNumber} • {productName}
                </p>
                <StatusBadge status={orderStatus} />
              </div>
            </div>
            {/* Add this above the response form */}
    <div className="mb-4 rounded-lg border border-gray-700 bg-slate-900/50 p-4">
    <p className="text-sm text-gray-400 mb-2">Want to see the full conversation?</p>
    <Link href={`/orders/${brief.orderId?._id}/products/${brief.productId?._id}/briefs`}>
        <Button variant="secondary" size="sm">View Full Thread</Button>
    </Link>
    </div>
            {isFromAdmin && !brief.viewed && isEditable && (
              <Button
                variant="primary"
                size="sm"
                onClick={markAsViewed}
                disabled={markingViewed}
                className="w-full sm:w-auto"
              >
                {markingViewed ? 'Marking...' : 'Mark as Reviewed'}
              </Button>
            )}
            {isFromAdmin && brief.viewed && (
              <span className="rounded-full border border-green-700 bg-green-900/30 px-3 py-1 text-center text-xs text-green-400 sm:text-sm">
                ✓ Reviewed
              </span>
            )}
          </div>

          {!isEditable && isFromAdmin && (
            <div className="mt-3 rounded-lg border border-red-700 bg-red-900/30 p-3">
              <p className="text-sm text-red-200">
                ⚠️ This order is no longer editable (Status: {orderStatus}). 
                You can view the response but cannot make changes.
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 space-y-4">
          <div className={`rounded-xl p-4 sm:p-6 ${
            isFromAdmin 
              ? 'mr-0 ml-0 border border-blue-800 bg-blue-900/20 sm:mr-8 md:mr-12' 
              : 'mr-0 ml-0 border border-green-800 bg-green-900/20 sm:ml-8 md:ml-12'
          }`}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-white">
                {isFromAdmin ? 'Admin' : 'You'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(brief.createdAt).toLocaleString()}
              </span>
              {isFromAdmin && brief.viewed && (
                <span className="ml-auto text-xs text-green-400">✓ Reviewed</span>
              )}
            </div>

            {hasDesign && (
              <div className="mb-4 rounded-lg bg-slate-800/50 p-3 sm:p-4">
                <p className="mb-3 text-sm text-purple-400">🎨 Design Uploaded</p>
                <Link href={`/designs/${brief.designId}`}>
                  <Button variant="secondary" size="sm">
                    View Design
                  </Button>
                </Link>
              </div>
            )}

            {brief.description && (
              <div className="mb-4">
                <p className="whitespace-pre-line text-sm text-gray-300 sm:text-base">
                  {brief.description}
                </p>
              </div>
            )}

            {hasAttachments && (
              <div className="space-y-4">
                {brief.image && (
                  <div>
                    <p className="mb-2 text-sm text-gray-400">Reference Image:</p>
                    <img 
                      src={brief.image} 
                      alt="Reference" 
                      className="max-h-64 w-full max-w-full rounded-lg border border-gray-700 object-contain md:max-h-96"
                    />
                  </div>
                )}
                {brief.voiceNote && (
                  <div>
                    <p className="mb-2 text-sm text-gray-400">Voice Note:</p>
                    <audio controls className="w-full max-w-full">
                      <source src={brief.voiceNote} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                {brief.video && (
                  <div>
                    <p className="mb-2 text-sm text-gray-400">Video:</p>
                    <video controls className="max-h-64 w-full max-w-full rounded-lg border border-gray-700 md:max-h-96">
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
          <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Your Response</h2>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Type your response here..."
              className="w-full rounded-lg border border-gray-700 bg-slate-800 p-3 text-sm text-white focus:border-primary focus:outline-none sm:text-base"
              rows={4}
            />
            
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                disabled={responding || !responseText.trim()}
                className="w-full sm:w-auto"
              >
                {responding ? 'Sending...' : 'Send Response'}
              </Button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Note: Responding will create a new message and keep this conversation open.
            </p>
          </div>
        )}

        <div className={`mt-6 rounded-lg border p-3 sm:p-4 ${
          !isEditable ? 'border-red-700 bg-red-900/30' :
          brief.viewed ? 'border-green-700 bg-green-900/30' : 
          'border-yellow-700 bg-yellow-900/30'
        }`}>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <span className="text-2xl">{!isEditable ? '🔒' : brief.viewed ? '✅' : '⏳'}</span>
            <div>
              {!isEditable ? (
                <>
                  <p className="text-sm font-medium text-red-400 sm:text-base">Order Locked</p>
                  <p className="text-xs text-gray-400 sm:text-sm">
                    This order is in {orderStatus} status and cannot be modified.
                  </p>
                </>
              ) : brief.viewed ? (
                <>
                  <p className="text-sm font-medium text-green-400 sm:text-base">Response Reviewed</p>
                  <p className="text-xs text-gray-400 sm:text-sm">
                    You've reviewed this response. The order will proceed when all items are ready.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-yellow-400 sm:text-base">Awaiting Your Review</p>
                  <p className="text-xs text-gray-400 sm:text-sm">
                    Please review this response. You can either mark it as reviewed or respond back.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
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
              {isFromAdmin && isEditable && !brief.viewed && (
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={markAsViewed}
                  disabled={markingViewed}
                  className="w-full sm:w-auto"
                >
                  {markingViewed ? 'Marking...' : 'I\'ve Reviewed This'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}