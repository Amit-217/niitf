import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  FileText,
  Pencil,
  Eye,
  Trash2,
  GraduationCap,
  Wrench,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getAllTrainingQuotations,
  getAllServiceQuotations,
  deleteTrainingQuotation,
  deleteServiceQuotation,
} from "../../../api/quotationApi";
import { getCustomers } from "../../../api/customerApi";
import { Pagination } from "../../../components/Pagination";

type QuoteType = "training" | "service" | null;

const QUOTE_TYPES: {
  key: QuoteType;
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
    key: "service",
    label: "Service",
    fullLabel: "Service Quotations",
    icon: Wrench,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-300",
    bgNum: "bg-blue-100",
    dotColor: "bg-blue-600",
  },
  {
    key: "training",
    label: "Training",
    fullLabel: "Training Quotations",
    icon: GraduationCap,
    color: "bg-primary-50",
    textColor: "text-primary-600",
    borderColor: "border-primary-300",
    bgNum: "bg-primary-100",
    dotColor: "bg-primary-600",
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

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allQuotations, setAllQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<QuoteType>(() => {
    const stateTab = (location.state as any)?.activeTab as QuoteType;
    if (stateTab === "training" || stateTab === "service") return stateTab;
    const saved = sessionStorage.getItem("quotations-active-tab") as QuoteType;
    if (saved === "training" || saved === "service") return saved;
    return "service";
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Persist activeTab so browser back/forward restores correct tab
  useEffect(() => {
    if (activeTab) sessionStorage.setItem("quotations-active-tab", activeTab);
  }, [activeTab]);

  // Sync activeTab when navigating back from form page
  useEffect(() => {
    const stateTab = (location.state as any)?.activeTab as QuoteType;
    if (stateTab === "training" || stateTab === "service") {
      setActiveTab(stateTab);
    }
  }, [location.state]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [trainRes, servRes, custRes] = await Promise.all([
        getAllTrainingQuotations({ limit: 1000 }),
        getAllServiceQuotations({ limit: 1000 }),
        getCustomers(),
      ]);

      const tData = (trainRes.data?.data || trainRes.data || []).map(
        (q: any) => ({ ...q, _type: "training" }),
      );
      const sData = (servRes.data?.data || servRes.data || []).map(
        (q: any) => ({ ...q, _type: "service" }),
      );

      const combined = [...tData, ...sData].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setAllQuotations(combined);
      setCustomers(custRes.data?.data || custRes.data || []);
    } catch {
      toast.error("Failed to fetch quotations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCustomerName = (customerId: any) => {
    if (!customerId) return "Unknown";
    // Backend populate() returns an object with companyName
    if (typeof customerId === "object" && customerId?.companyName) {
      return customerId.companyName;
    }
    // Fallback: plain string ID lookup in local customers list
    const cust = customers.find((c) => c._id === customerId);
    return cust?.companyName || "Unknown";
  };

  const handleDelete = async (id: string, type: string) => {
    if (!window.confirm("Are you sure you want to delete this quotation?"))
      return;
    try {
      if (type === "training") await deleteTrainingQuotation(id);
      else await deleteServiceQuotation(id);
      toast.success("Quotation deleted successfully");
      fetchData();
    } catch {
      toast.error("Failed to delete quotation");
    }
  };

  const counts = {
    training: allQuotations.filter((q) => q._type === "training").length,
    service: allQuotations.filter((q) => q._type === "service").length,
  };

  const filtered = allQuotations
    .filter((q) => activeTab === null || q._type === activeTab)
    .filter(
      (q) =>
        (q.quotationNo || "").toLowerCase().includes(search.toLowerCase()) ||
        getCustomerName(q.customerId)
          .toLowerCase()
          .includes(search.toLowerCase()),
    );

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const activeInfo =
    QUOTE_TYPES.find((t) => t.key === activeTab) ?? QUOTE_TYPES[0];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      {/* <div className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-3xl border border-white/20 p-6 sm:p-8 shadow-xl shadow-gray-200/50"> */}
      <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-violet-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -m-8 w-48 h-48 bg-primary-100/50 rounded-full blur-3xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-primary-600" /> Quotation Records
              </h1>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {total} total {activeTab ? activeInfo.label.toLowerCase() : ""}{" "}
                quotations found
              </p>
            </div>
          </div>
        </div>

        <button
          id="add-quote-btn"
          onClick={() =>
            navigate(`/admin/quotations/${activeTab ?? "training"}/new`, {
              state: { from: "quotations-list" },
            })
          }
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300 whitespace-nowrap"
        >
          <Plus size={17} /> New {activeTab ? `${activeInfo.label} ` : ""}
          Quote
        </button>
      </div>
      {/* </div> */}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {QUOTE_TYPES.map((qt) => {
          const Icon = qt.icon;
          const isActive = activeTab === qt.key;
          return (
            <button
              key={qt.key}
              onClick={() => {
                setActiveTab(
                  activeTab === qt.key
                    ? null
                    : (qt.key as "training" | "service"),
                );
                setPage(1);
              }}
              className={`group relative p-5 rounded-2xl border-2 transition-all flex flex-col items-start gap-3 text-left ${
                isActive
                  ? `${qt.borderColor} bg-white shadow-xl shadow-gray-200/50 ring-4 ring-gray-950/5`
                  : "border-gray-100 bg-white/60 hover:border-gray-200 hover:bg-white"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl transition-all group-hover:scale-110 duration-300 ${qt.color} ${qt.textColor}`}
              >
                <Icon size={20} />
              </div>

              <div className="w-full">
                <p
                  className={`text-[11px] font-black uppercase tracking-widest leading-tight ${
                    isActive ? qt.textColor : "text-gray-400"
                  }`}
                >
                  {qt.label}
                </p>
                <p className="text-[10px] font-medium text-gray-400 mt-0.5 leading-tight">
                  {qt.fullLabel}
                </p>
                <p
                  className={`text-3xl font-extrabold mt-2 leading-none ${
                    isActive ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {counts[qt.key as "training" | "service"]}
                </p>
              </div>

              {isActive && (
                <div
                  className={`absolute top-4 right-4 h-2.5 w-2.5 rounded-full ${qt.dotColor}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by quote number or customer..."
            className="input-field pl-9 w-full"
          />
        </div>
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
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
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No quotations found</p>
            <p className="text-sm mt-1">
              Try adjusting your search or create a new{" "}
              {activeInfo.label.toLowerCase()} quotation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Quote No.
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Amount (₹)
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((q) => {
                  const grandTotal = (() => {
                    const services = Array.isArray(q.services)
                      ? q.services
                      : [];
                    const subtotal = services.reduce((sum: number, s: any) => {
                      const amt = Number(s.amount);
                      if (!isNaN(amt) && amt > 0) return sum + amt;
                      return (
                        sum + Number(s.quantity || 1) * Number(s.price || 0)
                      );
                    }, 0);
                    const gst =
                      (subtotal * Number(q.gstPercentage ?? 18)) / 100;
                    return subtotal + gst;
                  })();

                  return (
                    <tr
                      key={q._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-primary-700">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-primary-400" />
                          {q.quotationNo || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {getCustomerName(q.customerId)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmt(q.date)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            q._type === "training"
                              ? "bg-primary-100 text-primary-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {q._type === "training" ? "Training" : "Service"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        ₹
                        {grandTotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/quotations/${q._type}/${q._id}/print`,
                              )
                            }
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="View / Print"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/quotations/${q._type}/${q._id}/edit`,
                                { state: { from: "quotations-list" } },
                              )
                            }
                            className="p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(q._id, q._type)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
    </div>
  );
};
