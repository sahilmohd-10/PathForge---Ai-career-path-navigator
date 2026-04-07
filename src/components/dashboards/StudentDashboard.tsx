import React, { useState, useEffect } from 'react';
import { Target, Zap, CheckCircle, Clock, Briefcase, MapPin, Bell, MessageSquare, BookOpen, Brain, Rocket, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const StudentDashboard = ({ profile }: any) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadNotifications = notifications.filter((notif) => !notif.is_read);
  const unreadCount = unreadNotifications.length;

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`/api/chat/notifications/${user.id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!user?.id) return;
    try {
      await axios.put(`/api/chat/notifications/${user.id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes] = await Promise.all([
          axios.get(`/api/jobs/applications/student/${user?.id}`)
        ]);
        setApplications(appsRes.data);
        await fetchNotifications();
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user]);

  const readinessScore = profile?.job_readiness_score ?? 0;
  const readinessData = [
    { name: 'Jan', score: Math.max(10, readinessScore - 30) },
    { name: 'Feb', score: Math.max(15, readinessScore - 20) },
    { name: 'Mar', score: Math.max(25, readinessScore - 10) },
    { name: 'Apr', score: readinessScore },
  ];

  const skillData = profile?.skills?.map((s: any) => ({
    name: s.name,
    level: Math.min(100, (s.proficiency_level || 1) * 20)
  })) || [
    { name: 'JavaScript', level: 80 },
    { name: 'React', level: 70 },
    { name: 'SQL', level: 60 },
  ];

  // Personalized recommendations based on readiness score
  const [learningSeconds, setLearningSeconds] = useState(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem(`learning_seconds_${user.id}`);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      setLearningSeconds((prev) => {
        const next = prev + 1;
        localStorage.setItem(`learning_seconds_${user.id}`, next.toString());
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const formatLearningTime = (seconds: number) => {
    if (seconds === 0) return '0 min';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const getRecommendations = () => {
    if (readinessScore < 30) {
      return ['Start with Career Engine assessment', 'Complete at least 3 skills', 'Update your profile completely'];
    } else if (readinessScore < 60) {
      return ['Practice interview questions', 'Build a portfolio project', 'Connect with mentors'];
    } else {
      return ['Apply to 5 jobs this week', 'Network with recruiters', 'Polish your resume'];
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-neon-cyan">Student Dashboard</h2>
        <p className="text-gray-500 dark:text-neon-light font-medium">
          {profile?.target_career
            ? `Your ${profile.target_career} readiness at a glance.`
            : 'Track your learning progress and job readiness.'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Job Readiness" value={`${profile?.job_readiness_score || 0}%`} icon={<Target className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard title="Skills Tracked" value={profile?.skills?.length || 0} icon={<Zap className="text-amber-600" />} color="bg-amber-50" />
        <StatCard title="Applications" value={applications.length} icon={<CheckCircle className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="Time Learned" value={formatLearningTime(learningSeconds)} icon={<Clock className="text-blue-600" />} color="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">


          <div className="bg-white dark:bg-neon-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal transition-colors duration-300">
            <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-neon-cyan">My Applications</h3>
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 border border-gray-50 dark:border-neon-teal rounded-2xl hover:bg-gray-50 dark:hover:bg-neon-gray transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 dark:bg-neon-teal/30 rounded-xl">
                      <Briefcase className="h-6 w-6 text-indigo-600 dark:text-neon-cyan" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-neon-light">{app.job_title}</h4>
                      <p className="text-sm text-gray-500 dark:text-neon-light flex items-center gap-1">
                        {app.company_name} • <MapPin className="h-3 w-3" /> {app.job_location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      app.status === 'shortlisted' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : app.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {app.status.toUpperCase()}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Applied on {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 font-medium">
                  You haven't applied to any jobs yet.
                </div>
              )}
            </div>
          </div>


        </div>

        <div className="space-y-8">
          {/* Recruiter Notifications */}
          <div className="bg-white dark:bg-neon-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-neon-cyan">Recruiter Notifications</h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-red-100 dark:bg-neon-teal/30 text-red-700 dark:text-neon-cyan text-xs font-semibold px-2 py-1">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={markNotificationsAsRead}
                className="text-indigo-600 dark:text-neon-cyan text-sm font-semibold hover:text-indigo-800 dark:hover:text-neon-light transition-colors duration-200"
              >
                Mark all read
              </button>
            </div>
            <div className="space-y-4">
              {unreadNotifications.map((notif) => (
                <div key={notif.id} className="p-4 bg-gray-50 dark:bg-neon-gray rounded-2xl border border-transparent dark:border-neon-teal hover:border-indigo-100 dark:hover:border-neon-cyan transition-all">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-neon-cyan" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 dark:text-neon-light leading-relaxed">{notif.content}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {unreadNotifications.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  No new notifications.
                </div>
              )}
            </div>
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

export default StudentDashboard;
