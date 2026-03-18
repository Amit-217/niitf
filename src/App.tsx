import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { VerifyOtp } from './pages/auth/VerifyOtp';
import { ResetPassword } from './pages/auth/ResetPassword';
import { StudentLogin } from './pages/auth/StudentLogin';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { EmployeeDashboard } from './pages/dashboard/EmployeeDashboard';
import { Settings } from './pages/settings/Settings';
import { StudentDashboard } from './pages/student/dashboard/StudentDashboard';
import { UsersPage } from './pages/users/UsersPage';
import { CoursesPage } from './pages/courses/CoursesPage';
import { BatchesPage } from './pages/batches/BatchesPage';
import { EnquiriesPage } from './pages/enquiries/EnquiriesPage';
import { AttendancePage } from './pages/admin/attendance/AttendancePage';
import { SalaryConfigPage } from './pages/admin/payroll/SalaryConfigPage';
import { OvertimePage } from './pages/admin/payroll/OvertimePage';
import { AdvancesPage } from './pages/admin/payroll/AdvancesPage';
import { SalaryRecordsPage } from './pages/admin/payroll/SalaryRecordsPage';
import { AdminTasksPage } from './pages/admin/tasks/AdminTasksPage';
import { EmployeeTasksPage } from './pages/employee/tasks/EmployeeTasksPage';
import { StudentsPage } from './pages/admin/students/StudentsPage';
import { AdmissionsPage } from './pages/admin/admissions/AdmissionsPage';
import { TestsPage } from './pages/admin/tests/TestsPage';
import { TakeTestPage } from './pages/student/tests/TakeTestPage';

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
    } else if (userRole === 'STUDENT') {
      return <Navigate to="/student/dashboard" replace />;
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
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Student/Employee Exam Route (Full screen, no layout) */}
        <Route
          path="/test/:id"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN', 'STUDENT']}>
              <TakeTestPage />
            </ProtectedRoute>
          }
        />

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
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="payroll/config" element={<SalaryConfigPage />} />
          <Route path="payroll/overtime" element={<OvertimePage />} />
          <Route path="payroll/advances" element={<AdvancesPage />} />
          <Route path="payroll/records" element={<SalaryRecordsPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="tests" element={<TestsPage />} />
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
          <Route path="tasks" element={<EmployeeTasksPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="enquiries" element={<EnquiriesPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
        </Route>

        {/* Student Dashboard Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
