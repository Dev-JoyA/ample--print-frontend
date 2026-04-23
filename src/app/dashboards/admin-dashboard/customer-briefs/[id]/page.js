'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { useAuthCheck } from '@/app/lib/auth';
import { customerBriefService } from '@/services/customerBriefService';
import { designService } from '@/services/designService';
import { getImageUrl, getDownloadUrl, getAudioUrl, getProductImageUrl } from '@/lib/imageUtils';

export default function CustomerBriefDetailPage({ params }) {
  const router = useRouter();
  useAuthCheck();

  const [resolvedParams, setResolvedParams] = useState(null);
  const [brief, setBrief] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState('');
  const [hasAutoMarked, setHasAutoMarked] = useState(false);

  const [responseText, setResponseText] = useState('');
  const [responseFiles, setResponseFiles] = useState({
    images: [],
    logo: null,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const statusColors = {
    pending: 'blue',
    responded: 'green',
    viewed: 'purple',
  };

  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const unwrappedParams = await params;
        setResolvedParams(unwrappedParams);
      } catch (err) {
        console.error('Failed to unwrap params:', err);
        setError('Failed to load page parameters');
        setLoading(false);
      }
    };

    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchBriefDetails(resolvedParams.id);
    }
  }, [resolvedParams]);

  // AUTO-MARK: When admin opens customer brief, mark it as viewed by admin
  useEffect(() => {
    const autoMarkAsViewedByAdmin = async () => {
      if (!hasAutoMarked && brief?._id && !brief.viewedByAdmin) {
        try {
          await customerBriefService.markAsViewedByAdmin(brief._id);
          setHasAutoMarked(true);
          setBrief((prev) => ({ ...prev, viewedByAdmin: true }));
          console.log('Auto-marked brief as viewed by admin');
        } catch (err) {
          console.error('Failed to mark as viewed by admin:', err);
        }
      }
    };

    autoMarkAsViewedByAdmin();
  }, [brief?._id, brief?.viewedByAdmin, hasAutoMarked]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const fetchBriefDetails = async (briefId) => {
    try {
      setLoading(true);
      const response = await customerBriefService.getById(briefId);
      console.log('Brief details:', response);

      const briefData = response?.data || response;
      setBrief(briefData);

      if (briefData?.orderId && briefData?.productId) {
        const orderId = briefData.orderId?._id || briefData.orderId;
        const productId = briefData.productId?._id || briefData.productId;
        await fetchConversation(orderId.toString(), productId.toString());
      }
    } catch (error) {
      console.error('Failed to fetch brief:', error);
      setError('Failed to load brief details');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: fetchConversation - handles array response from backend
  const fetchConversation = async (orderId, productId) => {
    try {
      setLoadingConversation(true);

      const response = await customerBriefService.getByOrderAndProduct(orderId, productId);
      console.log('Conversation response:', response);

      let allMessages = [];

      // Handle the new array format from backend
      if (response?.data && Array.isArray(response.data)) {
        allMessages = response.data;
      } else if (Array.isArray(response)) {
        allMessages = response;
      } else if (response?.data) {
        // Old format fallback
        const data = response.data;
        if (data.customer) allMessages.push({ ...data.customer, role: 'customer' });
        if (data.admin) allMessages.push({ ...data.admin, role: 'admin' });
        if (data.superAdmin) allMessages.push({ ...data.superAdmin, role: 'super-admin' });
      }

      // Sort chronologically (oldest first)
      allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setConversation(allMessages);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    } finally {
      setLoadingConversation(false);
    }
  };

  const determineBriefStatus = (brief) => {
    if (brief.viewedByAdmin) return 'viewed';
    if (brief.hasAdminResponse) return 'responded';
    return 'pending';
  };

  // FIXED: getRoleBadge - case insensitive
  const getRoleBadge = (role) => {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
      case 'customer':
        return (
          <span className="rounded-full bg-blue-600/20 px-2 py-1 text-xs font-medium text-blue-400">
            Customer
          </span>
        );
      case 'admin':
        return (
          <span className="rounded-full bg-green-600/20 px-2 py-1 text-xs font-medium text-green-400">
            Admin
          </span>
        );
      case 'super-admin':
      case 'superadmin':
        return (
          <span className="rounded-full bg-purple-600/20 px-2 py-1 text-xs font-medium text-purple-400">
            Super Admin
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);

    if (type === 'images') {
      setResponseFiles((prev) => ({
        ...prev,
        images: [...prev.images, ...files],
      }));
    } else if (type === 'logo') {
      setResponseFiles((prev) => ({
        ...prev,
        logo: files[0],
      }));
    }
  };

  const removeFile = (type, index = null) => {
    if (type === 'images' && index !== null) {
      setResponseFiles((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else if (type === 'logo') {
      setResponseFiles((prev) => ({
        ...prev,
        logo: null,
      }));
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Could not access microphone. Please check your permissions.');
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
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitResponse = async () => {
    if (
      !responseText.trim() &&
      responseFiles.images.length === 0 &&
      !responseFiles.logo &&
      !audioBlob
    ) {
      alert('Please add some content to your response');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      if (responseText.trim()) {
        formData.append('description', responseText.trim());
      }

      responseFiles.images.forEach((file) => {
        formData.append('image', file);
      });

      if (responseFiles.logo) {
        formData.append('logo', responseFiles.logo);
      }

      if (audioBlob) {
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        formData.append('voiceNote', audioFile);
      }

      const orderId = brief.orderId?._id || brief.orderId;
      const productId = brief.productId?._id || brief.productId;

      await customerBriefService.adminRespond(orderId, productId, formData);

      await fetchConversation(orderId, productId);

      setResponseText('');
      setResponseFiles({
        images: [],
        logo: null,
      });
      setAudioBlob(null);
      setAudioUrl(null);

      if (fileInputRef.current) fileInputRef.current.value = '';
      if (logoInputRef.current) logoInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to submit response:', err);
      alert('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !resolvedParams) {
    return (
      <DashboardLayout userRole="admin">
        <SEOHead {...METADATA.briefs} />
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !brief) {
    return (
      <DashboardLayout userRole="admin">
        <SEOHead {...METADATA.briefs} />
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-4 text-sm text-red-200">
              {error || 'Brief not found'}
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              ← Go Back
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const status = determineBriefStatus(brief);
  const orderNumber = brief.orderId?.orderNumber || 'N/A';
  const productName = brief.productId?.name || brief.productName || 'Unknown Product';
  const customerName = brief.orderId?.userId?.email?.split('@')[0] || 'Customer';
  const hasFiles = brief.image || brief.voiceNote || brief.video || brief.logo;

  return (
    <DashboardLayout userRole="admin">
      <SEOHead {...METADATA.briefs} />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
              ← Back to Briefs
            </Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-xl sm:h-12 sm:w-12 sm:text-2xl">
                  📝
                </div>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
                      Customer Brief
                    </h1>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium bg-${statusColors[status]}-600/20 text-${statusColors[status]}-400`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 sm:text-sm">
                    Order #{orderNumber} • {productName} • {customerName}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <div className="rounded-lg bg-slate-800/50 px-3 py-2 text-center sm:px-4">
                  <p className="text-[10px] text-gray-400 sm:text-xs">Files</p>
                  <p className="text-base font-bold text-white sm:text-lg">
                    {[
                      brief.image && '📷',
                      brief.voiceNote && '🎤',
                      brief.video && '🎥',
                      brief.logo && '🎨',
                    ].filter(Boolean).length || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 px-3 py-2 text-center sm:px-4">
                  <p className="text-[10px] text-gray-400 sm:text-xs">Responses</p>
                  <p className="text-base font-bold text-white sm:text-lg">{conversation.length}</p>
                </div>
                <div className="rounded-lg bg-slate-800/50 px-3 py-2 text-center sm:px-4">
                  <p className="text-[10px] text-gray-400 sm:text-xs">Submitted</p>
                  <p className="text-base font-bold text-white sm:text-lg">
                    {getTimeAgo(brief.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!brief.viewedByAdmin && (
            <div className="mb-6 rounded-lg border border-blue-700 bg-blue-900/30 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-blue-400">
                <span className="text-sm">👁️</span>
                <span className="text-sm font-medium">Auto-marked as viewed by admin</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-1">
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50 backdrop-blur-sm">
                <div className={`h-1 bg-${statusColors[status]}-500`}></div>
                <div className="p-4 sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white sm:text-lg">
                    <span className="text-primary">📋</span>
                    Customer Request
                  </h2>

                  <div className="space-y-4">
                    {brief.description ? (
                      <div className="rounded-lg bg-slate-800/50 p-3 sm:p-4">
                        <p className="mb-2 text-xs text-gray-400 sm:text-sm">Description</p>
                        <p className="whitespace-pre-wrap break-words text-sm text-white sm:text-base">
                          {brief.description}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                        <p className="text-sm text-gray-500">No description provided</p>
                      </div>
                    )}

                    {hasFiles && (
                      <div>
                        <p className="mb-2 text-xs text-gray-400 sm:text-sm">Attachments</p>
                        <div className="space-y-2">
                          {brief.image && (
                            <button
                              onClick={() => setPreviewImage(getImageUrl(brief.image))}
                              className="group flex w-full items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2 transition hover:bg-slate-800 sm:px-4 sm:py-3"
                            >
                              <span className="text-xl sm:text-2xl">🖼️</span>
                              <div className="flex-1 text-left">
                                <p className="text-xs text-white sm:text-sm">Reference Image</p>
                                <p className="text-[10px] text-gray-500 sm:text-xs">
                                  Click to preview
                                </p>
                              </div>
                              <span className="text-gray-500 group-hover:text-white">→</span>
                            </button>
                          )}

                          {brief.voiceNote && (
                            <div className="rounded-lg bg-slate-800/50 px-3 py-2 sm:px-4 sm:py-3">
                              <div className="mb-2 flex items-center gap-2 sm:gap-3">
                                <span className="text-xl sm:text-2xl">🎤</span>
                                <span className="text-xs text-white sm:text-sm">Voice Note</span>
                              </div>
                              <audio controls className="h-8 w-full">
                                <source src={getAudioUrl(brief.voiceNote)} />
                              </audio>
                            </div>
                          )}

                          {brief.video && (
                            <button
                              onClick={() => setPreviewVideo(getImageUrl(brief.video))}
                              className="group flex w-full items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2 transition hover:bg-slate-800 sm:px-4 sm:py-3"
                            >
                              <span className="text-xl sm:text-2xl">🎥</span>
                              <div className="flex-1 text-left">
                                <p className="text-xs text-white sm:text-sm">Video Reference</p>
                                <p className="text-[10px] text-gray-500 sm:text-xs">
                                  Click to play
                                </p>
                              </div>
                              <span className="text-gray-500 group-hover:text-white">→</span>
                            </button>
                          )}

                          {brief.logo && (
                            <button
                              onClick={() => setPreviewImage(getImageUrl(brief.logo))}
                              className="group flex w-full items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2 transition hover:bg-slate-800 sm:px-4 sm:py-3"
                            >
                              <span className="text-xl sm:text-2xl">🎨</span>
                              <div className="flex-1 text-left">
                                <p className="text-xs text-white sm:text-sm">Logo</p>
                                <p className="text-[10px] text-gray-500 sm:text-xs">
                                  Click to preview
                                </p>
                              </div>
                              <span className="text-gray-500 group-hover:text-white">→</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="border-b border-gray-800 p-4 sm:p-6">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-white sm:text-lg">
                    <span className="text-primary">💬</span>
                    Conversation History
                  </h2>
                </div>

                <div className="max-h-[400px] space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6">
                  {loadingConversation ? (
                    <div className="flex justify-center py-8">
                      <div className="border-3 h-8 w-8 animate-spin rounded-full border-primary border-t-transparent"></div>
                    </div>
                  ) : conversation.length > 0 ? (
                    conversation.map((msg, index) => {
                      const isAdminMsg =
                        msg.role === 'admin' ||
                        msg.role === 'super-admin' ||
                        msg.role === 'superadmin';
                      const isCustomerMsg = msg.role === 'customer';

                      return (
                        <div
                          key={index}
                          className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[90%] sm:max-w-[80%] ${
                              isAdminMsg
                                ? 'border border-primary/20 bg-primary/10'
                                : 'border border-gray-700 bg-slate-800/50'
                            } rounded-xl p-3 sm:p-4`}
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              {getRoleBadge(msg.role)}
                              <span className="text-[10px] text-gray-500 sm:text-xs">
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>

                            {msg.description && (
                              <p className="mb-3 whitespace-pre-wrap break-words text-sm text-gray-300 sm:text-base">
                                {msg.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {msg.image && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setPreviewImage(getImageUrl(msg.image))}
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-blue-400 transition hover:bg-slate-700 sm:px-3 sm:py-1.5 sm:text-sm"
                                  >
                                    <span>🖼️</span>
                                    View Image
                                  </button>
                                  <a
                                    href={getDownloadUrl(msg.image)}
                                    download
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-gray-300 transition hover:bg-slate-700 sm:px-3 sm:py-1.5 sm:text-sm"
                                  >
                                    <span>⬇️</span>
                                    Download
                                  </a>
                                </div>
                              )}

                              {msg.voiceNote && (
                                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-700/50 px-2 py-1 sm:px-3 sm:py-1.5">
                                  <span className="text-green-400">🎤</span>
                                  <audio controls className="h-8 max-w-[150px] sm:max-w-[200px]">
                                    <source src={getAudioUrl(msg.voiceNote)} />
                                  </audio>
                                  <a
                                    href={getDownloadUrl(msg.voiceNote)}
                                    download
                                    className="text-gray-400 hover:text-white"
                                  >
                                    <svg
                                      className="h-3 w-3 sm:h-4 sm:w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                      />
                                    </svg>
                                  </a>
                                </div>
                              )}

                              {msg.video && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setPreviewVideo(getImageUrl(msg.video))}
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-red-400 transition hover:bg-slate-700 sm:px-3 sm:py-1.5 sm:text-sm"
                                  >
                                    <span>🎥</span>
                                    View Video
                                  </button>
                                  <a
                                    href={getDownloadUrl(msg.video)}
                                    download
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-gray-300 transition hover:bg-slate-700 sm:px-3 sm:py-1.5 sm:text-sm"
                                  >
                                    <span>⬇️</span>
                                    Download
                                  </a>
                                </div>
                              )}

                              {msg.logo && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setPreviewImage(getImageUrl(msg.logo))}
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-purple-400 transition hover:bg-slate-700 sm:px-3 sm:py-1.5 sm:text-sm"
                                  >
                                    <span>🎨</span>
                                    View Logo
                                  </button>
                                  <a
                                    href={getDownloadUrl(msg.logo)}
                                    download
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-gray-300 transition hover:bg-slate-700 sm:px-3 sm:py-1.5 sm:text-sm"
                                  >
                                    <span>⬇️</span>
                                    Download
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-gray-500">No conversation history</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="border-b border-gray-800 p-4 sm:p-6">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-white sm:text-lg">
                    <span className="text-primary">✏️</span>
                    Your Response
                  </h2>
                </div>

                <div className="space-y-4 p-4 sm:p-6">
                  <Textarea
                    placeholder="Type your response here..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={3}
                    className="w-full border-gray-700 bg-slate-800 text-sm focus:border-primary sm:text-base"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    {!isRecording && !audioBlob ? (
                      <button
                        onClick={startRecording}
                        className="flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-2 text-sm text-red-400 transition hover:bg-red-600/30 sm:px-4"
                      >
                        <span>🎤</span>
                        <span>Record Voice Note</span>
                      </button>
                    ) : isRecording ? (
                      <div className="flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-2 sm:gap-3 sm:px-4">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500 sm:h-3 sm:w-3"></span>
                        <span className="font-mono text-xs text-red-400 sm:text-sm">
                          {formatTime(recordingTime)}
                        </span>
                        <button onClick={stopRecording} className="text-white hover:text-gray-300">
                          <svg
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      audioBlob && (
                        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 sm:gap-3 sm:px-4">
                          <span className="text-green-400">🎤</span>
                          <audio
                            controls
                            src={audioUrl}
                            className="h-8 max-w-[150px] sm:max-w-[200px]"
                          />
                          <button
                            onClick={discardRecording}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="relative">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileChange(e, 'images')}
                        accept="image/*"
                        multiple
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm transition hover:bg-slate-700"
                      >
                        <span className="text-blue-400">🖼️</span>
                        <span>Add Images</span>
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={(e) => handleFileChange(e, 'logo')}
                        accept="image/*,.svg"
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm transition hover:bg-slate-700"
                      >
                        <span className="text-purple-400">🎨</span>
                        <span>Add Logo</span>
                      </label>
                    </div>
                  </div>

                  {(responseFiles.images.length > 0 || responseFiles.logo) && (
                    <div className="flex flex-wrap gap-2 rounded-lg bg-slate-800/30 p-3">
                      {responseFiles.images.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-lg bg-slate-700 px-2 py-1 sm:px-3 sm:py-1.5"
                        >
                          <span className="text-blue-400">🖼️</span>
                          <span className="max-w-[100px] truncate text-xs text-gray-300 sm:max-w-[150px] sm:text-sm">
                            {file.name}
                          </span>
                          <button
                            onClick={() => removeFile('images', index)}
                            className="text-gray-500 hover:text-red-400"
                          >
                            <svg
                              className="h-3 w-3 sm:h-4 sm:w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {responseFiles.logo && (
                        <div className="flex items-center gap-2 rounded-lg bg-slate-700 px-2 py-1 sm:px-3 sm:py-1.5">
                          <span className="text-purple-400">🎨</span>
                          <span className="max-w-[100px] truncate text-xs text-gray-300 sm:max-w-[150px] sm:text-sm">
                            {responseFiles.logo.name}
                          </span>
                          <button
                            onClick={() => removeFile('logo')}
                            className="text-gray-500 hover:text-red-400"
                          >
                            <svg
                              className="h-3 w-3 sm:h-4 sm:w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <Button
                      variant="primary"
                      onClick={handleSubmitResponse}
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? 'Sending...' : 'Send Response'}
                    </Button>
                    <Button variant="secondary" onClick={() => router.back()} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-h-[90vh] max-w-4xl">
            <img
              key={previewImage}
              src={previewImage}
              alt="Preview"
              className="max-h-[90vh] max-w-full object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white hover:text-gray-300 sm:right-4 sm:top-4"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <a
              href={previewImage}
              download
              className="absolute bottom-2 right-2 flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-dark sm:bottom-4 sm:right-4 sm:px-4 sm:py-2 sm:text-sm"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </a>
          </div>
        </div>
      )}

      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-h-[90vh] max-w-4xl">
            <video src={previewVideo} controls className="max-h-[90vh] max-w-full" />
            <button
              onClick={() => setPreviewVideo(null)}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white hover:text-gray-300 sm:right-4 sm:top-4"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <a
              href={previewVideo}
              download
              className="absolute bottom-2 right-2 flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-dark sm:bottom-4 sm:right-4 sm:px-4 sm:py-2 sm:text-sm"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </a>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
