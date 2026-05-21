import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  User,
  MapPin,
  Building2,
  Link2,
  Save,
  Loader2,
} from "lucide-react";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  Student,
  StudentPayload,
} from "../../../api/admissionApi";
import { getEnquiries } from "../../../api/enquiryApi";
import { Pagination } from "../../../components/Pagination";

const INITIAL_FORM: StudentPayload = {
  fullName: "",
  mobile: "",
  email: "",
  dob: "",
  city: "",
  qualification: "",
  sponsorType: "Individual",
  companyName: "",
  enquiryId: "",
};

const inputClass =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";
const labelClass =
  "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

export const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentPayload>(INITIAL_FORM);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: any = await getStudents({ page, limit, search });
      // By default res is the unwrapped JSON body (via Axios interceptor).
      // Example successful body: { success: true, message: "...", data: { students: [...], pagination: {...} } }

      let items = [];
      let count = 0;

      if (Array.isArray(res)) {
        items = res;
        count = items.length;
      } else if (res?.data?.students) {
        // Shape: res.data = { students: [...], pagination: ... }
        items = res.data.students;
        count = res.data.pagination?.total || items.length;
      } else if (res?.data && Array.isArray(res.data)) {
        // Shape: res = { success: true, data: [...] }
        items = res.data;
        count = items.length;
      } else if (res?.students) {
        // Shape: res = { students: [...] }
        items = res.students;
        count = res.pagination?.total || items.length;
      }

      setStudents(items);
      setTotal(count);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load students");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    getEnquiries({ status: "New" })
      .then((res: any) => {
        setEnquiries(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  // Auto-open pre-filled form when arriving from an enquiry conversion
  useEffect(() => {
    const pending = sessionStorage.getItem("pendingStudent");
    if (!pending) return;
    try {
      const data = JSON.parse(pending);
      setEditTarget(null);
      setForm({
        ...INITIAL_FORM,
        fullName: data.fullName || "",
        mobile: data.mobile || "",
        email: data.email || "",
        city: data.city || "",
        enquiryId: data.enquiryId || "",
      });
      setDrawerOpen(true);
      if (data.fullName) {
        toast.info(`Converting enquiry for ${data.fullName}.`);
      }
    } catch {
      // ignore malformed payload
    } finally {
      sessionStorage.removeItem("pendingStudent");
    }
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(INITIAL_FORM);
    setDrawerOpen(true);
  };
  const openEdit = (s: Student) => {
    setEditTarget(s);
    setForm({
      fullName: s.fullName,
      mobile: s.mobile,
      email: s.email || "",
      // Use substring(0,10) to avoid UTC-to-local timezone shift that would display the wrong date
      dob: s.dob ? s.dob.substring(0, 10) : "",
      city: s.city || "",
      qualification: s.qualification || "",
      sponsorType: s.sponsorType,
      companyName: s.companyName || "",
      enquiryId: "",
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { toast.error("Full name is required"); return; }
    if (!form.mobile.trim()) { toast.error("Mobile number is required"); return; }
    if (!/^\d{10}$/.test(form.mobile.trim())) { toast.error("Mobile must be exactly 10 digits"); return; }
    
    if (form.dob) {
      const selectedDate = new Date(form.dob);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      if (selectedDate >= todayDate) {
        toast.error("Date of birth cannot be today or in the future.");
        return;
      }
    }

    if (form.sponsorType === "Company" && !form.companyName?.trim()) { toast.error("Company name is required"); return; }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.enquiryId) delete payload.enquiryId;
      if (editTarget) {
        await updateStudent(editTarget._id, payload);
        toast.success("Student updated successfully!");
      } else {
        await createStudent(payload);
        toast.success("Student enrolled successfully!");
      }
      setDrawerOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err?.message || err?.error || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Soft-delete this student?")) return;
    try {
      await deleteStudent(id);
      toast.success("Student deleted");
      fetchStudents();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-primary-600" /> Students
          </h1>
          <p className="hidden sm:block text-sm text-gray-500 mt-1">
            Manage all enrolled students — {total} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
        >
          <Plus size={17} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or mobile..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Student ID",
                  "Name",
                  "Login ID (Email)",
                  "Password (DOB)",
                  "Mobile",
                  "City",
                  "Sponsor",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-primary-700 font-bold">
                      {s.studentId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {s.fullName}
                    </td>
                    <td className="px-4 py-3 text-blue-600 font-mono text-xs font-semibold">
                      {s.email}
                    </td>
                    <td className="px-4 py-3 text-emerald-600 font-mono text-xs font-bold">
                      {s.dob ? s.dob.substring(0, 10) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.mobile}</td>
                    <td className="px-4 py-3 text-gray-500">{s.city || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.sponsorType === "Company" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {s.sponsorType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={Math.ceil(total / limit)}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </div>

      {/* Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editTarget
                      ? "Edit Student Profile"
                      : "New Enrollment Form"}
                  </h2>
                  <p className="text-violet-100 text-sm mt-0.5">
                    {editTarget
                      ? "Update academic and contact info."
                      : "Complete the registration for the upcoming batch."}
                  </p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col h-[75vh]">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Section 0: Link Enquiry */}
                {!editTarget && enquiries.length > 0 && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Link2 size={16} className="text-indigo-600" />
                      <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                        Fast-Track from Enquiry
                      </span>
                    </div>
                    <select
                      value={form.enquiryId}
                      onChange={(e) => {
                        const enq = enquiries.find(
                          (e2) => e2._id === e.target.value,
                        );
                        setForm((f) => ({
                          ...f,
                          enquiryId: e.target.value,
                          fullName: enq?.name || f.fullName,
                          mobile: enq?.mobile || f.mobile,
                          email: enq?.email || f.email,
                          city: enq?.city || f.city,
                        }));
                      }}
                      className={`${inputClass} !bg-white`}
                    >
                      <option value="">
                        -- Find Applicant to Auto-Fill --
                      </option>
                      {enquiries.map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.name} ({e.mobile})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Section 1: Identity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
                      <User size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                      Identity & Contact
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>Full Legal Name *</label>
                      <input
                        required
                        value={form.fullName}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, fullName: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="Full Name"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>Active Mobile *</label>
                      <input
                        required
                        type="tel"
                        inputMode="numeric"
                        value={form.mobile}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, mobile: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="Mobile Number"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>Date of Birth *</label>
                      <input
                        type="date"
                        required
                        max={new Date(Date.now() - 86400000).toISOString().split("T")[0]}
                        value={form.dob || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, dob: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>Professional Email</label>
                      <input
                        value={form.email || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="student@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Logistics */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                      <MapPin size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                      Background & Location
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className={labelClass}>City/Region</label>
                      <input
                        value={form.city || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, city: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="e.g. Mumbai"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className={labelClass}>Qualification</label>
                      <input
                        value={form.qualification || ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            qualification: e.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder="e.g. Graduate"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Sponsorship */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                      <Building2 size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                      Sponsorship Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={
                        form.sponsorType === "Company"
                          ? "col-span-1"
                          : "col-span-2"
                      }
                    >
                      <label className={labelClass}>Tuition Sponsor *</label>
                      <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                        {(["Individual", "Company"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setForm((f) => ({ ...f, sponsorType: s }))
                            }
                            className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${form.sponsorType === s ? "bg-white text-violet-600 shadow-sm" : "text-gray-400"}`}
                          >
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    {form.sponsorType === "Company" && (
                      <div className="col-span-1 animate-in fade-in slide-in-from-left-2 duration-200">
                        <label className={labelClass}>Company Name *</label>
                        <input
                          required
                          value={form.companyName || ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              companyName: e.target.value,
                            }))
                          }
                          className={inputClass}
                          placeholder="Registered Name"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-white transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-[2] py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-100 hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-70`}
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Save
                        size={18}
                        className="group-hover:scale-110 transition-transform"
                      />{" "}
                      {editTarget ? "Update Profile" : "Complete Enrollment"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
