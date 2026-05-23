
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Lock, User, Key, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(username, password);
    if (success) {
        navigate('/');
    } else {
        setError('Invalid credentials. Please try again.');
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border dark:border-slate-800">
        <div className="bg-pink-600 dark:bg-[#1a1a1a] p-10 text-center transition-colors duration-300">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-white rounded-full mb-4 text-pink-600 dark:text-[#1a1a1a]">
            <Building2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Property 101 Group</h1>
          <p className="text-pink-100 dark:text-slate-400 text-sm mt-2">Body Corporate Management</p>
        </div>
        
        <div className="p-8 flex-1 flex flex-col justify-center">
          <div className="mb-6 text-center">
             <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Staff Portal</h2>
             <p className="text-gray-500 dark:text-slate-400 text-sm">Sign in to access the management console.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Username</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        required
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm transition-all"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Password</label>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm transition-all"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 dark:bg-red-950/20 dark:border-red-900/20">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center text-xs text-slate-400 gap-4">
              <span className="flex items-center gap-1"><Lock size={12}/> Secure Connection</span>
              <span>v1.0.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
