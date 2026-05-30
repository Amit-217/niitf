import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FileText,
  Pencil,
  Eye,
  Trash2,
  Loader2,
  Receipt,
} from "lucide-react";
import { toast } from "react-toastify";
import { getAllInvoices, deleteInvoice } from "../../../api/invoiceApi";
import { Pagination } from "../../../components/Pagination";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Sent: "bg-blue-100 text-blue-700",
  Paid: "bg-green-100 text-green-700",
  Partial: "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-700",
};

const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtAmount = (n?: number) =>
  typeof n === "number"
    ? "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 })
    : "—";

export const InvoicesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getAllInvoices({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      const body: any = res;
      const data = body?.data?.data || body?.data || body || [];
      const pagination = body?.data?.pagination || body?.pagination;
      setInvoices(Array.isArray(data) ? data : []);
      if (pagination?.totalPages) setTotalPages(pagination.totalPages);
      if (pagination?.total) setTotal(pagination.total);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice(id);
      toast.success("Invoice deleted");
      setDeleteId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete invoice");
    }
  };

  const userStr = localStorage.getItem("user");
  const role = userStr ? JSON.parse(userStr)?.role : "EMPLOYEE";
  const basePath =
    role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin" : "/employee";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all invoices
          </p>
        </div>
        <button
          onClick={() => navigate(`${basePath}/invoices/new`)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by invoice no or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-field pl-9 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-full sm:w-44"
        >
          <option value="">All Statuses</option>
          {["Draft", "Sent", "Paid", "Partial", "Cancelled"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Receipt size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No invoices found</p>
            <p className="text-sm mt-1">
              Create your first invoice to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Invoice No
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Date
                  </th>
                  {/* <th className="px-4 py-3 text-left font-semibold text-gray-600">Due Date</th> */}
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Grand Total
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv: any) => (
                  <tr
                    key={inv._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-primary-700">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-primary-400" />
                        {inv.invoiceNo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {inv.customerId?.companyName ||
                        inv.customerId?.name ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmt(inv.date)}</td>
                    {/* <td className="px-4 py-3 text-gray-600">{fmt(inv.dueDate)}</td> */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {fmtAmount(inv.grandTotal || inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {inv.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`${basePath}/invoices/${inv._id}/print`)
                          }
                          title="View / Print"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`${basePath}/invoices/${inv._id}/edit`)
                          }
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(inv._id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Invoice
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
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
