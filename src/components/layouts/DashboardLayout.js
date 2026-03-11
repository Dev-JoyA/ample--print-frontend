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
      
      // Try to decode token to get role
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        
        // Check different possible role field names
        const role = decoded?.role || decoded?.userRole || decoded?.user?.role;
        
        if (role) {
          // Normalize role to lowercase for comparison
          const normalizedRole = role.toLowerCase();
          console.log('Decoded role from token:', normalizedRole);
          setUserRoleState(normalizedRole);
        } else {
          // If no role in token, use the prop
          console.log('No role in token, using prop:', userRole);
          setUserRoleState(userRole);
        }
      } catch (e) {
        console.error('Failed to decode token:', e);
        // Fallback to prop if token decode fails
        setUserRoleState(userRole);
      }
    } else {
      console.log('No token found, user not authenticated');
      setIsAuthenticated(false);
      setUserRoleState('guest');
    }
  }, [userRole]); // Re-run when userRole prop changes

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

  console.log('DashboardLayout rendering with role:', userRoleState);

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