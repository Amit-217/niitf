import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Plus,
  ListTodo,
  Search,
  Filter,
  CalendarDays,
  MoreVertical,
  X,
  Edit2,
} from "lucide-react";
import {
  createTask,
  updateTask,
  getAllTasks,
  updateTaskStatus,
  getTaskUpdates,
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
}

const inputClass =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";
const labelClass =
  "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

export const AdminTasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer states
  const [isCreateDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isViewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskUpdates, setTaskUpdates] = useState<any[]>([]);

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
      const res = await getAllTasks();
      setTasks(res.data || []);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const usersRes = await api.get("/users?role=EMPLOYEE");
      setEmployees(usersRes.data || []);
    } catch (error) {
      console.error("Failed to load employees:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (isCreateDrawerOpen) {
      fetchEmployees();
    }
  }, [isCreateDrawerOpen]);

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
    try {
      const res = await getTaskUpdates(task._id);
      setTaskUpdates(res.data || []);
    } catch (e) {
      toast.error("Failed to load task updates");
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedTask) return;
    try {
      await updateTaskStatus(selectedTask._id, "COMPLETED");
      toast.success("Task marked as completed!");
      setViewDrawerOpen(false);
      fetchTasks();
    } catch (error: any) {
      toast.error("Failed to update status");
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
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedTo.some((emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

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
        {/* Status Gradient Top Line */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradient}`} />

        <div className="p-5 flex flex-col h-full">
          {/* Header */}
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
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleOpenEdit(task, e)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button className="p-1 px-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <MoreVertical size={14} />
              </button>
            </div>
          </div>

          {/* Progress Badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`}
              />
              {task.status.replace("_", " ")}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 line-clamp-3 mb-5 leading-relaxed flex-1">
            {task.description}
          </p>

          {/* Footer Info */}
          <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between">
            {/* Assignees */}
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

            {/* Due Date */}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListTodo className="text-primary-600" /> Task Master
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage, assign, and track employee tasks
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
        >
          <Plus size={17} /> Create New Task
        </button>
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
        <div className="flex items-center gap-2 whitespace-nowrap bg-gray-100/50 p-1.5 rounded-xl border border-gray-100">
          <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 text-xs font-bold text-violet-700">
            {filteredTasks.length}{" "}
            {filteredTasks.length === 1 ? "Task" : "Tasks"} Found
          </div>
          <div className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Task Master View
          </div>
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
      ) : filteredTasks.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-gray-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No tasks found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            We couldn't find any tasks matching your criteria. Try adjusting
            your search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={openViewDrawer} />
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {drawerMode === "CREATE" ? "Create New Task" : "Edit Task"}
                  </h2>
                  <p className="text-violet-200 text-sm mt-0.5">
                    {drawerMode === "CREATE"
                      ? "Fill in task details and assign to employees."
                      : "Update task details and assignments."}
                  </p>
                </div>
                <button
                  onClick={() => setCreateDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form
              id="create-task-form"
              onSubmit={handleFormSubmit}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-4">
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
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setViewDrawerOpen(false)}
          />
          <div className="w-full max-w-lg bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
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
              <button
                onClick={() => setViewDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-600 mt-1"
              >
                ✖
              </button>
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

              {/* Daily Updates Feed */}
              <div className="p-6 bg-gray-50/30 min-h-full">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  Daily Progress Updates
                  <span className="bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {taskUpdates.length}
                  </span>
                </h4>

                {taskUpdates.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6 bg-white rounded-xl border border-gray-100 border-dashed">
                    No updates submitted by employees yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {taskUpdates.map((update: any) => (
                      <div
                        key={update._id}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {update.employeeId.name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {update.employeeId.name}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                            {new Date(update.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 pl-8 border-l-2 border-gray-100">
                          {update.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Action Footer */}
            {selectedTask.status !== "COMPLETED" && (
              <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <p className="text-xs text-gray-500 max-w-[200px]">
                  Only admins can mark a task as completely finished.
                </p>
                <button
                  onClick={handleMarkCompleted}
                  className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
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
