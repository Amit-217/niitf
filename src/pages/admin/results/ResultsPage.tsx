import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  BarChart2,
  Search,
  Clock,
  Users,
  ClipboardList,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { getAssignedTests, AssignedTest } from "../../../api/assignedTestApi";
import { Pagination } from "../../../components/Pagination";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  Ongoing: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const getEffectiveStatus = (test: AssignedTest): AssignedTest["status"] => {
  if (test.status === "Cancelled") return "Cancelled";
  const now = Date.now();
  const start = new Date(test.scheduledAt).getTime();
  const durationMs = (test.duration || test.questionPaper?.duration || 60) * 60 * 1000;
  if (now < start) return "Upcoming";
  if (now < start + durationMs) return "Ongoing";
  return "Completed";
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

// ── Page ───────────────────────────────────────────────────────────────────────

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<AssignedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [tick, setTick] = useState(0);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res: any = await getAssignedTests({
        page,
        limit,
        search: search || undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
      });
      setTests(res?.data || []);
      setPagination(res?.pagination || null);
    } catch {
      toast.error("Failed to load tests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchTests(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <BarChart2 size={18} />
            </span>
            Test Results
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            View question-by-question answers for all assigned tests
          </p>
        </div>
        <button
          onClick={fetchTests}
          className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors self-start"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by paper title, batch or assign ID..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none appearance-none bg-white"
        >
          <option value="All">All Status</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Question Paper</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled At</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody key={tick} className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 size={28} className="animate-spin text-indigo-500 inline" />
                  </td>
                </tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                      <BarChart2 size={24} className="text-indigo-400" />
                    </div>
                    <p className="text-gray-600 font-semibold text-sm">No tests found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
                  </td>
                </tr>
              ) : (
                tests.map((test, idx) => {
                  const effectiveDuration = test.duration || test.questionPaper?.duration;
                  const effectiveStatus = getEffectiveStatus(test);
                  return (
                    <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs font-medium">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ClipboardList size={13} className="text-indigo-500" />
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">
                              {test.questionPaper?.title || "—"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {test.questionPaper?.paperId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                            <Users size={11} className="text-teal-500" />
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                              {test.batch?.batchName || "—"}
                            </p>
                            <p className="text-[10px] text-gray-400">{test.batch?.batchId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Clock size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{formatDateTime(test.scheduledAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {effectiveDuration ? `${effectiveDuration} min` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLES[effectiveStatus] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {effectiveStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/admin/results/${test._id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors mx-auto"
                        >
                          <BarChart2 size={13} />
                          View Results
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        )}
      </div>
    </div>
  );
};
