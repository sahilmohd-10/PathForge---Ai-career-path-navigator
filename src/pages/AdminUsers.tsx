import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, UserCheck, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/PageShell';

const AdminUsers = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (token && user?.id) {
      fetchUsers();
    }
  }, [token, user?.id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id.toString()
        }
      });
      setUsers(res.data);
      console.log('Users loaded:', res.data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setError('');
    try {
      const response = await axios.delete(`/api/admin/users/${deleteConfirm.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id.toString()
        }
      });
      console.log('✓ User deleted successfully:', response.data);
      setUsers(users.filter((u: any) => u.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      alert(`✓ ${deleteConfirm.full_name} has been deleted successfully`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to delete user';
      console.error('❌ Failed to delete user:', errorMsg);
      setError(errorMsg);
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter((u: any) => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleVerify = async (userId: number) => {
    try {
      await axios.post(`/api/admin/users/${userId}/verify`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id.toString()
        }
      });
      setUsers(users.map((u: any) => 
        u.id === userId ? { ...u, is_verified: true } : u
      ));
    } catch (err) {
      console.error('Failed to verify user:', err);
    }
  };

  return (
    <PageShell
      title="User Management"
      subtitle="Review and manage the PathForge user base with audit-grade controls."
      maxWidth="max-w-6xl"
    >
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neon-dark rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-neon-teal transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-neon-cyan mb-4 transition-colors duration-300">Delete User?</h3>
            <p className="text-gray-600 dark:text-neon-light mb-8 transition-colors duration-300">Are you sure you want to delete <span className="font-bold text-indigo-600 dark:text-neon-cyan">{deleteConfirm.full_name}</span>? This will remove all their data from the platform.</p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setDeleteConfirm(null);
                  setError('');
                }}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-gray-100 dark:bg-neon-gray text-gray-700 dark:text-neon-light rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-red-600 dark:bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 dark:hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-neon-cyan transition-colors duration-300">User Management</h2>
          <p className="text-gray-500 dark:text-neon-light transition-colors duration-300">Manage all registered users on the platform.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-cyan placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-colors duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-neon-dark rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal overflow-hidden transition-colors duration-300">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-neon-gray border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-neon-light uppercase tracking-wider transition-colors duration-300">User</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-neon-light uppercase tracking-wider transition-colors duration-300">Role</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-neon-light uppercase tracking-wider transition-colors duration-300">Status</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-neon-light uppercase tracking-wider transition-colors duration-300">Type</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-neon-light uppercase tracking-wider transition-colors duration-300">Joined</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-neon-light uppercase tracking-wider transition-colors duration-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 transition-colors duration-300">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-neon-light">Loading users...</td></tr>
            ) : filteredUsers.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-neon-cyan font-bold mr-3 transition-colors duration-300">
                      {user.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-neon-cyan transition-colors duration-300">{user.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-neon-light transition-colors duration-300">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                    user.role === 'admin' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                    user.role === 'recruiter' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-neon-cyan'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                    user.is_verified ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {user.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                    user.is_oauth_user ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}>
                    {user.is_oauth_user ? 'Google' : 'Email'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-neon-light transition-colors duration-300">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {!user.is_verified && (
                      <button 
                        onClick={() => handleVerify(user.id)}
                        title="Verify user email"
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                      >
                        <UserCheck className="h-5 w-5" />
                      </button>
                    )}
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200">
                      <Shield className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(user)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
};

export default AdminUsers;

