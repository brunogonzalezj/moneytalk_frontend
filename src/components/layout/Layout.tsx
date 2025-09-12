import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useUIStore } from '../../stores/uiStore';

const Layout = () => {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  // Close sidebar on small screens when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="flex h-screen bg-base-200 overflow-hidden">
      {/* Sidebar - Only visible on desktop */}
      <div className="hidden md:flex">
        <div 
          className={`transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
        
        {/* Bottom Navigation - Only visible on mobile */}
        <BottomNavigation />
      </div>
    </div>
  );
};

export default Layout;