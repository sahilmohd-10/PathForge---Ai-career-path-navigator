import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CareerEngine from './pages/CareerEngine';
import JobBoard from './pages/JobBoard';
import Network from './pages/Network';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import AdminDatabase from './pages/AdminDatabase';
import DataMatch from './pages/DataMatch';
import Login from './pages/Login';

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      return hash || 'dashboard';
    }
    return 'dashboard';
  });

  useEffect(() => {
    const titleMap: Record<string, string> = {
      dashboard: 'Dashboard',
      career: 'Career Engine',
      jobs: 'Job Board',
      network: 'Mentor Network',
      users: 'User Management',
      database: 'Database Management',
      datamatch: 'Career Data Match',
      profile: 'Profile',
    };

    if (!isAuthenticated) {
      document.title = 'PathForge · Sign In';
      return;
    }

    document.title = `PathForge · ${titleMap[activeTab] || 'Dashboard'}`;
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (!isAuthenticated) return <Login />;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-white dark:bg-neon-dark md:flex transition-colors duration-300">
      <Sidebar
        activeTab={activeTab.split('?')[0]}
        setActiveTab={setActiveTab}
        mobileOpen={sidebarOpen}
        setMobileOpen={setSidebarOpen}
      />

      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neon-dark min-h-screen transition-colors duration-300">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-20 border-b border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray px-4 py-3 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900 dark:text-neon-cyan">PathForge</div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-neon-cyan bg-white dark:bg-neon-dark p-2 text-gray-700 dark:text-neon-cyan shadow-sm hover:bg-gray-50 dark:hover:bg-neon-gray dark:hover:shadow-neon-cyan transition-all duration-200"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </button>
          </div>
        </div>

        {activeTab.split('?')[0] === 'dashboard' && <Dashboard />}
        {activeTab.split('?')[0] === 'career' && user?.role === 'student' && <CareerEngine />}
        {activeTab.split('?')[0] === 'jobs' && <JobBoard />}
        {activeTab.split('?')[0] === 'network' && (user?.role === 'student' || user?.role === 'recruiter') && <Network />}
        {activeTab.split('?')[0] === 'users' && isAdmin && <AdminUsers />}
        {activeTab.split('?')[0] === 'database' && isAdmin && <AdminDatabase />}
        {activeTab.split('?')[0] === 'datamatch' && isAdmin && <DataMatch />}
        {activeTab.split('?')[0] === 'profile' && <Profile />}
      </main>
    </div>
  );
};

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!googleClientId) {
    console.warn('⚠️ VITE_GOOGLE_CLIENT_ID not found in environment variables');
    console.warn('📍 Add VITE_GOOGLE_CLIENT_ID to your .env file');
  } else {
    console.log('✅ Google Client ID loaded:', googleClientId.substring(0, 20) + '...');
  }
  
  return (
    <GoogleOAuthProvider clientId={googleClientId || 'placeholder'}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
