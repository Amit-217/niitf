import React, { useState, useEffect } from 'react';
import { Clock, FileText, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export const EmployeeDashboard: React.FC = () => {
    const navigate = useNavigate();

    const [availableTests, setAvailableTests] = useState<any[]>([]);

    useEffect(() => {
        // In a real app, you'd fetch tests assigned to this employee's batch
        api.get('/admin/tests').then(res => {
            const onlineTests = (res.data?.data?.tests || []).filter((t: any) => t.mode === 'Online' && t.isActive);
            setAvailableTests(onlineTests);
        });
    }, []);

    return (
        <div className="space-y-6">
            {/* Header ... */}

            {/* Stats ... */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tests Widget */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={18} className="text-primary-600" /> Available CBT Tests
                        </h3>
                        <span className="bg-primary-50 text-primary-700 text-[10px] font-black px-2 py-1 rounded-lg">{availableTests.length} Total</span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                        {availableTests.length > 0 ? availableTests.map(test => (
                            <div key={test._id} className="group p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-white hover:shadow-lg hover:border-primary-100 transition-all">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{test.testName}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {test.durationMinutes}m</span>
                                        <span>{test.totalMarks} Marks</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(`/test/${test._id}`)}
                                    className="p-2 bg-white text-primary-600 rounded-xl shadow-sm border border-gray-100 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all"
                                >
                                    <PlayCircle size={20} />
                                </button>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <FileText size={48} className="mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">No active tests scheduled</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
                    <p className="text-xs font-bold uppercase tracking-widest">Schedule & Enquiries Placeholder</p>
                </div>
            </div>
        </div>
    );
};
