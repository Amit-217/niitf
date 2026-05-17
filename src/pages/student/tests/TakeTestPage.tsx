import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Flag } from 'lucide-react';
import {
    getTestForTaking,
    startTest,
    submitTest,
    TestForTaking,
    Question,
    AnswerPayload,
} from '../../../api/studentTestApi';
import { toast } from 'react-toastify';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Flatten all "question slots" from the paper's questions array */
interface QuestionSlot {
    key: string;              // unique key = question _id (or subq _id for passage)
    parentKey: string | null; // passage parent _id
    type: 'direct' | 'passage' | 'subjective';
    questionText: string;
    options?: string[];
    marks?: number;
    passageText?: string;     // only for the first sub-question in a passage group
    passageGroupLabel?: string; // e.g. "Passage 1"
}

const flattenQuestions = (questions: Question[]): QuestionSlot[] => {
    const slots: QuestionSlot[] = [];
    let passageNo = 0;
    questions.forEach((q) => {
        if (q.type === 'direct') {
            slots.push({
                key: q._id,
                parentKey: null,
                type: 'direct',
                questionText: q.questionText || '',
                options: q.options,
                marks: q.marks,
            });
        } else if (q.type === 'passage') {
            passageNo++;
            (q.questions || []).forEach((sq, i) => {
                slots.push({
                    key: sq._id,
                    parentKey: q._id,
                    type: 'passage',
                    questionText: sq.questionText,
                    options: sq.options,
                    marks: sq.marks,
                    passageText: i === 0 ? q.passageText : undefined,
                    passageGroupLabel: i === 0 ? `Passage ${passageNo}` : undefined,
                });
            });
        } else if (q.type === 'subjective') {
            slots.push({
                key: q._id,
                parentKey: null,
                type: 'subjective',
                questionText: q.questionText || '',
                marks: q.marks,
            });
        }
    });
    return slots;
};

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ── Main Component ─────────────────────────────────────────────────────────────

const TakeTestPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [data, setData] = useState<TestForTaking | null>(null);
    const [slots, setSlots] = useState<QuestionSlot[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const submittedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Load test ──────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await getTestForTaking(id);
                setData(res);
                const s = flattenQuestions(res.test.questionPaper.questions || []);
                setSlots(s);

                // Restore existing answers if InProgress
                if (res.submission?.answers?.length) {
                    const map: Record<string, AnswerPayload> = {};
                    res.submission.answers.forEach((a) => { map[a.questionId] = a; });
                    setAnswers(map);
                }

                // Calculate time left
                const duration = (res.test.duration || res.test.questionPaper.duration || 60) * 60;
                if (res.submission?.startedAt) {
                    const elapsed = Math.floor((Date.now() - new Date(res.submission.startedAt).getTime()) / 1000);
                    setTimeLeft(Math.max(0, duration - elapsed));
                } else {
                    setTimeLeft(duration);
                }
            } catch (err: any) {
                toast.error(err?.message || 'Failed to load test');
                navigate('/student/tests');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // ── Start test (create submission) ────────────────────────────────────────

    useEffect(() => {
        if (!id || loading || !data) return;
        if (data.submission?.status === 'Submitted' || data.submission?.status === 'TimedOut') {
            navigate(`/student/tests/${id}/result`, { replace: true });
            return;
        }
        startTest(id).catch(() => {});
    }, [id, loading, data]);

    // ── Timer countdown ────────────────────────────────────────────────────────

    const handleAutoSubmit = useCallback(async () => {
        if (submittedRef.current || !id) return;
        submittedRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);
        try {
            const payload = Object.values(answers);
            await submitTest(id, payload, true);
            toast.info('Time is up! Test submitted automatically.');
            navigate(`/student/tests/${id}/result`, { replace: true });
        } catch {
            navigate(`/student/tests/${id}/result`, { replace: true });
        }
    }, [answers, id, navigate]);

    useEffect(() => {
        if (loading || timeLeft <= 0) return;
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [loading, handleAutoSubmit]);

    // ── Answer handling ────────────────────────────────────────────────────────

    const setAnswer = (slot: QuestionSlot, optionIndex?: number, text?: string) => {
        setAnswers((prev) => ({
            ...prev,
            [slot.key]: {
                questionId: slot.key,
                parentQuestionId: slot.parentKey || null,
                questionType: slot.type,
                selectedOptionIndex: optionIndex ?? null,
                textAnswer: text ?? null,
            },
        }));
    };

    const toggleFlag = (key: string) => {
        setFlagged((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!id || submittedRef.current) return;
        submittedRef.current = true;
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);
        try {
            await submitTest(id, Object.values(answers), false);
            toast.success('Test submitted successfully!');
            navigate(`/student/tests/${id}/result`, { replace: true });
        } catch (err: any) {
            submittedRef.current = false;
            setSubmitting(false);
            toast.error(err?.message || 'Submission failed');
        }
    };

    // ── Rendering ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                Loading test...
            </div>
        );
    }

    if (!data || slots.length === 0) return null;

    const currentSlot = slots[currentIdx];
    const currentAnswer = answers[currentSlot?.key];
    const answeredCount = Object.keys(answers).length;
    const timerWarning = timeLeft < 300; // < 5 min

    return (
        <div className="space-y-4">
            {/* Header bar */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-bold text-gray-900">{data.test.questionPaper.title}</h1>
                    <p className="text-xs text-gray-500">{data.test.batch.batchName} · {data.test.questionPaper.totalMarks} marks</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${timerWarning ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                    <Clock size={18} />
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="flex gap-4 items-start">
                {/* Main question area */}
                <div className="flex-1 min-w-0 space-y-4">
                    {/* Passage text (if first sub-q of passage) */}
                    {currentSlot?.passageText && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wider">{currentSlot.passageGroupLabel}</p>
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{currentSlot.passageText}</p>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        {/* Question header */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Question {currentIdx + 1} of {slots.length}
                                    {currentSlot?.marks ? ` · ${currentSlot.marks} mark${currentSlot.marks > 1 ? 's' : ''}` : ''}
                                </span>
                                <p className="text-gray-900 font-medium mt-2 leading-relaxed">{currentSlot?.questionText}</p>
                            </div>
                            <button
                                onClick={() => toggleFlag(currentSlot.key)}
                                className={`flex-shrink-0 p-2 rounded-lg border transition-colors ${flagged.has(currentSlot.key) ? 'bg-yellow-50 border-yellow-300 text-yellow-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                title="Flag for review"
                            >
                                <Flag size={15} />
                            </button>
                        </div>

                        {/* MCQ Options */}
                        {currentSlot?.type !== 'subjective' && currentSlot?.options && (
                            <div className="space-y-2">
                                {currentSlot.options.map((opt, i) => {
                                    const selected = currentAnswer?.selectedOptionIndex === i;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setAnswer(currentSlot, i)}
                                            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors ${
                                                selected
                                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-medium'
                                                    : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                                            }`}
                                        >
                                            <span className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${selected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300 text-gray-500'}`}>
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Subjective */}
                        {currentSlot?.type === 'subjective' && (
                            <textarea
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
                                rows={5}
                                placeholder="Type your answer here..."
                                value={currentAnswer?.textAnswer || ''}
                                onChange={(e) => setAnswer(currentSlot, undefined, e.target.value)}
                            />
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                                disabled={currentIdx === 0}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={15} /> Previous
                            </button>

                            {currentIdx < slots.length - 1 ? (
                                <button
                                    onClick={() => setCurrentIdx((i) => Math.min(slots.length - 1, i + 1))}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                                >
                                    Save & Next <ChevronRight size={15} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                                >
                                    <CheckCircle2 size={15} /> Submit Test
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Question palette sidebar */}
                <div className="w-52 flex-shrink-0 bg-white rounded-2xl border border-gray-200 p-4 hidden md:block">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Questions</p>
                    <div className="flex flex-wrap gap-1.5">
                        {slots.map((s, i) => {
                            const isAnswered = !!answers[s.key];
                            const isFlagged = flagged.has(s.key);
                            const isCurrent = i === currentIdx;
                            return (
                                <button
                                    key={s.key}
                                    onClick={() => setCurrentIdx(i)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                        isCurrent
                                            ? 'bg-indigo-600 text-white'
                                            : isFlagged
                                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                            : isAnswered
                                            ? 'bg-green-100 text-green-700 border border-green-300'
                                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-indigo-600 inline-block" /> Current</div>
                        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-100 border border-green-300 inline-block" /> Answered</div>
                        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300 inline-block" /> Flagged</div>
                        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-100 border border-gray-200 inline-block" /> Unanswered</div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <p>{answeredCount}/{slots.length} answered</p>
                    </div>
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="w-full mt-3 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Submit Test
                    </button>
                </div>
            </div>

            {/* Confirmation modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Submit Test?</h3>
                                <p className="text-xs text-gray-500">You cannot change answers after submission.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 mb-5 space-y-1">
                            <div className="flex justify-between"><span>Answered</span><span className="font-semibold text-gray-900">{answeredCount}</span></div>
                            <div className="flex justify-between"><span>Unanswered</span><span className="font-semibold text-gray-900">{slots.length - answeredCount}</span></div>
                            <div className="flex justify-between"><span>Flagged</span><span className="font-semibold text-gray-900">{flagged.size}</span></div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Review
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeTestPage;
