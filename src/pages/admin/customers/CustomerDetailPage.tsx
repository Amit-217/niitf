import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getAllTrainingQuotations,
  getAllServiceQuotations,
  deleteTrainingQuotation,
  deleteServiceQuotation,
} from "../../../api/quotationApi";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  FileText,
  Receipt,
  FileBadge,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  User,
  Magnet,
  Droplets,
  Waves,
  Satellite,
  Ruler,
  ClipboardList,
  GitBranch,
} from "lucide-react";
import {
  getCustomerById,
  getInvoices,
  deleteInvoice,
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
  Customer,
  Quotation,
  Invoice,
} from "../../../api/customerApi";
import { Pagination } from "../../../components/Pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const statusColors: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Sent: "bg-blue-100 text-blue-700",
  Accepted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-600",
  Paid: "bg-emerald-100 text-emerald-700",
  Partial: "bg-amber-100 text-amber-700",
  Cancelled: "bg-red-100 text-red-600",
};

// ─── Main Component ───────────────────────────────────────────────────────────

type ActiveTab = "reports" | "quotations" | "invoices";
type ReportSubType =
  | "mpt"
  | "pt"
  | "ut"
  | "vssc-ut"
  | "utg"
  | "tpi-ivr"
  | "awsd";

const REPORT_TYPES: {
  key: ReportSubType;
  label: string;
  fullLabel: string;
  icon: React.ElementType;
  color: string;
  textColor: string;
}[] = [
  {
    key: "mpt",
    label: "MPT",
    fullLabel: "Magnetic Particle Testing",
    icon: Magnet,
    color: "bg-rose-50",
    textColor: "text-rose-600",
  },
  {
    key: "pt",
    label: "PT",
    fullLabel: "Liquid Penetrant Testing",
    icon: Droplets,
    color: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    key: "ut",
    label: "UT",
    fullLabel: "Ultrasonic Testing",
    icon: Waves,
    color: "bg-violet-50",
    textColor: "text-violet-600",
  },
  {
    key: "vssc-ut",
    label: "VSSC-UT",
    fullLabel: "VSSC Ultrasonic Testing",
    icon: Satellite,
    color: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    key: "utg",
    label: "UTG",
    fullLabel: "UT Thickness Gauging",
    icon: Ruler,
    color: "bg-teal-50",
    textColor: "text-teal-600",
  },
  {
    key: "tpi-ivr",
    label: "TPI IVR",
    fullLabel: "Inspection Visit Report",
    icon: ClipboardList,
    color: "bg-cyan-50",
    textColor: "text-cyan-600",
  },
  {
    key: "awsd",
    label: "AWS D1.1",
    fullLabel: "UT of Welds (AWS D1.1)",
    icon: GitBranch,
    color: "bg-orange-50",
    textColor: "text-orange-600",
  },
];

export const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    activeTab?: ActiveTab;
    reportSubType?: ReportSubType;
  } | null;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab | null>(
    locationState?.activeTab ?? null,
  );

  // Report sub-type selection
  const [reportSubType, setReportSubType] = useState<ReportSubType | null>(
    locationState?.reportSubType ?? null,
  );

  // ── Report counts (limit:1 fetch on mount only)
  const [mptTotal, setMptTotal] = useState(0);
  const [ptTotal, setPtTotal] = useState(0);
  const [utTotal, setUtTotal] = useState(0);
  const [vsscUtTotal, setVsscUtTotal] = useState(0);
  const [utgTotal, setUtgTotal] = useState(0);
  const [tpiIvrTotal, setTpiIvrTotal] = useState(0);
  const [awsdTotal, setAwsdTotal] = useState(0);

  // ── Quotation counts per type (limit:1 fetch on mount)
  const [trainQuotationsTotal, setTrainQuotationsTotal] = useState(0);
  const [servQuotationsTotal, setServQuotationsTotal] = useState(0);

  // ── Invoice count (limit:1 fetch on mount)
  const [invoicesTotal, setInvoicesTotal] = useState(0);

  // ── Lazy-loaded report data (populated when Reports tab + subtype selected)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportDataTotal, setReportDataTotal] = useState(0);
  const [reportDataLoading, setReportDataLoading] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const [reportLimit, setReportLimit] = useState(10);

  // ── Quotations (lazy-loaded when Quotations tab is active)
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationTypeFilter, setQuotationTypeFilter] = useState<string | null>(
    null,
  );
  const [quotationStatusFilter, setQuotationStatusFilter] = useState<
    string | null
  >(null);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [quotationPage, setQuotationPage] = useState(1);
  const [quotationLimit, setQuotationLimit] = useState(10);
  const [showQTypeMenu, setShowQTypeMenu] = useState(false);

  // ── Invoices (lazy-loaded when Invoices tab is active)
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesPageTotal, setInvoicesPageTotal] = useState(0);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceLimit, setInvoiceLimit] = useState(10);

  const [countsLoaded, setCountsLoaded] = useState(false);

  // ── Fetches ────────────────────────────────────────────────────────────────

  const fetchCustomer = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await getCustomerById(id);
      setCustomer(res?.data || res);
    } catch {
      toast.error("Customer not found");
      navigate("/admin/customers");
    }
  }, [id, navigate]);

  // Count-only fetch on mount — limit:1 per type, uses pagination.total for counts
  const fetchAllCounts = useCallback(async () => {
    if (!id) return;
    setCountsLoaded(false);
    const extractTotal = (res: any): number => {
      const items = res?.data || res?.reports || [];
      return (
        res?.pagination?.total ?? (Array.isArray(items) ? items.length : 0)
      );
    };
    const extractQuoTotal = (res: any): number => {
      const items = res?.data?.data || res?.data || [];
      return (
        res?.data?.pagination?.total ??
        (Array.isArray(items) ? items.length : 0)
      );
    };
    const results = await Promise.allSettled([
      getMPTReports({ customerId: id, page: 1, limit: 1 }),
      getPTReports({ customerId: id, page: 1, limit: 1 }),
      getUTReports({ customerId: id, page: 1, limit: 1 }),
      getVSSCUTReports({ customerId: id, page: 1, limit: 1 }),
      getUTGReports({ customerId: id, page: 1, limit: 1 }),
      getTPIIVRReports({ customerId: id, page: 1, limit: 1 }),
      getAWSDReports({ customerId: id, page: 1, limit: 1 }),
      getAllTrainingQuotations({ customerId: id, limit: 1 }),
      getAllServiceQuotations({ customerId: id, limit: 1 }),
      getInvoices({ customerId: id, limit: 1 }),
    ]);
    const v = (r: PromiseSettledResult<any>) =>
      r.status === "fulfilled" ? r.value : null;
    setMptTotal(extractTotal(v(results[0])));
    setPtTotal(extractTotal(v(results[1])));
    setUtTotal(extractTotal(v(results[2])));
    setVsscUtTotal(extractTotal(v(results[3])));
    setUtgTotal(extractTotal(v(results[4])));
    setTpiIvrTotal(extractTotal(v(results[5])));
    setAwsdTotal(extractTotal(v(results[6])));
    setTrainQuotationsTotal(extractQuoTotal(v(results[7])));
    setServQuotationsTotal(extractQuoTotal(v(results[8])));
    const invRes = v(results[9]);
    setInvoicesTotal(
      invRes?.pagination?.total ??
        (Array.isArray(invRes?.data || invRes?.invoices)
          ? (invRes?.data || invRes?.invoices).length
          : 0),
    );
    setCountsLoaded(true);
  }, [id]);

  // Fetch paginated report data for the active sub-type
  const fetchReportData = useCallback(async () => {
    if (!id || !reportSubType) return;
    setReportDataLoading(true);
    try {
      const fns: Record<ReportSubType, (p: any) => Promise<any>> = {
        mpt: getMPTReports,
        pt: getPTReports,
        ut: getUTReports,
        "vssc-ut": getVSSCUTReports,
        utg: getUTGReports,
        "tpi-ivr": getTPIIVRReports,
        awsd: getAWSDReports,
      };
      const res: any = await fns[reportSubType]({
        customerId: id,
        page: reportPage,
        limit: reportLimit,
      });
      const items = res?.data || res?.reports || [];
      setReportData(Array.isArray(items) ? items : []);
      setReportDataTotal(
        res?.pagination?.total ?? (Array.isArray(items) ? items.length : 0),
      );
    } catch {
      /* silent */
    } finally {
      setReportDataLoading(false);
    }
  }, [id, reportSubType, reportPage, reportLimit]);

  // Fetch all quotations to filter them client-side (to mix service and training)
  const fetchQuotations = useCallback(async () => {
    if (!id) return;
    setQuotationsLoading(true);
    try {
      const [serviceRes, trainingRes]: any[] = await Promise.all([
        getAllServiceQuotations({ customerId: id, page: 1, limit: 200 }),
        getAllTrainingQuotations({ customerId: id, page: 1, limit: 200 }),
      ]);
      const serviceItems = (
        serviceRes?.data?.data ||
        serviceRes?.data ||
        []
      ).map((q: any) => ({ ...q, _type: "service" }));
      const trainingItems = (
        trainingRes?.data?.data ||
        trainingRes?.data ||
        []
      ).map((q: any) => ({ ...q, _type: "training" }));
      const all = [...serviceItems, ...trainingItems].sort(
        (a: any, b: any) =>
          new Date(b.date || b.createdAt).getTime() -
          new Date(a.date || a.createdAt).getTime(),
      );
      setQuotations(all as Quotation[]);
    } catch {
      /* silent */
    } finally {
      setQuotationsLoading(false);
    }
  }, [id]);

  // Fetch paginated invoices
  const fetchInvoices = useCallback(async () => {
    if (!id) return;
    setInvoicesLoading(true);
    try {
      const res: any = await getInvoices({
        customerId: id,
        page: invoicePage,
        limit: invoiceLimit,
      });
      const items = res?.data || res?.invoices || [];
      setInvoices(Array.isArray(items) ? items : []);
      setInvoicesPageTotal(
        res?.pagination?.total ?? (Array.isArray(items) ? items.length : 0),
      );
    } catch {
      /* silent */
    } finally {
      setInvoicesLoading(false);
    }
  }, [id, invoicePage, invoiceLimit]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);
  useEffect(() => {
    fetchAllCounts();
  }, [fetchAllCounts]);

  // Reset report page when sub-type changes
  useEffect(() => {
    setReportPage(1);
    setReportData([]);
  }, [reportSubType]);
  // Reset quotation page when type filter changes
  useEffect(() => {
    setQuotationPage(1);
    setQuotations([]);
  }, [quotationTypeFilter]);

  // Lazy-fetch report data when Reports tab is active and a sub-type is selected
  useEffect(() => {
    if (activeTab === "reports" && reportSubType) fetchReportData();
  }, [activeTab, reportSubType, reportPage, fetchReportData]);

  // Lazy-fetch quotations when Quotations tab is active
  useEffect(() => {
    if (activeTab === "quotations") fetchQuotations();
  }, [activeTab, fetchQuotations]);

  // Lazy-fetch invoices when Invoices tab is active
  useEffect(() => {
    if (activeTab === "invoices") fetchInvoices();
  }, [activeTab, invoicePage, fetchInvoices]);

  // Keep history state in sync so browser back button restores the correct tab/inspection
  useEffect(() => {
    navigate(".", { replace: true, state: { activeTab, reportSubType } });
  }, [activeTab, reportSubType, navigate]);

  // ── Delete Actions ─────────────────────────────────────────────────────────

  const handleDelete = async (item: Quotation | Invoice) => {
    if (
      !window.confirm(
        `Delete this ${activeTab === "quotations" ? "quotation" : "invoice"}?`,
      )
    )
      return;
    try {
      if (activeTab === "quotations") {
        const qType = (item as any)._type || "service";
        if (qType === "training") await deleteTrainingQuotation(item._id);
        else await deleteServiceQuotation(item._id);
        fetchQuotations();
        fetchAllCounts();
      } else {
        await deleteInvoice(item._id);
        fetchInvoices();
        fetchAllCounts();
      }
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!reportSubType) return;
    if (!window.confirm("Delete this report? This action cannot be undone."))
      return;
    try {
      const deleteFns: Record<string, (id: string) => Promise<any>> = {
        mpt: deleteMPTReport,
        pt: deletePTReport,
        ut: deleteUTReport,
        "vssc-ut": deleteVSSCUTReport,
        utg: deleteUTGReport,
        "tpi-ivr": deleteTPIIVRReport,
        awsd: deleteAWSDReport,
      };
      await deleteFns[reportSubType](reportId);
      toast.success("Report deleted");
      fetchReportData();
      fetchAllCounts();
    } catch {
      toast.error("Failed to delete report");
    }
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading customer...
      </div>
    );
  }

  const reportsTotal =
    mptTotal +
    ptTotal +
    utTotal +
    vsscUtTotal +
    utgTotal +
    tpiIvrTotal +
    awsdTotal;

  const reportCountByType: Record<ReportSubType, number> = {
    mpt: mptTotal,
    pt: ptTotal,
    ut: utTotal,
    "vssc-ut": vsscUtTotal,
    utg: utgTotal,
    "tpi-ivr": tpiIvrTotal,
    awsd: awsdTotal,
  };

  const filteredQuotations = quotations.filter(
    (q) => !quotationStatusFilter || q.status === quotationStatusFilter,
  );
  const pagedQuotations = filteredQuotations.slice(
    (quotationPage - 1) * quotationLimit,
    quotationPage * quotationLimit,
  );

  const quotationsTotal = trainQuotationsTotal + servQuotationsTotal;

  const tabs = [
    {
      key: "reports" as ActiveTab,
      label: "Reports",
      icon: FileBadge,
      count: reportsTotal,
      color: "text-indigo-600 bg-indigo-50",
      activeColor: "border-indigo-600 text-indigo-700",
    },
    {
      key: "quotations" as ActiveTab,
      label: "Quotations",
      icon: FileText,
      count: quotationsTotal,
      color: "text-violet-600 bg-violet-50",
      activeColor: "border-violet-600 text-violet-700",
    },
    {
      key: "invoices" as ActiveTab,
      label: "Invoices",
      icon: Receipt,
      count: invoicesTotal,
      color: "text-emerald-600 bg-emerald-50",
      activeColor: "border-emerald-600 text-emerald-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Heading */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/customers")}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={22} className="text-primary-600" />
            {customer.companyName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Customer Profile</p>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-violet-50 rounded-lg mt-0.5">
              <Building2 size={14} className="text-violet-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Short Code
              </p>
              <p className="font-semibold text-gray-800 mt-0.5 font-mono">
                {customer.shortCode}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg mt-0.5">
              <User size={14} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Contact Person
              </p>
              <p className="font-semibold text-gray-800 mt-0.5">
                {customer.contactPerson}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg mt-0.5">
              <Phone size={14} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Mobile
              </p>
              <p className="font-semibold text-gray-800 mt-0.5">
                {customer.mobile}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-green-50 rounded-lg mt-0.5">
              <Mail size={14} className="text-green-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Email
              </p>
              <p className="font-semibold text-gray-800 mt-0.5">
                {customer.email || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                const newTab = activeTab === tab.key ? null : tab.key;
                setActiveTab(newTab);
                if (newTab !== "reports") setReportSubType(null);
                if (newTab !== "quotations") {
                  setQuotationStatusFilter(null);
                  setQuotationTypeFilter(null);
                }
              }}
              className={`relative flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left shadow-sm hover:shadow-md ${
                isActive
                  ? "border-violet-400 bg-violet-50/60 shadow-violet-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className={`p-2.5 rounded-xl mb-3 ${tab.color}`}>
                <Icon size={20} />
              </div>
              <p
                className={`text-xs font-black uppercase tracking-wider mb-1 ${isActive ? "text-violet-700" : "text-gray-500"}`}
              >
                {tab.label}
              </p>
              <p
                className={`text-3xl font-extrabold ${isActive ? "text-violet-900" : "text-gray-800"}`}
              >
                {countsLoaded ? tab.count : "-"}
              </p>
              {isActive && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-violet-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab !== null && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              {tabs.find((t) => t.key === activeTab)?.label}
            </h2>
            {activeTab === "invoices" && (
              <button
                onClick={() =>
                  navigate(`/admin/invoices/new`, { state: { customerId: id } })
                }
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:from-violet-700 hover:to-purple-700 transition-all shadow shadow-violet-200"
              >
                <Plus size={14} /> Add Invoice
              </button>
            )}
            {activeTab === "quotations" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQTypeMenu((v) => !v)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:from-violet-700 hover:to-purple-700 transition-all shadow shadow-violet-200"
                >
                  <Plus size={14} /> New Quotation
                </button>
                {showQTypeMenu && (
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
                    <button
                      className="block w-full px-4 py-2.5 text-left text-xs font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700"
                      onClick={() => {
                        setShowQTypeMenu(false);
                        navigate(`/admin/quotations/service/new`, {
                          state: { customerId: id },
                        });
                      }}
                    >
                      Service Quotation
                    </button>
                    <button
                      className="block w-full px-4 py-2.5 text-left text-xs font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 border-t border-gray-100"
                      onClick={() => {
                        setShowQTypeMenu(false);
                        navigate(`/admin/quotations/training/new`, {
                          state: { customerId: id },
                        });
                      }}
                    >
                      Training Quotation
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {activeTab === "reports" && (
            <div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 border-b border-gray-100">
                {REPORT_TYPES.map((rt) => {
                  const Icon = rt.icon;
                  const isSelected = reportSubType === rt.key;
                  return (
                    <button
                      key={rt.key}
                      onClick={() =>
                        setReportSubType(isSelected ? null : rt.key)
                      }
                      className={`relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left hover:shadow-md ${
                        isSelected
                          ? "border-indigo-400 bg-indigo-50/70 shadow-sm shadow-indigo-100"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className={`p-2 rounded-xl mb-2 ${rt.color}`}>
                        <Icon size={18} className={rt.textColor} />
                      </div>
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-indigo-700" : "text-gray-500"}`}
                      >
                        {rt.label}
                      </p>
                      <p
                        className={`text-2xl font-extrabold mt-0.5 ${isSelected ? "text-indigo-900" : "text-gray-800"}`}
                      >
                        {countsLoaded ? reportCountByType[rt.key] : "-"}
                      </p>
                      <p
                        className={`text-[9px] mt-1 leading-tight ${isSelected ? "text-indigo-500" : "text-gray-400"}`}
                      >
                        {rt.fullLabel}
                      </p>
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {reportSubType ? (
                <div className="mx-5 mb-5 mt-2 rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700">
                      {
                        REPORT_TYPES.find((r) => r.key === reportSubType)
                          ?.fullLabel
                      }{" "}
                      Reports
                      <span className="ml-2 text-gray-400 font-normal text-xs">
                        ({countsLoaded ? reportCountByType[reportSubType] : "-"}{" "}
                        records)
                      </span>
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/admin/reports/${reportSubType}/new`, {
                          state: {
                            customerId: id,
                            customerName: customer.companyName,
                          },
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-bold hover:from-indigo-700 hover:to-blue-700 transition-all shadow shadow-indigo-200"
                    >
                      <Plus size={13} /> Generate New Report
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {[
                            "Report No",
                            "Customer",
                            "Date",
                            ...(reportSubType !== "awsd"
                              ? ["Inspection Stage"]
                              : []),
                            "Status",
                            "Type",
                            "Actions",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left font-semibold text-gray-600"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportDataLoading ? (
                          <tr>
                            <td
                              colSpan={reportSubType === "awsd" ? 6 : 7}
                              className="px-4 py-10 text-center text-gray-400"
                            >
                              <Loader2
                                className="animate-spin inline mr-2"
                                size={16}
                              />{" "}
                              Loading...
                            </td>
                          </tr>
                        ) : reportData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={reportSubType === "awsd" ? 6 : 7}
                              className="px-4 py-10 text-center text-gray-400"
                            >
                              No{" "}
                              {
                                REPORT_TYPES.find(
                                  (r) => r.key === reportSubType,
                                )?.label
                              }{" "}
                              reports found.
                            </td>
                          </tr>
                        ) : (
                          reportData.map((r) => (
                            <tr
                              key={r._id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 font-medium text-primary-700">
                                <div className="flex items-center gap-2">
                                  <FileText
                                    size={14}
                                    className="text-primary-400"
                                  />
                                  {r.reportNo || r.irNo}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-700 truncate max-w-[150px]">
                                {r.jobDetails?.customer || r.customer || "—"}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {fmt(
                                  r.jobDetails?.reportDate ||
                                    r.dtOfInspection ||
                                    r.reportDate,
                                )}
                              </td>

                              {reportSubType !== "awsd" && (
                                <td className="px-4 py-3 text-gray-600">
                                  {r.jobDetails?.stageOfInspection ||
                                    r.inspectionStage ||
                                    "—"}
                                </td>
                              )}
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "final" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                                  {r.reportType || reportSubType?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-1 py-3 text-center">
                                <div className="flex items-center justify-start gap-2">
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/admin/reports/${reportSubType}/${r._id}/print`,
                                        {
                                          state: {
                                            customerId: id,
                                            reportSubType,
                                          },
                                        },
                                      )
                                    }
                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  >
                                    <Eye size={15} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/admin/reports/${reportSubType}/${r._id}/edit`,
                                        {
                                          state: {
                                            customerId: id,
                                            reportSubType,
                                            customerName: customer.companyName,
                                          },
                                        },
                                      )
                                    }
                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReport(r._id)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <Pagination
                      page={reportPage}
                      totalPages={Math.max(
                        1,
                        Math.ceil(reportDataTotal / reportLimit),
                      )}
                      total={reportDataTotal}
                      limit={reportLimit}
                      onPageChange={setReportPage}
                      onLimitChange={(l) => {
                        setReportLimit(l);
                        setReportPage(1);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="px-5 py-16 text-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ClipboardList size={28} className="opacity-20" />
                  </div>
                  <p className="font-medium text-gray-500">
                    Select a report type above
                  </p>
                  <p className="text-sm mt-1">
                    View specialized technical reports for this customer
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "quotations" && (
            <div className="mx-5 mb-5 mt-2 rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {[
                        "Quotation No",
                        "Date",
                        "Type",
                        "Subject",
                        "Amount",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotationsLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-gray-400"
                        >
                          <Loader2
                            className="animate-spin inline mr-2"
                            size={16}
                          />{" "}
                          Loading...
                        </td>
                      </tr>
                    ) : pagedQuotations.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-gray-400"
                        >
                          No quotations found.
                        </td>
                      </tr>
                    ) : (
                      pagedQuotations.map((q) => (
                        <tr
                          key={q._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-primary-700">
                            <div className="flex items-center gap-2">
                              <FileText
                                size={14}
                                className="text-primary-400"
                              />
                              {q.quotationNo}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {fmt(q.date)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${(q as any)._type === "training" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}
                            >
                              {(q as any)._type === "training"
                                ? "Training"
                                : "Service"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 truncate max-w-[200px]">
                            {q.subject || "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            ₹{(q.totalAmount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[q.status] || "bg-gray-100 text-gray-600"}`}
                            >
                              {q.status}
                            </span>
                          </td>
                          <td className="px-1 py-3 text-right">
                            <div className="flex items-center gap-2 justify-start">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/quotations/${((q as any)._type as string) || "service"}/${q._id}/print`,
                                    { state: { customerId: id } },
                                  )
                                }
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/quotations/${((q as any)._type as string) || "service"}/${q._id}/edit`,
                                  )
                                }
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(q)}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <Pagination
                  page={quotationPage}
                  totalPages={Math.max(
                    1,
                    Math.ceil(filteredQuotations.length / quotationLimit),
                  )}
                  total={filteredQuotations.length}
                  limit={quotationLimit}
                  onPageChange={setQuotationPage}
                  onLimitChange={(l) => {
                    setQuotationLimit(l);
                    setQuotationPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="mx-5 mb-5 mt-2 rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {[
                        "Invoice No",
                        "Date",
                        // "Due Date",
                        "Grand Total",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoicesLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-gray-400"
                        >
                          <Loader2
                            className="animate-spin inline mr-2"
                            size={16}
                          />{" "}
                          Loading...
                        </td>
                      </tr>
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-gray-400"
                        >
                          No invoices found.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr
                          key={inv._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-primary-700">
                            <div className="flex items-center gap-2">
                              <FileText
                                size={14}
                                className="text-primary-400"
                              />
                              {inv.invoiceNo}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {fmt(inv.date)}
                          </td>
                          {/* <td className="px-4 py-3 text-gray-500">
                            {fmt(inv.dueDate)}
                          </td> */}
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            ₹{(inv.totalAmount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || "bg-gray-100 text-gray-600"}`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-1 py-3 text-left">
                            <div className="flex items-center gap-2 justify-start">
                              <button
                                onClick={() =>
                                  navigate(`/admin/invoices/${inv._id}/print`)
                                }
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/admin/invoices/${inv._id}/edit`)
                                }
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(inv)}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <Pagination
                  page={invoicePage}
                  totalPages={Math.max(
                    1,
                    Math.ceil(invoicesPageTotal / invoiceLimit),
                  )}
                  total={invoicesPageTotal}
                  limit={invoiceLimit}
                  onPageChange={setInvoicePage}
                  onLimitChange={(l) => {
                    setInvoiceLimit(l);
                    setInvoicePage(1);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
