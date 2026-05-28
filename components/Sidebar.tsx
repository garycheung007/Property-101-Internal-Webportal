
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, FileText, LogOut, BarChart3, Settings, HardHat, FileSignature, CloudCheck, CloudOff, AlertCircle, Sun, Moon, DollarSign, FlaskConical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { ReminderType } from '../types';

const Sidebar: React.FC = () => {
  const { logout, user, isAuthenticated } = useAuth();
  const { loading, syncError, reminders, snoozedAlerts } = useData();
  const { theme, toggleTheme } = useTheme();
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const snoozedIds = new Set(snoozedAlerts.filter(s => new Date(s.snoozedUntil) >= now).map(s => s.reminderId));
  const criticalCount = reminders.filter(r => r.type !== ReminderType.UPCOMING_ACTION && !snoozedIds.has(r.id)).length;
  const location = useLocation();

  const getNavClass = (path: string) => {
    const isActive = path === '/' 
        ? location.pathname === '/' 
        : location.pathname.startsWith(path);

    if (isActive) {
        // Active state depends on theme
        return `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors shadow-sm bg-pink-800 dark:bg-pink-600 text-white`;
    }

    return `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-pink-50 dark:text-slate-300 hover:text-white hover:bg-pink-800/50 dark:hover:bg-slate-800`;
  };

  return (
    <div className="w-64 bg-pink-700 dark:bg-[#1a1a1a] text-white h-screen flex flex-col fixed left-0 top-0 border-r border-pink-800 dark:border-slate-800 z-40 transition-colors duration-300">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2 leading-tight">
          <Building2 className="w-8 h-8 text-white" />
          <span className="flex flex-col">
            <span>Property 101</span>
            <span className="text-sm font-normal text-pink-200 dark:text-slate-400">Group Ltd</span>
          </span>
        </h1>
        <div className="flex items-center gap-2 mt-3 min-h-[16px]">
           {!isAuthenticated ? (
             <span className="text-[10px] text-pink-300 dark:text-slate-500 uppercase tracking-wider font-bold">Offline Mode</span>
           ) : syncError ? (
             <button 
                onClick={() => alert(`Connection Error: ${syncError}\n\nCheck your internet or Firebase console security rules.`)}
                className="flex items-center gap-1.5 text-[10px] text-red-200 dark:text-red-500 uppercase tracking-wider font-bold hover:text-red-100 transition-colors"
                title={syncError}
             >
               <AlertCircle size={12} />
               Connection Error
             </button>
           ) : loading ? (
             <span className="flex items-center gap-1.5 text-[10px] text-amber-300 dark:text-amber-400 uppercase tracking-wider font-bold">
               <span className="w-2 h-2 bg-amber-300 rounded-full animate-pulse"></span>
               Syncing...
             </span>
           ) : (
             <span className="flex items-center gap-1.5 text-[10px] text-emerald-300 dark:text-emerald-400 uppercase tracking-wider font-bold">
               <CloudCheck size={12} />
               Connected
             </span>
           )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link to="/" className={getNavClass('/')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
          {criticalCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {criticalCount > 9 ? '9+' : criticalCount}
            </span>
          )}
        </Link>
        <Link to="/complexes" className={getNavClass('/complexes')}>
          <Building2 size={20} />
          <span>Complexes</span>
        </Link>
        <Link to="/reports" className={getNavClass('/reports')}>
          <BarChart3 size={20} />
          <span>Reports</span>
        </Link>
        <Link to="/meeting-docs-test" className={getNavClass('/meeting-docs-test')}>
          <FileText size={20} />
          <span>Meeting Docs</span>
        </Link>
        <Link to="/disclosure" className={getNavClass('/disclosure')}>
          <FileSignature size={20} />
          <span>Disclosure & CPL</span>
        </Link>
        <Link to="/contractors" className={getNavClass('/contractors')}>
          <HardHat size={20} />
          <span>Contractors</span>
        </Link>
        
        {/* Admin Only Section */}
        {user?.role === 'admin' && (
             <div className="pt-4 mt-4 border-t border-pink-800 dark:border-slate-800">
                 <p className="px-4 text-xs font-semibold text-pink-300 dark:text-slate-500 uppercase tracking-wider mb-2">Administration</p>
                 <Link to="/financials" className={getNavClass('/financials')}>
                    <DollarSign size={20} />
                    <span>Financials</span>
                </Link>
                 <Link to="/admin" className={getNavClass('/admin')}>
                    <Settings size={20} />
                    <span>Admin Panel</span>
                </Link>
             </div>
        )}
      </nav>

      <div className="p-4 border-t border-pink-800 dark:border-slate-800 space-y-4">
         {/* Theme Toggle */}
         <button 
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2 bg-pink-800 dark:bg-slate-800 hover:bg-pink-900 dark:hover:bg-slate-700 rounded-lg text-sm text-pink-50 dark:text-slate-300 transition-colors"
         >
            <span className="flex items-center gap-3">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </span>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-pink-600' : 'bg-pink-400 dark:bg-slate-600'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
         </button>

         <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-pink-800 dark:bg-slate-700 flex items-center justify-center font-bold text-white border border-pink-900 dark:border-slate-600">
                {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-pink-200 dark:text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
         </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 w-full text-left text-pink-200 dark:text-red-400 hover:bg-pink-800 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
