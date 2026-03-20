'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { customerBriefService } from '@/services/customerBriefService';
import { formatDistanceToNow } from 'date-fns';

export default function ProductBriefPreview({ orderId, productId, productName }) {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversation();
  }, [orderId, productId]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await customerBriefService.getByOrderAndProduct(orderId, productId);
      
      let data = null;
      if (response?.data) {
        data = response.data;
      } else if (response) {
        data = response;
      }
      
      setConversation(data);
    } catch (err) {
      console.error('Failed to fetch brief conversation:', err);
      setError('Could not load briefs');
    } finally {
      setLoading(false);
    }
  };

  const getLatestMessage = () => {
    if (!conversation) return null;
    
    const messages = [];
    if (conversation.customer) messages.push({ ...conversation.customer, role: 'customer' });
    if (conversation.admin) messages.push({ ...conversation.admin, role: 'admin' });
    if (conversation.superAdmin) messages.push({ ...conversation.superAdmin, role: 'superAdmin' });
    
    if (messages.length === 0) return null;
    
    return messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'customer': return '👤';
      case 'admin': return '👨‍💼';
      case 'superAdmin': return '👑';
      default: return '📝';
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'customer': return 'bg-blue-900/30 text-blue-400 border-blue-700';
      case 'admin': return 'bg-green-900/30 text-green-400 border-green-700';
      case 'superAdmin': return 'bg-purple-900/30 text-purple-400 border-purple-700';
      default: return 'bg-gray-900/30 text-gray-400 border-gray-700';
    }
  };

  const hasAttachments = (brief) => {
    return brief?.image || brief?.voiceNote || brief?.video || brief?.logo;
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 text-center">
        <div className="text-gray-400 text-xs sm:text-sm">Loading briefs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-4 text-center">
        <div className="text-red-400 text-xs sm:text-sm">{error}</div>
      </div>
    );
  }

  const hasCustomerBrief = !!conversation?.customer;
  const hasAdminResponse = !!(conversation?.admin || conversation?.superAdmin);
  const latestMessage = getLatestMessage();

  if (!hasCustomerBrief && !hasAdminResponse) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <p className="text-gray-400 text-xs sm:text-sm mb-2">No customization briefs yet</p>
        <Link href={`/orders/${orderId}/products/${productId}/respond`}>
          <span className="text-primary hover:text-primary-dark text-xs font-medium cursor-pointer">
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
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${getRoleColor(latestMessage.role)} flex items-center justify-center text-xs sm:text-sm border flex-shrink-0`}>
            {getRoleIcon(latestMessage.role)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
              <span className="text-xs sm:text-sm font-medium text-white">
                {latestMessage.role === 'customer' ? 'You' : 
                 latestMessage.role === 'admin' ? 'Admin' : 'Super Admin'}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(latestMessage.createdAt), { addSuffix: true })}
              </span>
              {latestMessage.role !== 'customer' && !conversation.customer?.viewed && (
                <span className="text-xs bg-yellow-600/20 text-yellow-400 px-1.5 py-0.5 rounded-full">
                  New
                </span>
              )}
            </div>
            
            <p className="text-gray-300 text-xs sm:text-sm line-clamp-2">
              {latestMessage.description || 'No description provided'}
            </p>
            
            {hasAttachments(latestMessage) && (
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
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
            <span className="text-green-400 text-xs">✓ Your brief submitted</span>
          )}
          {hasAdminResponse && !conversation.customer?.viewed && (
            <span className="text-yellow-400 animate-pulse text-xs">● Admin response</span>
          )}
        </div>
        <Link href={`/orders/${orderId}/products/${productId}/briefs`}>
          <span className="text-primary hover:text-primary-dark text-xs font-medium cursor-pointer">
            View Full Conversation →
          </span>
        </Link>
      </div>
    </div>
  );
}