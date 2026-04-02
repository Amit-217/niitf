import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FileText, Play, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';

interface Test {
    _id: string;
    testName: string;
    durationMinutes: number;
    totalMarks: number;
    passingMarks: number;
    startTime: string;
    endTime: string;
    batchId: {
        _id: string;
        batchName: string;
    };
}

export const StudentDashboard = () => {
    const [tests, setTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res: any = await api.get('/tests/available');
                setTests(res.data?.data || []);
            } catch (err: any) {
                toast.error("Failed to load examinations");
            } finally {
                setIsLoading(false);
            }
        };
        fetchExams();
    }, []);

    const now = new Date();

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-lg text-white">
                <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                    <FileText size={32} /> Examination Portal
                </h1>
                <p className="opacity-90 font-medium">View and attempt your assigned online CBT tests.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    Available Examinations
                </h3>

                {isLoading ? (
                    <div className="py-12 text-center text-gray-400 font-semibold animate-pulse">Loading tests...</div>
                ) : tests.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <h4 className="text-gray-900 font-bold">No Tests Available</h4>
                        <p className="text-gray-500 text-sm mt-1">Check back later or contact your administrator.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tests.map(test => {
                            const start = new Date(test.startTime);
                            const end = new Date(test.endTime);
                            const isLive = now >= start && now <= end;
                            const isPast = now > end;
                            const isFuture = now < start;

                            return (
                                <div key={test._id} className="border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                                                {test.testName}
                                            </h4>
                                            {isLive && <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LIVE</span>}
                                            {isPast && <span className="bg-gray-100 text-gray-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-gray-200">EXPIRED</span>}
                                            {isFuture && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">UPCOMING</span>}
                                        </div>
                                        
                                        <div className="space-y-1.5 mb-5 text-xs text-gray-500 font-semibold">
                                            <div className="flex items-center gap-2 px-1"><Clock size={14} className="text-gray-400" /> {test.durationMinutes} Minutes</div>
                                            <div className="flex items-center gap-2 px-1"><CheckCircle2 size={14} className="text-gray-400" /> Marks: {test.totalMarks} (Pass: {test.passingMarks})</div>
                                            <div className="flex items-center gap-2 px-1 text-gray-400"><AlertCircle size={14} /> Available: {start.toLocaleString()} - {end.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => navigate(`/test/${test._id}`)}
                                        disabled={!isLive}
                                        className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border
                                            ${isLive ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white' : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-70'}
                                        `}
                                    >
                                        <Play size={14} /> {isLive ? 'Attempt Exam' : 'Unavailable'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
