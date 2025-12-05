import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1a1a1a] p-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 text-[#1a1a1a]">
            <Building2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Property 101 Group</h1>
          <p className="text-slate-400 text-sm mt-2">Body Corporate Management</p>
        </div>
        
        <div className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-800">Welcome Back</h2>
              <p className="text-gray-500 text-sm">Please sign in with your Property 101 account.</p>
            </div>

            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-3 bg-[#2F2F2F] hover:bg-black text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg group"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M12 1h10v10H12z"/>
                <path fill="#7FBA00" d="M1 12h10v10H1z"/>
                <path fill="#FFB900" d="M12 12h10v10H12z"/>
              </svg>
              <span>Sign in with Office 365</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Secure Access</span>
              </div>
            </div>

            <div className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
              <Lock size={12} />
              <span>SharePoint Integration Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;