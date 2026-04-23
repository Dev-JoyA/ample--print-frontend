'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, clearAuthCookies } from '@/app/lib/auth';
import { profileService } from '@/services/profileService';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
    }
  }, [isAuthenticated, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = await profileService.getMyProfile();
      console.log('User data in dropdown:', userData);

      if (userData?.user) {
        setProfile(userData.user);
      } else {
        setProfile(userData);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthCookies();
    router.push('/auth/sign-in');
  };

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile?.firstName) {
      return profile.firstName[0].toUpperCase();
    }
    if (profile?.userName) {
      return profile.userName[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (profile?.userName) {
      return profile.userName.toUpperCase();
    }
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (profile?.firstName) {
      return profile.firstName;
    }
    if (profile?.userName) {
      return profile.userName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-lg p-1 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-600 sm:gap-2"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-800 text-sm font-bold text-white sm:h-10 sm:w-10 sm:text-base">
          {loading ? '...' : getInitials()}
        </div>
        <div className="hidden text-left md:block">
          <p className="text-xs font-medium text-white sm:text-sm">
            {loading ? 'Loading...' : getDisplayName()}
          </p>
          <p className="text-[10px] capitalize text-gray-400 sm:text-xs">{user?.role || 'User'}</p>
        </div>
        <svg
          className={`h-3 w-3 text-gray-400 transition-transform sm:h-4 sm:w-4 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-gray-800 bg-slate-900 shadow-lg">
            <div className="py-1">
              <div className="border-b border-gray-800 px-4 py-3">
                <p className="text-sm font-medium text-white">{getDisplayName()}</p>
                <p className="mt-1 text-xs text-gray-400">{user?.email}</p>
              </div>

              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>My Profile</span>
              </Link>

              <Link
                href="/order-history"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span>My Orders</span>
              </Link>

              <div className="my-1 border-t border-gray-800"></div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-gray-800 hover:text-red-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileDropdown;
