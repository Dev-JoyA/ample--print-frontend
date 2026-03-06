'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../ui/Sidebar';
import Header from '../ui/Header';

const DashboardLayout = ({ children, userRole = 'customer', showSearch = true }) => {
  const [userRoleState, setUserRoleState] = useState(userRole);

  // Get user role from token if not provided (for cases where it's not passed)
  useEffect(() => {
    if (!userRole) {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          setUserRoleState(decoded?.role?.toLowerCase() || 'customer');
        } catch (e) {
          console.error('Failed to decode token:', e);
        }
      }
    }
  }, [userRole]);

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