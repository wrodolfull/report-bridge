import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import TestMenu from './pages/TestMenu';
import Presence from './pages/Presence';
import Layout from './components/Layout';
import CallQueues from './pages/CallQueues';
import GotoCallEvents from './pages/GotoCallEvents';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="testmenu" element={<TestMenu />} />
          <Route path="call-queues" element={<CallQueues />} />
          <Route path="goto-call-events" element={<GotoCallEvents />} />
          <Route path="presence" element={<Presence />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

