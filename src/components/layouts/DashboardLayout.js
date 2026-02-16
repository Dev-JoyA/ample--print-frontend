'use client';

import Sidebar from '../ui/Sidebar';
import Header from '../ui/Header';

const DashboardLayout = ({ children, userRole = 'customer', showSearch = true }) => {
  return (
    <div className="flex min-h-screen bg-dark">
      <Sidebar userRole={userRole} />
      <div className="flex-1 ml-sidebar flex flex-col">
        <Header showSearch={showSearch} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
