import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0d0d0d', color: '#c9973a',
      fontFamily: 'monospace', fontSize: 12, letterSpacing: 2
    }}>
      ĐANG TẢI...
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.vaitro || ''))
    return <Navigate to="/tables" replace />;

  return <Outlet />;
};

export default PrivateRoute;