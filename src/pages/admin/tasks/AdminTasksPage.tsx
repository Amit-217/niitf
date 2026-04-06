import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ListTodo,
  CalendarDays,
  Edit2,
  Trash2,
  Plus,
  Search,
  MessageSquare,
  X,
  Archive,
  RefreshCw,
  Send,
  ArrowRight,
} from "lucide-react";
import {
  createTask,
  updateTask,
  getAllTasks,
  submitTaskUpdate,
  getTaskUpdates,
  deleteTask,
  archiveTask,
} from "../../../api/taskApi";
import api from "../../../api/axios";

interface User {
  _id: string;
  name: string;
  empId: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  startDate: string;
  dueDate?: string;
  assignedTo: User[];
  createdBy: User;
  isArchived: boolean;
}

const inputClass =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";
const labelClass =
  "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

export const AdminTasksPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isMyTasksMode = new URLSearchParams(location.search).get("mine") === "1";
  const [viewArchived, setViewArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'ASSIGNED'>(isMyTasksMode ? 'IN_PROGRESS' : 'ALL');
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set());

  // Drawer states
  const [isCreateDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isViewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskUpdates, setTaskUpdates] = useState<any[]>([]);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [isMyTasksDrawerOpen, setMyTasksDrawerOpen] = useState(false);
  const [selectedMyTask, setSelectedMyTask] = useState<Task | null>(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId =
    currentUser?.userId || currentUser?.id || currentUser?._id || "";

  // Create/Edit Form states
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: [] as string[],
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "ASSIGNED" as "ASSIGNED" | "IN_PROGRESS" | "COMPLETED",
  });

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await getAllTasks({ isArchived: viewArchived });
      const allTasks = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setTasks(allTasks);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const usersRes = await api.get("/users?status=active&limit=100");
      setEmployees(usersRes.data || []);
    } catch (error) {
      console.error("Failed to load employees:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [viewArchived]);

  useEffect(() => {
    if (isCreateDrawerOpen) {
      fetchEmployees();
    }
  }, [isCreateDrawerOpen]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenAssigned =
      params.get("mine") === "1" ||
      (location.state as { openMyTasks?: boolean } | null)?.openMyTasks === true;

    if (shouldOpenAssigned) {
      setMyTasksDrawerOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (!isMyTasksDrawerOpen) {
      setSelectedMyTask(null);
    }
  }, [isMyTasksDrawerOpen]);

  const openedTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    const taskId = (location.state as { taskId?: string } | null)?.taskId;
    if (!taskId || openedTaskIdRef.current === taskId || tasks.length === 0) return;
    const matched = tasks.find((task) => task._id === taskId);
    if (matched) {
      openedTaskIdRef.current = taskId;
      if (isMyTasksMode) {
        setSelectedMyTask(matched);
        setMyTasksDrawerOpen(true);
      } else {
        openViewDrawer(matched);
      }
    }
  }, [tasks, location.state, isMyTasksMode]);

  const handleOpenCreate = () => {
    setDrawerMode("CREATE");
    setEditTaskId(null);
    setTaskForm({
      title: "",
      description: "",
      assignedTo: [],
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      status: "ASSIGNED",
    });
    setCreateDrawerOpen(true);
  };

  const handleOpenEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setDrawerMode("EDIT");
    setEditTaskId(task._id);
    setTaskForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo.map((emp) => emp._id),
      startDate: task.startDate.split("T")[0],
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      status: task.status,
    });
    setCreateDrawerOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !taskForm.title ||
      !taskForm.description ||
      taskForm.assignedTo.length === 0
    ) {
      return toast.warning("Please fill all required fields");
    }

    try {
      if (drawerMode === "CREATE") {
        await createTask(taskForm);
        toast.success("Task created successfully!");
      } else {
        await updateTask(editTaskId!, taskForm);
        toast.success("Task updated successfully!");
      }
      setCreateDrawerOpen(false);
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to process task");
    }
  };

  const toggleEmployeeSelection = (empId: string) => {
    setTaskForm((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(empId)
        ? prev.assignedTo.filter((id) => id !== empId)
        : [...prev.assignedTo, empId],
    }));
  };

  const openViewDrawer = async (task: Task) => {
    setSelectedTask(task);
    setViewDrawerOpen(true);
    setTaskUpdates([]); // clear old
    setFollowUpMessage("");
    try {
      const res = await getTaskUpdates(task._id);
      setTaskUpdates(res.data || []);
    } catch (e) {
      toast.error("Failed to load task updates");
    }
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !followUpMessage.trim()) return;

    setIsSendingFollowUp(true);
    try {
      await submitTaskUpdate(selectedTask._id, {
        date: new Date().toISOString().split("T")[0],
        comment: followUpMessage.trim(),
      });
      toast.success("Follow-up sent");
      setFollowUpMessage("");
      window.dispatchEvent(new Event("notifications:refresh"));
      const res = await getTaskUpdates(selectedTask._id);
      setTaskUpdates(res.data || []);
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to send follow-up");
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully!");
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
    }
  };

  const handleUnarchiveTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to reopen this task?")) return;
    setProcessingTasks(prev => new Set(prev).add(id));
    try {
      await updateTask(id, { isArchived: false, status: 'IN_PROGRESS' });
      toast.success("Task reopened and set to In Progress");
      await fetchTasks();
    } catch (err) {
      toast.error("Failed to reopen task");
    } finally {
      setProcessingTasks(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReopenTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to reopen this completed task for further work?")) return;
    setProcessingTasks(prev => new Set(prev).add(id));
    try {
      await updateTask(id, { status: "IN_PROGRESS", isArchived: false });
      toast.success("Task reopened and set to In Progress");
      await fetchTasks();
    } catch (err: any) {
      toast.error(err.message || "Failed to reopen task");
    } finally {
      setProcessingTasks(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleArchiveTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to archive this task? It will no longer be visible in active lists.")) return;
    setProcessingTasks(prev => new Set(prev).add(taskId));
    try {
      await archiveTask(taskId);
      toast.success("Task archived successfully!");
      await fetchTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to archive task");
    } finally {
      setProcessingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  // Status colors mapping
  const STATUS_MAP: Record<
    string,
    { bg: string; text: string; border: string; dot: string; gradient: string }
  > = {
    COMPLETED: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      dot: "bg-emerald-500",
      gradient: "from-emerald-400 to-green-500",
    },
    IN_PROGRESS: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      dot: "bg-blue-500",
      gradient: "from-blue-400 to-indigo-500",
    },
    ASSIGNED: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      dot: "bg-amber-500",
      gradient: "from-orange-400 to-amber-500",
    },
    DEFAULT: {
      bg: "bg-gray-50",
      text: "text-gray-500",
      border: "border-gray-100",
      dot: "bg-gray-400",
      gradient: "from-gray-400 to-gray-500",
    },
  };

  const getStatusConfig = (status: string) =>
    STATUS_MAP[status] || STATUS_MAP.DEFAULT;

  const getStatusBadge = (status: string) => {
    const cfg = getStatusConfig(status);
    return `${cfg.bg} ${cfg.text} ${cfg.border}`;
  };

  // Filter tasks
  const filteredTasks = tasks.filter(
    (t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.assignedTo.some((emp) =>
            emp.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesArchived = (t.isArchived || false) === viewArchived;
      return matchesSearch && matchesStatus && matchesArchived;
    }
  );
  const myTasks = tasks.filter((task) => {
    return task.assignedTo.some((emp) => String(emp?._id || emp) === String(currentUserId));
  });
  const visibleTasks = isMyTasksMode
    ? myTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.assignedTo.some((emp) => emp.name.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : filteredTasks;

  const TaskCard = ({
    task,
    onClick,
  }: {
    task: Task;
    onClick: (t: Task) => void;
  }) => {
    const cfg = getStatusConfig(task.status);
    return (
      <div
        onClick={() => onClick(task)}
        className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
      >
        <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradient}`} />
        <div className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white shadow-sm`}
              >
                <ListTodo size={16} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-1 text-sm leading-tight">
                  {task.title}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-tighter">
                  Task ID: {task._id.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>
            {!isMyTasksMode && (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={(e) => handleOpenEdit(task, e)}
                  title="Edit Task"
                  className="p-2 sm:p-1.5 rounded-xl border border-gray-100 sm:border-none text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDeleteTask(task._id, e)}
                  title="Delete Task"
                  className="p-2 sm:p-1.5 rounded-xl border border-gray-100 sm:border-none text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
              {task.status.replace("_", " ")}
            </span>
            {task.status === "COMPLETED" && !task.isArchived && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={(e) => handleArchiveTask(task._id, e)}
                  disabled={processingTasks.has(task._id)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all shadow-sm group/archive disabled:opacity-50"
                >
                  {processingTasks.has(task._id) ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Archive size={12} className="group-hover/archive:scale-110 transition-transform" />
                  )}
                  Archive Task
                </button>
                <button
                  onClick={(e) => handleReopenTask(task._id, e)}
                  disabled={processingTasks.has(task._id)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all shadow-sm group/reopen disabled:opacity-50"
                >
                  {processingTasks.has(task._id) ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} className="group-hover/reopen:rotate-180 transition-transform duration-500" />
                  )}
                  Reopen Task
                </button>
              </div>
            )}
            {task.isArchived && (
              <button
                onClick={(e) => handleUnarchiveTask(task._id, e)}
                disabled={processingTasks.has(task._id)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all shadow-sm group/reopen disabled:opacity-50"
              >
                {processingTasks.has(task._id) ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} className="group-hover/reopen:rotate-180 transition-transform duration-500" />
                )}
                Reopen Task
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 line-clamp-3 mb-5 leading-relaxed flex-1">
            {task.description}
          </p>

          <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between">
            <div className="flex -space-x-2.5">
              {task.assignedTo.slice(0, 3).map((emp) => (
                <div
                  key={emp._id}
                  className="w-8 h-8 rounded-full bg-white border-2 border-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center text-[10px] font-black text-violet-700 bg-violet-50"
                  title={emp.name}
                >
                  {emp.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {task.assignedTo.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                  +{task.assignedTo.length - 3}
                </div>
              )}
            </div>

            {task.dueDate && (
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-0.5">
                  Due By
                </span>
                <div
                  className={`flex items-center text-[11px] font-bold gap-1.5 ${new Date(task.dueDate) < new Date() ? "text-rose-500" : "text-gray-600"}`}
                >
                  <CalendarDays size={13} strokeWidth={2.5} />
                  {new Date(task.dueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListTodo className="text-primary-600" /> {isMyTasksMode ? 'My Tasks' : 'Admin Task'}
          </h1>
          <p className="hidden sm:block text-sm text-gray-500 mt-1">
            {isMyTasksMode
              ? 'Only the tasks assigned to your account are shown here.'
              : 'Manage, assign, and follow up on employee tasks. Completion is confirmed from the employee workspace.'}
          </p>
        </div>

        {!isMyTasksMode && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
          >
            <Plus size={17} /> Create New Task
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks by title, description or assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none bg-white shadow-sm transition-all text-sm"
          />
        </div>
        <div className="flex bg-gray-100/50 p-1 rounded-2xl self-stretch md:self-auto border border-gray-100 shadow-inner">
          {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${statusFilter === status ? 'bg-white shadow-sm text-violet-700 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl self-stretch md:self-auto">
          <button
            onClick={() => setViewArchived(false)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${!viewArchived ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setViewArchived(true)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${viewArchived ? 'bg-white shadow-sm text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Grid View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-violet-100 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-12 h-12 border-t-4 border-violet-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Loading Task Data...
          </p>
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="hidden sm:block text-center p-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-gray-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No tasks found</h3>
          <p className="hidden sm:block text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            {isMyTasksMode
              ? 'No tasks are assigned to you yet.'
              : "We couldn't find any tasks matching your criteria. Try adjusting your search query."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={isMyTasksMode ? (t) => {
                setSelectedMyTask(t);
                setMyTasksDrawerOpen(true);
              } : openViewDrawer}
            />
          ))}
        </div>
      )}

      {/* ── DRAWERS ───────────────────────────────────────────────────────── */}

      {/* 1. Create/Edit Modal */}
      {isCreateDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setCreateDrawerOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 mx-4 sm:mx-0">
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-5 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {drawerMode === "CREATE" ? "Create New Task" : "Edit Task"}
                  </h2>
                  <p className="text-violet-200 text-[11px] sm:text-sm mt-0.5">
                    {drawerMode === "CREATE"
                      ? "Fill in details and assign to employees."
                      : "Update task details and assignments."}
                  </p>
                </div>
                <button
                  onClick={() => setCreateDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form
              id="create-task-form"
              onSubmit={handleFormSubmit}
              className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="col-span-2">
                  <label className={labelClass}>Task Title *</label>
                  <input
                    required
                    type="text"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, title: e.target.value })
                    }
                    className={inputClass}
                    placeholder="e.g. Design Homepage"
                  />
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, description: e.target.value })
                    }
                    className={`${inputClass} resize-none`}
                    placeholder="Details of the task..."
                  />
                </div>

                <div>
                  <label className={labelClass}>Start Date *</label>
                  <input
                    required
                    type="date"
                    value={taskForm.startDate}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, startDate: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, dueDate: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        status: e.target.value as any,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      className={
                        "text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      }
                    >
                      Assign To *
                    </label>
                    <span className="text-xs font-medium text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full">
                      {taskForm.assignedTo.length} selected
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50 shadow-inner">
                    {employees.map((emp) => (
                      <label
                        key={emp._id}
                        className="flex items-center gap-3 p-3 hover:bg-violet-50/50 cursor-pointer transition-colors group"
                      >
                        <input
                          type="checkbox"
                          checked={taskForm.assignedTo.includes(emp._id)}
                          onChange={() => toggleEmployeeSelection(emp._id)}
                          className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500 transition-colors group-hover:border-violet-400"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 group-hover:text-violet-900 transition-colors">
                            {emp.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {emp.empId}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateDrawerOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
                >
                  {drawerMode === "CREATE" ? "Create Task" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. View/Updates Drawer */}
      {isViewDrawerOpen && selectedTask && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setViewDrawerOpen(false)}
          />
          <div className="w-full sm:max-w-lg bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
              <div className="pr-4">
                <span
                  className={`inline-flex px-2.5 py-1 mb-2 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(selectedTask.status)}`}
                >
                  {selectedTask.status.replace("_", " ")}
                </span>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedTask.title}
                </h2>
              </div>
              <div className="flex items-start gap-2">
                {selectedTask.status === "COMPLETED" && !selectedTask.isArchived && (
                  <>
                    <button
                      onClick={(e) => {
                        handleArchiveTask(selectedTask._id, e);
                        setViewDrawerOpen(false);
                      }}
                      disabled={processingTasks.has(selectedTask._id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Archive size={14} />
                      Archive
                    </button>
                    <button
                      onClick={(e) => {
                        handleReopenTask(selectedTask._id, e);
                        setViewDrawerOpen(false);
                      }}
                      disabled={processingTasks.has(selectedTask._id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw size={14} />
                      Reopen Task
                    </button>
                  </>
                )}
                {selectedTask.isArchived && (
                  <button
                    onClick={(e) => {
                      handleUnarchiveTask(selectedTask._id, e);
                      setViewDrawerOpen(false);
                    }}
                    disabled={processingTasks.has(selectedTask._id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw size={14} />
                    Reopen Task
                  </button>
                )}
                <button
                  onClick={() => setViewDrawerOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Task Details */}
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Description
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedTask.description}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Start Date
                    </h4>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedTask.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedTask.dueDate && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Due Date
                      </h4>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedTask.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Assigned To
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.assignedTo.map((emp) => (
                      <span
                        key={emp._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-200"
                      >
                        <div className="w-4 h-4 rounded-full bg-white text-[8px] flex items-center justify-center font-bold text-gray-600 border border-gray-300">
                          {emp.name.charAt(0)}
                        </div>
                        {emp.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50/30 min-h-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={16} className="text-violet-600" />
                    Conversation
                    <span className="bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {taskUpdates.length}
                    </span>
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                    Follow up thread
                  </span>
                </div>

                {taskUpdates.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6 bg-white rounded-xl border border-gray-100 border-dashed">
                    No updates yet. Start the conversation below.
                  </p>
                ) : (
                  <div className="flex flex-col-reverse space-y-3 space-y-reverse max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-violet-200 scrollbar-track-transparent">
                    {taskUpdates.map((update: any) => {
                      const isMine = String(update.employeeId?._id || update.employeeId) === String(currentUserId);
                      return (
                        <div
                          key={update._id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[92%] sm:max-w-[88%] rounded-2xl border px-3 sm:px-4 py-2 sm:py-3 shadow-sm ${isMine ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white border-gray-200 text-gray-700'}`}
                          >
                            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black ${isMine ? 'bg-white/15 text-white' : 'bg-violet-100 text-violet-700'}`}>
                                  {update.employeeId?.name?.charAt(0) || '?'}
                                </div>
                                <span className="text-xs sm:text-sm font-bold truncate">
                                  {isMine ? 'You' : update.employeeId?.name || 'User'}
                                </span>
                              </div>
                              <span className={`text-[9px] font-semibold uppercase tracking-wider ${isMine ? 'text-violet-100' : 'text-gray-400'}`}>
                                {new Date(update.createdAt || update.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${isMine ? 'text-violet-50' : 'text-gray-700'}`}>
                              {update.comment}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <form onSubmit={handleSendFollowUp} className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">
                    Add follow-up
                  </label>
                  <textarea
                    rows={3}
                    value={followUpMessage}
                    onChange={(e) => setFollowUpMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                    placeholder="Ask for an update, share a reminder, or add context..."
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400 max-w-[220px]">
                      This follows the same task update stream employees use, so both sides see one shared thread.
                    </p>
                    <button
                      type="submit"
                      disabled={isSendingFollowUp || !followUpMessage.trim()}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSendingFollowUp ? 'Sending...' : (
                        <>
                          <Send size={15} />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMyTasksDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setMyTasksDrawerOpen(false)}
          />
          <div className="w-full sm:max-w-md bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                  My Tasks
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {selectedMyTask ? selectedMyTask.title : "My Tasks"}
                </h2>
                <p className="hidden sm:block text-sm text-gray-500 mt-1">
                  {selectedMyTask
                    ? "Standalone details for the task assigned to you."
                    : "Only tasks assigned to your account are shown here."}
                </p>
              </div>
              <button
                onClick={() => {
                  if (selectedMyTask) {
                    setSelectedMyTask(null);
                    return;
                  }
                  setMyTasksDrawerOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600 mt-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {myTasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500 text-sm">
                  No tasks assigned to your account right now.
                </div>
              ) : selectedMyTask ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-500">
                          Assigned to you
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">
                          {selectedMyTask.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                          {selectedMyTask.description}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusConfig(selectedMyTask.status).bg} ${getStatusConfig(selectedMyTask.status).text} ${getStatusConfig(selectedMyTask.status).border}`}>
                        {selectedMyTask.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-2xl bg-white border border-gray-100 p-3">
                        <p className="text-gray-400 font-black uppercase tracking-widest">Start Date</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {new Date(selectedMyTask.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white border border-gray-100 p-3">
                        <p className="text-gray-400 font-black uppercase tracking-widest">Due Date</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {selectedMyTask.dueDate
                            ? new Date(selectedMyTask.dueDate).toLocaleDateString()
                            : "Not set"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white border border-gray-100 p-3 col-span-2">
                        <p className="text-gray-400 font-black uppercase tracking-widest">Assigned Count</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {selectedMyTask.assignedTo.length} assignee{selectedMyTask.assignedTo.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedMyTask(null)}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Back to My Tasks
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((task) => {
                    const cfg = getStatusConfig(task.status);
                    return (
                      <button
                        key={task._id}
                        type="button"
                        onClick={() => setSelectedMyTask(task)}
                        className="w-full text-left rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-4 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-500">
                              Assigned to you
                            </p>
                            <p className="font-bold text-gray-900 truncate mt-1">{task.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <ArrowRight size={11} />
                            View
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-500">
                            Task {myTasks.length > 1 ? `${myTasks.indexOf(task) + 1} of ${myTasks.length}` : "Details"}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-black ${cfg.bg} ${cfg.text}`}>
                            {task.status.replace("_", " ")}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
