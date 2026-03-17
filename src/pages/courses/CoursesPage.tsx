import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  IndianRupee,
  Clock,
  BarChart3,
  Filter,
  MoreVertical,
  RefreshCw,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axios";

interface Course {
  _id: string;
  courseId: string;
  courseName: string;
  level: string | null;
  duration: string | null;
  fees: number;
  isActive: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LEVELS = ["Basic", "Intermediate", "Advanced", "Expert"];

const levelColors: Record<string, string> = {
  Basic: "bg-sky-100 text-sky-700 border-sky-200",
  Intermediate: "bg-violet-100 text-violet-700 border-violet-200",
  Advanced: "bg-amber-100 text-amber-700 border-amber-200",
  Expert: "bg-rose-100 text-rose-700 border-rose-200",
};

const levelGradients: Record<string, string> = {
  Basic: "from-sky-400 to-blue-500",
  Intermediate: "from-violet-500 to-purple-600",
  Advanced: "from-amber-400 to-orange-500",
  Expert: "from-rose-500 to-red-600",
};

const inputClass =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";
const labelClass =
  "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

// ── Modal ──────────────────────────────────────────────────────────────────
interface ModalProps {
  course?: Course | null;
  onClose: () => void;
  onSaved: () => void;
}

const CourseModal: React.FC<ModalProps> = ({ course, onClose, onSaved }) => {
  const [courseName, setCourseName] = useState(course?.courseName || "");
  const [level, setLevel] = useState(course?.level || "");
  const [duration, setDuration] = useState(course?.duration || "");
  const [fees, setFees] = useState(course ? String(course.fees) : "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        courseName,
        level: level || null,
        duration: duration || null,
        fees: fees ? Number(fees) : 0,
      };
      if (course) {
        await api.put(`/courses/${course.courseId}`, payload);
        toast.success("Course updated!");
      } else {
        await api.post("/courses", payload);
        toast.success("Course created!");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || err?.error || "Failed to save course.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 fade-in duration-200">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5 rounded-t-2xl flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {course ? "Edit Course" : "New Course"}
            </h2>
            <p className="text-sm text-violet-200 mt-0.5">
              {course ? "Update course details" : "Add a new training course"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <BookOpen size={14} className="text-violet-600" />
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Course Details
              </span>
            </div>
            <div>
              <label className={labelClass}>Course Name *</label>
              <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                required
                placeholder="e.g. NDT Level II"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Level</label>
              <div className="relative">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  <option value="">Select level...</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 pt-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock size={14} className="text-amber-600" />
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Schedule & Pricing
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Duration</label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 months"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Fees (₹)</label>
                <input
                  type="number"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  placeholder="0"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-white transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-100 hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {course ? "Update Course" : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Course Card ───────────────────────────────────────────────────────────
interface CardProps {
  course: Course;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onToggleActive: (c: Course) => void;
}

const CourseCard: React.FC<CardProps> = ({
  course,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const gradient = course.level
    ? levelGradients[course.level]
    : "from-gray-400 to-gray-500";
  const levelColor = course.level
    ? levelColors[course.level]
    : "bg-gray-100 text-gray-500 border-gray-200";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group ${!course.isActive ? "opacity-60" : ""}`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm flex-shrink-0 text-white`}
            >
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">
                {course.courseName}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{course.courseId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${course.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}
            >
              {course.isActive ? (
                <CheckCircle2 size={10} />
              ) : (
                <XCircle size={10} />
              )}{" "}
              {course.isActive ? "Active" : "Inactive"}
            </span>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      onEdit(course);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      onToggleActive(course);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {course.isActive ? (
                      <XCircle size={13} />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}{" "}
                    {course.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      onDelete(course);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {course.level && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-3 ${levelColor}`}
          >
            <BarChart3 size={10} /> {course.level}
          </span>
        )}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5 text-gray-400">
              <Clock size={11} />{" "}
              <span className="text-xs font-medium">Duration</span>
            </div>
            <p className="text-sm font-bold text-gray-800 truncate">
              {course.duration || "—"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5 text-gray-400">
              <IndianRupee size={11} />{" "}
              <span className="text-xs font-medium">Fees</span>
            </div>
            <p className="text-sm font-bold text-gray-800">
              {course.fees > 0
                ? `₹${course.fees.toLocaleString("en-IN")}`
                : "Free"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "9",
        search,
        level: levelFilter,
        status: statusFilter,
      });
      const res: any = await api.get(`/courses?${params.toString()}`);
      setCourses(res.data || []);
      setPagination(res.pagination);
    } catch {
      toast.error("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => fetchCourses(), search ? 500 : 0);
    return () => clearTimeout(delayDebounce);
  }, [page, search, levelFilter, statusFilter]);

  const handleToggleActive = async (course: Course) => {
    try {
      await api.put(`/courses/${course.courseId}`, {
        isActive: !course.isActive,
      });
      toast.success(`Course ${course.isActive ? "deactivated" : "activated"}!`);
      fetchCourses();
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/courses/${deleteTarget.courseId}`);
      toast.success("Course deleted.");
      setDeleteTarget(null);
      fetchCourses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
              <BookOpen size={18} />
            </span>
            Courses
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage NDT training courses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl mr-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-primary-600" : "text-gray-400"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white shadow-sm text-primary-600" : "text-gray-400"}`}
            >
              <List size={18} />
            </button>
          </div>
          <button
            onClick={fetchCourses}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => {
              setEditCourse(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
          >
            <Plus size={16} /> New Course
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or ID..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none transition-all"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => {
            setLevelFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none appearance-none"
        >
          <option value="All">All Levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none appearance-none"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 size={32} className="animate-spin text-violet-500 inline" />
        </div>
      ) : courses.length === 0 ? (
        <div className="py-20 text-center text-gray-500">No courses found</div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <CourseCard
              key={c._id}
              course={c}
              onEdit={(c) => {
                setEditCourse(c);
                setShowModal(true);
              }}
              onDelete={setDeleteTarget}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-400 uppercase">
                  Course Info
                </th>
                <th className="px-6 py-4 font-bold text-gray-400 uppercase">
                  Level
                </th>
                <th className="px-6 py-4 font-bold text-gray-400 uppercase">
                  Duration
                </th>
                <th className="px-6 py-4 font-bold text-gray-400 uppercase">
                  Fees
                </th>
                <th className="px-6 py-4 font-bold text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courses.map((c) => (
                <tr
                  key={c._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <strong>{c.courseName}</strong>
                    <br />
                    <span className="text-xs text-gray-400">{c.courseId}</span>
                  </td>
                  <td className="px-6 py-4">
                    {c.level && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${levelColors[c.level]}`}
                      >
                        {c.level}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{c.duration || "—"}</td>
                  <td className="px-6 py-4 font-bold">
                    ₹{c.fees.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setEditCourse(c);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-primary-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="p-1.5 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-700">
            Page <strong>{page}</strong> of{" "}
            <strong>{pagination.totalPages}</strong>
          </p>
          <div className="flex gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 border rounded-lg disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border rounded-lg disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <CourseModal
          course={editCourse}
          onClose={() => {
            setShowModal(false);
            setEditCourse(null);
          }}
          onSaved={fetchCourses}
        />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <Trash2 size={40} className="mx-auto text-red-600 mb-4" />
            <h3 className="text-lg font-bold mb-2">Delete Course?</h3>
            <p className="text-sm text-gray-500 mb-6">
              "{deleteTarget.courseName}" will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
