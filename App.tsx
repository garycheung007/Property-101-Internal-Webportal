
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ComplexList from './pages/ComplexList';
import DocumentGenerator from './pages/DocumentGenerator';
import DisclosureGenerator from './pages/DisclosureGenerator';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';
import Financials from './pages/Financials';
import ContractorList from './pages/ContractorList';
import Sidebar from './components/Sidebar';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">{children}</main>
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
      <Route path="/reports"     element={<ProtectedLayout><Reports /></ProtectedLayout>} />
      <Route path="/documents"   element={<ProtectedLayout><DocumentGenerator /></ProtectedLayout>} />
      <Route path="/disclosure"  element={<ProtectedLayout><DisclosureGenerator /></ProtectedLayout>} />
      <Route path="/contractors" element={<ProtectedLayout><ContractorList /></ProtectedLayout>} />
      <Route path="/admin"       element={<ProtectedLayout><AdminPanel /></ProtectedLayout>} />
      <Route path="/financials"  element={<ProtectedLayout><Financials /></ProtectedLayout>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <HashRouter>
                <AppRoutes />
            </HashRouter>
          </DataProvider>
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
