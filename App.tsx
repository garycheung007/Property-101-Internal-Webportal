import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ComplexList from './pages/ComplexList';
import DocumentGenerator from './pages/DocumentGenerator';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';
import ContractorList from './pages/ContractorList';
import Sidebar from './components/Sidebar';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="ml-64 flex-1 p-8">
                {children}
            </main>
        </div>
    );
};

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();
    
    return (
        <Routes>
            <Route path="/login" element={
                isAuthenticated ? <Navigate to="/" replace /> : <Login />
            } />
            
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/complexes" element={
                <ProtectedRoute>
                    <Layout>
                        <ComplexList />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/reports" element={
                <ProtectedRoute>
                    <Layout>
                        <Reports />
                    </Layout>
                </ProtectedRoute>
            } />
            
             <Route path="/documents" element={
                <ProtectedRoute>
                    <Layout>
                        <DocumentGenerator />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/contractors" element={
                <ProtectedRoute>
                    <Layout>
                        <ContractorList />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
                <ProtectedRoute>
                    <Layout>
                        <AdminPanel />
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;