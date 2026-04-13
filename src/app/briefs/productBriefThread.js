'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { customerBriefService } from '@/services/customerBriefService';
import { getImageUrl, getAudioUrl } from '@/lib/imageUtils';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/providers/ToastProvider';

export default function ProductBriefThread({ orderId, productId, productName, orderNumber, isEditable = true }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
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
  const hasAutoMarkedRef = useRef(false);

  useEffect(() => {
    if (orderId && productId) fetchConversation();
  }, [orderId, productId]);

  useEffect(() => {
    if (hasAutoMarkedRef.current || loading || messages.length === 0) return;
    const adminMessages = messages.filter(m => m.role === 'admin' || m.role === 'super-admin');
    const latestAdmin = adminMessages[adminMessages.length - 1];
    if (latestAdmin && latestAdmin.status === 'responded' && !latestAdmin.viewed) {
      hasAutoMarkedRef.current = true;
      customerBriefService.markAsViewed(latestAdmin._id)
        .then(() => fetchConversation())
        .catch(err => console.error('Auto-mark failed:', err));
    }
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await customerBriefService.getByOrderAndProduct(orderId, productId);
      let msgs = [];
      if (response?.data && Array.isArray(response.data)) msgs = response.data;
      else if (Array.isArray(response)) msgs = response;
      msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const adminMessages = messages.filter(m => m.role === 'admin' || m.role === 'super-admin');
  const customerMessages = messages.filter(m => m.role === 'customer');
  const latestAdmin = adminMessages[adminMessages.length - 1] || null;
  const latestCustomer = customerMessages[customerMessages.length - 1] || null;

  const hasAdminResponse = !!latestAdmin;
  const isAdminComplete = latestAdmin?.status === 'complete';
  const customerRespondedAfter = latestCustomer && latestAdmin &&
    new Date(latestCustomer.createdAt) > new Date(latestAdmin.createdAt);

  const canRespond = hasAdminResponse && !customerRespondedAfter && isEditable && latestAdmin?.status === 'responded';
  const canMarkComplete = hasAdminResponse && !isAdminComplete && !customerRespondedAfter && isEditable;

  const handleMarkAsComplete = async () => {
    if (!latestAdmin || markingComplete) return;
    try {
      setMarkingComplete(true);
      await customerBriefService.markAsComplete(latestAdmin._id);
      showToast('Response marked as complete', 'success');
      await fetchConversation();
    } catch (err) {
      showToast(err.message || 'Failed to mark as complete', 'error');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleRespond = async () => {
    const hasContent = responseText.trim() || responseFiles.images.length > 0 ||
                       responseFiles.voiceNote || responseFiles.video;
    if (!hasContent) { showToast('Please add a message or attachment', 'error'); return; }

    try {
      setResponding(true);
      const formData = new FormData();
      if (responseText.trim()) formData.append('description', responseText.trim());
      responseFiles.images.forEach(f => formData.append('image', f));
      if (responseFiles.voiceNote) {
        const af = new File([responseFiles.voiceNote], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        formData.append('voiceNote', af);
      }
      if (responseFiles.video) formData.append('video', responseFiles.video);

      await customerBriefService.replyToAdmin(orderId, productId, formData);
      showToast('Response sent!', 'success');

      setShowResponseForm(false);
      setResponseText('');
      setResponseFiles({ images: [], voiceNote: null, video: null });
      setAudioBlob(null); setAudioUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';

      await fetchConversation();
    } catch (err) {
      showToast(err.message || 'Failed to send', 'error');
    } finally {
      setResponding(false);
    }
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'images') setResponseFiles(prev => ({ ...prev, images: [...prev.images, ...files] }));
    else if (type === 'video') setResponseFiles(prev => ({ ...prev, video: files[0] }));
  };

  const removeFile = (type, idx = null) => {
    if (type === 'images') setResponseFiles(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    else if (type === 'video') { setResponseFiles(prev => ({ ...prev, video: null })); if (videoInputRef.current) videoInputRef.current.value = ''; }
    else if (type === 'voiceNote') discardRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob); setAudioUrl(url);
        setResponseFiles(prev => ({ ...prev, voiceNote: blob }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true); setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch { showToast('Microphone access denied', 'error'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop(); setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const discardRecording = () => {
    setAudioBlob(null); setAudioUrl(null); setRecordingTime(0);
    setResponseFiles(prev => ({ ...prev, voiceNote: null }));
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const isAdminRole = (role) => role === 'admin' || role === 'super-admin' || role === 'superadmin';

  const getRoleBadge = (role) => {
    if (role === 'customer') return <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">You</span>;
    if (role === 'admin') return <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">Admin</span>;
    return <span className="rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-400">Super Admin</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Customization Conversation</h2>
          <p className="mt-1 text-sm text-gray-400">Order #{orderNumber} • {productName}</p>
        </div>
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm">Back to Order</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-gray-800 bg-slate-900/50 overflow-hidden">
        <div className="max-h-[480px] overflow-y-auto space-y-4 p-5">
          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-gray-400">No messages yet for this product</p>
              <Link href={`/orders/${orderId}/products/${productId}/respond`}>
                <Button variant="primary" size="md">Start Conversation</Button>
              </Link>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={msg._id || idx} className={`flex ${isAdminRole(msg.role) ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-xl p-4 ${
                  isAdminRole(msg.role)
                    ? 'bg-green-900/20 border border-green-800/50'
                    : 'bg-blue-900/20 border border-blue-800/50'
                }`}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {getRoleBadge(msg.role)}
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                    {isAdminRole(msg.role) && msg.status === 'complete' && (
                      <span className="text-xs text-green-400">✓ Complete</span>
                    )}
                  </div>

                  {msg.description && (
                    <p className="mb-3 whitespace-pre-wrap text-sm text-gray-300">{msg.description}</p>
                  )}

                  {msg.designId && (
                    <Link href={`/designs/${msg.designId}`}>
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-900/30 px-3 py-1 text-xs text-purple-400 hover:bg-purple-900/50 transition">
                        🎨 View Design
                      </span>
                    </Link>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.image && (
                      <button onClick={() => setPreviewImage(getImageUrl(msg.image))}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-3 py-1 text-xs text-blue-400 hover:bg-slate-700 transition">
                        📷 Image
                      </button>
                    )}
                    {msg.voiceNote && (
                      <div className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-3 py-1">
                        <span className="text-green-400">🎤</span>
                        <audio controls className="h-7 max-w-[150px]">
                          <source src={getAudioUrl(msg.voiceNote)} />
                        </audio>
                      </div>
                    )}
                    {msg.video && (
                      <button onClick={() => setPreviewVideo(getImageUrl(msg.video))}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-3 py-1 text-xs text-red-400 hover:bg-slate-700 transition">
                        🎥 Video
                      </button>
                    )}
                    {msg.logo && (
                      <button onClick={() => setPreviewImage(getImageUrl(msg.logo))}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-700/50 px-3 py-1 text-xs text-purple-400 hover:bg-slate-700 transition">
                        🎨 Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {canRespond && (
        <div className="rounded-xl border border-gray-800 bg-slate-900/50 overflow-hidden">
          {!showResponseForm ? (
            <div className="p-5">
              <p className="mb-4 text-sm text-gray-400">
                Admin has responded. You can reply or mark it as complete.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="secondary" size="md" className="flex-1"
                  onClick={() => setShowResponseForm(true)}>
                  Reply to Admin
                </Button>
                {canMarkComplete && (
                  <Button variant="primary" size="md" className="flex-1"
                    onClick={handleMarkAsComplete} disabled={markingComplete}>
                    {markingComplete ? 'Marking...' : '✓ Mark as Complete'}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">Your Reply</h3>
                <button onClick={() => { setShowResponseForm(false); setResponseText(''); }}
                  className="text-gray-500 hover:text-gray-300 transition">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <textarea
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                placeholder="Type your response..."
                rows={4}
                className="w-full rounded-lg border border-gray-700 bg-slate-800 p-3 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-blue-400 hover:bg-slate-700 transition">
                  🖼️ Images
                  <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef}
                    onChange={e => handleFileChange(e, 'images')} />
                </label>
                <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-red-400 hover:bg-slate-700 transition">
                  🎥 Video
                  <input type="file" accept="video/*" className="hidden" ref={videoInputRef}
                    onChange={e => handleFileChange(e, 'video')} />
                </label>
                {!isRecording && !audioBlob && (
                  <button onClick={startRecording}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-green-400 hover:bg-slate-700 transition">
                    🎤 Record
                  </button>
                )}
                {isRecording && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    <span className="font-mono text-xs text-red-400">{formatTime(recordingTime)}</span>
                    <button onClick={stopRecording} className="text-white hover:text-gray-300">■</button>
                  </div>
                )}
                {audioBlob && (
                  <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2">
                    <audio controls src={audioUrl} className="h-7 max-w-[150px]" />
                    <button onClick={discardRecording} className="text-gray-400 hover:text-red-400">✕</button>
                  </div>
                )}
              </div>

              {(responseFiles.images.length > 0 || responseFiles.video) && (
                <div className="mt-3 flex flex-wrap gap-2 rounded-lg bg-slate-800/50 p-3">
                  {responseFiles.images.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1">
                      <span className="text-xs text-blue-400">🖼️</span>
                      <span className="max-w-[100px] truncate text-xs text-gray-300">{f.name}</span>
                      <button onClick={() => removeFile('images', i)} className="text-gray-500 hover:text-red-400">✕</button>
                    </div>
                  ))}
                  {responseFiles.video && (
                    <div className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1">
                      <span className="text-xs text-red-400">🎥</span>
                      <span className="max-w-[100px] truncate text-xs text-gray-300">{responseFiles.video.name}</span>
                      <button onClick={() => removeFile('video')} className="text-gray-500 hover:text-red-400">✕</button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" size="md" onClick={() => { setShowResponseForm(false); setResponseText(''); }}
                  className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={handleRespond} disabled={responding}
                  className="w-full sm:w-auto">
                  {responding ? 'Sending...' : 'Send Response'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {customerRespondedAfter && (
        <div className="rounded-lg border border-gray-700 bg-slate-800/30 p-4 text-center">
          <p className="text-sm text-gray-400">
            ✓ You've replied. Waiting for the admin to respond.
          </p>
        </div>
      )}

      {!hasAdminResponse && messages.length > 0 && (
        <div className="rounded-lg border border-blue-800/30 bg-blue-900/10 p-4 text-center">
          <p className="text-sm text-blue-400">⏳ Awaiting admin response</p>
        </div>
      )}

      {isAdminComplete && !customerRespondedAfter && !showResponseForm && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-4 text-center">
          <p className="text-sm text-green-400">
            ✓ This response has been marked as complete.
          </p>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" />
            <button onClick={() => setPreviewImage(null)}
              className="absolute -right-3 -top-3 rounded-full bg-slate-800 p-1.5 text-white hover:bg-slate-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewVideo(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <video controls autoPlay src={previewVideo} className="max-h-[85vh] max-w-[90vw] rounded-lg" />
            <button onClick={() => setPreviewVideo(null)}
              className="absolute -right-3 -top-3 rounded-full bg-slate-800 p-1.5 text-white hover:bg-slate-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}