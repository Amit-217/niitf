import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { VerifyOtp } from './pages/auth/VerifyOtp';
import { ResetPassword } from './pages/auth/ResetPassword';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { EmployeeDashboard } from './pages/dashboard/EmployeeDashboard';
import { Settings } from './pages/settings/Settings';
import { UsersPage } from './pages/users/UsersPage';
import { CoursesPage } from './pages/courses/CoursesPage';
import { BatchesPage } from './pages/batches/BatchesPage';
import { EnquiriesPage } from './pages/enquiries/EnquiriesPage';
// Role-Based Protected Route Wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  const userRole = user.role || 'EMPLOYEE';

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return <>{children}</>;
};



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="enquiries" element={<EnquiriesPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Employee Dashboard Routes */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="enquiries" element={<EnquiriesPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
