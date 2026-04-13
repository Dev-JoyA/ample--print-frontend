'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { customerBriefService } from '@/services/customerBriefService';
import { orderService } from '@/services/orderService';
import { METADATA } from '@/lib/metadata';
import { getImageUrl, getAudioUrl, getDownloadUrl, getProductImageUrl } from '@/lib/imageUtils';

export default function CustomerBriefsPage() {
  useAuthCheck();

  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseFiles, setResponseFiles] = useState({
    images: [],
    logo: null
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [markingViewed, setMarkingViewed] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHasFiles, setFilterHasFiles] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [updatingBrief, setUpdatingBrief] = useState(null);
  
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const statusColors = {
    pending: 'blue',
    responded: 'green',
    viewed: 'purple'
  };

  useEffect(() => {
    fetchBriefs();
  }, [activeTab, searchTerm, filterHasFiles]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const fetchBriefs = async () => {
    try {
      setLoading(true);
      
      const params = {
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (activeTab === 'pending') {
        params.status = 'pending';
      } else if (activeTab === 'responded') {
        params.status = 'responded';
      } else if (activeTab === 'viewed') {
        params.status = 'viewed';
      }

      if (filterHasFiles) {
        params.hasFiles = true;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log('Fetching briefs with params:', params);

      const response = await customerBriefService.getAdminBriefs(params);
      console.log('Briefs response:', response);
      
      let briefsData = [];
      if (response?.briefs && Array.isArray(response.briefs)) {
        briefsData = response.briefs;
      } else if (Array.isArray(response)) {
        briefsData = response;
      }
       console.log('Briefs data count:', briefsData.length);
        console.log('Briefs data details:', briefsData.map(b => ({ 
        id: b._id, 
        product: b.productName, 
        order: b.orderNumber,
        status: b.status 
        })));

      setBriefs(briefsData);
    } catch (err) {
      console.error('Failed to fetch briefs:', err);
      setError('Failed to load customer briefs');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: fetchConversation - properly handles array response from backend
  const fetchConversation = async (orderId, productId) => {
    try {
      setLoadingConversation(true);
      
      const response = await customerBriefService.getByOrderAndProduct(orderId, productId);
      console.log('Conversation response:', response);
      
      let allMessages = [];
      
      // Check if response.data is an array (new format)
      if (response?.data && Array.isArray(response.data)) {
        allMessages = response.data;
      } 
      // Check if response itself is an array
      else if (Array.isArray(response)) {
        allMessages = response;
      }
      // Old format fallback
      else if (response?.data) {
        const data = response.data;
        if (data.customer) allMessages.push({ ...data.customer, role: 'customer' });
        if (data.admin) allMessages.push({ ...data.admin, role: 'admin' });
        if (data.superAdmin) allMessages.push({ ...data.superAdmin, role: 'super-admin' });
      }
      
      // Sort chronologically (oldest first)
      allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      console.log('Processed messages:', allMessages);
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

  const handleViewBrief = async (brief) => {
    setUpdatingBrief(brief._id);
    setSelectedBrief(brief);
    await fetchConversation(brief.orderId?._id || brief.orderId, brief.productId?._id || brief.productId);
    setUpdatingBrief(null);
  };

  const handleMarkAsViewed = async (briefId) => {
    try {
      setMarkingViewed(true);
      await customerBriefService.markAsViewedByAdmin(briefId);
      await fetchBriefs();
    } catch (err) {
      console.error('Failed to mark as viewed:', err);
      alert('Failed to mark brief as viewed');
    } finally {
      setMarkingViewed(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedBrief(null);
    setConversation([]);
    setResponseText('');
    setResponseFiles({
      images: [],
      logo: null
    });
    setAudioBlob(null);
    setAudioUrl(null);
    setPreviewImage(null);
    setPreviewVideo(null);
    if (isRecording) stopRecording();
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    
    if (type === 'images') {
      setResponseFiles(prev => ({
        ...prev,
        images: [...prev.images, ...files]
      }));
    } else if (type === 'logo') {
      setResponseFiles(prev => ({
        ...prev,
        logo: files[0]
      }));
    }
  };

  const removeFile = (type, index = null) => {
    if (type === 'images' && index !== null) {
      setResponseFiles(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else if (type === 'logo') {
      setResponseFiles(prev => ({
        ...prev,
        logo: null
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
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
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
    if (!responseText.trim() && 
        responseFiles.images.length === 0 && 
        !responseFiles.logo && 
        !audioBlob) {
      alert('Please add some content to your response');
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      
      if (responseText.trim()) {
        formData.append('description', responseText.trim());
      }
      
      responseFiles.images.forEach(file => {
        formData.append('image', file);
      });
      
      if (responseFiles.logo) {
        formData.append('logo', responseFiles.logo);
      }
      
      if (audioBlob) {
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        formData.append('voiceNote', audioFile);
      }

      const orderId = selectedBrief.orderId?._id || selectedBrief.orderId;
      const productId = selectedBrief.productId?._id || selectedBrief.productId;

      await customerBriefService.adminRespond(orderId, productId, formData);
      
      await fetchConversation(orderId, productId);
      
      setResponseText('');
      setResponseFiles({
        images: [],
        logo: null
      });
      setAudioBlob(null);
      setAudioUrl(null);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (logoInputRef.current) logoInputRef.current.value = '';
      
      await fetchBriefs();
      
    } catch (err) {
      console.error('Failed to submit response:', err);
      alert('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // FIXED: getRoleBadge - case insensitive
  const getRoleBadge = (role) => {
    const roleLower = role?.toLowerCase();
    switch(roleLower) {
      case 'customer':
        return <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">Customer</span>;
      case 'admin':
        return <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">Admin</span>;
      case 'super-admin':
      case 'superadmin':
        return <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium">Super Admin</span>;
      default:
        return null;
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchBriefs();
    }, 500);
    setSearchTimeout(timeout);
  };

  const toggleHasFilesFilter = () => {
    setFilterHasFiles(!filterHasFiles);
  };

  const stats = {
    total: briefs.length,
    pending: briefs.filter(b => b.status === 'pending').length,
    responded: briefs.filter(b => b.status === 'responded').length,
    viewed: briefs.filter(b => b.status === 'viewed').length,
    hasFiles: briefs.filter(b => b.hasFiles).length
  };

  return (
    <>
      <SEOHead {...METADATA.briefs} />
      <DashboardLayout userRole="admin">
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Customer Briefs</h1>
                <p className="text-gray-400 text-sm sm:text-base">Review and respond to customer design briefs</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="bg-slate-800/50 rounded-lg px-3 sm:px-4 py-2">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-blue-600/20 rounded-lg px-3 sm:px-4 py-2">
                  <p className="text-xs text-blue-400">Pending</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-400">{stats.pending}</p>
                </div>
                <div className="bg-green-600/20 rounded-lg px-3 sm:px-4 py-2">
                  <p className="text-xs text-green-400">Responded</p>
                  <p className="text-lg sm:text-xl font-bold text-green-400">{stats.responded}</p>
                </div>
                <div className="bg-purple-600/20 rounded-lg px-3 sm:px-4 py-2">
                  <p className="text-xs text-purple-400">Viewed</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-400">{stats.viewed}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex flex-wrap gap-2 bg-slate-800/50 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                      activeTab === 'pending'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Pending ({stats.pending})
                  </button>
                  <button
                    onClick={() => setActiveTab('responded')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                      activeTab === 'responded'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Responded ({stats.responded})
                  </button>
                  <button
                    onClick={() => setActiveTab('viewed')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                      activeTab === 'viewed'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Viewed ({stats.viewed})
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                      activeTab === 'all'
                        ? 'bg-primary text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All ({stats.total})
                  </button>
                </div>

                <button
                  onClick={toggleHasFilesFilter}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                    filterHasFiles
                      ? 'bg-primary text-white'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  <span>📎</span>
                  Has Files ({stats.hasFiles})
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search by order number, product name, or customer..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 pl-9 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {(activeTab !== 'all' || filterHasFiles || searchTerm) && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-800">
                  <span className="text-xs text-gray-500">Active filters:</span>
                  {activeTab !== 'all' && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColors[activeTab]}-600/20 text-${statusColors[activeTab]}-400`}>
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </span>
                  )}
                  {filterHasFiles && (
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                      Has Files
                    </span>
                  )}
                  {searchTerm && (
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                      "{searchTerm}"
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab('all');
                      setFilterHasFiles(false);
                      setSearchTerm('');
                    }}
                    className="text-xs text-gray-400 hover:text-white underline ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!loading && briefs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {briefs.map((brief) => {
                  const status = brief.status || determineBriefStatus(brief);
                  const orderNumber = brief.orderNumber || brief.orderId?.orderNumber || 'N/A';
                  const productName = brief.productName || brief.productId?.name || 'Unknown Product';
                  const customerName = brief.customerName || brief.orderId?.userId?.email?.split('@')[0] || 'Customer';
                  const hasFiles = brief.hasFiles || brief.image || brief.voiceNote || brief.video || brief.logo;
                  
                  return (
                    <div
                      key={brief._id}
                      className={`bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-${statusColors[status]}-500/50 hover:shadow-xl hover:shadow-${statusColors[status]}-500/5 transition-all duration-300 group ${
                        updatingBrief === brief._id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className={`h-1 bg-${statusColors[status]}-500`}></div>
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-lg">
                              📝
                            </div>
                            <div>
                              <span className="text-xs font-mono text-primary">
                                #{orderNumber}
                              </span>
                              <h3 className="text-white font-semibold text-sm line-clamp-1">
                                {productName}
                              </h3>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColors[status]}-600/20 text-${statusColors[status]}-400`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3 text-sm">
                          <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center text-xs">
                            👤
                          </div>
                          <span className="text-gray-300 text-sm">{customerName}</span>
                          <span className="text-gray-600 text-xs">•</span>
                          <span className="text-gray-500 text-xs">{getTimeAgo(brief.createdAt)}</span>
                        </div>

                        <p className="text-gray-400 text-sm line-clamp-2 mb-4 h-10">
                          {brief.description || 'No description provided'}
                        </p>

                        {hasFiles && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {brief.image && (
                              <span className="inline-flex items-center gap-1 text-blue-400 text-xs bg-blue-600/10 px-2 py-1 rounded-full">
                                🖼️ Image
                              </span>
                            )}
                            {brief.voiceNote && (
                              <span className="inline-flex items-center gap-1 text-green-400 text-xs bg-green-600/10 px-2 py-1 rounded-full">
                                🎤 Voice
                              </span>
                            )}
                            {brief.video && (
                              <span className="inline-flex items-center gap-1 text-red-400 text-xs bg-red-600/10 px-2 py-1 rounded-full">
                                🎥 Video
                              </span>
                            )}
                            {brief.logo && (
                              <span className="inline-flex items-center gap-1 text-purple-400 text-xs bg-purple-600/10 px-2 py-1 rounded-full">
                                🎨 Logo
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleViewBrief(brief)}
                            disabled={updatingBrief === brief._id}
                            className={`flex-1 bg-${statusColors[status]}-600/10 hover:bg-${statusColors[status]}-600/20 text-${statusColors[status]}-400 text-sm font-medium py-2 rounded-lg transition ${
                              updatingBrief === brief._id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            View Details
                          </button>
                          
                          {status === 'pending' && (
                            <button
                              onClick={() => handleMarkAsViewed(brief._id)}
                              disabled={markingViewed || updatingBrief === brief._id}
                              className="px-3 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white text-sm rounded-lg transition"
                              title="Mark as viewed (no response needed)"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !loading && (
              <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-white mb-2">No briefs found</h3>
                <p className="text-gray-400">
                  {searchTerm 
                    ? `No briefs matching "${searchTerm}"`
                    : filterHasFiles
                    ? 'No briefs with files'
                    : activeTab === 'pending'
                    ? 'No pending briefs awaiting your response'
                    : activeTab === 'responded'
                    ? 'No responded briefs'
                    : activeTab === 'viewed'
                    ? 'No viewed briefs'
                    : 'No customer briefs have been submitted yet'}
                </p>
                {(searchTerm || filterHasFiles || activeTab !== 'all') && (
                  <button
                    onClick={() => {
                      setActiveTab('all');
                      setFilterHasFiles(false);
                      setSearchTerm('');
                    }}
                    className="mt-4 text-primary hover:text-primary-dark text-sm underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal for viewing/responding to brief */}
        {selectedBrief && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-gray-800 w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Conversation Thread</h2>
                  </div>
                  <p className="text-sm text-gray-400">
                    Order #{selectedBrief.orderNumber || selectedBrief.orderId?.orderNumber || 'N/A'} • {selectedBrief.productName || selectedBrief.productId?.name || 'Product'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {loadingConversation ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : conversation.length > 0 ? (
                  conversation.map((msg, index) => {
                    const isAdminMsg = msg.role === 'admin' || msg.role === 'super-admin' || msg.role === 'superadmin';
                    
                    return (
                      <div
                        key={index}
                        className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[90%] sm:max-w-[80%] ${
                          isAdminMsg
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'bg-slate-800/50 border border-gray-700'
                        } rounded-xl p-3 sm:p-4`}>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {getRoleBadge(msg.role)}
                            <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                          </div>

                          {msg.description && (
                            <p className="text-gray-300 whitespace-pre-wrap mb-3 text-sm">
                              {msg.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {msg.image && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => setPreviewImage(getImageUrl(msg.image))}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-blue-400 transition"
                                >
                                  <span>🖼️</span>
                                  View Image
                                </button>
                                <a
                                  href={getDownloadUrl(msg.image)}
                                  download
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-gray-300 transition"
                                >
                                  <span>⬇️</span>
                                  Download
                                </a>
                              </div>
                            )}
                            
                            {msg.voiceNote && (
                              <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg">
                                <span className="text-green-400">🎤</span>
                                <audio controls className="h-8 max-w-[150px] sm:max-w-[200px]">
                                  <source src={getAudioUrl(msg.voiceNote)} />
                                </audio>
                                <a
                                  href={getDownloadUrl(msg.voiceNote)}
                                  download
                                  className="text-gray-400 hover:text-white"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </a>
                              </div>
                            )}
                            
                            {msg.video && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => setPreviewVideo(getImageUrl(msg.video))}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-red-400 transition"
                                >
                                  <span>🎥</span>
                                  View Video
                                </button>
                                <a
                                  href={getDownloadUrl(msg.video)}
                                  download
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-gray-300 transition"
                                >
                                  <span>⬇️</span>
                                  Download
                                </a>
                              </div>
                            )}
                            
                            {msg.logo && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => setPreviewImage(getImageUrl(msg.logo))}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-purple-400 transition"
                                >
                                  <span>🎨</span>
                                  View Logo
                                </button>
                                <a
                                  href={getDownloadUrl(msg.logo)}
                                  download
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-gray-300 transition"
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
                  <div className="text-center py-8 text-gray-500">
                    No conversation history
                  </div>
                )}
              </div>

              <div className="border-t border-gray-800 p-4 sm:p-6 space-y-4">
                <Textarea
                  placeholder="Type your response here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border-gray-700 focus:border-primary"
                />

                <div className="flex flex-wrap items-center gap-3">
                  {!isRecording && !audioBlob ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition text-sm"
                    >
                      <span>🎤</span>
                      <span>Record Voice Note</span>
                    </button>
                  ) : isRecording ? (
                    <div className="flex items-center gap-3 bg-red-600/20 rounded-lg px-4 py-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-red-400 font-mono text-sm">{formatTime(recordingTime)}</span>
                      <button
                        onClick={stopRecording}
                        className="text-white hover:text-gray-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                      </button>
                    </div>
                  ) : audioBlob && (
                    <div className="flex flex-wrap items-center gap-3 bg-slate-800 rounded-lg px-4 py-2">
                      <span className="text-green-400">🎤</span>
                      <audio controls src={audioUrl} className="h-8 max-w-[150px] sm:max-w-[200px]" />
                      <button
                        onClick={discardRecording}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
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
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition text-sm"
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
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition text-sm"
                    >
                      <span className="text-purple-400">🎨</span>
                      <span>Add Logo</span>
                    </label>
                  </div>
                </div>

                {Object.values(responseFiles).some(f => f && (Array.isArray(f) ? f.length > 0 : true)) && (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-800/30 rounded-lg">
                    {responseFiles.images.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-1.5">
                        <span className="text-blue-400">🖼️</span>
                        <span className="text-sm text-gray-300 truncate max-w-[100px] sm:max-w-[150px]">{file.name}</span>
                        <button
                          onClick={() => removeFile('images', index)}
                          className="text-gray-500 hover:text-red-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {responseFiles.logo && (
                      <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-1.5">
                        <span className="text-purple-400">🎨</span>
                        <span className="text-sm text-gray-300 truncate max-w-[100px] sm:max-w-[150px]">{responseFiles.logo.name}</span>
                        <button
                          onClick={() => removeFile('logo')}
                          className="text-gray-500 hover:text-red-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    onClick={handleSubmitResponse}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Sending...' : 'Send Response'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCloseModal}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {previewImage && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <a
                href={previewImage}
                download
                className="absolute bottom-4 right-4 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
            </div>
          </div>
        )}

        {previewVideo && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
            <div className="relative max-w-4xl max-h-[90vh]">
              <video
                src={previewVideo}
                controls
                className="max-w-full max-h-[90vh]"
              />
              <button
                onClick={() => setPreviewVideo(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <a
                href={previewVideo}
                download
                className="absolute bottom-4 right-4 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}