import api from './axios';

export interface MyTest {
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
    };
    scheduledAt: string;
    duration?: number;
    status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
    submission: {
        _id: string;
        status: 'InProgress' | 'Submitted' | 'TimedOut';
        score: number;
        totalMarks: number;
        percentage: number;
        isPassed: boolean;
        submittedAt: string;
    } | null;
}

export interface Question {
    _id: string;
    type: 'direct' | 'passage' | 'subjective';
    questionText?: string;
    options?: string[];
    marks?: number;
    passageText?: string;
    questions?: {
        _id: string;
        questionText: string;
        options: string[];
        marks?: number;
    }[];
}

export interface TestForTaking {
    test: {
        _id: string;
        assignId: string;
        scheduledAt: string;
        duration?: number;
        status: string;
        questionPaper: {
            _id: string;
            paperId: string;
            title: string;
            duration: number;
            totalMarks: number;
            passingMarks: number;
            difficulty: string;
            instructions?: string;
            questions: Question[];
        };
        batch: { batchId: string; batchName: string };
    };
    submission: {
        _id: string;
        submissionId: string;
        status: string;
        startedAt: string;
        answers: AnswerPayload[];
    } | null;
}

export interface AnswerPayload {
    questionId: string;
    parentQuestionId?: string | null;
    questionType: 'direct' | 'passage' | 'subjective';
    selectedOptionIndex?: number | null;
    textAnswer?: string | null;
}

export const getMyTests = (): Promise<{ tests: MyTest[] }> =>
    api.get('/student/tests');

export const getTestForTaking = (id: string): Promise<TestForTaking> =>
    api.get(`/student/tests/${id}`);

export const startTest = (id: string): Promise<{ submission: { _id: string; submissionId: string; startedAt: string } }> =>
    api.post(`/student/tests/${id}/start`);

export const submitTest = (
    id: string,
    answers: AnswerPayload[],
    timedOut = false
): Promise<{ submission: object; correct: number; wrong: number; skipped: number }> =>
    api.post(`/student/tests/${id}/submit`, { answers, timedOut });

export const getTestResult = (id: string): Promise<{
    submission: {
        _id: string;
        submissionId: string;
        status: string;
        score: number;
        totalMarks: number;
        percentage: number;
        isPassed: boolean;
        submittedAt: string;
        answers: AnswerPayload[];
    };
    test: object;
}> => api.get(`/student/tests/${id}/result`);
