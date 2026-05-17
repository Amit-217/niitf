import api from './axios';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AssignedTestPayload {
  questionPaper: string;
  batch: string;
  scheduledAt: string;
  duration?: number;
  status?: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
}

export interface AssignedTest {
  _id: string;
  assignId: string;
  questionPaper: {
    _id: string;
    paperId: string;
    title: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    difficulty: string;
  };
  batch: {
    _id: string;
    batchId: string;
    batchName: string;
    status: string;
  };
  scheduledAt: string;
  duration?: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  createdAt: string;
}

// ── API Functions ──────────────────────────────────────────────────────────────

export const getAssignedTests = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  batch?: string;
}) => api.get('/assigned-tests', { params });

export const getAssignedTestById = (id: string) =>
  api.get(`/assigned-tests/${id}`);

export const createAssignedTest = (data: AssignedTestPayload) =>
  api.post('/assigned-tests', data);

export const updateAssignedTest = (id: string, data: Partial<AssignedTestPayload>) =>
  api.put(`/assigned-tests/${id}`, data);

export const deleteAssignedTest = (id: string) =>
  api.delete(`/assigned-tests/${id}`);
