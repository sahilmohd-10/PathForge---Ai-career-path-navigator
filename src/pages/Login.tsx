import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('✅ Login component mounted');
    console.log('📱 GoogleLogin component should be visible below');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^.+@.+\..+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Invalid email format');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        const registerRes = await axios.post('/api/auth/register', { email, password, fullName, role });
        login(registerRes.data.token, registerRes.data.user);
      } else {
        const res = await axios.post('/api/auth/login', { email, password, role });
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/google', {
        token: credentialResponse.credential || credentialResponse,
        role: role,
      });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google login failed. Please check your credentials.');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = (credentialResponse: any) => {
    handleGoogleLogin(credentialResponse);
  };

  const handleGoogleLoginError = () => {
    console.error('❌ Google login failed - check browser console for details');
    console.error('Possible issues:');
    console.error('1. Google Client ID is invalid or missing');
    console.error('2. Domain is not authorized in Google Console');
    console.error('3. Google API not enabled');
    setError('Google login failed. Please check the console for details or use email/password.');
  };

  const allRoles = [
    { id: 'student', label: 'Student' },
    { id: 'recruiter', label: 'Recruiter' },
    { id: 'admin', label: 'Admin' },
  ];

  // Show only Student and Recruiter for signup, all roles for login
  const roles = isRegister ? [
    { id: 'student', label: 'Student' },
    { id: 'recruiter', label: 'Recruiter' },
  ] : allRoles;

  // Reset to student if admin is selected during signup transition
  useEffect(() => {
    if (isRegister && role === 'admin') {
      setRole('student');
    }
  }, [isRegister]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neon-dark flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-neon-dark rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-neon-teal transition-colors duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-neon-cyan">PathForge</h1>
          <p className="text-gray-500 dark:text-neon-light mt-2">
            {isRegister ? 'Create your account' : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-neon-gray rounded-2xl mb-8 transition-colors duration-300">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                role === r.id 
                  ? 'bg-white dark:bg-neon-cyan dark:text-neon-dark text-indigo-600 shadow-sm' 
                  : 'text-gray-500 dark:text-neon-light hover:text-gray-700 dark:hover:text-neon-cyan'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neon-cyan mb-1">Full Name</label>
              <input
                type="text"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200 disabled:opacity-50"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neon-cyan mb-1">Email Address</label>
            <input
              type="email"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200 disabled:opacity-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neon-cyan mb-1">Password</label>
            <input
              type="password"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200 disabled:opacity-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 dark:bg-neon-cyan text-white dark:text-neon-dark rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-neon-light transition-all shadow-lg shadow-indigo-200 dark:shadow-neon-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {/* Google OAuth Button */}
        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-neon-teal"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-neon-dark text-gray-500 dark:text-neon-light">Or continue with</span>
            </div>
          </div>

          <div className="w-full flex justify-center bg-gray-50 dark:bg-neon-gray p-4 rounded-xl">
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                size="large"
                text="signin_with"
              />
            </div>
          </div>
          <p className="text-xs text-center text-gray-400 dark:text-neon-light">
            🔐 Secure OAuth authentication powered by Google
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              const newIsRegister = !isRegister;
              setIsRegister(newIsRegister);
              setError('');
            }}
            className="text-sm text-indigo-600 dark:text-neon-cyan font-medium hover:underline transition-colors duration-200 disabled:opacity-50"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
