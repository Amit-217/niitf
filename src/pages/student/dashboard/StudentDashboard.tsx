import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle, Clock, TrendingUp, ChevronRight, CalendarDays } from 'lucide-react';
import { getMyTests, MyTest } from '../../../api/studentTestApi';
import { toast } from 'react-toastify';

const DIFFICULTY_COLOR: Record<string, string> = {
    Easy: 'text-green-600 bg-green-50 border-green-200',
    Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    Hard: 'text-red-600 bg-red-50 border-red-200',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, string> = {
        Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
        Ongoing: 'bg-green-50 text-green-700 border-green-200',
        Completed: 'bg-gray-100 text-gray-600 border-gray-200',
        Cancelled: 'bg-red-50 text-red-600 border-red-200',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${map[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    );
};

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<MyTest[]>([]);
    const [loading, setLoading] = useState(true);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        getMyTests()
            .then((res) => setTests(res.tests || []))
            .catch(() => toast.error('Failed to load tests'))
            .finally(() => setLoading(false));
    }, []);

    const upcoming = tests.filter((t) => t.status === 'Upcoming' && !t.submission);
    const ongoing = tests.filter((t) => t.status === 'Ongoing');
    const completed = tests.filter((t) => t.submission?.status === 'Submitted' || t.submission?.status === 'TimedOut');
    const avgScore = completed.length
        ? Math.round(completed.reduce((sum, t) => sum + (t.submission?.percentage || 0), 0) / completed.length)
        : 0;

    const actionableTests = tests.filter(
        (t) => t.status === 'Ongoing' || (t.status === 'Upcoming' && !t.submission)
    ).slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white">
                <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back,</p>
                <h1 className="text-2xl font-bold">{user?.fullName || 'Student'}</h1>
                <p className="text-indigo-200 text-sm mt-1">Student ID: {user?.studentId || '—'}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Upcoming', value: upcoming.length, icon: Clock, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Active Now', value: ongoing.length, icon: ClipboardList, color: 'text-green-600 bg-green-50' },
                    { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-gray-600 bg-gray-100' },
                    { label: 'Avg Score', value: `${avgScore}%`, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-xl font-bold text-gray-900">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upcoming / Active tests */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">Upcoming & Active Tests</h2>
                    <button
                        onClick={() => navigate('/student/tests')}
                        className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                    >
                        View all <ChevronRight size={14} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : actionableTests.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No upcoming tests at the moment.</div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {actionableTests.map((t) => {
                            const isOngoing = t.status === 'Ongoing';
                            return (
                                <li key={t._id} className="px-5 py-4 flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{t.questionPaper.title}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500">{t.batch.batchName}</span>
                                            <span className="text-gray-300">·</span>
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <CalendarDays size={11} />
                                                {new Date(t.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                            <StatusBadge status={t.status} />
                                        </div>
                                    </div>
                                    {isOngoing && (
                                        <button
                                            onClick={() => navigate(`/student/tests/${t._id}/take`)}
                                            className="flex-shrink-0 px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Start Test
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
