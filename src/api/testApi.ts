import api from './axios';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Test {
    _id: string;
    testCode?: string;
    testName: string;
    batchId: { _id: string; batchName: string };
    durationMinutes: number;
    totalMarks: number;
    passingMarks: number;
    passingPercentage: number;
    mode: 'Online' | 'Offline';
    isActive: boolean;
    startTime: string;
    endTime: string;
    createdAt: string;
}

export interface TestPayload {
    testName: string;
    batchId: string;
    durationMinutes: number;
    totalMarks: number;
    passingPercentage: number;
    mode: 'Online' | 'Offline';
    startTime?: string;
    endTime?: string;
}

export interface Question {
    _id: string;
    testId: string;
    type: 'MCQ' | 'PASSAGE';
    passageName?: string;
    passageText?: string;
    passageId?: string;
    questionText: string;
    options: string[];
    marks: number;
}

export interface Passage {
    passageId: string;
    passageName: string;
    passageText: string;
    questionCount: number;
}

export interface QuestionPayload {
    type: 'MCQ' | 'PASSAGE';
    passageName?: string;
    passageText?: string;
    passageId?: string;
    questionText: string;
    options: string[];
    correctOption: number;
    marks?: number;
}

export interface OfflineScorePayload {
    studentId: string;
    score: number;
}

// ─── Admin Test APIs ─────────────────────────────────────────────────────────

export const createTest = (data: TestPayload) =>
    api.post('/admin/tests', data);

export const getTests = (params?: { page?: number; limit?: number; batchId?: string; mode?: string }) =>
    api.get('/admin/tests', { params });

export const updateTest = (id: string, data: Partial<TestPayload & { isActive: boolean }>) =>
    api.put(`/admin/tests/${id}`, data);

export const addQuestion = (testId: string, data: QuestionPayload) =>
    api.post(`/admin/tests/${testId}/questions`, data);

export const getQuestions = (testId: string) =>
    api.get(`/admin/tests/${testId}/questions`);

export const getPassages = (testId: string) =>
    api.get(`/admin/tests/${testId}/passages`);

export const recordOfflineScore = (testId: string, data: OfflineScorePayload) =>
    api.post(`/admin/tests/${testId}/offline-score`, data);

export const sendExamInvites = (testId: string) =>
    api.post(`/admin/tests/${testId}/send-invites`);

// ─── Student Test APIs ───────────────────────────────────────────────────────

export const startTest = (testId: string, studentId: string) =>
    api.get(`/tests/${testId}/start`, { params: { studentId } });

export const submitTest = (testId: string, studentId: string, answers: { questionId: string; selectedOption: number }[]) =>
    api.post(`/tests/${testId}/submit`, { studentId, answers });
