import React, { useState, useEffect } from 'react';
import { Briefcase, Users, CheckCircle, Clock, Search, Plus, X, MapPin, DollarSign, FileText, TrendingUp, Eye, MessageCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const RecruiterDashboard = ({ stats: initialStats }: any) => {
  const { user } = useAuth();
  const [showPostModal, setShowPostModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [shortlistMessage, setShortlistMessage] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);

  const unreadNotifications = notifications.filter((notif) => !notif.is_read);
  const unreadCount = unreadNotifications.length;

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`/api/chat/notifications/${user?.id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch recruiter notifications:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user?.id) return;
    try {
      await axios.put(`/api/chat/notifications/${user.id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };
  
  // Job Form State
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    location: '',
    salaryRange: '',
    type: 'Full-time'
  });

  const fetchRecruiterData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        axios.get('/api/recruiter/stats', { params: { userId: user?.id } }),
        axios.get(`/api/jobs/applications/recruiter/${user?.id}`)
      ]);
      setStats(statsRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      console.error('Failed to fetch recruiter data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchRecruiterData();
    fetchNotifications();
  }, [user]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/jobs', {
        ...jobForm,
        requirements: jobForm.requirements.split(',').map(s => s.trim()),
        postedBy: user?.id
      });
      setShowPostModal(false);
      setJobForm({
        title: '',
        company: '',
        description: '',
        requirements: '',
        location: '',
        salaryRange: '',
        type: 'Full-time'
      });
      fetchRecruiterData();
    } catch (err) {
      console.error('Failed to post job:', err);
    }
  };

  const handleShortlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await axios.post(`/api/jobs/applications/${selectedApp.id}/shortlist`, {
        message: shortlistMessage
      });
      setShowShortlistModal(false);
      setShortlistMessage('');
      setSelectedApp(null);
      fetchRecruiterData();
    } catch (err) {
      console.error('Failed to shortlist candidate:', err);
    }
  };

  const openShortlistModal = (app: any) => {
    setSelectedApp(app);
    setShortlistMessage(`Congratulations! You have been shortlisted for the ${app.job_title} position. We'd like to schedule an interview.`);
    setShowShortlistModal(true);
  };

  const applicationData = [
    { name: 'Mon', apps: 12 },
    { name: 'Tue', apps: 19 },
    { name: 'Wed', apps: 15 },
    { name: 'Thu', apps: 22 },
    { name: 'Fri', apps: 30 },
    { name: 'Sat', apps: 10 },
    { name: 'Sun', apps: 8 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-neon-cyan">Recruiter Dashboard</h2>
          <p className="text-gray-500 dark:text-neon-light font-medium">Manage your job postings and candidate applications.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {unreadNotifications.length > 0 && (
            <div className="px-4 py-2 bg-amber-100 dark:bg-neon-teal/30 text-amber-800 dark:text-neon-cyan rounded-full text-sm font-semibold transition-colors duration-300">
              {unreadNotifications.length} new notification{unreadNotifications.length === 1 ? '' : 's'}
            </div>
          )}
          <button 
            onClick={() => setShowPostModal(true)}
            className="px-6 py-3 bg-indigo-600 dark:bg-neon-cyan text-white dark:text-neon-dark rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-neon-cyan hover:bg-indigo-700 dark:hover:bg-neon-light transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Post a Job
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Active Jobs" value={stats?.activeJobs || 0} icon={<Briefcase className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard title="Total Apps" value={stats?.totalApps || 0} icon={<Users className="text-amber-600" />} color="bg-amber-50" />
        <StatCard title="Shortlisted" value={stats?.shortlisted || 0} icon={<CheckCircle className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="Pending Review" value={stats?.pending || 0} icon={<Clock className="text-blue-600" />} color="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-neon-light font-medium">Avg Time to Hire</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-neon-cyan mt-1">14 days</p>
                </div>
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 p-4 rounded-2xl border border-green-200 dark:border-green-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-neon-light font-medium">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-neon-cyan mt-1">32%</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neon-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-neon-cyan">Applications Management</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-neon-cyan text-xs font-bold rounded-full">
                  {applications.length} Total
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100 dark:border-neon-teal">
                    <th className="pb-4 font-bold text-gray-500 dark:text-neon-light text-sm">Candidate</th>
                    <th className="pb-4 font-bold text-gray-500 dark:text-neon-light text-sm">Job Role</th>
                    <th className="pb-4 font-bold text-gray-500 dark:text-neon-light text-sm">Status</th>
                    <th className="pb-4 font-bold text-gray-500 dark:text-neon-light text-sm text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-neon-teal">
                  {applications.map((app) => (
                    <tr key={app.id} className="group hover:bg-gray-50 dark:hover:bg-neon-gray transition-all">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-700 dark:text-neon-cyan font-bold">
                            {app.student_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-neon-light">{app.student_name}</p>
                            <p className="text-xs text-gray-500 dark:text-neon-light/50">{app.student_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-neon-light">{app.job_title}</p>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          app.status === 'shortlisted' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {app.status !== 'shortlisted' && (
                          <button 
                            onClick={() => openShortlistModal(app)}
                            className="px-4 py-2 bg-indigo-600 dark:bg-neon-cyan text-white dark:text-neon-dark text-xs font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-neon-light transition-all opacity-0 group-hover:opacity-100"
                          >
                            Shortlist
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                        No applications received yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


        </div>

        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-neon-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal">
            <h3 className="text-lg font-bold text-gray-900 dark:text-neon-cyan mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setShowPostModal(true)}
                className="w-full px-4 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Post New Job
              </button>
              <button className="w-full px-4 py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-all flex items-center justify-center gap-2">
                <Eye className="h-4 w-4" />
                View Candidates
              </button>
              <button className="w-full px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-all flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Send Messages
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-neon-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-neon-cyan">Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-neon-light">All recruiter activity updates.</p>
              </div>
              <button
                onClick={markAllNotificationsRead}
                className="text-indigo-600 dark:text-neon-cyan text-sm font-semibold hover:text-indigo-800 dark:hover:text-neon-light"
              >
                Mark all read
              </button>
            </div>
            <div className="space-y-3">
              {unreadNotifications.length === 0 && (
                <div className="py-8 text-center text-gray-400 dark:text-gray-600">No new notifications.</div>
              )}
              {unreadNotifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/30">
                  <p className="text-sm text-gray-700 dark:text-neon-light">{notif.content}</p>
                  <p className="text-xs text-gray-500 dark:text-neon-light/50 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
            {notifications.length > 5 && (
              <p className="mt-4 text-xs text-gray-500 dark:text-neon-light/50">Showing the latest 5 notifications.</p>
            )}
          </div>
          

        </div>
      </div>

      {/* Post Job Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neon-dark w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-neon-teal flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neon-cyan">Post New Job Opening</h3>
              <button onClick={() => setShowPostModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neon-gray rounded-xl transition-all">
                <X className="h-6 w-6 text-gray-400 dark:text-neon-light" />
              </button>
            </div>
            <form onSubmit={handlePostJob} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-neon-cyan mb-1">Job Title</label>
                  <input 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan"
                    placeholder="e.g. Senior Frontend Developer"
                    value={jobForm.title}
                    onChange={e => setJobForm({...jobForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-neon-cyan mb-1">Company Name</label>
                  <input 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan"
                    placeholder="e.g. PathForge Tech"
                    value={jobForm.company}
                    onChange={e => setJobForm({...jobForm, company: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-neon-cyan mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 dark:text-neon-light" />
                    <input 
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan"
                      placeholder="Remote / City"
                      value={jobForm.location}
                      onChange={e => setJobForm({...jobForm, location: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-neon-cyan mb-1">Salary Range</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 dark:text-neon-light" />
                    <input 
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan"
                      placeholder="e.g. $80k - $120k"
                      value={jobForm.salaryRange}
                      onChange={e => setJobForm({...jobForm, salaryRange: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-neon-cyan mb-1">Job Type</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan"
                    value={jobForm.type}
                    onChange={e => setJobForm({...jobForm, type: e.target.value})}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-neon-cyan mb-1">Job Description</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan"
                  placeholder="Describe the role and responsibilities..."
                  value={jobForm.description}
                  onChange={e => setJobForm({...jobForm, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-neon-cyan mb-1">Requirements (comma separated)</label>
                <input 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan"
                  placeholder="React, TypeScript, Node.js, AWS"
                  value={jobForm.requirements}
                  onChange={e => setJobForm({...jobForm, requirements: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-neon-gray text-gray-700 dark:text-neon-light rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neon-teal transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 dark:bg-neon-cyan text-white dark:text-neon-dark rounded-2xl font-bold hover:bg-indigo-700 dark:hover:bg-neon-light transition-all shadow-lg shadow-indigo-200 dark:shadow-neon-cyan/50"
                >
                  Post Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Shortlist Modal */}
      {showShortlistModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neon-dark w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-neon-teal flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neon-cyan">Shortlist Candidate</h3>
              <button onClick={() => setShowShortlistModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neon-gray rounded-xl transition-all">
                <X className="h-6 w-6 text-gray-400 dark:text-neon-light" />
              </button>
            </div>
            <form onSubmit={handleShortlist} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-neon-light mb-4">
                  Shortlisting <span className="font-bold text-gray-900 dark:text-neon-cyan">{selectedApp?.student_name}</span> for <span className="font-bold text-gray-900 dark:text-neon-cyan">{selectedApp?.job_title}</span>.
                </p>
                <label className="block text-sm font-bold text-gray-700 dark:text-neon-cyan mb-1">Message to Student</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan"
                  placeholder="Add interview details, next steps, or a congratulatory note..."
                  value={shortlistMessage}
                  onChange={e => setShortlistMessage(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowShortlistModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-neon-gray text-gray-700 dark:text-neon-light rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neon-teal transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-500/50"
                >
                  Confirm Shortlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

export default RecruiterDashboard;
