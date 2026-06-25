import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Login } from "./pages/auth/Login";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { VerifyOtp } from "./pages/auth/VerifyOtp";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AdminDashboard } from "./pages/dashboard/AdminDashboard";
import { EmployeeDashboard } from "./pages/dashboard/EmployeeDashboard";
import { SupervisorDashboard } from "./pages/dashboard/SupervisorDashboard";
import { Settings } from "./pages/settings/Settings";
import { UsersPage } from "./pages/users/UsersPage";
import { CoursesPage } from "./pages/courses/CoursesPage";
import { BatchesPage } from "./pages/batches/BatchesPage";
import { EnquiriesPage } from "./pages/enquiries/EnquiriesPage";
import { AttendancePage } from "./pages/admin/attendance/AttendancePage";
import { AttendanceHistoryPage } from "./pages/admin/attendance/AttendanceHistoryPage";
import { SalaryConfigPage } from "./pages/admin/payroll/SalaryConfigPage";
import { OvertimePage } from "./pages/admin/payroll/OvertimePage";
import { AdvancesPage } from "./pages/admin/payroll/AdvancesPage";
import { SalaryRecordsPage } from "./pages/admin/payroll/SalaryRecordsPage";
import { AdminTasksPage } from "./pages/admin/tasks/AdminTasksPage";
import { MyTasksPage } from "./pages/admin/tasks/MyTasksPage";
import { EmployeeTasksPage } from "./pages/employee/tasks/EmployeeTasksPage";
import { StudentsPage } from "./pages/admin/students/StudentsPage";
import { CustomersPage } from "./pages/admin/customers/CustomersPage";
import { CustomerDetailPage } from "./pages/admin/customers/CustomerDetailPage";
import { MPTReportFormPage } from "./pages/admin/reports/MPTReportFormPage";
import { MPTReportPrintPage } from "./pages/admin/reports/MPTReportPrintPage";
import { PTReportFormPage } from "./pages/admin/reports/PTReportFormPage";
import { PTReportPrintPage } from "./pages/admin/reports/PTReportPrintPage";
import { UTReportFormPage } from "./pages/admin/reports/UTReportFormPage";
import { UTReportPrintPage } from "./pages/admin/reports/UTReportPrintPage";
import { VSSCUTReportFormPage } from "./pages/admin/reports/VSSCUTReportFormPage";
import { VSSCUTReportPrintPage } from "./pages/admin/reports/VSSCUTReportPrintPage";
import { ReportsListPage } from "./pages/admin/reports/ReportsListPage";
import { UTGReportFormPage } from "./pages/admin/reports/UTGReportFormPage";
import { UTGReportPrintPage } from "./pages/admin/reports/UTGReportPrintPage";
import { TPIIVRFormPage } from "./pages/admin/reports/TPIIVRFormPage";
import { TPIIVRReportPrintPage } from "./pages/admin/reports/TPIIVRReportPrintPage";
import { AWSDReportFormPage } from "./pages/admin/reports/AWSDReportFormPage";
import { AWSDReportPrintPage } from "./pages/admin/reports/AWSDReportPrintPage";
import { AdmissionsPage } from "./pages/admin/admissions/AdmissionsPage";
import { QuotationsListPage } from "./pages/admin/quotations/QuotationsListPage";
import { QuotationFormPage } from "./pages/admin/quotations/QuotationFormPage";
import { QuotationPrintPage } from "./pages/admin/quotations/QuotationPrintPage";
import { InvoicesListPage } from "./pages/admin/invoices/InvoicesListPage";
import { InvoiceFormPage } from "./pages/admin/invoices/InvoiceFormPage";
import { InvoicePrintPage } from "./pages/admin/invoices/InvoicePrintPage";
import { SalarySlipPage } from "./pages/admin/payroll/SalarySlipPage";
import { EmployeeSalaryDetailPage } from "./pages/admin/payroll/EmployeeSalaryDetailPage";
import { QuestionPapersPage } from "./pages/admin/questionPapers/QuestionPapersPage";
import { QuestionPaperFormPage } from "./pages/admin/questionPapers/QuestionPaperFormPage";
import { AssignTestPage } from "./pages/admin/assignedTests/AssignTestPage";
import { CertificatePrintPage } from "./pages/admin/assignedTests/CertificatePrintPage";
import { ResultsPage } from "./pages/admin/results/ResultsPage";
import { ResultDetailPage } from "./pages/admin/results/ResultDetailPage";
import { SubmissionReviewPage } from "./pages/admin/results/SubmissionReviewPage";
import { StudentLogin } from "./pages/auth/StudentLogin";
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/dashboard/StudentDashboard";
import StudentTestsPage from "./pages/student/tests/StudentTestsPage";
import TakeTestPage from "./pages/student/tests/TakeTestPage";
import StudentTestResultPage from "./pages/student/tests/StudentTestResultPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const isTokenExpired = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized));
    if (!decoded?.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
};

const getSessionUser = () => {
  const token = localStorage.getItem("accessToken");
  const userStr = localStorage.getItem("user");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!userStr) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return null;
  }

  // If access token is expired but a refresh token exists, let the user through.
  // The axios interceptor will silently refresh on the next API call.
  if (!token || isTokenExpired(token)) {
    if (!refreshToken) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      return null;
    }
  }

  try {
    return JSON.parse(userStr);
  } catch {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    return null;
  }
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const location = useLocation();
  const user = getSessionUser();

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  const userRole = user.role || "EMPLOYEE";

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === "STUDENT") {
      return <Navigate to="/student/dashboard" replace />;
    } else if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "SUPERVISOR") {
      return <Navigate to="/supervisor/dashboard" replace />;
    } else {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = getSessionUser();

  if (!user) {
    return <>{children}</>;
  }

  const role = user.role || "EMPLOYEE";
  if (role === "STUDENT") {
    return <Navigate to="/student/dashboard" replace />;
  }
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (role === "SUPERVISOR") {
    return <Navigate to="/supervisor/dashboard" replace />;
  }
  return <Navigate to="/employee/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/student-login"
          element={
            <PublicOnlyRoute>
              <StudentLogin />
            </PublicOnlyRoute>
          }
        />

        {/* Student Portal Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="tests" element={<StudentTestsPage />} />
          <Route path="tests/:id/take" element={<TakeTestPage />} />
          <Route path="tests/:id/result" element={<StudentTestResultPage />} />
          <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route
            path="attendance/history"
            element={<AttendanceHistoryPage />}
          />
          <Route path="payroll/config" element={<SalaryConfigPage />} />
          <Route path="payroll/overtime" element={<OvertimePage />} />
          <Route path="payroll/advances" element={<AdvancesPage />} />
          <Route path="payroll/records" element={<SalaryRecordsPage />} />
          <Route path="payroll/employee/:id/detail" element={<EmployeeSalaryDetailPage />} />
          <Route path="my-tasks" element={<MyTasksPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="enquiries" element={<EnquiriesPage />} />
          <Route path="question-papers" element={<QuestionPapersPage />} />
          <Route path="question-papers/new" element={<QuestionPaperFormPage />} />
          <Route path="question-papers/:id/edit" element={<QuestionPaperFormPage />} />
          <Route path="assign-tests" element={<AssignTestPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="results/:testId" element={<ResultDetailPage />} />
          <Route path="results/:testId/:submissionId" element={<SubmissionReviewPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />

          <Route path="quotations" element={<QuotationsListPage />} />
          <Route path="quotations/:type/new" element={<QuotationFormPage />} />
          <Route
            path="quotations/:type/:id/edit"
            element={<QuotationFormPage />}
          />

          <Route path="invoices" element={<InvoicesListPage />} />
          <Route path="invoices/new" element={<InvoiceFormPage />} />
          <Route path="invoices/:id/edit" element={<InvoiceFormPage />} />

          <Route path="reports" element={<ReportsListPage />} />
          <Route path="reports/mpt/new" element={<MPTReportFormPage />} />
          <Route path="reports/mpt/:id/edit" element={<MPTReportFormPage />} />
          <Route path="reports/pt/new" element={<PTReportFormPage />} />
          <Route path="reports/pt/:id/edit" element={<PTReportFormPage />} />
          <Route path="reports/ut/new" element={<UTReportFormPage />} />
          <Route path="reports/ut/:id/edit" element={<UTReportFormPage />} />
          <Route
            path="reports/vssc-ut/new"
            element={<VSSCUTReportFormPage />}
          />
          <Route
            path="reports/vssc-ut/:id/edit"
            element={<VSSCUTReportFormPage />}
          />
          <Route path="reports/utg/new" element={<UTGReportFormPage />} />
          <Route path="reports/utg/:id/edit" element={<UTGReportFormPage />} />
          <Route path="reports/tpi-ivr/new" element={<TPIIVRFormPage />} />
          <Route path="reports/tpi-ivr/:id/edit" element={<TPIIVRFormPage />} />
          <Route path="reports/awsd/new" element={<AWSDReportFormPage />} />
          <Route
            path="reports/awsd/:id/edit"
            element={<AWSDReportFormPage />}
          />
          <Route path="settings" element={<Settings />} />
          <Route
            path="*"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Route>

        {/* Employee Dashboard Routes */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="tasks" element={<EmployeeTasksPage />} />
          <Route path="my-tasks" element={<MyTasksPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="quotations" element={<QuotationsListPage />} />
          <Route path="quotations/:type/new" element={<QuotationFormPage />} />
          <Route
            path="quotations/:type/:id/edit"
            element={<QuotationFormPage />}
          />
          <Route path="invoices" element={<InvoicesListPage />} />
          <Route path="invoices/new" element={<InvoiceFormPage />} />
          <Route path="invoices/:id/edit" element={<InvoiceFormPage />} />
          <Route path="reports" element={<ReportsListPage />} />
          <Route path="reports/mpt/new" element={<MPTReportFormPage />} />
          <Route path="reports/mpt/:id/edit" element={<MPTReportFormPage />} />
          <Route path="reports/pt/new" element={<PTReportFormPage />} />
          <Route path="reports/pt/:id/edit" element={<PTReportFormPage />} />
          <Route path="reports/ut/new" element={<UTReportFormPage />} />
          <Route path="reports/ut/:id/edit" element={<UTReportFormPage />} />
          <Route
            path="reports/vssc-ut/new"
            element={<VSSCUTReportFormPage />}
          />
          <Route
            path="reports/vssc-ut/:id/edit"
            element={<VSSCUTReportFormPage />}
          />
          <Route path="reports/utg/new" element={<UTGReportFormPage />} />
          <Route path="reports/utg/:id/edit" element={<UTGReportFormPage />} />
          <Route path="reports/tpi-ivr/new" element={<TPIIVRFormPage />} />
          <Route path="reports/tpi-ivr/:id/edit" element={<TPIIVRFormPage />} />
          <Route path="reports/awsd/new" element={<AWSDReportFormPage />} />
          <Route
            path="reports/awsd/:id/edit"
            element={<AWSDReportFormPage />}
          />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="enquiries" element={<EnquiriesPage />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="*"
            element={<Navigate to="/employee/dashboard" replace />}
          />
        </Route>

        {/* Supervisor Dashboard Routes */}
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SupervisorDashboard />} />
          <Route path="my-tasks" element={<MyTasksPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="attendance/history" element={<AttendanceHistoryPage />} />
          <Route path="payroll/overtime" element={<OvertimePage />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="*"
            element={<Navigate to="/supervisor/dashboard" replace />}
          />
        </Route>

        {/* Salary Slip Standalone Page */}
        <Route
          path="/admin/payroll/slip"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <SalarySlipPage />
            </ProtectedRoute>
          }
        />

        {/* Report Print Routes (standalone, no DashboardLayout) */}
        <Route
          path="/admin/reports/mpt/:id/print"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "EMPLOYEE"]}>
              <MPTReportPrintPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports/pt/:id/print"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "EMPLOYEE"]}>
              <PTReportPrintPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports/ut/:id/print"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "EMPLOYEE"]}>
              <UTReportPrintPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports/vssc-ut/:id/print"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "EMPLOYEE"]}>
              <VSSCUTReportPrintPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports/utg/:id/print"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "EMPLOYEE"]}>
              <UTGReportPrintPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports/tpi-ivr/:id/print"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "EMPLOYEE"]}>
              <TPIIVRReportPrintPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports/awsd/:id/print"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "EMPLOYEE"]}>
              <AWSDReportPrintPage />
            </ProtectedRoute>
          }
        />

        {/* NDT Certificate Print Page (standalone, no DashboardLayout) */}
        <Route
          path="/admin/assign-tests/:testId/certificate/:submissionId"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <CertificatePrintPage />
            </ProtectedRoute>
          }
        />

        {/* Public Report View Routes — no auth required */}
        <Route
          path="/reports/public/mpt/:id"
          element={<MPTReportPrintPage />}
        />
        <Route path="/reports/public/pt/:id" element={<PTReportPrintPage />} />
        <Route path="/reports/public/ut/:id" element={<UTReportPrintPage />} />
        <Route
          path="/reports/public/vssc-ut/:id"
          element={<VSSCUTReportPrintPage />}
        />
        <Route
          path="/reports/public/utg/:id"
          element={<UTGReportPrintPage />}
        />
        <Route
          path="/reports/public/tpi-ivr/:id"
          element={<TPIIVRReportPrintPage />}
        />
        <Route
          path="/reports/public/awsd/:id"
          element={<AWSDReportPrintPage />}
        />

        <Route
          path="/admin/quotations/:type/:id/print"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "EMPLOYEE"]}>
              <QuotationPrintPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/invoices/:id/print"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "EMPLOYEE"]}>
              <InvoicePrintPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/invoices/:id/print"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "EMPLOYEE"]}>
              <InvoicePrintPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/quotations/:type/:id/print"
          element={<QuotationPrintPage />}
        />

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} limit={3} />
    </BrowserRouter>
  );
}

export default App;
