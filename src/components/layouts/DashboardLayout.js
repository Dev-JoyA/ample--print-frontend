'use client';

import Sidebar from '../ui/Sidebar';
import Header from '../ui/Header';

const DashboardLayout = ({ children, userRole = 'customer', showSearch = true }) => {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar userRole={userRole} />
      <div className="flex-1 ml-[14rem] flex flex-col">
        <Header showSearch={showSearch} />
        <main className="flex-1 py-6 px-[3rem] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
