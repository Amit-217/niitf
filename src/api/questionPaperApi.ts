import api from './axios';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubQuestion {
  _id?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  explanation?: string;
}

export interface DirectQuestion {
  _id?: string;
  type: 'direct';
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  explanation?: string;
}

export interface PassageQuestion {
  _id?: string;
  type: 'passage';
  passageText: string;
  questions: SubQuestion[];
}

export type QuestionItem = DirectQuestion | PassageQuestion;

export interface QuestionPaperPayload {
  title: string;
  subject: string;
  duration: number;
  totalMarks?: number;
  passingMarks?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  instructions?: string;
  questions: QuestionItem[];
  isActive?: boolean;
}

export interface QuestionPaper extends QuestionPaperPayload {
  _id: string;
  paperId: string;
  totalMarks: number;
  passingMarks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isActive: boolean;
  createdAt: string;
}

// ── API Functions ──────────────────────────────────────────────────────────────

export const getQuestionPapers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: string;
  status?: string;
}) => api.get('/question-papers', { params });

export const getQuestionPaperById = (id: string) =>
  api.get(`/question-papers/${id}`);

export const createQuestionPaper = (data: QuestionPaperPayload) =>
  api.post('/question-papers', data);

export const updateQuestionPaper = (id: string, data: Partial<QuestionPaperPayload>) =>
  api.put(`/question-papers/${id}`, data);

export const deleteQuestionPaper = (id: string) =>
  api.delete(`/question-papers/${id}`);
