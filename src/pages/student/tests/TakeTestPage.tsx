import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import api from '../../../api/axios';

interface Question {
    _id: string;
    type: 'MCQ' | 'PASSAGE';
    passageText?: string;
    questionText: string;
    options: string[];
    marks: number;
}

export const TakeTestPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const studentId = user?.id;
    const isStudent = user?.role === 'STUDENT';
    
    const [testData, setTestData] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [visited, setVisited] = useState<Record<string, boolean>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const startTest = useCallback(async () => {
        if (!studentId) {
            toast.error('Student session not found. Please login again.');
            navigate('/student/login');
            setIsLoading(false);
            return;
        }

        try {
            const res: any = await api.get(`/tests/${id}/start`, {
                params: { studentId }
            });
            setTestData(res.data.test);
            setQuestions(res.data.questions);
            setTimeLeft(res.data.test.durationMinutes * 60);
        } catch (err: any) {
            toast.error(err.message || "Failed to start test");
            navigate(isStudent ? '/student/exam' : '/employee/dashboard');
        } finally {
            setIsLoading(false);
        }
    }, [id, isStudent, navigate, studentId]);

    useEffect(() => { startTest(); }, [startTest]);

    useEffect(() => {
        if (questions.length > 0 && !visited[questions[currentIndex]._id]) {
            setVisited(prev => ({ ...prev, [questions[currentIndex]._id]: true }));
        }
    }, [currentIndex, questions]);

    // Timer Logic
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || result) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0));
        }, 1000);
        if (timeLeft === 0) handleSubmit();
        return () => clearInterval(timer);
    }, [timeLeft, result]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (qId: string, optIdx: number) => {
        if (result) return;
        setAnswers(prev => ({ ...prev, [qId]: optIdx }));
    };

    const handleClearResponse = (qId: string) => {
        setAnswers(prev => {
            const newAnswers = { ...prev };
            delete newAnswers[qId];
            return newAnswers;
        });
    };

    const handleSubmit = async () => {
        if (isSubmitting || result) return;
        if (!window.confirm("Are you sure you want to submit the test?")) return;

        setIsSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, opt]) => ({
                questionId: qId,
                selectedOption: opt
            }));
            const res: any = await api.post(`/tests/${id}/submit`, {
                studentId,
                answers: formattedAnswers
            });
            setResult(res.data);
            toast.success("Test submitted successfully!");
        } catch (err: any) {
            toast.error("Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={40} />
                <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Preparing your examination...</p>
            </div>
        </div>
    );

    if (result) return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className={`p-8 text-center ${result.result === 'PASS' ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        {result.result === 'PASS' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                    </div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight">Examination {result.result}</h2>
                    <p className="opacity-80 font-semibold mt-1">{testData.testName}</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Score</p>
                            <p className="text-2xl font-bold text-gray-900">{result.score} / {result.totalMarks}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Accuracy</p>
                            <p className="text-2xl font-bold text-gray-900">{Math.round(result.percentage)}%</p>
                        </div>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-500 px-2">
                        <span>Correct: <span className="text-emerald-600">{result.correctCount}</span></span>
                        <span>Incorrect: <span className="text-red-600">{result.incorrectCount}</span></span>
                    </div>
                    <button onClick={() => navigate(isStudent ? '/student/exam' : '/employee/dashboard')} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-100">Back to Dashboard</button>
                </div>
            </div>
        </div>
    );

    const currentQ = questions[currentIndex];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / Timer */}
            <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-100">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight uppercase truncate max-w-[200px]">{testData.testName}</h1>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tighter">Question {currentIndex + 1} of {questions.length}</p>
                    </div>
                </div>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${timeLeft! < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                    <Clock size={18} />
                    {formatTime(timeLeft!)}
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 w-full bg-slate-200/50">
                {/* Main Exam Area */}
                <main className="flex-1 flex flex-col border border-gray-300 shadow-sm bg-white">
                    {/* Header bar inside main */}
                    <div className="bg-blue-600 text-white px-4 py-2 font-bold text-sm flex justify-between">
                        <span>{testData.testName}</span>
                    </div>
                    {currentQ.type === 'PASSAGE' && (
                        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl shadow-sm">
                            <h4 className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-3">Reading Passage</h4>
                            <div className="text-sm text-amber-900 leading-relaxed font-medium whitespace-pre-wrap">{currentQ.passageText}</div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col p-6">
                        <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-relaxed">
                                <span className="text-blue-600 mr-2">Q.{currentIndex + 1}</span> 
                                {currentQ.questionText}
                            </h2>
                            <span className="shrink-0 bg-gray-100 border border-gray-300 text-gray-600 text-[10px] font-bold px-2 py-1 uppercase">{currentQ.marks} Marks</span>
                        </div>

                        <div className="space-y-3 flex-1">
                            {currentQ.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(currentQ._id, idx)}
                                    className={`w-full text-left p-4 border transition-all flex items-center gap-4 ${answers[currentQ._id] === idx ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${answers[currentQ._id] === idx ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400 text-gray-600'}`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className={`text-sm md:text-base ${answers[currentQ._id] === idx ? 'font-bold text-blue-900' : 'font-medium text-gray-700'}`}>{opt}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 bg-gray-100 -mx-6 -mb-6 p-4 flex items-center justify-between border-t border-gray-300">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleClearResponse(currentQ._id)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 shadow-sm transition-all"
                                >
                                    Clear Response
                                </button>
                                <button
                                    disabled={currentIndex === 0}
                                    onClick={() => setCurrentIndex(prev => prev - 1)}
                                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm disabled:opacity-50 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1"
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>
                            </div>

                            {currentIndex === questions.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-8 py-2 bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-sm transition-all uppercase"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Test'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentIndex(prev => prev + 1)}
                                    className="px-8 py-2 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1 uppercase"
                                >
                                    Save & Next <ChevronRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </main>

                {/* Sidebar Navigation (Desktop) */}
                <aside className="w-full lg:w-80 flex flex-col gap-4">
                    {/* Candidate Info */}
                    <div className="bg-white border border-gray-300 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 border border-gray-300 flex items-center justify-center shrink-0">
                            <span className="text-gray-400 text-xs text-center font-bold">Photo</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Candidate</p>
                            <p className="text-sm font-bold text-gray-900 leading-tight">Student Testing</p>
                            <p className="text-xs text-blue-600 font-bold mt-1">CBT Portal</p>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm border border-gray-300 flex-1 flex flex-col">
                        <div className="bg-blue-600 text-white px-4 py-2 font-bold text-sm">
                            Question Palette
                        </div>
                        <div className="p-4 grid grid-cols-5 gap-2 overflow-y-auto" style={{ maxHeight: '300px' }}>
                            {questions.map((q, idx) => {
                                const isAnswered = answers[q._id] !== undefined;
                                const isVisited = visited[q._id];
                                
                                let btnClass = 'bg-gray-100 border-gray-300 text-gray-700'; // Not visited
                                if (isAnswered) btnClass = 'bg-green-600 border-green-700 text-white'; // Answered
                                else if (isVisited) btnClass = 'bg-red-500 border-red-600 text-white'; // Not answered but visited
                                
                                const isCurrent = idx === currentIndex;

                                return (
                                    <button
                                        key={q._id}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`aspect-square flex items-center justify-center text-sm font-bold border transition-all ${btnClass} ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-bold text-gray-700">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-green-600 border border-green-700 block text-white text-center text-[10px] leading-5 font-bold">{Object.keys(answers).length}</span> Answered
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-red-500 border border-red-600 block text-white text-center text-[10px] leading-5 font-bold">
                                    {Object.keys(visited).length - Object.keys(answers).length}
                                </span> Not Answered
                            </div>
                            <div className="flex items-center gap-2 col-span-2 mt-1 pt-2 border-t border-gray-200">
                                <span className="w-5 h-5 bg-gray-100 border border-gray-300 block text-gray-600 text-center text-[10px] leading-5 font-bold">
                                    {questions.length - Object.keys(visited).length}
                                </span> Not Visited
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
