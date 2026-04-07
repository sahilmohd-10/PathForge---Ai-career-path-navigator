import React from 'react';
import { Users, Briefcase, TrendingUp, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const AdminDashboard = ({ stats }: any) => {
  const data = [
    { name: 'Students', value: stats?.students || 120, color: '#4f46e5' },
    { name: 'Recruiters', value: stats?.recruiters || 45, color: '#f59e0b' },
    { name: 'Admins', value: stats?.admins || 5, color: '#10b981' },
  ];

  const COLORS = ['#4f46e5', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-neon-cyan">Admin Control Panel</h2>
        <p className="text-gray-500 dark:text-neon-light">System-wide overview and management.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={(stats?.students || 0) + (stats?.recruiters || 0) + (stats?.admins || 0)} icon={<Users className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard title="Active Jobs" value={stats?.jobs || 0} icon={<Briefcase className="text-amber-600" />} color="bg-amber-50" />
        <StatCard title="Applications" value={stats?.applications || 0} icon={<TrendingUp className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="System Alerts" value={stats?.systemAlerts || 0} icon={<ShieldAlert className="text-red-600" />} color="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-neon-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal transition-colors duration-300">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-neon-cyan">User Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600 dark:text-neon-light font-medium transition-colors duration-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-neon-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal transition-colors duration-300">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-neon-cyan">Platform Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.platformActivity || [
                { name: 'Mon', users: 0 },
                { name: 'Tue', users: 0 },
                { name: 'Wed', users: 0 },
                { name: 'Thu', users: 0 },
                { name: 'Fri', users: 0 },
                { name: 'Sat', users: 0 },
                { name: 'Sun', users: 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="users" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => {
  const { isDark } = useTheme();
  const colorBgMap: any = {
    'bg-indigo-50': { light: '#eef2ff', dark: '#312e81' },
    'bg-amber-50': { light: '#fffbeb', dark: '#78350f' },
    'bg-emerald-50': { light: '#f0fdf4', dark: '#064e3b' },
    'bg-blue-50': { light: '#eff6ff', dark: '#0c2340' },
    'bg-red-50': { light: '#fef2f2', dark: '#7f1d1d' },
  };

  const bgColor = colorBgMap[color];
  const bgColorValue = isDark ? bgColor?.dark : bgColor?.light;

  return (
    <div className="bg-white dark:bg-neon-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal flex items-center transition-colors duration-300">
      <div className="p-4 rounded-2xl mr-4 transition-colors duration-300" style={{ backgroundColor: bgColorValue || '#f3f4f6' }}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-neon-light font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-neon-cyan">{value}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
