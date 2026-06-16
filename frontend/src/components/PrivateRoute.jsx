import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api';

const PrivateRoute = ({ children, allowedRoles }) => {
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Role not authorized
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
