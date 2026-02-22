import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, ListTodo, Search, Filter, CalendarDays, MoreVertical } from 'lucide-react';
import {
    createTask,
    getAllTasks,
    updateTaskStatus,
    getTaskUpdates
} from '../../../api/taskApi';
import api from '../../../api/axios';

interface User {
    _id: string;
    name: string;
    empId: string;
}

interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
    startDate: string;
    dueDate?: string;
    assignedTo: User[];
    createdBy: User;
}

export const AdminTasksPage = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Drawer states
    const [isCreateDrawerOpen, setCreateDrawerOpen] = useState(false);
    const [isViewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskUpdates, setTaskUpdates] = useState<any[]>([]);

    // Create Form states
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignedTo: [] as string[],
        startDate: new Date().toISOString().split('T')[0],
        dueDate: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [tasksRes, usersRes] = await Promise.all([
                getAllTasks(),
                api.get('/users?role=EMPLOYEE') // Assume this exists from our previous work
            ]);
            setTasks(tasksRes.data || []);
            setEmployees(usersRes.data || []);
        } catch (error) {
            toast.error('Failed to load tasks data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title || !newTask.description || newTask.assignedTo.length === 0) {
            return toast.warning('Please fill all required fields');
        }

        try {
            await createTask(newTask);
            toast.success('Task created successfully!');
            setCreateDrawerOpen(false);

            // Reset form
            setNewTask({
                title: '',
                description: '',
                assignedTo: [],
                startDate: new Date().toISOString().split('T')[0],
                dueDate: ''
            });
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create task');
        }
    };

    const toggleEmployeeSelection = (empId: string) => {
        setNewTask(prev => ({
            ...prev,
            assignedTo: prev.assignedTo.includes(empId)
                ? prev.assignedTo.filter(id => id !== empId)
                : [...prev.assignedTo, empId]
        }));
    };

    const openViewDrawer = async (task: Task) => {
        setSelectedTask(task);
        setViewDrawerOpen(true);
        setTaskUpdates([]); // clear old
        try {
            const res = await getTaskUpdates(task._id);
            setTaskUpdates(res.data || []);
        } catch (e) {
            toast.error('Failed to load task updates');
        }
    };

    const handleMarkCompleted = async () => {
        if (!selectedTask) return;
        try {
            await updateTaskStatus(selectedTask._id, 'COMPLETED');
            toast.success('Task marked as completed!');
            setViewDrawerOpen(false);
            fetchInitialData();
        } catch (error: any) {
            toast.error('Failed to update status');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'ASSIGNED': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    // Filter tasks
    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedTo.some(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ListTodo className="text-primary-600" /> Task Master
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage, assign, and track employee tasks</p>
                </div>

                <button
                    onClick={() => setCreateDrawerOpen(true)}
                    className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus size={18} /> Create New Task
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tasks by title or assignee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <Filter size={16} />
                    <span>Showing {filteredTasks.length} Tasks</span>
                </div>
            </div>

            {/* Grid View */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-500">
                    No tasks found matching your criteria.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map((task) => (
                        <div
                            key={task._id}
                            onClick={() => openViewDrawer(task)}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">{task.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{task.description}</p>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {task.assignedTo.slice(0, 3).map((emp) => (
                                        <div key={emp._id} className="w-8 h-8 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-xs font-bold text-primary-700" title={emp.name}>
                                            {emp.name.charAt(0)}
                                        </div>
                                    ))}
                                    {task.assignedTo.length > 3 && (
                                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">
                                            +{task.assignedTo.length - 3}
                                        </div>
                                    )}
                                </div>

                                {task.dueDate && (
                                    <div className="flex items-center text-xs text-gray-400 gap-1.5 font-medium">
                                        <CalendarDays size={14} />
                                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── DRAWERS ───────────────────────────────────────────────────────── */}

            {/* 1. Create Drawer */}
            {isCreateDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setCreateDrawerOpen(false)} />
                    <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Create New Task</h2>
                            <button onClick={() => setCreateDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">✖</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="create-task-form" onSubmit={handleCreateSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Task Title</label>
                                    <input required type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Design Homepage" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Description</label>
                                    <textarea required rows={4} value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Details of the task..." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Start Date</label>
                                        <input required type="date" value={newTask.startDate} onChange={e => setNewTask({ ...newTask, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Due Date</label>
                                        <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex justify-between">
                                        Assign To <span className="text-primary-600 font-medium">{newTask.assignedTo.length} selected</span>
                                    </label>
                                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white shadow-inner">
                                        {employees.map(emp => (
                                            <label key={emp._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={newTask.assignedTo.includes(emp._id)}
                                                    onChange={() => toggleEmployeeSelection(emp._id)}
                                                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                                                    <span className="text-xs text-gray-400">{emp.empId}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setCreateDrawerOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" form="create-task-form" className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors">Create Task</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. View/Updates Drawer */}
            {isViewDrawerOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setViewDrawerOpen(false)} />
                    <div className="w-full max-w-lg bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">

                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                            <div className="pr-4">
                                <span className={`inline-flex px-2.5 py-1 mb-2 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(selectedTask.status)}`}>
                                    {selectedTask.status.replace('_', ' ')}
                                </span>
                                <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                            </div>
                            <button onClick={() => setViewDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 mt-1">✖</button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* Task Details */}
                            <div className="p-6 border-b border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTask.description}</p>

                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Start Date</h4>
                                        <p className="text-sm font-medium text-gray-900">{new Date(selectedTask.startDate).toLocaleDateString()}</p>
                                    </div>
                                    {selectedTask.dueDate && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</h4>
                                            <p className="text-sm font-medium text-gray-900">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Assigned To</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTask.assignedTo.map(emp => (
                                            <span key={emp._id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-200">
                                                <div className="w-4 h-4 rounded-full bg-white text-[8px] flex items-center justify-center font-bold text-gray-600 border border-gray-300">{emp.name.charAt(0)}</div>
                                                {emp.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Daily Updates Feed */}
                            <div className="p-6 bg-gray-50/30 min-h-full">
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    Daily Progress Updates
                                    <span className="bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">{taskUpdates.length}</span>
                                </h4>

                                {taskUpdates.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-6 bg-white rounded-xl border border-gray-100 border-dashed">No updates submitted by employees yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {taskUpdates.map((update: any) => (
                                            <div key={update._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                            {update.employeeId.name.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900">{update.employeeId.name}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                                        {new Date(update.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 mt-2 pl-8 border-l-2 border-gray-100">{update.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin Action Footer */}
                        {selectedTask.status !== 'COMPLETED' && (
                            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                <p className="text-xs text-gray-500 max-w-[200px]">Only admins can mark a task as completely finished.</p>
                                <button
                                    onClick={handleMarkCompleted}
                                    className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
                                >
                                    Verify & Complete Task
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
