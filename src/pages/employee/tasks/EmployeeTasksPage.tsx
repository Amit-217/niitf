import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ClipboardList, CalendarClock, MessageSquarePlus, CheckCircle2, Save, Loader2, X, MessageSquare, Bell } from 'lucide-react';
import {
    getAllTasks,
    submitTaskUpdate,
    getTaskUpdates
} from '../../../api/taskApi';
import api from '../../../api/axios';

interface User {
    _id: string;
    name: string;
}

interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
    startDate: string;
    dueDate?: string;
    createdBy: User;
}

export const EmployeeTasksPage = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
    const [isCompleteModalOpen, setCompleteModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [comment, setComment] = useState('');
    const [completionNote, setCompletionNote] = useState('');
    const [myPastUpdates, setMyPastUpdates] = useState<any[]>([]);
    const [isSubmitting, setSubmitting] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser?.userId || currentUser?.id || currentUser?._id || null;

    useEffect(() => { fetchMyTasks(); }, []);

    const fetchMyTasks = async () => {
        setIsLoading(true);
        try {
            const res = await getAllTasks();
            setTasks(res.data || []);
        } catch (error) { toast.error('Failed to load tasks'); }
        finally { setIsLoading(false); }
    };

    const openUpdateModal = async (task: Task) => {
        setSelectedTask(task); setComment(''); setUpdateModalOpen(true);
        try {
            const res = await getTaskUpdates(task._id);
            setMyPastUpdates(res.data || []);
        } catch (e) { console.error('History load failed'); }
    };

    const handleSubmitUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask || !comment.trim()) return;
        try {
            await submitTaskUpdate(selectedTask._id, { date: new Date().toISOString().split('T')[0], comment });
            toast.success('Update submitted!'); setUpdateModalOpen(false); fetchMyTasks();
        } catch (error: any) { toast.error(error.message || 'Failed'); }
    };

    const handleMarkComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask || !completionNote.trim()) return;
        setSubmitting(true);
        try {
            await api.patch(`/tasks/${selectedTask._id}/complete`, { completionNote });
            toast.success('Task completed!'); setCompleteModalOpen(false); fetchMyTasks();
        } catch (error: any) { toast.error(error.message || 'Failed'); }
        finally { setSubmitting(false); }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500 text-white';
            case 'IN_PROGRESS': return 'bg-blue-500 text-white';
            default: return 'bg-amber-500 text-white';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="text-primary-600" /> My Tasks</h1>
            </div>

            {isLoading ? <div className="text-center py-12"><Loader2 className="animate-spin inline" /></div> :
                tasks.length === 0 ? <div className="text-center py-12 bg-white rounded-xl border">No tasks assigned</div> :
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map((task) => (
                        <div key={task._id} className="bg-white rounded-2xl shadow-sm border p-5 flex flex-col">
                            <div className="flex justify-between mb-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusBadge(task.status)}`}>{task.status}</span>
                                {task.dueDate && task.status !== 'COMPLETED' && (
                                    <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                                        <CalendarClock size={12} /> Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">{task.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{task.description}</p>
                            <div className="flex gap-2 border-t pt-4">
                                {task.status !== 'COMPLETED' ? (
                                    <>
                                        <button onClick={() => openUpdateModal(task)} className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5">
                                            <MessageSquarePlus size={13} /> Update
                                        </button>
                                        <button onClick={() => { setSelectedTask(task); setCompletionNote(''); setCompleteModalOpen(true); }} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5">
                                            <CheckCircle2 size={13} /> Finish
                                        </button>
                                    </>
                                ) : <div className="w-full text-center text-emerald-600 font-bold text-xs">COMPLETED</div>}
                            </div>
                        </div>
                    ))}
                </div>
            }

            {isUpdateModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 shadow-2xl">
                        <div className="px-6 py-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex justify-between items-start gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-100/80">Task thread</p>
                                <h2 className="font-black text-xl mt-1">{selectedTask.title}</h2>
                                <p className="text-violet-100/80 text-sm mt-1">Post your update and keep the task conversation visible.</p>
                            </div>
                            <button onClick={() => setUpdateModalOpen(false)} className="p-2 rounded-xl hover:bg-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <form onSubmit={handleSubmitUpdate} className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                    <MessageSquare size={16} className="text-violet-600" />
                                    Send update
                                </div>
                                <textarea required rows={5} value={comment} onChange={e => setComment(e.target.value)} className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none resize-none" placeholder="Share what you completed, blockers, or next steps..." />
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                    <Bell size={14} className="text-amber-500" />
                                    Admins can reply in the task thread after you submit this update.
                                </div>
                                <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-2xl font-bold uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-primary-200">
                                    <MessageSquarePlus size={16} />
                                    Submit
                                </button>
                            </form>

                            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Conversation</h3>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{myPastUpdates.length} messages</span>
                                </div>
                                {myPastUpdates.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                                        No messages yet. Your updates will appear here.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                        {myPastUpdates.map((update: any) => {
                                            const isMine = String(update.employeeId?._id || update.employeeId) === String(currentUserId);
                                            return (
                                                <div key={update._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[90%] rounded-2xl border px-4 py-3 shadow-sm ${isMine ? 'bg-violet-600 text-white border-violet-500' : 'bg-white text-gray-700 border-gray-100'}`}>
                                                        <div className="flex items-center justify-between gap-3 mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${isMine ? 'bg-white/15 text-white' : 'bg-violet-100 text-violet-700'}`}>
                                                                    {update.employeeId?.name?.charAt(0) || 'Y'}
                                                                </div>
                                                                <span className="text-sm font-bold truncate">{isMine ? 'You' : update.employeeId?.name || 'Admin'}</span>
                                                            </div>
                                                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isMine ? 'text-violet-100' : 'text-gray-400'}`}>
                                                                {new Date(update.createdAt || update.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm whitespace-pre-wrap ${isMine ? 'text-violet-50' : 'text-gray-700'}`}>
                                                            {update.comment}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isCompleteModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold">Finalize Task</h2>
                            <button onClick={() => setCompleteModalOpen(false)}><X size={20}/></button>
                        </div>
                        <form onSubmit={handleMarkComplete} className="space-y-4">
                            <textarea required rows={4} value={completionNote} onChange={e => setCompletionNote(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Completion notes..." />
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2">
                                <Save size={14} />
                                {isSubmitting ? 'Saving...' : 'Mark as Completed'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
