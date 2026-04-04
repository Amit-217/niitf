import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  BookOpen,
  Calendar,
  User,
  XCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axios";

// ── Types ──────────────────────────────────────────────────────────────────
interface Course {
  _id: string;
  courseId: string;
  courseName: string;
}

interface Enquiry {
  _id: string;
  enquiryId: string;
  name: string;
  mobile: string;
  email: string | null;
  city: string | null;
  courseInterestedId: {
    _id: string;
    courseId: string;
    courseName: string;
  } | null;
  enquiryDate: string;
  nextFollowUpDate?: string | null;
  remarks?: Array<{ note: string; date: string; author?: string }>;
  source: "Walk-in" | "Call" | "Website" | "Reference";
  status: "New" | "Follow-up" | "Converted" | "Not Interested";
  isDeleted: boolean;
  createdAt: string;
}

// ── Config ─────────────────────────────────────────────────────────────────

const SOURCES = ["Walk-in", "Call", "Website", "Reference"] as const;
const STATUSES = ["New", "Follow-up", "Converted", "Not Interested"] as const;

const inputClass =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";
const labelClass =
  "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

// ── Components ─────────────────────────────────────────────────────────────
const StatusTimeline: React.FC<{ status: string }> = ({ status }) => {
  const stages = ["New", "Follow-up", "Converted"];
  const currentIdx = stages.indexOf(status);
  return (
    <div className="flex items-center gap-1 my-3">
      {stages.map((s, i) => {
        const isActive = i <= currentIdx;
        const isCurrent = i === currentIdx;
        if (status === "Not Interested" && i === 0)
          return (
            <div key={s} className="flex items-center gap-1 text-gray-400">
              <XCircle size={14} className="text-red-400" />
              <span className="text-[10px] font-bold uppercase">Dropped</span>
            </div>
          );
        if (status === "Not Interested") return null;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-400"}`}
              >
                {i + 1}
              </div>
              <span
                className={`text-[10px] font-bold uppercase ${isCurrent ? "text-indigo-600" : "text-gray-400"}`}
              >
                {s}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`h-[2px] w-6 ${i < currentIdx ? "bg-indigo-200" : "bg-gray-100"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface ModalProps {
  enquiry?: Enquiry | null;
  courses: Course[];
  onClose: () => void;
  onSaved: () => void;
}

const EnquiryModal: React.FC<ModalProps> = ({
  enquiry,
  courses,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(enquiry?.name || "");
  const [mobile, setMobile] = useState(enquiry?.mobile || "");
  const [email, setEmail] = useState(enquiry?.email || "");
  const [city] = useState(enquiry?.city || "");
  const [courseId, setCourseId] = useState(
    enquiry?.courseInterestedId?.courseId || "",
  );
  const [source, setSource] = useState<(typeof SOURCES)[number]>(
    enquiry?.source || "Walk-in",
  );
  const [status, setStatus] = useState<(typeof STATUSES)[number]>(
    enquiry?.status || "New",
  );
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    enquiry?.nextFollowUpDate ? enquiry.nextFollowUpDate.split("T")[0] : "",
  );
  const [newRemark, setNewRemark] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name,
        mobile,
        source,
        status,
        nextFollowUpDate: nextFollowUpDate || null,
      };
      if (email) payload.email = email;
      if (city) payload.city = city;
      if (!enquiry) payload.courseInterestedId = courseId;
      if (newRemark.trim()) payload.remark = newRemark.trim();
      if (enquiry) await api.put(`/enquiries/${enquiry.enquiryId}`, payload);
      else await api.post("/enquiries", payload);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error("Failed to save.");
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5 rounded-t-2xl flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {enquiry ? "Edit Enquiry" : "New Lead Enquiry"}
            </h2>
            <p className="text-violet-200 text-sm mt-0.5">
              {enquiry
                ? "Update lead details & status."
                : "Capture details for the new enquiry."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-[75vh]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section: Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                  <User size={16} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Prospect Details
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>Full Name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Applicant Name"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>Mobile Number *</label>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    placeholder="10 Digit Number"
                    maxLength={10}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    value={email || ""}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Section: interest */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="p-1.5 bg-sky-100 text-sky-600 rounded-lg">
                  <BookOpen size={16} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Enquiry Context
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!enquiry && (
                  <div className="col-span-2">
                    <label className={labelClass}>Course of Interest *</label>
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      required
                      className={inputClass}
                    >
                      <option value="">-- Select Course --</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c.courseId}>
                          {c.courseName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className={inputClass}
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>Next Followup</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                    <Calendar
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Status & Remarks */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <MessageSquare size={14} className="text-violet-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Status & Remarks
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Current Status</label>
                  <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${status === s ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
                      >
                        {s.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass}>Notes History</label>
                    <span className="text-[10px] font-bold text-gray-400">
                      {enquiry?.remarks?.length || 0} entries
                    </span>
                  </div>
                  <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                    {enquiry?.remarks?.length ? (
                      [...enquiry.remarks].reverse().map((r, i) => (
                        <div key={i} className="p-3 text-[11px]">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-900 flex items-center gap-1">
                              <Clock size={10} />{" "}
                              {new Date(r.date).toLocaleDateString()}
                            </span>
                            <span className="text-gray-400 italic">Admin</span>
                          </div>
                          <p className="text-gray-600 leading-relaxed font-medium">
                            {r.note}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 italic text-xs">
                        No previous notes recorded.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Add New Remark</label>
                  <textarea
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    placeholder="Type followup notes here..."
                    className={`${inputClass} h-24 resize-none`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
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
              className="flex-[2] py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-100 disabled:opacity-70 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Save
                    size={18}
                    className="group-hover:scale-110 transition-transform"
                  />{" "}
                  {enquiry ? "Update Enquiry" : "Create Enquiry"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EnquiryCard: React.FC<{
  enquiry: Enquiry;
  onEdit: (e: Enquiry) => void;
  onDelete: (e: Enquiry) => void;
  onConvert: (e: Enquiry) => void;
}> = ({ enquiry, onEdit, onDelete, onConvert }) => {

  const isDue =
    enquiry.nextFollowUpDate &&
    new Date(enquiry.nextFollowUpDate) <= new Date() &&
    enquiry.status !== "Converted";
  return (
    <div
      className={`bg-white rounded-2xl border p-4 space-y-3 shadow-sm ${isDue ? "border-amber-400 ring-1 ring-amber-100" : "border-gray-100"}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{enquiry.name}</h3>
          <p className="text-[10px] text-gray-400">{enquiry.mobile}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(enquiry)}
            className="p-1.5 text-gray-400 hover:text-indigo-600"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(enquiry)}
            className="p-1.5 text-gray-400 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <StatusTimeline status={enquiry.status} />
      <div className="flex items-center justify-between mt-4 border-t pt-3">
        <div className="text-[10px] font-bold text-gray-500 uppercase">
          Followup:{" "}
          <span className={isDue ? "text-amber-600" : "text-gray-900"}>
            {enquiry.nextFollowUpDate
              ? new Date(enquiry.nextFollowUpDate).toLocaleDateString()
              : "N/A"}
          </span>
        </div>
        {enquiry.status !== "Converted" && (
          <button
            onClick={() => onConvert(enquiry)}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1"
          >
            Convert <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export const EnquiriesPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editEnquiry, setEditEnquiry] = useState<Enquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        followUpDue: dueFilter ? "true" : "false",
        limit: "100",
      });
      const [eRes, cRes]: any[] = await Promise.all([
        api.get(`/enquiries?${params.toString()}`),
        api.get("/courses?limit=100"),
      ]);
      setEnquiries(eRes.data || []);
      setCourses(cRes.data || []);
    } catch {
      toast.error("Error loading.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const d = setTimeout(() => fetchData(), search ? 500 : 0);
    return () => clearTimeout(d);
  }, [search, statusFilter, dueFilter]);

  const handleConvert = (enq: Enquiry) => {
    sessionStorage.setItem(
      "pendingAdmission",
      JSON.stringify({
        studentName: enq.name,
        mobile: enq.mobile,
        courseId: enq.courseInterestedId?.courseId,
      }),
    );
    navigate("/admin/admissions");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/enquiries/${deleteTarget.enquiryId}`);
      toast.success("Deleted!");
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error("Error.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="text-indigo-600" /> Enquiries
        </h1>
        <button
          onClick={() => {
            setEditEnquiry(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
        >
          <Plus size={17} /> New Lead
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-9 p-2.5 border rounded-xl"
          />
        </div>
        <button
          onClick={() => setDueFilter(!dueFilter)}
          className={`px-4 py-2 border rounded-xl text-xs font-bold ${dueFilter ? "bg-amber-100 text-amber-700" : "bg-white text-gray-500"}`}
        >
          <Clock size={14} className="inline mr-1" /> Due Only
        </button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2.5 border rounded-xl text-xs font-bold"
        >
          <option value="All">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin inline" size={32} />
        </div>
      ) : enquiries.length === 0 ? (
        <div className="py-20 text-center text-gray-500">No leads found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enquiries.map((e) => (
            <EnquiryCard
              key={e._id}
              enquiry={e}
              onEdit={(enq) => {
                setEditEnquiry(enq);
                setShowModal(true);
              }}
              onDelete={setDeleteTarget}
              onConvert={handleConvert}
            />
          ))}
        </div>
      )}
      {showModal && (
        <EnquiryModal
          enquiry={editEnquiry}
          courses={courses}
          onClose={() => {
            setShowModal(false);
            setEditEnquiry(null);
          }}
          onSaved={fetchData}
        />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <Trash2 size={40} className="mx-auto text-red-600 mb-4" />
            <h3 className="text-lg font-bold">Delete Lead?</h3>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl"
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
