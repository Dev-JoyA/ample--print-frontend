'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { useProtectedRoute } from '@/app/lib/auth';
import { customerBriefService } from '@/services/customerBriefService';
import { useToast } from '@/components/providers/ToastProvider';

export default function BriefResponsesPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = useProtectedRoute({
    redirectTo: '/auth/sign-in'
  });
  const { showToast } = useToast();

  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchResponses();
    }
  }, [authLoading, user, page, filter]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page,
        limit: 10,
        hasAdminResponse: true
      };
      
      if (filter === 'pending') {
        params.viewed = false;
      } else if (filter === 'reviewed') {
        params.viewed = true;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await customerBriefService.getMyBriefs(params);
      
      let briefs = [];
      let total = 0;
      
      if (response?.briefs) {
        briefs = response.briefs;
        total = response.total || briefs.length;
      } else if (response?.data?.briefs) {
        briefs = response.data.briefs;
        total = response.data.total || briefs.length;
      }
      
      setResponses(briefs);
      setTotalPages(Math.ceil(total / 10));
    } catch (error) {
      console.error('Failed to fetch responses:', error);
      setError('Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResponses();
  };

  const handleViewResponse = async (response) => {
    try {
      setViewingId(response._id);
      
      // Navigate to the detail page where customer can take action
      router.push(`/briefs/${response._id}`);
    } catch (error) {
      console.error('Failed to view response:', error);
      showToast('Failed to load response', 'error');
    } finally {
      setViewingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout userRole="customer">
        <SEOHead {...METADATA.briefs} title="Admin Responses" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 md:py-12">
          <div className="flex min-h-[50vh] items-center justify-center md:min-h-[60vh]">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary md:h-12 md:w-12"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <SEOHead {...METADATA.briefs} title="Admin Responses" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="mb-6 md:mb-8">
          <div className="mb-3 flex items-center gap-3 md:mb-4">
            <Link href="/dashboards">
              <Button variant="ghost" size="sm" className="gap-1 md:gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            </Link>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl">Admin Responses</h1>
          <p className="text-sm text-gray-400 sm:text-base">Review and respond to messages from our team</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-900/30 p-3 sm:p-4">
            <p className="text-sm text-red-200 sm:text-base">{error}</p>
          </div>
        )}

        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="text"
              placeholder="Search by order number or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs transition sm:px-4 sm:py-2 sm:text-sm ${
                filter === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              All Responses
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`rounded-lg px-3 py-1.5 text-xs transition sm:px-4 sm:py-2 sm:text-sm ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Pending Review
            </button>
            <button
              onClick={() => setFilter('reviewed')}
              className={`rounded-lg px-3 py-1.5 text-xs transition sm:px-4 sm:py-2 sm:text-sm ${
                filter === 'reviewed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Reviewed
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : responses.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-8 text-center md:p-12">
            <div className="mb-4 text-5xl md:text-6xl">📬</div>
            <h3 className="mb-2 text-lg font-semibold text-white md:text-xl">No Responses Found</h3>
            <p className="mb-6 text-sm text-gray-400 md:text-base">
              {searchTerm 
                ? 'No responses match your search' 
                : filter === 'pending'
                ? 'You have no pending responses to review'
                : filter === 'reviewed'
                ? 'You have not reviewed any responses yet'
                : 'No admin responses yet'}
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setPage(1);
                }}
                className="text-sm text-primary transition hover:text-primary-dark"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {responses.map((response) => (
              <div
                key={response._id}
                className={`cursor-pointer overflow-hidden rounded-xl border transition hover:bg-slate-900/50 ${
                  response.viewed 
                    ? 'border-gray-800 bg-slate-900/30' 
                    : 'border-yellow-600/30 bg-gradient-to-r from-yellow-900/10 to-transparent'
                }`}
                onClick={() => handleViewResponse(response)}
              >
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between md:mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl">📬</span>
                      <div>
                        <h3 className="text-sm font-medium text-white sm:text-base">
                          Order #{response.orderId?.orderNumber || response.orderId}
                        </h3>
                        <p className="text-xs text-gray-400 sm:text-sm">
                          {response.productId?.name || 'Unknown Product'}
                        </p>
                      </div>
                    </div>
                    {!response.viewed && (
                      <span className="w-fit animate-pulse rounded-full bg-yellow-600/20 px-2 py-1 text-xs text-yellow-400">
                        New
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {response.designId && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="text-purple-400">🎨</span>
                        <span className="text-gray-300">Design ready for review</span>
                      </div>
                    )}
                    {response.description && (
                      <p className="line-clamp-2 text-xs text-gray-400 sm:text-sm">
                        {response.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {response.image && (
                        <span className="rounded-full bg-blue-600/20 px-2 py-1 text-xs text-blue-400">
                          📷 Image
                        </span>
                      )}
                      {response.voiceNote && (
                        <span className="rounded-full bg-green-600/20 px-2 py-1 text-xs text-green-400">
                          🎤 Voice
                        </span>
                      )}
                      {response.video && (
                        <span className="rounded-full bg-red-600/20 px-2 py-1 text-xs text-red-400">
                          🎥 Video
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-500">
                      {formatDate(response.updatedAt)}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full gap-1 sm:w-auto"
                      disabled={viewingId === response._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewResponse(response);
                      }}
                    >
                      {viewingId === response._id ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                          Loading...
                        </>
                      ) : response.viewed ? (
                        'View Again'
                      ) : (
                        'Review Now'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-4"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-400 sm:px-4">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-4"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}