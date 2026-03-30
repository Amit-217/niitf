import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  CalendarClock,
  ClipboardList,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Send,
  X,
} from 'lucide-react';
import { getAllTasks, getTaskUpdates, submitTaskUpdate, updateTaskStatus } from '../../../api/taskApi';

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
      return 'bg-emerald-500 text-white';
    case 'IN_PROGRESS':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-amber-500 text-white';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'Completed';
    case 'IN_PROGRESS':
      return 'In Progress';
    default:
      return 'Pending';
  }
};

export const MyTasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [updates, setUpdates] = useState<any[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [statusDraft, setStatusDraft] = useState<'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'>('ASSIGNED');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId || currentUser?.id || currentUser?._id || '';
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
      if (!silent) {
        toast.error('Failed to load your tasks');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return task.status === 'ASSIGNED';
    return task.status === statusFilter;
  });

  useEffect(() => {
    const taskId = (location.state as { taskId?: string } | null)?.taskId;
    if (!taskId || openedTaskIdRef.current === taskId) return;
    const matched = tasks.find((task) => task._id === taskId);
    if (matched) {
      openedTaskIdRef.current = taskId;
      openTask(matched);
    }
  }, [tasks, location]);

  const openTask = async (task: Task) => {
    setSelectedTask(task);
    setComment('');
    setStatusDraft(task.status);
    setTaskModalOpen(true);
    try {
      const res = await getTaskUpdates(task._id);
      setUpdates(res.data || []);
    } catch (error) {
      setUpdates([]);
    }
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !comment.trim()) return;
    setSubmitting(true);
    try {
      if (statusDraft !== selectedTask.status) {
        await updateTaskStatus(selectedTask._id, statusDraft);
      }
      await submitTaskUpdate(selectedTask._id, {
        date: new Date().toISOString().split('T')[0],
        comment,
      });
      toast.success('Update added');
      setComment('');
      setSelectedTask({ ...selectedTask, status: statusDraft });
      window.dispatchEvent(new Event('notifications:refresh'));
      
      // Refresh updates
      const updRes = await getTaskUpdates(selectedTask._id);
      setUpdates(updRes.data || []);
      
      // Refresh tasks
      await fetchMyTasks(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-violet-400">
              Personal Work Queue
            </p>
            <h1 className="mt-2 text-2xl font-black text-gray-900 flex items-center gap-2">
              <ClipboardList className="text-violet-600" size={26} />
              My Tasks
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Only tasks assigned to your account are visible here.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400">Assigned</p>
            <p className="text-2xl font-black text-violet-700 mt-1">{tasks.length}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { key: 'ALL', label: 'All', count: tasks.length },
            { key: 'PENDING', label: 'Pending', count: tasks.filter((task) => task.status === 'ASSIGNED').length },
            { key: 'IN_PROGRESS', label: 'In Progress', count: tasks.filter((task) => task.status === 'IN_PROGRESS').length },
            { key: 'COMPLETED', label: 'Completed', count: tasks.filter((task) => task.status === 'COMPLETED').length },
          ].map((item) => {
            const active = statusFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatusFilter(item.key as typeof statusFilter)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  active
                    ? 'border-violet-600 bg-violet-600 text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-violet-300 hover:text-violet-600'
                }`}
              >
                {item.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-violet-600" size={28} />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-500">
          No tasks found for this status.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <button
              key={task._id}
              type="button"
              onClick={() => openTask(task)}
              className="text-left group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadge(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  <h3 className="mt-3 font-black text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                    {task.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-3">
                    {task.description}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-gray-500 font-semibold">
                  <CalendarClock size={13} />
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-violet-600 font-bold">
                  <MessageSquarePlus size={13} />
                  View
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isTaskModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setTaskModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full sm:max-w-3xl lg:max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 mx-4 sm:mx-0">
            <div className="px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-100/80">
                  My Tasks
                </p>
                <h2 className="text-xl sm:text-2xl font-black mt-1">{selectedTask.title}</h2>
                <p className="text-violet-100/80 text-[11px] sm:text-sm mt-1">
                  Standalone task details assigned to you.
                </p>
              </div>
              <button
                onClick={() => setTaskModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] max-h-[75dvh] lg:max-h-[72vh] overflow-y-auto lg:overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-100">
                <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Description
                      </p>
                      <p className="mt-2 text-xs sm:text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {selectedTask.description}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadge(selectedTask.status)}`}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-2xl bg-white border border-gray-100 p-3">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Start Date</p>
                      <p className="mt-1 font-bold text-gray-900">
                        {new Date(selectedTask.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white border border-gray-100 p-3">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Due Date</p>
                      <p className="mt-1 font-bold text-gray-900">
                        {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitUpdate} className="mt-5 rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">
                    <MessageSquare size={14} className="text-violet-600" />
                    New Update
                  </div>
                  <div className="mt-4">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Set Status
                    </label>
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value as any)}
                      className="w-full rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 sm:py-3 text-sm font-bold text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                    >
                      <option value="ASSIGNED">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share progress, blockers, or next steps..."
                    className="mt-4 w-full rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                  />
                  <div className="mt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || !comment.trim()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending...' : (
                        <>
                          <Send size={15} />
                          Send Update
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto bg-gray-50/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Bell size={14} className="text-violet-600" />
                    Timeline
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400">
                    {updates.length} updates
                  </span>
                </div>

                {updates.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs font-medium">
                    No timeline updates yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updates.map((update: any) => {
                      const isMine = String(update.employeeId?._id || update.employeeId) === String(currentUserId);
                      return (
                        <div key={update._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[95%] sm:max-w-[90%] rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm ${isMine ? 'bg-violet-600 text-white border-violet-500' : 'bg-white text-gray-700 border-gray-100'}`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${isMine ? 'bg-white/15 text-white' : 'bg-violet-100 text-violet-700'}`}>
                                  {update.employeeId?.name?.charAt(0) || '?'}
                                </div>
                                <span className="text-xs font-bold truncate">
                                  {isMine ? 'You' : update.employeeId?.name || 'Admin'}
                                </span>
                              </div>
                            </div>
                            <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${isMine ? 'text-violet-50' : 'text-gray-700'}`}>
                              {update.comment}
                            </p>
                            <div className={`mt-2 flex items-center justify-end text-[8px] font-bold uppercase tracking-wider ${isMine ? 'text-violet-100/60' : 'text-gray-400'}`}>
                              {new Date(update.createdAt || update.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
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
    </div>
  );
};
