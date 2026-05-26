import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const effectiveRoles = [...(allowedRoles || [])];
  if (effectiveRoles.includes('Manager') || effectiveRoles.includes('Employee')) {
    effectiveRoles.push('Leader');
  }

  if (allowedRoles && !effectiveRoles.includes(user.role)) {
    // If not allowed, redirect to their default dashboard
    if (user.role === 'Admin') return <Navigate to="/admin" />;
    if (user.role === 'Leader' || user.role === 'Manager') return <Navigate to="/manager" />;
    return <Navigate to="/employee" />;
  }

  return children;
};

export default PrivateRoute;
