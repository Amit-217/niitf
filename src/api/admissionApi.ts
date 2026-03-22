import api from './axios';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StudentPayload {
    fullName: string;
    mobile: string;
    email?: string | null;
    city?: string | null;
    qualification?: string | null;
    sponsorType?: 'Individual' | 'Company';
    companyName?: string | null;
    enquiryId?: string; // Optional: link to an existing enquiry
}

export interface Student {
    _id: string;
    studentId: string;
    fullName: string;
    mobile: string;
    email?: string;
    city?: string;
    qualification?: string;
    sponsorType: 'Individual' | 'Company';
    companyName?: string;
    isActive: boolean;
    createdAt: string;
}

export interface AdmissionPayload {
    studentId: string;
    courseId: string;
    batchId: string;
    admissionDate: string;
    totalFees: number;
    discount?: number;
    finalPayable: number;
    status?: 'Active' | 'Completed' | 'Cancelled';
}

export interface Admission {
    _id: string;
    admissionId: string;
    studentId: Student;
    courseId: { _id: string; title?: string; courseName?: string; duration: string };
    batchId: { _id: string; batchName: string; timing: string };
    totalFees: number;
    discount: number;
    finalPayable: number;
    status: 'Active' | 'Completed' | 'Cancelled';
    admissionDate: string;
    totalPaid?: number;
    balance?: number;
    paymentStatus?: 'Pending' | 'Partial' | 'Full';
}

export interface FeePayment {
    _id: string;
    admissionId: string;
    installmentNo: 1 | 2 | 3 | 4;
    amount: number;
    paymentMode: 'Cash' | 'UPI' | 'Bank';
    paymentDate: string;
    remarks?: string;
}

export interface FeePaymentPayload {
    installmentNo: 1 | 2 | 3 | 4;
    amount: number;
    paymentMode: 'Cash' | 'UPI' | 'Bank';
    remarks?: string;
}

export interface PayRemainingFeePayload {
    paymentMode?: 'Cash' | 'UPI' | 'Bank';
    remarks?: string;
    paymentDate?: string;
}

// ─── Student APIs ────────────────────────────────────────────────────────────

export const getStudents = (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/students', { params });

export const getStudentById = (id: string) =>
    api.get(`/admin/students/${id}`);

export const createStudent = (data: StudentPayload) =>
    api.post('/admin/students', data);

export const updateStudent = (id: string, data: Partial<StudentPayload>) =>
    api.put(`/admin/students/${id}`, data);

export const deleteStudent = (id: string) =>
    api.delete(`/admin/students/${id}`);

// ─── Admission APIs ──────────────────────────────────────────────────────────

export const getAdmissions = (params?: { page?: number; limit?: number; studentId?: string; status?: string; hasBalance?: string }) =>
    api.get('/admin/admissions', { params });

export const getAdmissionById = (id: string) =>
    api.get(`/admin/admissions/${id}`);

export const createAdmission = (data: AdmissionPayload) =>
    api.post('/admin/admissions', data);

export const updateAdmission = (id: string, data: Partial<AdmissionPayload>) =>
    api.put(`/admin/admissions/${id}`, data);

export const completeAdmission = (id: string) =>
    api.put(`/admin/admissions/${id}/complete`);

// ─── Fee Payment APIs ────────────────────────────────────────────────────────

export const getFeesByAdmission = (admissionId: string) =>
    api.get(`/admin/fees/${admissionId}`);

export const payFee = (admissionId: string, data: FeePaymentPayload) =>
    api.post(`/admin/fees/${admissionId}/pay`, data);

export const payRemainingFee = (admissionId: string, data?: PayRemainingFeePayload) =>
    api.post(`/admin/fees/${admissionId}/pay-remaining`, data || {});
