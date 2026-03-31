import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ClipboardList, 
  CalendarClock, 
  MessageSquarePlus, 
  CheckCircle2, 
  Loader2, 
  X, 
  MessageSquare, 
  Bell, 
  Info,
  Send
} from 'lucide-react';
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
  assignedTo: User[];
  createdBy?: User;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-500 text-white shadow-sm';
    case 'IN_PROGRESS':
      return 'bg-blue-500 text-white shadow-sm';
    default:
      return 'bg-amber-500 text-white shadow-sm';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'Completed';
    case 'IN_PROGRESS': return 'In Progress';
    default: return 'Pending';
  }
};

export const MyTasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comment, setComment] = useState('');
  const [statusDraft, setStatusDraft] = useState<'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'>('ASSIGNED');
  const [updates, setUpdates] = useState<any[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId || currentUser?.id || currentUser?._id || null;
  const location = useLocation();
  const openedTaskIdRef = useRef<string | null>(null);

  const fetchMyTasks = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await getAllTasks();
      const allTasks = Array.isArray(res.data) ? res.data : [];
      const mine = allTasks.filter((task: Task) =>
        (task.assignedTo || []).some((emp: any) => String(emp?._id || emp) === String(currentUserId)),
      );
      setTasks(mine);
    } catch (error) {
      if (!silent) toast.error('Failed to load tasks');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'ALL') return true;
    return task.status === statusFilter;
  });

  useEffect(() => {
    const taskId = (location.state as { taskId?: string } | null)?.taskId;
    if (!taskId || openedTaskIdRef.current === taskId || tasks.length === 0) return;
    const matched = tasks.find((task) => task._id === taskId);
    if (matched) {
      openedTaskIdRef.current = taskId;
      openTaskModal(matched);
    }
  }, [tasks, location.state]);

  const openTaskModal = async (task: Task, initialStatus?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED') => {
    setSelectedTask(task);
    setComment('');
    setStatusDraft(initialStatus || task.status);
    setTaskModalOpen(true);
    try {
      const res = await getTaskUpdates(task._id);
      setUpdates(res.data || []);
    } catch (e) {
      console.error('History load failed');
      setUpdates([]);
    }
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !comment.trim()) return;
    setSubmitting(true);
    try {
      if (statusDraft !== selectedTask.status) {
        if (statusDraft === 'COMPLETED') {
            await api.patch(`/tasks/${selectedTask._id}/complete`, { completionNote: comment });
        } else {
            await api.patch(`/tasks/${selectedTask._id}`, { status: statusDraft });
        }
      }

      if (statusDraft !== 'COMPLETED') {
          await submitTaskUpdate(selectedTask._id, {
            date: new Date().toISOString().split('T')[0],
            comment
          });
      }

      toast.success('Update submitted!');
      setComment('');
      
      const res = await getTaskUpdates(selectedTask._id);
      setUpdates(res.data || []);
      
      window.dispatchEvent(new Event('notifications:refresh'));
      await fetchMyTasks(true);

      if (statusDraft === 'COMPLETED') setTaskModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit update');
    } finally {
      setSubmitting(false);
    }
  };

  const renderThread = (updates: any[]) => (
    updates.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-3xl border border-dashed border-gray-200">
        <MessageSquare size={32} className="text-gray-200 mb-3" />
        <p className="text-sm text-gray-400 font-medium text-center">No updates posted in this thread yet.</p>
      </div>
    ) : (
      <div className="flex flex-col-reverse space-y-4 space-y-reverse max-h-[450px] overflow-y-auto pr-1">
        {updates.map((update: any) => {
          const isMine = String(update.employeeId?._id || update.employeeId) === String(currentUserId);
          return (
            <div key={update._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] sm:max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${
                isMine 
                  ? 'bg-violet-600 text-white border-violet-500' 
                  : 'bg-white text-gray-700 border-gray-100'
              }`}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isMine ? 'bg-white/15 text-white' : 'bg-violet-100 text-violet-700'
                    }`}>
                      {(update.employeeId?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold truncate">
                      {isMine ? 'You' : (update.employeeId?.name || 'Admin')}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isMine ? 'text-violet-100' : 'text-gray-400'}`}>
                    {new Date(update.createdAt || update.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${isMine ? 'text-violet-50' : 'text-gray-700'}`}>
                  {update.comment}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    )
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-violet-400">Personal Work Queue</p>
            <h1 className="mt-2 text-2xl font-black text-gray-900 flex items-center gap-2">
              <ClipboardList className="text-violet-600" size={26} />
              My Tasks
            </h1>
            <p className="mt-1 text-sm text-gray-500">Only tasks assigned to your admin account appear here.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-white border border-violet-100 shadow-sm text-center min-w-[100px]">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active</p>
              <p className="text-xl font-black text-violet-700">{tasks.filter(t => t.status !== 'COMPLETED').length}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: 'All Tasks', count: tasks.length },
            { id: 'IN_PROGRESS', label: 'In Progress', count: tasks.filter(t => t.status === 'IN_PROGRESS').length },
            { id: 'COMPLETED', label: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                statusFilter === f.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-100'
                  : 'bg-white text-gray-400 border border-gray-100 hover:border-violet-200 hover:text-violet-600'
              }`}
            >
              {f.label} <span className={`ml-1 opacity-60`}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-violet-600" size={40} />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
          <Info size={40} className="mb-4 opacity-20" />
          <p className="font-bold uppercase tracking-widest text-sm">No tasks found</p>
          <p className="text-xs mt-1">Try changing your filters or contact your admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div 
              key={task._id} 
              className="group bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadge(task.status)}`}>
                  {getStatusLabel(task.status)}
                </span>
                {task.dueDate && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 rounded-full text-[9px] text-rose-600 font-black">
                    <CalendarClock size={12} />
                    {new Date(task.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-black text-gray-900 mb-3 group-hover:text-violet-600 transition-colors leading-tight">
                {task.title}
              </h3>
              
              <p className="text-sm text-gray-500 line-clamp-3 mb-6 leading-relaxed">
                {task.description}
              </p>
              
              <div className="flex gap-2.5 pt-4 border-t border-gray-50 mt-auto">
                <button 
                  onClick={() => openTaskModal(task)} 
                  className="flex-1 py-3 bg-violet-50 text-violet-700 border border-violet-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-violet-600 hover:text-white transition-all shadow-sm"
                >
                  <MessageSquarePlus size={14} /> View detail
                </button>
                {task.status !== 'COMPLETED' && (
                  <button 
                    onClick={() => openTaskModal(task, 'COMPLETED')} 
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                  >
                    <CheckCircle2 size={14} /> Finish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Unified Task Modal */}
      {isTaskModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setTaskModalOpen(false)} />
          <div className="relative bg-white rounded-[2rem] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
            <div className="px-6 py-5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white flex justify-between items-start gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-100/80">Admin Task Detail</p>
                <h2 className="font-black text-xl mt-1 line-clamp-1">{selectedTask.title}</h2>
                <p className="text-violet-50 text-xs mt-1">Review instructions and submit updates or finalize your personal task.</p>
              </div>
              <button 
                onClick={() => setTaskModalOpen(false)} 
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] max-h-[80dvh] lg:max-h-[70vh] overflow-y-auto lg:overflow-hidden">
              {/* Form Side */}
              <div className="p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-100">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 mb-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Description</p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <div className="px-3 py-1.5 rounded-xl bg-white border border-gray-100 flex items-center gap-2">
                            <CalendarClock size={12} className="text-violet-400" />
                            <span className="text-[10px] font-bold text-gray-500">Due: {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${getStatusBadge(selectedTask.status)}`}>
                            {getStatusLabel(selectedTask.status)}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmitUpdate} className="space-y-5">
                  <div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2 font-black">
                       <MessageSquare size={16} className="text-violet-600" />
                       Progress Comment
                    </h3>
                    <textarea 
                      required 
                      rows={4} 
                      value={comment} 
                      onChange={e => setComment(e.target.value)} 
                      className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none resize-none transition-all text-sm leading-relaxed" 
                      placeholder={statusDraft === 'COMPLETED' ? "Summarize final achievements..." : "Share your progress..."} 
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !comment.trim()}
                    className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.25em] flex items-center justify-center gap-3 transition-all hover:bg-violet-700 disabled:opacity-50 shadow-xl shadow-violet-100"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Send size={16} />
                        {statusDraft === 'COMPLETED' ? 'Finalize & Finish' : 'Post Update'}
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Thread Side */}
              <div className="p-6 bg-gray-50/50 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Bell size={14} className="text-violet-600" />
                    Timeline
                  </h3>
                  <span className="text-[10px] font-black uppercase text-gray-400">{updates.length} Entries</span>
                </div>
                {renderThread(updates)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
