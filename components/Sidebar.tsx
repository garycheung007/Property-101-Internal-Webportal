
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, FileText, LogOut, BarChart3, Settings, HardHat,
  FileSignature, CloudCheck, AlertCircle, Sun, Moon, DollarSign, Receipt,
  MessageSquare, Calendar, ChevronLeft, ChevronRight, Menu, X, BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSidebar } from '../contexts/SidebarContext';
import { ReminderType } from '../types';

const Sidebar: React.FC = () => {
  const { logout, user, isAuthenticated } = useAuth();
  const { loading, syncError, reminders, snoozedAlerts } = useData();
  const { theme, toggleTheme } = useTheme();
  const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar();
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const snoozedIds = new Set(snoozedAlerts.filter(s => new Date(s.snoozedUntil) >= now).map(s => s.reminderId));
  const criticalCount = reminders.filter(r => r.type !== ReminderType.UPCOMING_ACTION && !snoozedIds.has(r.id)).length;
  const location = useLocation();

  const getNavClass = (path: string) => {
    const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    const base = `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors`;
    const active = `shadow-sm bg-pink-800 dark:bg-pink-600 text-white`;
    const inactive = `text-pink-50 dark:text-slate-300 hover:text-white hover:bg-pink-800/50 dark:hover:bg-slate-800`;
    return `${base} ${isActive ? active : inactive} ${collapsed ? 'justify-center' : ''}`;
  };

  const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; badge?: number }> = ({ to, icon, label, badge }) => (
    <Link to={to} className={getNavClass(to)} title={collapsed ? label : undefined} onClick={closeMobile}>
      <span className="flex-shrink-0 relative">
        {icon}
        {badge != null && badge > 0 && collapsed && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-64';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarWidth} bg-pink-700 dark:bg-[#1a1a1a] text-white h-screen flex flex-col fixed left-0 top-0
        border-r border-pink-800 dark:border-slate-800 z-40 transition-all duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
          {!collapsed && (
            <Building2 className="w-8 h-8 text-white flex-shrink-0" />
          )}
          {!collapsed && (
            <span className="flex flex-col flex-1 min-w-0">
              <span className="text-lg font-bold text-white leading-tight">Property 101</span>
              <span className="text-xs font-normal text-pink-200 dark:text-slate-400">Group Ltd</span>
            </span>
          )}
          {collapsed && <Building2 className="w-7 h-7 text-white" />}
        </div>

        {/* Sync status */}
        {!collapsed && (
          <div className="px-4 pb-2 min-h-[20px]">
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
                <span className="w-2 h-2 bg-amber-300 rounded-full animate-pulse" />
                Syncing...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-300 dark:text-emerald-400 uppercase tracking-wider font-bold">
                <CloudCheck size={12} />
                Connected
              </span>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} space-y-1 mt-2 overflow-y-auto`}>
          <NavLink to="/"           icon={<LayoutDashboard size={20} />} label="Dashboard"          badge={criticalCount} />
          <NavLink to="/complexes"  icon={<Building2 size={20} />}       label="Complexes" />
          <NavLink to="/calendar"   icon={<Calendar size={20} />}        label="Meeting Calendar" />
          <NavLink to="/reports"    icon={<BarChart3 size={20} />}       label="Reports" />
          <NavLink to="/meeting-docs-test" icon={<FileText size={20} />} label="Document Preparation" />
          <NavLink to="/disclosure" icon={<FileSignature size={20} />}   label="Disclosure & CPL" />
          <NavLink to="/contractors" icon={<HardHat size={20} />}        label="Contractors" />
          <NavLink to="/response-library" icon={<MessageSquare size={20} />} label="Response Library" />
          <NavLink to="/financial"  icon={<Receipt size={20} />}         label="Financial" />
          <NavLink to="/help"       icon={<BookOpen size={20} />}        label="User Guide" />

          {user?.role === 'admin' && (
            <div className={`pt-3 mt-3 border-t border-pink-800 dark:border-slate-800 space-y-1`}>
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold text-pink-300 dark:text-slate-500 uppercase tracking-wider mb-1">Administration</p>
              )}
              <NavLink to="/financials" icon={<DollarSign size={20} />} label="Portfolio" />
              <NavLink to="/admin"      icon={<Settings size={20} />}   label="Admin Panel" />
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} pb-4 border-t border-pink-800 dark:border-slate-800 space-y-2 pt-3`}>
          {/* Collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className={`hidden lg:flex items-center w-full px-3 py-2 bg-pink-800 dark:bg-slate-800 hover:bg-pink-900 dark:hover:bg-slate-700 rounded-lg text-sm text-pink-50 dark:text-slate-300 transition-colors ${collapsed ? 'justify-center' : 'gap-3'}`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full px-3 py-2 bg-pink-800 dark:bg-slate-800 hover:bg-pink-900 dark:hover:bg-slate-700 rounded-lg text-sm text-pink-50 dark:text-slate-300 transition-colors ${collapsed ? 'justify-center' : 'justify-between'}`}
            title={collapsed ? (theme === 'light' ? 'Dark mode' : 'Light mode') : undefined}
          >
            {collapsed ? (
              theme === 'light' ? <Moon size={18} /> : <Sun size={18} />
            ) : (
              <>
                <span className="flex items-center gap-3">
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </span>
                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-pink-600' : 'bg-pink-400 dark:bg-slate-600'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </>
            )}
          </button>

          {/* User info */}
          {!collapsed && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-pink-800 dark:bg-slate-700 flex items-center justify-center font-bold text-white border border-pink-900 dark:border-slate-600 flex-shrink-0">
                {user?.name.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-pink-200 dark:text-slate-400 truncate capitalize">{user?.role}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-pink-800 dark:bg-slate-700 flex items-center justify-center font-bold text-white border border-pink-900 dark:border-slate-600" title={user?.name}>
                {user?.name.charAt(0)}
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className={`flex items-center w-full px-3 py-2 text-left text-pink-200 dark:text-red-400 hover:bg-pink-800 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm ${collapsed ? 'justify-center' : 'gap-3'}`}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
