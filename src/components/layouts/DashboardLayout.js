'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../ui/Sidebar';
import Header from '../ui/Header';
import WhatsAppButton from '../ui/WhatsAppButton';

const DashboardLayout = ({ children, userRole = 'customer', showSearch = true }) => {
  const [userRoleState, setUserRoleState] = useState(userRole);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];

    if (token) {
      setIsAuthenticated(true);

      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));

        const role = decoded?.role || decoded?.userRole || decoded?.user?.role;

        if (role) {
          const normalizedRole = role.toLowerCase();
          console.log('Decoded role from token:', normalizedRole);
          setUserRoleState(normalizedRole);
        } else {
          console.log('No role in token, using prop:', userRole);
          setUserRoleState(userRole);
        }
      } catch (e) {
        console.error('Failed to decode token:', e);
        setUserRoleState(userRole);
      }
    } else {
      console.log('No token found, user not authenticated');
      setIsAuthenticated(false);
      setUserRoleState('guest');
    }
    setIsLoading(false); 
  }, [userRole]);

  if (isLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-white">Loading...</div>
    </div>
  );
}

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header showSearch={showSearch} userRole="guest" />
        <main className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
    );
  }

  console.log('DashboardLayout rendering with role:', userRoleState);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar userRole={userRoleState} />
      <div className="flex min-w-0 flex-1 flex-col pl-0">
        <Header showSearch={showSearch} userRole={userRoleState} />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
      <WhatsAppButton />
    </div>
  );
};

export default DashboardLayout;
