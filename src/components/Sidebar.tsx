import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Briefcase, User, MessageSquare, LogOut, TrendingUp, Users, Database, Table, X } from 'lucide-react';

const Sidebar = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'recruiter', 'admin'] },
    { id: 'career', label: 'Career Engine', icon: TrendingUp, roles: ['student'] },
    { id: 'jobs', label: 'Job Board', icon: Briefcase, roles: ['student', 'recruiter', 'admin'] },
    { id: 'network', label: 'Network', icon: MessageSquare, roles: ['student', 'recruiter'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin'] },
    { id: 'database', label: 'Database', icon: Database, roles: ['admin'] },
    { id: 'datamatch', label: 'Data Match', icon: Table, roles: ['admin'] },
    { id: 'profile', label: 'Profile', icon: User, roles: ['student', 'recruiter', 'admin'] },
  ].filter(item => item.roles.includes(user?.role || 'student'));

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-full transform overflow-y-auto bg-white dark:bg-neon-dark border-r border-gray-200 dark:border-neon-teal transition-all duration-300 ease-in-out md:static md:w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neon-teal md:hidden transition-colors duration-300">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-neon-cyan tracking-tight transition-colors duration-300">PathForge</h1>
            <p className="text-xs text-gray-400 dark:text-neon-light mt-1 uppercase tracking-widest font-semibold transition-colors duration-300">AI Career Assistant</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-neon-cyan bg-white dark:bg-neon-gray p-2 text-gray-700 dark:text-neon-cyan shadow-sm hover:bg-gray-50 dark:hover:shadow-neon-cyan transition-all duration-200"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        <div className="p-6 md:p-6 border-b border-gray-100 dark:border-neon-teal transition-colors duration-300">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-neon-cyan tracking-tight transition-colors duration-300">PathForge</h1>
          <p className="text-xs text-gray-400 dark:text-neon-light mt-1 uppercase tracking-widest font-semibold transition-colors duration-300">AI Career Assistant</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 pb-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              window.location.hash = item.id;
              setMobileOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-indigo-50 dark:bg-neon-gray text-indigo-700 dark:text-neon-cyan' 
                : 'text-gray-600 dark:text-neon-light hover:bg-gray-50 dark:hover:bg-neon-gray hover:text-gray-900 dark:hover:text-neon-cyan'
            }`}
          >
            <item.icon className={`mr-3 h-5 w-5 transition-colors duration-200 ${activeTab === item.id ? 'text-indigo-600 dark:text-neon-cyan' : 'text-gray-400 dark:text-neon-teal'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-neon-teal transition-colors duration-300">
        <div className="flex items-center p-2 mb-4">
          <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-neon-teal flex items-center justify-center text-indigo-700 dark:text-neon-dark font-bold transition-all duration-300">
            {user?.fullName.charAt(0)}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 dark:text-neon-cyan truncate transition-colors duration-300">{user?.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-neon-light truncate transition-colors duration-300">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-neon-light hover:bg-red-50 dark:hover:bg-neon-teal dark:hover:text-neon-dark rounded-lg transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
