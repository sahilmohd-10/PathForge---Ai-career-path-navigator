import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import StudentDashboard from '../components/dashboards/StudentDashboard';
import RecruiterDashboard from '../components/dashboards/RecruiterDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import PageShell from '../components/PageShell';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user?.role === 'student') {
          const res = await axios.get(`/api/profile/${user?.id}`);
          setData(res.data);
        } else if (user?.role === 'recruiter') {
          const res = await axios.get('/api/recruiter/stats');
          setData(res.data);
        } else if (user?.role === 'admin') {
          const res = await axios.get('/api/admin/stats');
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <PageShell
      title="Dashboard"
      subtitle={`Welcome back, ${user?.fullName || 'PathForge user'}. Review your latest insights here.`}
    >
      {user?.role === 'student' && <StudentDashboard profile={data} />}
      {user?.role === 'recruiter' && <RecruiterDashboard stats={data} />}
      {user?.role === 'admin' && <AdminDashboard stats={data} />}
    </PageShell>
  );
};

export default Dashboard;
