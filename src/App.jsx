import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';

// Dummy Dashboards for Phase 2
const AdminDashboard = () => <div className="p-8 text-white min-h-screen bg-slate-900 text-2xl font-bold">Admin Dashboard</div>;
const ManagerDashboard = () => <div className="p-8 text-white min-h-screen bg-slate-900 text-2xl font-bold">Manager Dashboard</div>;
const EmployeeDashboard = () => <div className="p-8 text-white min-h-screen bg-slate-900 text-2xl font-bold">Employee Dashboard</div>;

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
