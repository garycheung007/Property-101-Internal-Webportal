
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ComplexList from './pages/ComplexList';
import DisclosureGenerator from './pages/DisclosureGenerator';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';
import MeetingDocsTest from './pages/MeetingDocsTest';
import Financials from './pages/Financials';
import Financial from './pages/Financial';
import ContractorList from './pages/ContractorList';
import ResponseLibrary from './pages/ResponseLibrary';
import MeetingCalendar from './pages/MeetingCalendar';
import Sidebar from './components/Sidebar';
import { Menu } from 'lucide-react';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { collapsed, toggleMobile } = useSidebar();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const mainMargin = collapsed ? 'md:ml-[68px]' : 'md:ml-64';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobile}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-pink-700 dark:bg-slate-800 text-white rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <main className={`flex-1 ${mainMargin} transition-all duration-300 p-8 pt-16 md:pt-8`}>
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/"            element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/complexes"   element={<ProtectedLayout><ComplexList /></ProtectedLayout>} />
      <Route path="/calendar"    element={<ProtectedLayout><MeetingCalendar /></ProtectedLayout>} />
      <Route path="/reports"     element={<ProtectedLayout><Reports /></ProtectedLayout>} />
      <Route path="/disclosure"  element={<ProtectedLayout><DisclosureGenerator /></ProtectedLayout>} />
      <Route path="/contractors" element={<ProtectedLayout><ContractorList /></ProtectedLayout>} />
      <Route path="/response-library" element={<ProtectedLayout><ResponseLibrary /></ProtectedLayout>} />
      <Route path="/admin"       element={<ProtectedLayout><AdminPanel /></ProtectedLayout>} />
      <Route path="/meeting-docs-test" element={<ProtectedLayout><MeetingDocsTest /></ProtectedLayout>} />
      <Route path="/financials"  element={<ProtectedLayout><Financials /></ProtectedLayout>} />
      <Route path="/financial"   element={<ProtectedLayout><Financial /></ProtectedLayout>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <SidebarProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </SidebarProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
