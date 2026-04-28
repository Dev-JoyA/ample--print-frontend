'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { getImageUrl, getAudioUrl } from '@/lib/imageUtils';
import { formatDistanceToNow } from 'date-fns';

const EDITABLE_ORDER_STATUSES = ['Pending', 'OrderReceived', 'FilesUploaded'];

export default function BriefResponseDetailPage({ params }) {
  const router = useRouter();
  const { id } = React.use(params);
  const { isLoading: authLoading, user } = useProtectedRoute({ redirectTo: '/auth/sign-in' });
  const { showToast } = useToast();

  const [brief, setBrief] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [hasAutoMarked, setHasAutoMarked] = useState(false);

  const [responding, setResponding] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseFiles, setResponseFiles] = useState({ images: [], voiceNote: null, video: null });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const hasLeftPageRef = useRef(false);

  useEffect(() => {
    if (!authLoading && user) fetchBriefAndConversation();
  }, [authLoading, user, id]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      hasLeftPageRef.current = true;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!hasLeftPageRef.current && brief && !hasAutoMarked) {
        const isAdminBrief = brief.role === 'admin' || brief.role === 'super-admin';
        const shouldAutoMark = isAdminBrief && brief.status === 'responded' && !brief.viewed;

        if (shouldAutoMark) {
          customerBriefService
            .markAsViewed(brief._id)
            .catch((err) => console.error('Auto-mark on exit failed:', err));
        }
      }
    };
  }, [brief, hasAutoMarked]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const fetchBriefAndConversation = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await customerBriefService.getById(id);
      const briefData = response?.data || response;
      if (!briefData) {
        setNotFound(true);
        return;
      }

      setBrief(briefData);
      const orderId = briefData.orderId?._id || briefData.orderId;
      const productId = briefData.productId?._id || briefData.productId;
      if (orderId && productId) await fetchConversation(orderId.toString(), productId.toString());
    } catch (err) {
      console.error('Failed to fetch brief:', err);
      if (err.status === 404) setNotFound(true);
      else setError('Failed to load brief response');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (orderId, productId) => {
    try {
      setLoadingConversation(true);
      const response = await customerBriefService.getByOrderAndProduct(orderId, productId);
      let msgs = [];
      if (response?.data && Array.isArray(response.data)) msgs = response.data;
      else if (Array.isArray(response)) msgs = response;
      msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    } finally {
      setLoadingConversation(false);
    }
  };

  const adminMessages = messages.filter((m) => m.role === 'admin' || m.role === 'super-admin');
  const customerMessages = messages.filter((m) => m.role === 'customer');
  const latestAdmin = adminMessages[adminMessages.length - 1] || null;
  const latestCustomer = customerMessages[customerMessages.length - 1] || null;

  const hasAdminResponse = !!latestAdmin;
  const isAdminComplete = latestAdmin?.status === 'complete';
  const isAdminViewed = latestAdmin?.viewed === true;
  const hasCustomerRespondedAfter =
    latestCustomer &&
    latestAdmin &&
    new Date(latestCustomer.createdAt) > new Date(latestAdmin.createdAt);

  const isEditable = EDITABLE_ORDER_STATUSES.includes(brief?.orderId?.status);
  const canRespond =
    hasAdminResponse &&
    !hasCustomerRespondedAfter &&
    isEditable &&
    latestAdmin?.status === 'responded';
  const canMarkComplete =
    hasAdminResponse && !isAdminComplete && !hasCustomerRespondedAfter && isEditable;

  const markAsComplete = async () => {
    if (!latestAdmin || markingComplete) return;
    try {
      setMarkingComplete(true);
      setHasAutoMarked(true);
      await customerBriefService.markAsComplete(latestAdmin._id);
      showToast('Response marked as complete', 'success');
      await fetchBriefAndConversation();
      if (brief?.orderId?._id) router.push(`/orders/${brief.orderId._id}`);
    } catch (err) {
      showToast(err.message || 'Failed to mark as complete', 'error');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleRespond = async () => {
    const hasContent =
      responseText.trim() ||
      responseFiles.images.length > 0 ||
      responseFiles.voiceNote ||
      responseFiles.video;
    if (!hasContent) {
      showToast('Please add a message or attachment', 'error');
      return;
    }

    try {
      setResponding(true);
      const formData = new FormData();
      if (responseText.trim()) formData.append('description', responseText.trim());
      responseFiles.images.forEach((f) => formData.append('image', f));
      if (responseFiles.voiceNote) {
        const af = new File([responseFiles.voiceNote], `voice-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        formData.append('voiceNote', af);
      }
      if (responseFiles.video) formData.append('video', responseFiles.video);

      const orderId = brief.orderId?._id || brief.orderId;
      const productId = brief.productId?._id || brief.productId;
      await customerBriefService.replyToAdmin(orderId, productId, formData);

      showToast('Response sent!', 'success');
      setShowResponseForm(false);
      setResponseText('');
      setResponseFiles({ images: [], voiceNote: null, video: null });
      setAudioBlob(null);
      setAudioUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';

      await fetchConversation(orderId.toString(), productId.toString());
      await fetchBriefAndConversation();
    } catch (err) {
      showToast(err.message || 'Failed to send response', 'error');
    } finally {
      setResponding(false);
    }
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'images')
      setResponseFiles((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    else if (type === 'video') setResponseFiles((prev) => ({ ...prev, video: files[0] }));
  };

  const removeFile = (type, index = null) => {
    if (type === 'images')
      setResponseFiles((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    else if (type === 'video') {
      setResponseFiles((prev) => ({ ...prev, video: null }));
      if (videoInputRef.current) videoInputRef.current.value = '';
    } else if (type === 'voiceNote') discardRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setResponseFiles((prev) => ({ ...prev, voiceNote: blob }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch (err) {
      showToast('Microphone access denied', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setResponseFiles((prev) => ({ ...prev, voiceNote: null }));
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const getRoleBadge = (role) => {
    const r = role?.toLowerCase();
    if (r === 'customer')
      return (
        <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">You</span>
      );
    if (r === 'admin')
      return (
        <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">
          Admin
        </span>
      );
    return (
      <span className="rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-400">
        Super Admin
      </span>
    );
  };

  const isAdminMsg = (role) => role === 'admin' || role === 'super-admin' || role === 'superadmin';

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !brief) {
    return (
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mb-4 text-5xl">😕</div>
          <p className="mb-6 text-gray-400">
            {error || "This brief doesn't exist or has been removed."}
          </p>
          <Link href="/dashboards">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const orderNumber = brief.orderId?.orderNumber || 'N/A';
  const productName = brief.productId?.name || 'Unknown Product';
  const orderStatus = brief.orderId?.status;

  return (
    <DashboardLayout userRole="customer">
      <SEOHead {...METADATA.briefs} title={`Brief | ${productName}`} />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <Link href={`/orders/${brief.orderId?._id || brief.orderId}`}>
            <Button variant="ghost" size="sm" className="mb-4 gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Order
            </Button>
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Conversation</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-400">
                <span>Order #{orderNumber}</span>
                <span className="text-gray-600">•</span>
                <span>{productName}</span>
                {orderStatus && <StatusBadge status={orderStatus} />}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50">
          <div className="border-b border-gray-800 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <span>💬</span> Conversation History
            </h2>
          </div>

          <div className="max-h-[480px] space-y-4 overflow-y-auto p-5">
            {loadingConversation ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No messages yet</p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={`flex ${isAdminMsg(msg.role) ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-4 ${
                      isAdminMsg(msg.role)
                        ? 'border border-green-800/50 bg-green-900/20'
                        : 'border border-blue-800/50 bg-blue-900/20'
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {getRoleBadge(msg.role)}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </span>
                      {isAdminMsg(msg.role) && msg.status === 'complete' && (
                        <span className="text-xs text-green-400">✓ Complete</span>
                      )}
                    </div>

                    {msg.description && (
                      <p className="mb-3 whitespace-pre-wrap text-sm text-gray-300">
                        {msg.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {msg.image && (
                        <button
                          onClick={() => setPreviewImage(getImageUrl(msg.image))}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs text-blue-400 transition hover:bg-slate-700"
                        >
                          🖼️ View Image
                        </button>
                      )}
                      {msg.voiceNote && (
                        <div className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-3 py-1.5">
                          <span className="text-green-400">🎤</span>
                          <audio controls className="h-7 max-w-[180px]">
                            <source src={getAudioUrl(msg.voiceNote)} />
                          </audio>
                        </div>
                      )}
                      {msg.video && (
                        <button
                          onClick={() => setPreviewVideo(getImageUrl(msg.video))}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs text-red-400 transition hover:bg-slate-700"
                        >
                          🎥 Play Video
                        </button>
                      )}
                      {msg.logo && (
                        <button
                          onClick={() => setPreviewImage(getImageUrl(msg.logo))}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs text-purple-400 transition hover:bg-slate-700"
                        >
                          🎨 View Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {hasAdminResponse && !hasCustomerRespondedAfter && latestAdmin?.status === 'responded' && (
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50">
            {!showResponseForm ? (
              <div className="p-5">
                <p className="mb-4 text-sm text-gray-400">
                  Admin has responded to your brief. Review and choose your next step.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {canRespond && (
                    <Button
                      variant="secondary"
                      size="md"
                      className="flex-1"
                      onClick={() => setShowResponseForm(true)}
                    >
                      Reply to Admin
                    </Button>
                  )}
                  {canMarkComplete && (
                    <Button
                      variant="primary"
                      size="md"
                      className="flex-1"
                      onClick={markAsComplete}
                      disabled={markingComplete}
                    >
                      {markingComplete ? 'Marking...' : '✓ Mark as Complete'}
                    </Button>
                  )}
                </div>
                {!isEditable && (
                  <p className="mt-3 text-xs text-yellow-400">
                    ⚠️ Order is {orderStatus} — responses are locked.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">Your Reply</h2>
                  <button
                    onClick={() => {
                      setShowResponseForm(false);
                      setResponseText('');
                    }}
                    className="text-gray-500 transition hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response here..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-700 bg-slate-800 p-3 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <label
                    htmlFor="img-upload"
                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-blue-400 transition hover:bg-slate-700"
                  >
                    🖼️ Images
                    <input
                      id="img-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => handleFileChange(e, 'images')}
                    />
                  </label>
                  <label
                    htmlFor="vid-upload"
                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-red-400 transition hover:bg-slate-700"
                  >
                    🎥 Video
                    <input
                      id="vid-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      ref={videoInputRef}
                      onChange={(e) => handleFileChange(e, 'video')}
                    />
                  </label>
                  {!isRecording && !audioBlob && (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-green-400 transition hover:bg-slate-700"
                    >
                      🎤 Record
                    </button>
                  )}
                  {isRecording && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <span className="font-mono text-xs text-red-400">
                        {formatTime(recordingTime)}
                      </span>
                      <button onClick={stopRecording} className="text-white hover:text-gray-300">
                        ■
                      </button>
                    </div>
                  )}
                  {audioBlob && (
                    <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2">
                      <audio controls src={audioUrl} className="h-7 max-w-[150px]" />
                      <button
                        onClick={discardRecording}
                        className="text-gray-400 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {(responseFiles.images.length > 0 || responseFiles.video) && (
                  <div className="mt-3 flex flex-wrap gap-2 rounded-lg bg-slate-800/50 p-3">
                    {responseFiles.images.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 rounded-lg bg-slate-700 px-2 py-1"
                      >
                        <span className="text-xs text-blue-400">🖼️</span>
                        <span className="max-w-[100px] truncate text-xs text-gray-300">
                          {f.name}
                        </span>
                        <button
                          onClick={() => removeFile('images', i)}
                          className="text-gray-500 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {responseFiles.video && (
                      <div className="flex items-center gap-1 rounded-lg bg-slate-700 px-2 py-1">
                        <span className="text-xs text-red-400">🎥</span>
                        <span className="max-w-[100px] truncate text-xs text-gray-300">
                          {responseFiles.video.name}
                        </span>
                        <button
                          onClick={() => removeFile('video')}
                          className="text-gray-500 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setShowResponseForm(false);
                      setResponseText('');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleRespond}
                    disabled={responding}
                    className="w-full sm:w-auto"
                  >
                    {responding ? 'Sending...' : 'Send Response'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {hasCustomerRespondedAfter && (
          <div className="rounded-lg border border-gray-700 bg-slate-800/50 p-4 text-center">
            <p className="text-sm text-gray-400">
              ✓ You've replied. Waiting for the admin to respond.
            </p>
          </div>
        )}

        {isAdminComplete && !hasCustomerRespondedAfter && !showResponseForm && (
          <div className="rounded-lg border border-green-800 bg-green-900/20 p-4 text-center">
            <p className="text-sm text-green-400">
              ✓ This response has been marked as complete. The order will proceed when all items are
              ready.
            </p>
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -right-3 -top-3 rounded-full bg-slate-800 p-1.5 text-white hover:bg-slate-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {previewVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewVideo(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <video
              controls
              autoPlay
              src={previewVideo}
              className="max-h-[85vh] max-w-[90vw] rounded-lg"
            />
            <button
              onClick={() => setPreviewVideo(null)}
              className="absolute -right-3 -top-3 rounded-full bg-slate-800 p-1.5 text-white hover:bg-slate-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
