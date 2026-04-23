'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { customerBriefService } from '@/services/customerBriefService';
import { formatDistanceToNow } from 'date-fns';

export default function ProductBriefPreview({ orderId, productId, productName }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversation();
  }, [orderId, productId]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await customerBriefService.getByOrderAndProduct(orderId, productId);

      let msgs = [];
      if (response?.data && Array.isArray(response.data)) {
        msgs = response.data;
      } else if (Array.isArray(response)) {
        msgs = response;
      }

      msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to fetch brief conversation:', err);
      setError('Could not load briefs');
    } finally {
      setLoading(false);
    }
  };

  const getLatestMessage = () => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1];
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'customer':
        return '👤';
      case 'admin':
        return '👨‍💼';
      case 'super-admin':
        return '👑';
      default:
        return '📝';
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'customer':
        return 'bg-blue-900/30 text-blue-400 border-blue-700';
      case 'admin':
        return 'bg-green-900/30 text-green-400 border-green-700';
      case 'super-admin':
        return 'bg-purple-900/30 text-purple-400 border-purple-700';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-700';
    }
  };

  const hasAttachments = (msg) => {
    return msg?.image || msg?.voiceNote || msg?.video || msg?.logo;
  };

  const hasCustomerBrief = messages.some((m) => m.role === 'customer');
  const hasAdminResponse = messages.some((m) => m.role === 'admin' || m.role === 'super-admin');
  const latestMessage = getLatestMessage();
  const isPendingResponse =
    latestMessage &&
    (latestMessage.role === 'admin' || latestMessage.role === 'super-admin') &&
    latestMessage.status === 'responded' &&
    !latestMessage.viewed;

  if (loading) {
    return (
      <div className="p-3 text-center sm:p-4">
        <div className="text-xs text-gray-400 sm:text-sm">Loading briefs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-center sm:p-4">
        <div className="text-xs text-red-400 sm:text-sm">{error}</div>
      </div>
    );
  }

  if (!hasCustomerBrief && !hasAdminResponse) {
    return (
      <div className="p-4 text-center sm:p-6">
        <p className="mb-2 text-xs text-gray-400 sm:text-sm">No customization briefs yet</p>
        <Link href={`/orders/${orderId}/products/${productId}/respond`}>
          <span className="cursor-pointer text-xs font-medium text-primary hover:text-primary-dark">
            + Add Brief
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      {latestMessage && (
        <div className="flex items-start gap-2 sm:gap-3">
          <div
            className={`h-6 w-6 rounded-full sm:h-8 sm:w-8 ${getRoleColor(latestMessage.role)} flex flex-shrink-0 items-center justify-center border text-xs sm:text-sm`}
          >
            {getRoleIcon(latestMessage.role)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="text-xs font-medium text-white sm:text-sm">
                {latestMessage.role === 'customer'
                  ? 'You'
                  : latestMessage.role === 'admin'
                    ? 'Admin'
                    : 'Super Admin'}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(latestMessage.createdAt), { addSuffix: true })}
              </span>
              {isPendingResponse && (
                <span className="animate-pulse rounded-full bg-yellow-600/20 px-1.5 py-0.5 text-xs text-yellow-400">
                  Needs Review
                </span>
              )}
              {latestMessage.status === 'complete' && (
                <span className="rounded-full bg-green-600/20 px-1.5 py-0.5 text-xs text-green-400">
                  Complete
                </span>
              )}
            </div>

            <p className="line-clamp-2 text-xs text-gray-300 sm:text-sm">
              {latestMessage.description || 'No description provided'}
            </p>

            {hasAttachments(latestMessage) && (
              <div className="mt-1 flex flex-wrap gap-1 sm:gap-2">
                {latestMessage.image && <span className="text-xs text-blue-400">📷</span>}
                {latestMessage.voiceNote && <span className="text-xs text-green-400">🎤</span>}
                {latestMessage.video && <span className="text-xs text-red-400">🎥</span>}
                {latestMessage.logo && <span className="text-xs text-purple-400">🎨</span>}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap gap-2">
          {hasCustomerBrief && (
            <span className="text-xs text-green-400">✓ Your brief submitted</span>
          )}
          {isPendingResponse && (
            <span className="animate-pulse text-xs text-yellow-400">● Admin response waiting</span>
          )}
        </div>
        <Link href={`/briefs/${latestMessage?._id}`}>
          <span className="cursor-pointer text-xs font-medium text-primary hover:text-primary-dark">
            View Full Conversation →
          </span>
        </Link>
      </div>
    </div>
  );
}
