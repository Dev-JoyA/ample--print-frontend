'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { useProtectedRoute } from '@/app/lib/auth';
import { customerBriefService } from '@/services/customerBriefService';
import { useToast } from '@/components/providers/ToastProvider';

export default function BriefResponsesPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = useProtectedRoute({ redirectTo: '/auth/sign-in' });
  const { showToast } = useToast();

  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [markingComplete, setMarkingComplete] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchResponses();
    }
  }, [authLoading, user]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await customerBriefService.getPendingResponses();

      let data = [];
      if (response?.success && Array.isArray(response?.data)) {
        data = response.data;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }

      setResponses(data);
    } catch (err) {
      console.error('Failed to fetch responses:', err);
      setError('Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsComplete = async (response, e) => {
    e.stopPropagation();
    if (markingComplete === response.briefId) return;

    try {
      setMarkingComplete(response.briefId);
      await customerBriefService.markAsComplete(response.briefId);
      showToast('Response marked as complete', 'success');
      await fetchResponses();
    } catch (err) {
      showToast(err.message || 'Failed to mark as complete', 'error');
    } finally {
      setMarkingComplete(null);
    }
  };

  const handleViewResponse = (response) => {
    router.push(`/briefs/${response.briefId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const pendingResponses = responses.filter((r) => !r.viewed);
  const completedResponses = responses.filter((r) => r.viewed);
  const filteredResponses = filter === 'pending' ? pendingResponses : completedResponses;

  if (authLoading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <SEOHead {...METADATA.briefs} title="Admin Responses" />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 md:mb-8">
          <Link href="/dashboards">
            <Button variant="ghost" size="sm" className="mb-4 gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Dashboard
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Admin Responses</h1>
              <p className="mt-1 text-sm text-gray-400">
                Messages from our team awaiting your attention
              </p>
            </div>
            <button
              onClick={fetchResponses}
              className="rounded-lg bg-slate-800 p-2 text-gray-400 transition hover:bg-slate-700 hover:text-white"
              title="Refresh"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-900/30 p-4">
            <p className="text-sm text-red-200">{error}</p>
            <button onClick={fetchResponses} className="mt-2 text-sm text-red-400 underline">
              Retry
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Pending ({pendingResponses.length})
            {pendingResponses.length > 0 && filter !== 'pending' && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {pendingResponses.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Completed ({completedResponses.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-slate-900/50 py-16 text-center">
            <div className="mb-4 text-5xl">📬</div>
            <h3 className="mb-2 text-lg font-semibold text-white">No responses found</h3>
            <p className="text-sm text-gray-400">
              {filter === 'pending'
                ? 'No pending responses to review'
                : 'No completed responses yet'}
            </p>
            {filter !== 'pending' && pendingResponses.length > 0 && (
              <button
                onClick={() => setFilter('pending')}
                className="mt-4 text-sm text-primary underline"
              >
                View pending ({pendingResponses.length})
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResponses.map((response) => (
              <div
                key={response.briefId}
                onClick={() => handleViewResponse(response)}
                className={`cursor-pointer overflow-hidden rounded-xl border transition hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${
                  !response.viewed
                    ? 'border-yellow-600/40 bg-gradient-to-r from-yellow-900/10 via-slate-900/50 to-slate-900/50'
                    : 'border-gray-800 bg-slate-900/30'
                }`}
              >
                <div className={`h-0.5 ${!response.viewed ? 'bg-yellow-500' : 'bg-green-600'}`} />

                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${
                          !response.viewed ? 'bg-yellow-600/20' : 'bg-green-600/20'
                        }`}
                      >
                        {!response.viewed ? '📬' : '✓'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            Order #{response.orderNumber}
                          </span>
                          {!response.viewed && (
                            <span className="animate-pulse rounded-full bg-yellow-600/20 px-2 py-0.5 text-xs text-yellow-400">
                              New
                            </span>
                          )}
                          {response.viewed && (
                            <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400">{response.productName}</p>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs text-gray-500">
                      {getTimeAgo(response.respondedAt)}
                    </span>
                  </div>

                  {response.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-gray-300">
                      {response.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {response.hasDesign && (
                        <span className="rounded-full bg-purple-600/20 px-2 py-1 text-xs text-purple-400">
                          🎨 Design included
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!response.viewed && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={(e) => handleMarkAsComplete(response, e)}
                          disabled={markingComplete === response.briefId}
                        >
                          {markingComplete === response.briefId ? (
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Marking...
                            </span>
                          ) : (
                            '✓ Mark as Complete'
                          )}
                        </Button>
                      )}
                      <Button
                        variant={!response.viewed ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewResponse(response);
                        }}
                      >
                        {!response.viewed ? 'Review Now' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
