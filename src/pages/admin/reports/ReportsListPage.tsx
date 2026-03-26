import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    FileBarChart2,
    Search,
    Eye,
    Printer,
    Magnet,
    Droplets,
    Waves,
    Satellite,
    Plus,
    Loader2,
    Calendar,
    User,
    ChevronRight,
    Filter
} from "lucide-react";
import {
    getMPTReports,
    getPTReports,
    getUTReports,
    getVSSCUTReports,
} from "../../../api/customerApi";

type ReportType = "mpt" | "pt" | "ut" | "vssc-ut";

const REPORT_TYPES: { key: ReportType; label: string; fullLabel: string; icon: any; color: string; textColor: string; borderColor: string }[] = [
    { key: "mpt", label: "MPT", fullLabel: "Magnetic Particle Testing", icon: Magnet, color: "bg-rose-50", textColor: "text-rose-600", borderColor: "border-rose-100" },
    { key: "pt", label: "PT", fullLabel: "Liquid Penetrant Testing", icon: Droplets, color: "bg-blue-50", textColor: "text-blue-600", borderColor: "border-blue-100" },
    { key: "ut", label: "UT", fullLabel: "Ultrasonic Testing", icon: Waves, color: "bg-violet-50", textColor: "text-violet-600", borderColor: "border-violet-100" },
    { key: "vssc-ut", label: "VSSC-UT", fullLabel: "VSSC Ultrasonic Testing", icon: Satellite, color: "bg-amber-50", textColor: "text-amber-600", borderColor: "border-amber-100" },
];

const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const ReportsListPage = () => {
    const [activeTab, setActiveTab] = useState<ReportType>("mpt");
    const [reports, setReports] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<string>("");
    const [page, setPage] = useState(1);
    const navigate = useNavigate();

    const LIMIT = 10;

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            let res: any;
            const params = { page, limit: LIMIT, search, status };

            switch (activeTab) {
                case "mpt": res = await getMPTReports(params); break;
                case "pt": res = await getPTReports(params); break;
                case "ut": res = await getUTReports(params); break;
                case "vssc-ut": res = await getVSSCUTReports(params); break;
            }

            const items = res?.data || res?.reports || [];
            setReports(Array.isArray(items) ? items : []);
            setTotal(res?.pagination?.total || (Array.isArray(items) ? items.length : 0));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load reports");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, page, search, status]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const totalPages = Math.ceil(total / LIMIT);

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setPage(1);
    };

    const activeInfo = REPORT_TYPES.find(r => r.key === activeTab)!;

    return (
        <div className="space-y-6">
            {/* Header section with glass effect */}
            <div className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-3xl border border-white/20 p-6 sm:p-8 shadow-xl shadow-gray-200/50">
                <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-primary-100/50 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -m-8 w-48 h-48 bg-violet-100/50 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${activeInfo.color} ${activeInfo.textColor} shadow-lg shadow-current/10 bg-white`}>
                            <FileBarChart2 size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reports Records</h1>
                            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                {total} total {activeInfo.label} reports found
                            </p>
                        </div>
                    </div>
                    
                    <button
                    onClick={() => navigate(`/admin/reports/${activeTab}/new`)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-gray-900/20 active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={15} /> New {activeInfo.label}
                    </button>
                </div>
            </div>

            {/* Quick Stats / Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {REPORT_TYPES.map((rt) => {
                    const Icon = rt.icon;
                    const isActive = activeTab === rt.key;
                    return (
                        <button
                            key={rt.key}
                            onClick={() => { setActiveTab(rt.key); setPage(1); setStatus(""); }}
                            className={`group relative p-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-4 text-left ${
                                isActive 
                                ? `${rt.borderColor} bg-white shadow-xl shadow-gray-200/50 ring-4 ring-gray-950/5` 
                                : 'border-gray-100 bg-white/50 hover:border-gray-200 hover:bg-white'
                            }`}
                        >
                            <div className={`p-3 rounded-xl transition-all group-hover:scale-110 duration-300 ${rt.color} ${rt.textColor}`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <h3 className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {rt.label}
                                </h3>
                                <p className={`text-[10px] sm:text-xs font-medium mt-0.5 line-clamp-1 ${isActive ? rt.textColor : 'text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                                    {rt.fullLabel}
                                </p>
                            </div>
                            {isActive && (
                                <div className="absolute top-4 right-4 flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${rt.textColor} opacity-75`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${rt.textColor.replace('text', 'bg')}`}></span>
                                </div>
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
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder={`Search reports by customer or report number...`}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-gray-400 font-medium"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
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
                                {["Report No", "Customer", "Date", "Inspection Stage", "Status", "Actions"].map((h) => (
                                    <th key={h} className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-primary-600" size={32} />
                                            <p className="text-sm font-bold text-gray-500 animate-pulse">Fetching latest records...</p>
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
                                                <h4 className="text-lg font-bold text-gray-800">No matching reports</h4>
                                                <p className="text-sm text-gray-500 mt-1">Try adjusting your keywords or adding a new report for {activeInfo.fullLabel}.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reports.map((r) => (
                                    <tr key={r._id} className="group hover:bg-gray-50/80 transition-all duration-300">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 tracking-tight group-hover:text-primary-700 transition-colors uppercase">{r.reportNo}</span>
                                                <span className="text-[10px] font-bold text-gray-400 mt-0.5">{fmt(r.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <User size={14} />
                                                </div>
                                                <span className="font-bold text-gray-700">{r.jobDetails?.customer || r.customer || "Unspecified"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                <Calendar size={14} className="text-gray-400" />
                                                {fmt(r.jobDetails?.reportDate || r.reportDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                                                {r.jobDetails?.stageOfInspection || r.stageOfInspection || "Standard"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                r.status === "final" 
                                                ? "bg-green-50 text-green-700 border border-green-100" 
                                                : "bg-amber-50 text-amber-700 border border-amber-100"
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${r.status === "final" ? "bg-green-600" : "bg-amber-600"}`} />
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 scale-90 origin-left">
                                                <button
                                                    onClick={() => navigate(`/admin/reports/${activeTab}/${r._id}/print`)}
                                                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-white border-2 border-gray-100 rounded-xl hover:border-primary-400 hover:text-primary-700 transition-all shadow-sm active:scale-95"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                                <button
                                                    onClick={() => window.open(`/admin/reports/${activeTab}/${r._id}/print?autoprint=true`, '_blank')}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 bg-white border-2 border-gray-100 rounded-xl transition-all active:scale-95"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-5 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Page <span className="text-gray-900">{page}</span> of <span className="text-gray-900">{totalPages}</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-5 py-2.5 text-xs font-bold border-2 border-gray-100 rounded-2xl disabled:opacity-30 hover:bg-white hover:border-gray-200 transition-all active:scale-95"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-white border-2 border-gray-100 rounded-2xl disabled:opacity-30 hover:border-gray-200 transition-all active:scale-95"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
