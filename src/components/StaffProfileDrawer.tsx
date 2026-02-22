import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';

interface StaffProfileProps {
    employeeId: string;
    onClose: () => void;
}

export const StaffProfileDrawer: React.FC<StaffProfileProps> = ({ employeeId, onClose }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res: any = await api.get(`/users/${employeeId}/profile`);
                setData(res.data);
            } catch (err) {
                console.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [employeeId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-500';
            case 'ABSENT': return 'bg-red-500';
            case 'HALF_DAY': return 'bg-orange-500';
            case 'LEAVE': return 'bg-amber-500';
            default: return 'bg-blue-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Staff Intelligence</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary-600" size={32} />
                    </div>
                ) : data ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Header / Info */}
                        <div className="p-6 bg-gradient-to-br from-primary-600 to-indigo-700 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black border border-white/30 shadow-xl">
                                    {data.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black leading-tight">{data.user.name}</h3>
                                    <p className="text-primary-100 font-bold uppercase tracking-widest text-[10px] opacity-80 mt-1">{data.user.empId} • {data.user.role}</p>
                                    <div className="flex gap-4 mt-3">
                                        <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                                            <p className="text-[10px] uppercase font-bold text-white/60">Mobile</p>
                                            <p className="text-xs font-bold">{data.user.mobile}</p>
                                        </div>
                                        <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                                            <p className="text-[10px] uppercase font-bold text-white/60">Email</p>
                                            <p className="text-xs font-bold">{data.user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Attendance Strip */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Clock size={14} className="text-primary-500" /> Recent Attendance (30 Days)
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.attendance.length > 0 ? data.attendance.map((att: any) => (
                                        <div key={att._id} title={`${new Date(att.date).toLocaleDateString()}: ${att.status}`}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-sm ${getStatusColor(att.status)}`}>
                                            {att.status.charAt(0)}
                                        </div>
                                    )) : <p className="text-xs text-gray-400 italic">No attendance records found</p>}
                                </div>
                            </div>

                            {/* Tasks History */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Briefcase size={14} className="text-primary-500" /> Task Accountability
                                </h4>
                                <div className="space-y-3">
                                    {data.tasks.length > 0 ? data.tasks.map((task: any) => (
                                        <div key={task._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-primary-200 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="text-sm font-black text-gray-800 line-clamp-1">{task.title}</h5>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                            {task.completionNote && (
                                                <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg italic border-l-2 border-emerald-400 mt-2">
                                                    "{task.completionNote}"
                                                </p>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Created: {new Date(task.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    )) : <p className="text-xs text-gray-400 italic">No tasks assigned yet</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <AlertCircle size={48} className="text-gray-200 mb-4" />
                        <p className="text-gray-500 font-bold">Profile Not Found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
