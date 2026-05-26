import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FileBarChart2,
  Search,
  Eye,
  Pencil,
  Trash2,
  Magnet,
  Droplets,
  Waves,
  Satellite,
  Ruler,
  ClipboardList,
  GitBranch,
  Plus,
  Loader2,
} from "lucide-react";
import {
  getMPTReports,
  deleteMPTReport,
  getPTReports,
  deletePTReport,
  getUTReports,
  deleteUTReport,
  getVSSCUTReports,
  deleteVSSCUTReport,
  getUTGReports,
  deleteUTGReport,
  getTPIIVRReports,
  deleteTPIIVRReport,
  getAWSDReports,
  deleteAWSDReport,
} from "../../../api/customerApi";
import { Pagination } from "../../../components/Pagination";

type ReportType = "mpt" | "pt" | "ut" | "vssc-ut" | "utg" | "tpi-ivr" | "awsd";

const REPORT_TYPES: {
  key: ReportType;
  label: string;
  fullLabel: string;
  icon: any;
  color: string;
  textColor: string;
  borderColor: string;
  bgNum: string;
  dotColor: string;
}[] = [
  {
    key: "mpt",
    label: "MPT",
    fullLabel: "Magnetic Particle Testing",
    icon: Magnet,
    color: "bg-rose-50",
    textColor: "text-rose-600",
    borderColor: "border-rose-200",
    bgNum: "bg-rose-100",
    dotColor: "bg-rose-600",
  },
  {
    key: "pt",
    label: "PT",
    fullLabel: "Liquid Penetrant Testing",
    icon: Droplets,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    bgNum: "bg-blue-100",
    dotColor: "bg-blue-600",
  },
  {
    key: "ut",
    label: "UT",
    fullLabel: "Ultrasonic Testing",
    icon: Waves,
    color: "bg-violet-50",
    textColor: "text-violet-600",
    borderColor: "border-violet-200",
    bgNum: "bg-violet-100",
    dotColor: "bg-violet-600",
  },
  {
    key: "vssc-ut",
    label: "VSSC-UT",
    fullLabel: "VSSC Ultrasonic Testing",
    icon: Satellite,
    color: "bg-amber-50",
    textColor: "text-amber-600",
    borderColor: "border-amber-200",
    bgNum: "bg-amber-100",
    dotColor: "bg-amber-600",
  },
  {
    key: "utg",
    label: "UTG",
    fullLabel: "UT Thickness Gauging",
    icon: Ruler,
    color: "bg-teal-50",
    textColor: "text-teal-600",
    borderColor: "border-teal-200",
    bgNum: "bg-teal-100",
    dotColor: "bg-teal-600",
  },
  {
    key: "tpi-ivr",
    label: "TPI IVR",
    fullLabel: "Inspection Visit Report",
    icon: ClipboardList,
    color: "bg-cyan-50",
    textColor: "text-cyan-600",
    borderColor: "border-cyan-200",
    bgNum: "bg-cyan-100",
    dotColor: "bg-cyan-600",
  },
  {
    key: "awsd",
    label: "AWS D1.1",
    fullLabel: "UT of Welds (AWS D1.1)",
    icon: GitBranch,
    color: "bg-orange-50",
    textColor: "text-orange-600",
    borderColor: "border-orange-200",
    bgNum: "bg-orange-100",
    dotColor: "bg-orange-600",
  },
];

const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fetchCount = async (type: ReportType) => {
  try {
    let res: any;
    switch (type) {
      case "mpt":
        res = await getMPTReports({ page: 1, limit: 1 });
        break;
      case "pt":
        res = await getPTReports({ page: 1, limit: 1 });
        break;
      case "ut":
        res = await getUTReports({ page: 1, limit: 1 });
        break;
      case "vssc-ut":
        res = await getVSSCUTReports({ page: 1, limit: 1 });
        break;
      case "utg":
        res = await getUTGReports({ page: 1, limit: 1 });
        break;
      case "tpi-ivr":
        res = await getTPIIVRReports({ page: 1, limit: 1 });
        break;
      case "awsd":
        res = await getAWSDReports({ page: 1, limit: 1 });
        break;
    }
    const items = res?.data || res?.reports || [];
    return res?.pagination?.total ?? (Array.isArray(items) ? items.length : 0);
  } catch {
    return 0;
  }
};

export const ReportsListPage = () => {
  const [activeTab, setActiveTab] = useState<ReportType>(
    () => (sessionStorage.getItem("reports_activeTab") as ReportType) || "mpt",
  );
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState<Record<ReportType, number>>({
    mpt: 0,
    pt: 0,
    ut: 0,
    "vssc-ut": 0,
    utg: 0,
    "tpi-ivr": 0,
    awsd: 0,
  });
  const [limit, setLimit] = useState(10);
  const navigate = useNavigate();

  // Fetch counts for all report types on mount
  useEffect(() => {
    const loadCounts = async () => {
      const entries = await Promise.all(
        REPORT_TYPES.map(
          async (rt) =>
            [rt.key, await fetchCount(rt.key)] as [ReportType, number],
        ),
      );
      setCounts(Object.fromEntries(entries) as Record<ReportType, number>);
    };
    loadCounts();
  }, []);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      let res: any;
      const params = { page, limit, search, status };

      switch (activeTab) {
        case "mpt":
          res = await getMPTReports(params);
          break;
        case "pt":
          res = await getPTReports(params);
          break;
        case "ut":
          res = await getUTReports(params);
          break;
        case "vssc-ut":
          res = await getVSSCUTReports(params);
          break;
        case "utg":
          res = await getUTGReports(params);
          break;
        case "tpi-ivr":
          res = await getTPIIVRReports(params);
          break;
        case "awsd":
          res = await getAWSDReports(params);
          break;
      }

      const items = res?.data || res?.reports || [];
      setReports(Array.isArray(items) ? items : []);
      setTotal(
        res?.pagination?.total || (Array.isArray(items) ? items.length : 0),
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, limit, search, status]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const totalPages = Math.ceil(total / limit);

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Delete this report? This action cannot be undone."))
      return;
    try {
      const deleteFns: Record<ReportType, (id: string) => Promise<any>> = {
        mpt: deleteMPTReport,
        pt: deletePTReport,
        ut: deleteUTReport,
        "vssc-ut": deleteVSSCUTReport,
        utg: deleteUTGReport,
        "tpi-ivr": deleteTPIIVRReport,
        awsd: deleteAWSDReport,
      };
      await deleteFns[activeTab](reportId);
      toast.success("Report deleted");
      fetchReports();
    } catch {
      toast.error("Failed to delete report");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  const activeInfo = REPORT_TYPES.find((r) => r.key === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Header section with glass effect */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-3xl border border-white/20 p-6 sm:p-8 shadow-xl shadow-gray-200/50">
        <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-primary-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -m-8 w-48 h-48 bg-violet-100/50 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-2xl ${activeInfo.color} ${activeInfo.textColor} shadow-lg shadow-current/10 bg-white`}
            >
              <FileBarChart2 size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Reports Records
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {total} total {activeInfo.label} reports found
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/admin/reports/${activeTab}/new`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300 whitespace-nowrap"
          >
            <Plus size={17} /> New {activeInfo.label}
          </button>
        </div>
      </div>

      {/* Report Type Cards with Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
        {REPORT_TYPES.map((rt) => {
          const Icon = rt.icon;
          const isActive = activeTab === rt.key;
          return (
            <button
              key={rt.key}
              onClick={() => {
                sessionStorage.setItem("reports_activeTab", rt.key);
                setActiveTab(rt.key);
                setPage(1);
                setStatus("");
              }}
              className={`group relative p-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-2 text-left ${
                isActive
                  ? `${rt.borderColor} bg-white shadow-xl shadow-gray-200/50 ring-4 ring-gray-950/5`
                  : "border-gray-100 bg-white/60 hover:border-gray-200 hover:bg-white"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl transition-all group-hover:scale-110 duration-300 ${rt.color} ${rt.textColor}`}
              >
                <Icon size={18} />
              </div>
              <div className="w-full">
                <p
                  className={`text-[10px] font-black uppercase tracking-widest leading-tight ${isActive ? rt.textColor : "text-gray-400"}`}
                >
                  {rt.label}
                </p>
                <p className="text-[9px] font-medium text-gray-400 mt-0.5 line-clamp-1 leading-tight">
                  {rt.fullLabel}
                </p>
                <p
                  className={`text-2xl font-extrabold mt-1 leading-none ${isActive ? "text-gray-900" : "text-gray-600"}`}
                >
                  {counts[rt.key]}
                </p>
              </div>
              {isActive && (
                <div
                  className={`absolute top-3 right-3 h-2 w-2 rounded-full ${rt.dotColor}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search reports by customer or report number..."
            className="input-field pl-9 w-full"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-40"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="final">Final</option>
        </select>
        {(search || status) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Main Table Area ── */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileBarChart2 size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No reports found</p>
            <p className="text-sm mt-1">Try adjusting your search or create a new {activeInfo.label} report.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Report No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Inspection Stage</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary-700">
                      <div className="flex items-center gap-2">
                        <FileBarChart2 size={14} className="text-primary-400" />
                        {r.reportNo || r.irNo || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.jobDetails?.customer || r.jobDetails?.client || r.client || r.customer || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {fmt(r.jobDetails?.reportDate || r.dtOfInspection || r.reportDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.jobDetails?.stageOfInspection || r.inspectionStage || r.stageOfInspection || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "final"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.status === "final" ? "Final" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/reports/${activeTab}/${r._id}/print`)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="View / Print"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/reports/${activeTab}/${r._id}/edit`, { state: { from: "reports-list" } })}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(r._id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
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
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
