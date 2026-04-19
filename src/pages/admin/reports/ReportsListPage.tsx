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
  Calendar,
  User,
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

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden">
        {/* Dynamic Filters Bar */}
        <div className="px-6 py-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
          <div className="relative flex-1 group">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={`Search reports by customer or report number...`}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-gray-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-3 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="">All Status</option>
              <option value="draft">Draft Only</option>
              <option value="final">Final Only</option>
            </select>

            {(search || status) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-100 transition-all whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white border-b border-gray-50">
                {[
                  "Report No",
                  "Customer",
                  "Date",
                  "Inspection Stage",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] ${
                      h === "Actions" ? "text-center" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2
                        className="animate-spin text-primary-600"
                        size={32}
                      />
                      <p className="text-sm font-bold text-gray-500 animate-pulse">
                        Fetching latest records...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto text-center">
                      <div className="p-5 bg-gray-50 rounded-full text-gray-400">
                        <Search size={32} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">
                          No matching reports
                        </h4>
                        <p className="hidden sm:block text-sm text-gray-500 mt-1">
                          Try adjusting your keywords or adding a new report for{" "}
                          {activeInfo.fullLabel}.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr
                    key={r._id}
                    className="group hover:bg-gray-50/80 transition-all duration-300"
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 tracking-tight group-hover:text-primary-700 transition-colors uppercase">
                          {r.reportNo || r.irNo}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                          {fmt(r.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <User size={14} />
                        </div>
                        <span className="font-bold text-gray-700">
                          {r.jobDetails?.customer ||
                            r.jobDetails?.client ||
                            r.client ||
                            r.customer ||
                            "Unspecified"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                        <Calendar size={14} className="text-gray-400" />
                        {fmt(
                          r.jobDetails?.reportDate ||
                            r.dtOfInspection ||
                            r.reportDate,
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                        {r.jobDetails?.stageOfInspection ||
                          r.inspectionStage ||
                          r.stageOfInspection ||
                          "Standard"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          r.status === "final"
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${r.status === "final" ? "bg-green-600" : "bg-amber-600"}`}
                        />
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/reports/${activeTab}/${r._id}/print`,
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/reports/${activeTab}/${r._id}/edit`,
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(r._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
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
    </div>
  );
};
