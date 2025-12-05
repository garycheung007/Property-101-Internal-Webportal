import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, FileText, LogOut, BarChart3, Settings, HardHat } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const getNavClass = (path: string) => {
    const isActive = path === '/' 
        ? location.pathname === '/' 
        : location.pathname.startsWith(path);

    return `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-700 text-white'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;
  };

  return (
    <div className="w-64 bg-[#1a1a1a] text-white h-screen flex flex-col fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2 leading-tight">
          <Building2 className="w-8 h-8 text-white" />
          <span className="flex flex-col">
            <span>Property 101</span>
            <span className="text-sm font-normal text-slate-400">Group Ltd</span>
          </span>
        </h1>
        <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider pl-1">BC Management Console</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link to="/" className={getNavClass('/')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/complexes" className={getNavClass('/complexes')}>
          <Building2 size={20} />
          <span>Complexes</span>
        </Link>
        <Link to="/reports" className={getNavClass('/reports')}>
          <BarChart3 size={20} />
          <span>Reports</span>
        </Link>
        <Link to="/documents" className={getNavClass('/documents')}>
          <FileText size={20} />
          <span>Documents (AI)</span>
        </Link>
        <Link to="/contractors" className={getNavClass('/contractors')}>
          <HardHat size={20} />
          <span>Contractors</span>
        </Link>
        
        {/* Admin Only Section */}
        {user?.role === 'admin' && (
             <div className="pt-4 mt-4 border-t border-slate-800">
                 <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Administration</p>
                 <Link to="/admin" className={getNavClass('/admin')}>
                    <Settings size={20} />
                    <span>Admin Panel</span>
                </Link>
             </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
         <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white border border-slate-600">
                {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
         </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;