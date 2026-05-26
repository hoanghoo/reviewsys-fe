import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoadingProvider } from './context/LoadingContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

function App() {
  return (
    <Router>
      <ToastProvider>
        <LoadingProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" />} />
              
              <Route path="/admin/*" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/manager/*" element={
                <PrivateRoute allowedRoles={['Manager', 'Admin']}>
                  <ManagerDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/employee/*" element={
                <PrivateRoute allowedRoles={['Employee', 'Manager', 'Admin']}>
                  <EmployeeDashboard />
                </PrivateRoute>
              } />
            </Routes>
          </AuthProvider>
        </LoadingProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
