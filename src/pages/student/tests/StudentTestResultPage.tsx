import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, MinusCircle, Trophy, ClipboardList } from 'lucide-react';
import { getTestResult, AnswerPayload } from '../../../api/studentTestApi';
import { toast } from 'react-toastify';

interface Submission {
    _id: string;
    submissionId: string;
    status: string;
    score: number;
    totalMarks: number;
    percentage: number;
    isPassed: boolean;
    submittedAt: string;
    answers: AnswerPayload[];
}

interface Question {
    _id: string;
    type: 'direct' | 'passage' | 'subjective';
    questionText?: string;
    options?: string[];
    correctOptionIndex?: number;
    marks?: number;
    passageText?: string;
    questions?: {
        _id: string;
        questionText: string;
        options: string[];
        correctOptionIndex: number;
        marks?: number;
    }[];
}

interface TestData {
    questionPaper: {
        title: string;
        paperId: string;
        totalMarks: number;
        passingMarks: number;
        difficulty: string;
        questions: Question[];
    };
    batch: { batchId: string; batchName: string };
    scheduledAt: string;
}

const StudentTestResultPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [test, setTest] = useState<TestData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        getTestResult(id)
            .then((res) => {
                setSubmission(res.submission as Submission);
                setTest(res.test as TestData);
            })
            .catch((err: any) => {
                toast.error(err?.message || 'Failed to load result');
                navigate('/student/tests');
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading result...</div>;
    }

    if (!submission || !test) return null;

    // Build answer map for review
    const answerMap: Record<string, AnswerPayload> = {};
    submission.answers.forEach((a) => { answerMap[a.questionId] = a; });

    // Compute per-question result for review
    type ReviewItem = {
        questionText: string;
        options?: string[];
        correctOptionIndex?: number;
        selectedOptionIndex?: number | null;
        textAnswer?: string | null;
        type: string;
        marks: number;
        isCorrect: boolean | null; // null = subjective
    };

    const reviewItems: ReviewItem[] = [];
    test.questionPaper.questions.forEach((q) => {
        if (q.type === 'direct') {
            const ans = answerMap[q._id];
            const correct = ans?.selectedOptionIndex != null && ans.selectedOptionIndex === q.correctOptionIndex;
            reviewItems.push({
                questionText: q.questionText || '',
                options: q.options,
                correctOptionIndex: q.correctOptionIndex,
                selectedOptionIndex: ans?.selectedOptionIndex ?? null,
                type: 'direct',
                marks: q.marks ?? 1,
                isCorrect: ans?.selectedOptionIndex == null ? null : correct,
            });
        } else if (q.type === 'passage') {
            (q.questions || []).forEach((sq) => {
                const ans = answerMap[sq._id];
                const correct = ans?.selectedOptionIndex != null && ans.selectedOptionIndex === sq.correctOptionIndex;
                reviewItems.push({
                    questionText: sq.questionText,
                    options: sq.options,
                    correctOptionIndex: sq.correctOptionIndex,
                    selectedOptionIndex: ans?.selectedOptionIndex ?? null,
                    type: 'passage',
                    marks: sq.marks || 1,
                    isCorrect: ans?.selectedOptionIndex == null ? null : correct,
                });
            });
        } else if (q.type === 'subjective') {
            const ans = answerMap[q._id];
            reviewItems.push({
                questionText: q.questionText || '',
                textAnswer: ans?.textAnswer ?? null,
                type: 'subjective',
                marks: q.marks || 0,
                isCorrect: null,
            });
        }
    });

    const correct = reviewItems.filter((r) => r.isCorrect === true).length;
    const wrong = reviewItems.filter((r) => r.isCorrect === false).length;
    // Count skipped: MCQ with no selected option, or subjective with no text answer
    const skipped = reviewItems.filter((r) =>
        r.type === 'subjective' ? !r.textAnswer : r.selectedOptionIndex == null
    ).length;

    // Derive isPassed from score vs passingMarks — backend field can be stale/incorrect
    const isPassed = submission.score >= test.questionPaper.passingMarks;

    return (
        <div className="space-y-6">
            {/* Score card */}
            <div className={`rounded-2xl p-6 text-white ${isPassed ? 'bg-gradient-to-r from-green-600 to-emerald-500' : 'bg-gradient-to-r from-red-600 to-rose-500'}`}>
                <div className="flex items-center gap-3 mb-3">
                    {isPassed
                        ? <Trophy size={28} className="text-yellow-300" />
                        : <XCircle size={28} className="text-red-200" />
                    }
                    <div>
                        <h1 className="text-xl font-bold">{isPassed ? 'Congratulations! You Passed!' : 'Test Completed'}</h1>
                        <p className="text-sm opacity-80">{test.questionPaper.title}</p>
                    </div>
                </div>
                <div className="flex items-end gap-2 mt-4">
                    <span className="text-5xl font-bold">{submission.score}</span>
                    <span className="text-2xl opacity-70 mb-1">/ {submission.totalMarks}</span>
                    <span className={`ml-4 text-lg font-semibold px-3 py-1 rounded-full ${submission.isPassed ? 'bg-white/20' : 'bg-white/20'}`}>
                        {submission.percentage}%
                    </span>
                </div>
                <p className="text-sm opacity-70 mt-1">Passing marks: {test.questionPaper.passingMarks}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <CheckCircle size={20} className="text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{correct}</p>
                    <p className="text-xs text-gray-500">Correct</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <XCircle size={20} className="text-red-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{wrong}</p>
                    <p className="text-xs text-gray-500">Wrong</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <MinusCircle size={20} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{skipped}</p>
                    <p className="text-xs text-gray-500">Skipped</p>
                </div>
            </div>

            {/* Question review */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Answer Review</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {reviewItems.map((item, i) => {
                        const statusColor = item.isCorrect === true
                            ? 'border-l-green-400 bg-green-50/30'
                            : item.isCorrect === false
                            ? 'border-l-red-400 bg-red-50/30'
                            : 'border-l-gray-300';

                        return (
                            <div key={i} className={`p-5 border-l-4 ${statusColor}`}>
                                <div className="flex items-start gap-2 mb-3">
                                    <span className="text-xs font-bold text-gray-400 mt-0.5 min-w-[20px]">Q{i + 1}</span>
                                    <p className="text-sm text-gray-800 font-medium leading-relaxed">{item.questionText}</p>
                                </div>

                                {item.type !== 'subjective' && item.options && (
                                    <div className="ml-6 space-y-1.5">
                                        {item.options.map((opt, oi) => {
                                            const isCorrect = oi === item.correctOptionIndex;
                                            const isSelected = oi === item.selectedOptionIndex;
                                            return (
                                                <div
                                                    key={oi}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                                        isCorrect
                                                            ? 'bg-green-100 text-green-800 font-medium'
                                                            : isSelected && !isCorrect
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'text-gray-600'
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold">{String.fromCharCode(65 + oi)}.</span>
                                                    {opt}
                                                    {isCorrect && <CheckCircle size={13} className="ml-auto text-green-600" />}
                                                    {isSelected && !isCorrect && <XCircle size={13} className="ml-auto text-red-500" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {item.type === 'subjective' && (
                                    <div className="ml-6 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                        {item.textAnswer ? <p><span className="font-medium">Your answer:</span> {item.textAnswer}</p> : <p className="text-gray-400 italic">No answer provided</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center flex-wrap pb-6">
                <button
                    onClick={() => navigate('/student/tests')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <ClipboardList size={15} /> My Tests
                </button>
                <button
                    onClick={() => navigate('/student/dashboard')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                    Dashboard
                </button>
            </div>
        </div>
    );
};

export default StudentTestResultPage;
