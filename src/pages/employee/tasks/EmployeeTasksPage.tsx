import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ClipboardList, CalendarClock, MessageSquarePlus, CheckCircle2, Save, Loader2, X } from 'lucide-react';
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
            const userStr = localStorage.getItem('user');
            const userId = userStr ? JSON.parse(userStr)._id : null;
            setMyPastUpdates((res.data || []).filter((u: any) => u.employeeId._id === userId));
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
                                {task.dueDate && task.status !== 'COMPLETED' && <span className="text-[10px] text-red-600 font-bold">Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">{task.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{task.description}</p>
                            <div className="flex gap-2 border-t pt-4">
                                {task.status !== 'COMPLETED' ? (
                                    <>
                                        <button onClick={() => openUpdateModal(task)} className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold uppercase">Update</button>
                                        <button onClick={() => { setSelectedTask(task); setCompletionNote(''); setCompleteModalOpen(true); }} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase">Finish</button>
                                    </>
                                ) : <div className="w-full text-center text-emerald-600 font-bold text-xs">COMPLETED</div>}
                            </div>
                        </div>
                    ))}
                </div>
            }

            {isUpdateModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold">Daily Update</h2>
                            <button onClick={() => setUpdateModalOpen(false)}><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSubmitUpdate} className="space-y-4">
                            <textarea required rows={4} value={comment} onChange={e => setComment(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Today's work..." />
                            <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold uppercase text-xs">Submit</button>
                        </form>
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
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs">
                                {isSubmitting ? 'Saving...' : 'Mark as Completed'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
