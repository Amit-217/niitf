import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { getMyTests, MyTest } from '../../../api/studentTestApi';
import { toast } from 'react-toastify';

type FilterStatus = 'All' | 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

const getEffectiveStatus = (t: MyTest): string => {
    if (t.status === 'Cancelled') return 'Cancelled';
    const now = Date.now();
    const start = new Date(t.scheduledAt).getTime();
    const durationMs = (t.duration || t.questionPaper.duration || 60) * 60 * 1000;
    if (now < start) return 'Upcoming';
    if (now < start + durationMs) return 'Ongoing';
    return 'Completed';
};

const STATUS_COLOR: Record<string, string> = {
    Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
    Ongoing: 'bg-green-50 text-green-700 border-green-200',
    Completed: 'bg-gray-100 text-gray-600 border-gray-200',
    Cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const StudentTestsPage: React.FC = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<MyTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>('All');
    const [tick, setTick] = useState(0);

    useEffect(() => {
        getMyTests()
            .then((res) => setTests(res.tests || []))
            .catch(() => toast.error('Failed to load tests'))
            .finally(() => setLoading(false));
    }, []);

    // Re-render every 60s so time-based statuses stay current
    useEffect(() => {
        const interval = setInterval(() => setTick((n) => n + 1), 60_000);
        return () => clearInterval(interval);
    }, []);

    const filtered = filter === 'All' ? tests : tests.filter((t) => {
        if (filter === 'Completed') return t.submission?.status === 'Submitted' || t.submission?.status === 'TimedOut' || getEffectiveStatus(t) === 'Completed';
        return getEffectiveStatus(t) === filter;
    });

    const getAction = (t: MyTest) => {
        if (t.submission?.status === 'Submitted' || t.submission?.status === 'TimedOut') {
            return { label: 'View Result', onClick: () => navigate(`/student/tests/${t._id}/result`), style: 'bg-gray-100 text-gray-700 hover:bg-gray-200' };
        }
        if (getEffectiveStatus(t) === 'Ongoing') {
            return { label: 'Start Test', onClick: () => navigate(`/student/tests/${t._id}/take`), style: 'bg-indigo-600 text-white hover:bg-indigo-700' };
        }
        return null;
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-gray-900">My Tests</h1>
                <p className="text-sm text-gray-500 mt-0.5">All tests assigned to your batch</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {(['All', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'] as FilterStatus[]).map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            filter === s
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-16 text-center text-gray-400">Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400">No tests found.</div>
            ) : (
                <div key={tick} className="grid gap-4">
                    {filtered.map((t) => {
                        const effectiveStatus = getEffectiveStatus(t);
                        const action = getAction(t);
                        const isSubmitted = t.submission?.status === 'Submitted' || t.submission?.status === 'TimedOut';
                        const duration = t.duration || t.questionPaper.duration;

                        return (
                            <div key={t._id} className="bg-white rounded-2xl border border-gray-200 p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLOR[effectiveStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {effectiveStatus}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 text-base truncate">{t.questionPaper.title}</h3>
                                        <p className="text-sm text-gray-500">{t.batch.batchName} · {t.questionPaper.paperId}</p>
                                    </div>

                                    {action && (
                                        <button
                                            onClick={action.onClick}
                                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${action.style}`}
                                        >
                                            {action.label}
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1.5">
                                        <CalendarDays size={13} />
                                        {new Date(t.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                    {duration && (
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={13} />
                                            {duration} min
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <BookOpen size={13} />
                                        {t.questionPaper.totalMarks} marks · Pass: {t.questionPaper.passingMarks}
                                    </span>
                                </div>

                                {isSubmitted && t.submission && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
                                        <span className={`flex items-center gap-1.5 text-sm font-semibold ${t.submission.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.submission.isPassed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {t.submission.isPassed ? 'Passed' : 'Failed'}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Score: <strong>{t.submission.score}/{t.submission.totalMarks}</strong>
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {t.submission.percentage}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentTestsPage;
