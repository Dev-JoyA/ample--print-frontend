'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../ui/Sidebar';
import Header from '../ui/Header';

const DashboardLayout = ({ children, userRole = 'customer', showSearch = true }) => {
  const [userRoleState, setUserRoleState] = useState(userRole);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication and get user role from token
  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    
    if (token) {
      setIsAuthenticated(true);
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserRoleState(decoded?.role?.toLowerCase() || userRole);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    } else {
      setIsAuthenticated(false);
      setUserRoleState('guest');
    }
  }, [userRole]);

  // If not authenticated, render without sidebar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header showSearch={showSearch} userRole="guest" />
        <main className="py-6 px-[3rem] overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  // Authenticated view with sidebar
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar userRole={userRoleState} />
      <div className="flex-1 ml-[14rem] flex flex-col">
        <Header showSearch={showSearch} userRole={userRoleState} />
        <main className="flex-1 py-6 px-[3rem] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;