import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  User,
  Save,
  Loader2,
} from "lucide-react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  Customer,
  CustomerPayload,
} from "../../../api/customerApi";

const INITIAL_FORM: CustomerPayload = {
  companyName: "",
  shortCode: "",
  contactPerson: "",
  mobile: "",
  email: "",
  city: "",
  address: "",
  gstNo: "",
};

const inputClass =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";
const labelClass =
  "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerPayload>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const LIMIT = 10;

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await getCustomers({ page, limit: LIMIT, search });

      let items: Customer[] = [];
      let count = 0;

      if (Array.isArray(res)) {
        items = res;
        count = items.length;
      } else if (res?.data?.customers) {
        items = res.data.customers;
        count = res.data.pagination?.total || items.length;
      } else if (res?.data && Array.isArray(res.data)) {
        items = res.data;
        count = items.length;
      } else if (res?.customers) {
        items = res.customers;
        count = res.pagination?.total || items.length;
      }

      setCustomers(items);
      setTotal(count);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditTarget(c);
    setForm({
      companyName: c.companyName,
      shortCode: c.shortCode || "",
      contactPerson: c.contactPerson,
      mobile: c.mobile,
      email: c.email || "",
      city: c.city || "",
      address: c.address || "",
      gstNo: c.gstNo || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!form.shortCode.trim()) {
      toast.error("Short code is required");
      return;
    }
    if (!form.contactPerson.trim()) {
      toast.error("Contact person is required");
      return;
    }
    if (!form.mobile.trim()) {
      toast.error("Mobile number is required");
      return;
    }
    if (!/^\d{10}$/.test(form.mobile.trim())) {
      toast.error("Mobile must be exactly 10 digits");
      return;
    }
    if (!form.email?.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CustomerPayload = {
        companyName: form.companyName.trim(),
        shortCode: form.shortCode.trim().toUpperCase(),
        contactPerson: form.contactPerson.trim(),
        mobile: form.mobile.trim(),
        email: form.email?.trim() || null,
        city: form.city?.trim() || null,
        address: form.address?.trim() || null,
        gstNo: form.gstNo?.trim() || null,
      };

      if (editTarget) {
        await updateCustomer(editTarget._id, payload);
        toast.success("Customer updated successfully!");
      } else {
        await createCustomer(payload);
        toast.success("Customer added successfully!");
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err: unknown) {
      const e = err as { message?: string; error?: string };
      toast.error(e?.message || e?.error || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await deleteCustomer(id);
      toast.success("Customer deleted");
      fetchCustomers();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-primary-600" /> Customers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage company customers — {total} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
        >
          <Plus size={17} /> Add Customer
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
          placeholder="Search by company or contact person..."
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
                  "Company",
                  "Code",
                  "Contact Person",
                  "Mobile",
                  "Email",
                  "City",
                  "GST No.",
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
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/customers/${c._id}`)}
                        className="font-semibold text-violet-700 hover:text-violet-900 hover:underline text-left transition-colors"
                      >
                        {c.companyName}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200 uppercase">
                        {c.shortCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {c.contactPerson}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.mobile}</td>
                    <td className="px-4 py-3 text-blue-600 text-xs">
                      {c.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.city || "—"}</td>
                    <td className="px-4 py-3">
                      {c.gstNo ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {c.gstNo}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editTarget ? "Edit Customer" : "Add New Customer"}
                  </h2>
                  <p className="text-violet-100 text-sm mt-0.5">
                    {editTarget
                      ? "Update company and contact details."
                      : "Fill in the details to register a new customer."}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col max-h-[75vh]"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Section 1: Company Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
                      <Building2 size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                      Company Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelClass}>Company Name *</label>
                      <input
                        required
                        value={form.companyName}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            companyName: e.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder="e.g. Acme Industries Ltd."
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>Short Code *</label>
                      <input
                        required
                        value={form.shortCode}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            shortCode: e.target.value.toUpperCase(),
                          }))
                        }
                        className={inputClass}
                        placeholder="e.g. ACME"
                        maxLength={10}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>GST Number</label>
                      <input
                        value={form.gstNo || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, gstNo: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="e.g. 22ABCDE1234F1Z5"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>City</label>
                      <input
                        value={form.city || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, city: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="e.g. Mumbai"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Address</label>
                      <textarea
                        value={form.address || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, address: e.target.value }))
                        }
                        className={`${inputClass} resize-none`}
                        rows={2}
                        placeholder="Full address..."
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact Info */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                      <User size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                      Contact Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>Contact Person *</label>
                      <input
                        required
                        value={form.contactPerson}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            contactPerson: e.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder="Full Name"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>Mobile *</label>
                      <input
                        required
                        value={form.mobile}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, mobile: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="10-digit mobile"
                        maxLength={10}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Email *</label>
                      <input
                        type="email"
                        value={form.email || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-white transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-100 hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Save
                        size={18}
                        className="group-hover:scale-110 transition-transform"
                      />
                      {editTarget ? "Update Customer" : "Save Customer"}
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
