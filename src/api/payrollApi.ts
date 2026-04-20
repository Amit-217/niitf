import api from './axios';

// --- Types ---

export interface AttendancePayload {
    employeeId: string;
    date: string; // YYYY-MM-DD
    status: 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'ABSENT';
}

export interface BulkAttendancePayload {
    date: string; // YYYY-MM-DD
    attendances: {
        employeeId: string;
        status: 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'ABSENT';
    }[];
}

export interface SalaryConfigPayload {
    employeeId: string;
    monthlySalary: number;
    effectiveFrom: string; // YYYY-MM-DD
}

export interface OvertimePayload {
    employeeId: string;
    date: string; // YYYY-MM-DD
    units: number;
}

export interface AdvancePayload {
    employeeId: string;
    amount: number;
    date: string; // YYYY-MM-DD
    remarks?: string;
    repaymentMonth: string; // YYYY-MM
}

export interface GenerateSalaryPayload {
    employeeId: string;
    month: string; // YYYY-MM
    note?: string;
}

// --- Attendance Endpoints ---
export const markAttendance = (data: AttendancePayload) =>
    api.post('/admin/attendance', data);

export const bulkMarkAttendance = (data: BulkAttendancePayload) =>
    api.post('/admin/attendance/bulk', data);

export const updateAttendance = (id: string, status: 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'ABSENT') =>
    api.put(`/admin/attendance/${id}`, { status });

export const getAttendanceByDate = (date: string) =>
    api.get(`/admin/attendance?date=${date}`);

export const getEmployeeMonthlyAttendance = (employeeId: string, month: string) =>
    api.get(`/admin/attendance/employee/${employeeId}?month=${month}`);

// --- Salary Config Endpoints ---
export const createSalaryConfig = (data: SalaryConfigPayload) =>
    api.post('/admin/salary-config', data);

export const getCurrentSalaryConfig = (employeeId: string) =>
    api.get(`/admin/salary-config/current/${employeeId}`);

export const getAllSalaryConfigs = () =>
    api.get('/admin/salary-config/all');

export const getSalaryHistory = (employeeId: string) =>
    api.get(`/admin/salary-config/history/${employeeId}`);

export const toggleSalaryConfig = (id: string) =>
    api.patch(`/admin/salary-config/${id}/toggle`);

// --- Overtime Endpoints ---
export const markOvertime = (data: OvertimePayload) =>
    api.post('/admin/overtime', data);

export const updateOvertime = (id: string, units: number) =>
    api.put(`/admin/overtime/${id}`, { units });

export const getOvertimeByDate = (date: string) =>
    api.get(`/admin/overtime?date=${date}`);

export const getEmployeeMonthlyOvertime = (employeeId: string, month: string) =>
    api.get(`/admin/overtime/employee/${employeeId}?month=${month}`);

export const getAllOvertimeForMonth = (month: string) =>
    api.get(`/admin/overtime/month/all?month=${month}`);

// --- Advance Endpoints ---
export const createAdvance = (data: AdvancePayload) =>
    api.post('/admin/advance', data);

export const updateAdvance = (id: string, data: Partial<AdvancePayload>) =>
    api.put(`/admin/advance/${id}`, data);

export const getEmployeeMonthlyAdvances = (employeeId: string, month: string) =>
    api.get(`/admin/advance/employee/${employeeId}?month=${month}`);

export const getAllAdvancesForMonth = (month: string) =>
    api.get(`/admin/advance/month/all?month=${month}`);

// --- Salary Record Endpoints ---
export const generateSalary = (data: GenerateSalaryPayload) =>
    api.post('/admin/salary-record/generate', data);

export const previewSalary = (employeeId: string, month: string) =>
    api.get(`/admin/salary-record/preview/${employeeId}?month=${month}`);

export const getEmployeeSalaryRecord = (employeeId: string, month: string) =>
    api.get(`/admin/salary-record/${employeeId}?month=${month}`);

export const getAllSalaryRecordsForMonth = (month: string) =>
    api.get(`/admin/salary-record?month=${month}`);

export const deleteSalaryRecord = (id: string) =>
    api.delete(`/admin/salary-record/remove/${id}`);

export const updateSalaryRecordStatus = (id: string, status: 'DRAFT' | 'PAID') =>
    api.patch(`/admin/salary-record/${id}/status`, { status });
