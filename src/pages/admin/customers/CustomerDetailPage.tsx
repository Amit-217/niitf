import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getAllTrainingQuotations, getAllServiceQuotations, deleteTrainingQuotation, deleteServiceQuotation } from "../../../api/quotationApi";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Receipt,
  FileBadge,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
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
  getQuotations,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  getInvoices,
  createInvoice,
  updateInvoice,
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
  QuotationPayload,
  Invoice,
  InvoicePayload,
  LineItem,
} from "../../../api/customerApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";
const labelClass =
  "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const statusColors: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Sent: "bg-blue-100 text-blue-700",
  Accepted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-600",
  Paid: "bg-emerald-100 text-emerald-700",
  Partial: "bg-amber-100 text-amber-700",
  Cancelled: "bg-red-100 text-red-600",
};

const EMPTY_ITEM: LineItem = { srNo: 1, description: "", quantity: 1, unit: "Nos", unitPrice: 0, amount: 0 };

// ─── Line Items Editor ────────────────────────────────────────────────────────

const LineItemsEditor = ({
  items,
  onChange,
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}) => {
  const update = (idx: number, field: keyof LineItem, value: string | number) => {
    const next = items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        updated.amount = Number(updated.quantity) * Number(updated.unitPrice);
      }
      return updated;
    });
    onChange(next);
  };

  const addRow = () =>
    onChange([...items, { ...EMPTY_ITEM, srNo: items.length + 1 }]);

  const removeRow = (idx: number) =>
    onChange(items.filter((_, i) => i !== idx).map((item, i) => ({ ...item, srNo: i + 1 })));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-2 py-2 text-left w-8">#</th>
              <th className="px-2 py-2 text-left">Description *</th>
              <th className="px-2 py-2 text-right w-16">Qty</th>
              <th className="px-2 py-2 text-left w-16">Unit</th>
              <th className="px-2 py-2 text-right w-24">Rate</th>
              <th className="px-2 py-2 text-right w-24">Amount</th>
              <th className="px-2 py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50">
                <td className="px-2 py-1.5 text-gray-400 text-center">{idx + 1}</td>
                <td className="px-2 py-1.5">
                  <input
                    required
                    value={item.description}
                    onChange={(e) => update(idx, "description", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                    placeholder="Item description"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => update(idx, "quantity", Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={item.unit}
                    onChange={(e) => update(idx, "unit", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => update(idx, "unitPrice", Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </td>
                <td className="px-2 py-1.5 text-right font-semibold text-gray-700">
                  ₹{item.amount.toFixed(2)}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-semibold px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
      >
        <Plus size={13} /> Add Row
      </button>
    </div>
  );
};

// ─── Totals Summary ───────────────────────────────────────────────────────────

const TotalsBlock = ({
  items,
  discount,
  taxPercent,
  onDiscountChange,
  onTaxChange,
}: {
  items: LineItem[];
  discount: number;
  taxPercent: number;
  onDiscountChange: (v: number) => void;
  onTaxChange: (v: number) => void;
}) => {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const taxAmt = ((subtotal - discount) * taxPercent) / 100;
  const total = subtotal - discount + taxAmt;

  return (
    <div className="ml-auto w-64 space-y-1.5 text-sm">
      <div className="flex justify-between text-gray-500">
        <span>Subtotal</span>
        <span className="font-medium text-gray-700">₹{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-gray-500">
        <span>Discount (₹)</span>
        <input
          type="number"
          min={0}
          value={discount}
          onChange={(e) => onDiscountChange(Number(e.target.value))}
          className="w-28 px-2 py-0.5 border border-gray-200 rounded-lg text-right text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
        />
      </div>
      <div className="flex items-center justify-between text-gray-500">
        <span>Tax (%)</span>
        <input
          type="number"
          min={0}
          max={100}
          value={taxPercent}
          onChange={(e) => onTaxChange(Number(e.target.value))}
          className="w-28 px-2 py-0.5 border border-gray-200 rounded-lg text-right text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
        />
      </div>
      {taxAmt > 0 && (
        <div className="flex justify-between text-gray-500">
          <span>Tax Amount</span>
          <span>₹{taxAmt.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-1.5">
        <span>Total</span>
        <span className="text-violet-700">₹{total.toFixed(2)}</span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

type ActiveTab = "reports" | "quotations" | "invoices";
type ReportSubType = "mpt" | "pt" | "ut" | "vssc-ut" | "utg" | "tpi-ivr" | "awsd";

const REPORT_TYPES: { key: ReportSubType; label: string; fullLabel: string; icon: React.ElementType; color: string; textColor: string }[] = [
  { key: "mpt", label: "MPT", fullLabel: "Magnetic Particle Testing", icon: Magnet, color: "bg-rose-50", textColor: "text-rose-600" },
  { key: "pt", label: "PT", fullLabel: "Liquid Penetrant Testing", icon: Droplets, color: "bg-blue-50", textColor: "text-blue-600" },
  { key: "ut", label: "UT", fullLabel: "Ultrasonic Testing", icon: Waves, color: "bg-violet-50", textColor: "text-violet-600" },
  { key: "vssc-ut", label: "VSSC-UT", fullLabel: "VSSC Ultrasonic Testing", icon: Satellite, color: "bg-amber-50", textColor: "text-amber-600" },
  { key: "utg", label: "UTG", fullLabel: "UT Thickness Gauging", icon: Ruler, color: "bg-teal-50", textColor: "text-teal-600" },
  { key: "tpi-ivr", label: "TPI IVR", fullLabel: "Inspection Visit Report", icon: ClipboardList, color: "bg-cyan-50", textColor: "text-cyan-600" },
  { key: "awsd", label: "AWS D1.1", fullLabel: "UT of Welds (AWS D1.1)", icon: GitBranch, color: "bg-orange-50", textColor: "text-orange-600" },
];

const QUOTATION_STATUSES = [
  { key: "Draft", color: "bg-gray-50", textColor: "text-gray-600" },
  { key: "Sent", color: "bg-blue-50", textColor: "text-blue-600" },
  { key: "Accepted", color: "bg-green-50", textColor: "text-green-700" },
  { key: "Rejected", color: "bg-red-50", textColor: "text-red-600" },
];

const QUOTATION_TYPES = [
  { key: "service", label: "Service", fullLabel: "Service Quotation", color: "bg-blue-50", textColor: "text-blue-600" },
  { key: "training", label: "Training", fullLabel: "Training Quotation", color: "bg-violet-50", textColor: "text-violet-600" },
];

const INIT_QUO_ITEMS: LineItem[] = [{ ...EMPTY_ITEM }];

export const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { activeTab?: ActiveTab; reportSubType?: ReportSubType } | null;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab | null>(locationState?.activeTab ?? null);

  // Report sub-type selection
  const [reportSubType, setReportSubType] = useState<ReportSubType | null>(locationState?.reportSubType ?? null);

  // Per-type report data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mptReports, setMptReports] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ptReports, setPtReports] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [utReports, setUtReports] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vsscUtReports, setVsscUtReports] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [utgReports, setUtgReports] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tpiIvrReports, setTpiIvrReports] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [awsdReports, setAwsdReports] = useState<any[]>([]);
  const [mptTotal, setMptTotal] = useState(0);
  const [ptTotal, setPtTotal] = useState(0);
  const [utTotal, setUtTotal] = useState(0);
  const [vsscUtTotal, setVsscUtTotal] = useState(0);
  const [utgTotal, setUtgTotal] = useState(0);
  const [tpiIvrTotal, setTpiIvrTotal] = useState(0);
  const [awsdTotal, setAwsdTotal] = useState(0);

  // Quotations
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationsTotal, setQuotationsTotal] = useState(0);
  const [quotationTypeFilter, setQuotationTypeFilter] = useState<string | null>(null);
  const [quotationStatusFilter, setQuotationStatusFilter] = useState<string | null>(null);

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesTotal, setInvoicesTotal] = useState(0);

  const [isModalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Quotation | Invoice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quotation form state
  const [quoForm, setQuoForm] = useState({
    subject: "",
    date: new Date().toISOString().split("T")[0],
    validTill: "",
    status: "Draft" as Quotation["status"],
    notes: "",
    items: INIT_QUO_ITEMS,
    discount: 0,
    taxPercent: 0,
  });

  // Invoice form state
  const [invForm, setInvForm] = useState({
    subject: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "Draft" as Invoice["status"],
    paymentMode: "" as Invoice["paymentMode"] | "",
    paidAmount: 0,
    notes: "",
    items: INIT_QUO_ITEMS,
    discount: 0,
    taxPercent: 0,
  });

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractReports = (res: any) => {
    const items = res?.data || res?.reports || [];
    return { items: Array.isArray(items) ? items : [], total: res?.pagination?.total || (Array.isArray(items) ? items.length : 0) };
  };

  const fetchMPTReports = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await getMPTReports({ customerId: id, limit: 100 });
      const { items, total } = extractReports(res);
      setMptReports(items); setMptTotal(total);
    } catch { /* silent */ }
  }, [id]);

  const fetchPTReports = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await getPTReports({ customerId: id, limit: 100 });
      const { items, total } = extractReports(res);
      setPtReports(items); setPtTotal(total);
    } catch { /* silent */ }
  }, [id]);

  const fetchUTReports = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await getUTReports({ customerId: id, limit: 100 });
      const { items, total } = extractReports(res);
      setUtReports(items); setUtTotal(total);
    } catch { /* silent */ }
  }, [id]);

  const fetchVSSCUTReports = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await getVSSCUTReports({ customerId: id, limit: 100 });
      const { items, total } = extractReports(res);
      setVsscUtReports(items); setVsscUtTotal(total);
    } catch { /* silent */ }
  }, [id]);

  const fetchUTGReports = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await getUTGReports({ customerId: id, limit: 100 });
      const { items, total } = extractReports(res);
      setUtgReports(items); setUtgTotal(total);
    } catch { /* silent */ }
  }, [id]);

  const fetchTPIIVRReports = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await getTPIIVRReports({ customerId: id, limit: 100 });
      const { items, total } = extractReports(res);
      setTpiIvrReports(items); setTpiIvrTotal(total);
    } catch { /* silent */ }
  }, [id]);

  const fetchAWSDReports = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await getAWSDReports({ customerId: id, limit: 100 });
      const { items, total } = extractReports(res);
      setAwsdReports(items); setAwsdTotal(total);
    } catch { /* silent */ }
  }, [id]);

  const fetchQuotations = useCallback(async () => {
    if (!id) return;
    try {
      const [trainRes, servRes] = await Promise.all([
        getAllTrainingQuotations({ customerId: id, limit: 1000 }),
        getAllServiceQuotations({ customerId: id, limit: 1000 }),
      ]);
      const tData = (trainRes.data?.data || trainRes.data || []).map((q: any) => ({ ...q, _type: "training" }));
      const sData = (servRes.data?.data || servRes.data || []).map((q: any) => ({ ...q, _type: "service" }));
      const combined = [...tData, ...sData].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setQuotations(combined as Quotation[]);
      setQuotationsTotal(combined.length);
    } catch { /* silent */ }
  }, [id]);

  const fetchInvoices = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await getInvoices({ customerId: id, limit: 50 });
      const items = res?.data || res?.invoices || [];
      setInvoices(Array.isArray(items) ? items : []);
      setInvoicesTotal(res?.pagination?.total || items.length);
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);
  useEffect(() => {
    fetchMPTReports(); fetchPTReports(); fetchUTReports(); fetchVSSCUTReports();
    fetchUTGReports(); fetchTPIIVRReports(); fetchAWSDReports();
    fetchQuotations(); fetchInvoices();
  }, [fetchMPTReports, fetchPTReports, fetchUTReports, fetchVSSCUTReports, fetchUTGReports, fetchTPIIVRReports, fetchAWSDReports, fetchQuotations, fetchInvoices]);

  // Keep history state in sync so browser back button restores the correct tab/inspection
  useEffect(() => {
    navigate('.', { replace: true, state: { activeTab, reportSubType } });
  }, [activeTab, reportSubType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditTarget(null);
    if (activeTab === "quotations") {
      setQuoForm({ subject: "", date: new Date().toISOString().split("T")[0], validTill: "", status: "Draft", notes: "", items: [{ ...EMPTY_ITEM }], discount: 0, taxPercent: 0 });
    } else if (activeTab === "invoices") {
      setInvForm({ subject: "", date: new Date().toISOString().split("T")[0], dueDate: "", status: "Draft", paymentMode: "", paidAmount: 0, notes: "", items: [{ ...EMPTY_ITEM }], discount: 0, taxPercent: 0 });
    }
    setModalOpen(true);
  };

  const openEditModal = (item: Quotation | Invoice) => {
    setEditTarget(item);
    if (activeTab === "quotations") {
      const q = item as Quotation;
      setQuoForm({
        subject: q.subject || "",
        date: q.date ? q.date.split("T")[0] : new Date().toISOString().split("T")[0],
        validTill: q.validTill ? q.validTill.split("T")[0] : "",
        status: q.status,
        notes: q.notes || "",
        items: q.items.length ? q.items : [{ ...EMPTY_ITEM }],
        discount: q.discount || 0,
        taxPercent: q.taxPercent || 0,
      });
    } else if (activeTab === "invoices") {
      const inv = item as Invoice;
      setInvForm({
        subject: inv.subject || "",
        date: inv.date ? inv.date.split("T")[0] : new Date().toISOString().split("T")[0],
        dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : "",
        status: inv.status,
        paymentMode: (inv.paymentMode as Invoice["paymentMode"]) || "",
        paidAmount: inv.paidAmount || 0,
        notes: inv.notes || "",
        items: inv.items.length ? inv.items : [{ ...EMPTY_ITEM }],
        discount: inv.discount || 0,
        taxPercent: inv.taxPercent || 0,
      });
    }
    setModalOpen(true);
  };

  // ── Compute totals ─────────────────────────────────────────────────────────

  const computeTotals = (items: LineItem[], discount: number, taxPercent: number) => {
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const taxAmount = ((subtotal - discount) * taxPercent) / 100;
    const totalAmount = subtotal - discount + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      if (activeTab === "quotations") {
        const { subtotal, taxAmount, totalAmount } = computeTotals(quoForm.items, quoForm.discount, quoForm.taxPercent);
        const payload: QuotationPayload = {
          customerId: id,
          subject: quoForm.subject || null,
          date: quoForm.date,
          validTill: quoForm.validTill || null,
          status: quoForm.status,
          notes: quoForm.notes || null,
          items: quoForm.items,
          subtotal,
          discount: quoForm.discount,
          taxPercent: quoForm.taxPercent,
          taxAmount,
          totalAmount,
        };
        if (editTarget) {
          await updateQuotation(editTarget._id, payload);
          toast.success("Quotation updated");
        } else {
          await createQuotation(payload);
          toast.success("Quotation created");
        }
        fetchQuotations();
      } else if (activeTab === "invoices") {
        const { subtotal, taxAmount, totalAmount } = computeTotals(invForm.items, invForm.discount, invForm.taxPercent);
        const payload: InvoicePayload = {
          customerId: id,
          subject: invForm.subject || null,
          date: invForm.date,
          dueDate: invForm.dueDate || null,
          status: invForm.status,
          paymentMode: invForm.paymentMode as any,
          paidAmount: invForm.paidAmount,
          notes: invForm.notes || null,
          items: invForm.items,
          subtotal,
          discount: invForm.discount,
          taxPercent: invForm.taxPercent,
          taxAmount,
          totalAmount,
        };
        if (editTarget) {
          await updateInvoice(editTarget._id, payload);
          toast.success("Invoice updated");
        } else {
          await createInvoice(payload);
          toast.success("Invoice created");
        }
        fetchInvoices();
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (item: Quotation | Invoice) => {
    if (!window.confirm(`Delete this ${activeTab === "quotations" ? "quotation" : "invoice"}?`)) return;
    try {
      if (activeTab === "quotations") {
        const qType = (item as any)._type || "service";
        if (qType === "training") await deleteTrainingQuotation(item._id);
        else await deleteServiceQuotation(item._id);
        fetchQuotations();
      } else {
        await deleteInvoice(item._id);
        fetchInvoices();
      }
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!reportSubType) return;
    if (!window.confirm("Delete this report? This action cannot be undone.")) return;
    try {
      const deleteFns: Record<string, (id: string) => Promise<any>> = {
        mpt: deleteMPTReport, pt: deletePTReport, ut: deleteUTReport,
        "vssc-ut": deleteVSSCUTReport, utg: deleteUTGReport,
        "tpi-ivr": deleteTPIIVRReport, awsd: deleteAWSDReport,
      };
      await deleteFns[reportSubType](reportId);
      toast.success("Report deleted");
      const refreshFns: Record<string, () => void> = {
        mpt: fetchMPTReports, pt: fetchPTReports, ut: fetchUTReports,
        "vssc-ut": fetchVSSCUTReports, utg: fetchUTGReports,
        "tpi-ivr": fetchTPIIVRReports, awsd: fetchAWSDReports,
      };
      refreshFns[reportSubType]?.();
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

  const reportsTotal = mptTotal + ptTotal + utTotal + vsscUtTotal + utgTotal + tpiIvrTotal + awsdTotal;

  const reportCountByType: Record<ReportSubType, number> = {
    mpt: mptTotal, pt: ptTotal, ut: utTotal, "vssc-ut": vsscUtTotal,
    utg: utgTotal, "tpi-ivr": tpiIvrTotal, awsd: awsdTotal,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reportListByType: Record<ReportSubType, any[]> = {
    mpt: mptReports, pt: ptReports, ut: utReports, "vssc-ut": vsscUtReports,
    utg: utgReports, "tpi-ivr": tpiIvrReports, awsd: awsdReports,
  };

  const filteredQuotations = quotations
    .filter(q => !quotationTypeFilter || (q as any)._type === quotationTypeFilter)
    .filter(q => !quotationStatusFilter || q.status === quotationStatusFilter);

  const tabs = [
    { key: "reports" as ActiveTab, label: "Reports", icon: FileBadge, count: reportsTotal, color: "text-indigo-600 bg-indigo-50", activeColor: "border-indigo-600 text-indigo-700" },
    { key: "quotations" as ActiveTab, label: "Quotations", icon: FileText, count: quotationsTotal, color: "text-violet-600 bg-violet-50", activeColor: "border-violet-600 text-violet-700" },
    { key: "invoices" as ActiveTab, label: "Invoices", icon: Receipt, count: invoicesTotal, color: "text-emerald-600 bg-emerald-50", activeColor: "border-emerald-600 text-emerald-700" },
  ];

  const modalTitle = activeTab === "quotations"
    ? (editTarget ? "Edit Quotation" : "New Quotation")
    : (editTarget ? "Edit Invoice" : "New Invoice");

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
            <div className="p-1.5 bg-violet-50 rounded-lg mt-0.5"><Building2 size={14} className="text-violet-500" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Short Code</p>
              <p className="font-semibold text-gray-800 mt-0.5 font-mono">{customer.shortCode}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg mt-0.5"><User size={14} className="text-indigo-500" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Contact Person</p>
              <p className="font-semibold text-gray-800 mt-0.5">{customer.contactPerson}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg mt-0.5"><Phone size={14} className="text-blue-500" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Mobile</p>
              <p className="font-semibold text-gray-800 mt-0.5">{customer.mobile}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-green-50 rounded-lg mt-0.5"><Mail size={14} className="text-green-500" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Email</p>
              <p className="font-semibold text-gray-800 mt-0.5">{customer.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-amber-50 rounded-lg mt-0.5"><MapPin size={14} className="text-amber-500" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">City / GST</p>
              <p className="font-semibold text-gray-800 mt-0.5">{customer.city || "—"} {customer.gstNo ? `· ${customer.gstNo}` : ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Cards */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { const newTab = activeTab === tab.key ? null : tab.key; setActiveTab(newTab); if (newTab !== "reports") setReportSubType(null); if (newTab !== "quotations") { setQuotationStatusFilter(null); setQuotationTypeFilter(null); } }}
              className={`relative flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left shadow-sm hover:shadow-md ${
                isActive
                  ? "border-violet-400 bg-violet-50/60 shadow-violet-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className={`p-2.5 rounded-xl mb-3 ${tab.color}`}>
                <Icon size={20} />
              </div>
              <p className={`text-xs font-black uppercase tracking-wider mb-1 ${isActive ? "text-violet-700" : "text-gray-500"}`}>
                {tab.label}
              </p>
              <p className={`text-3xl font-extrabold ${isActive ? "text-violet-900" : "text-gray-800"}`}>
                {tab.count}
              </p>
              {isActive && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-violet-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab !== null && <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            {tabs.find((t) => t.key === activeTab)?.label}
          </h2>
          {activeTab !== "reports" && activeTab !== "quotations" && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:from-violet-700 hover:to-purple-700 transition-all shadow shadow-violet-200"
            >
              <Plus size={14} /> Add Invoice
            </button>
          )}
        </div>

        {/* Reports Tab — 4 sub-type cards + list */}
        {activeTab === "reports" && (
          <div>
            {/* 4 sub-type selector cards */}
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 border-b border-gray-100">
              {REPORT_TYPES.map((rt) => {
                const Icon = rt.icon;
                const isSelected = reportSubType === rt.key;
                return (
                  <button
                    key={rt.key}
                    onClick={() => setReportSubType(isSelected ? null : rt.key)}
                    className={`relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left hover:shadow-md ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-50/70 shadow-sm shadow-indigo-100"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className={`p-2 rounded-xl mb-2 ${rt.color}`}>
                      <Icon size={18} className={rt.textColor} />
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-indigo-700" : "text-gray-500"}`}>
                      {rt.label}
                    </p>
                    <p className={`text-2xl font-extrabold mt-0.5 ${isSelected ? "text-indigo-900" : "text-gray-800"}`}>
                      {reportCountByType[rt.key]}
                    </p>
                    <p className={`text-[9px] mt-1 leading-tight ${isSelected ? "text-indigo-500" : "text-gray-400"}`}>
                      {rt.fullLabel}
                    </p>
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Report list when a sub-type is selected */}
            {reportSubType ? (
              <div>
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {REPORT_TYPES.find((r) => r.key === reportSubType)?.fullLabel} Reports
                    <span className="ml-2 text-gray-400 font-normal normal-case">({reportCountByType[reportSubType]} records)</span>
                  </p>
                  <button
                    onClick={() =>
                      navigate(`/admin/reports/${reportSubType}/new`, {
                        state: { customerId: id, customerName: customer.companyName },
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-bold hover:from-indigo-700 hover:to-blue-700 transition-all shadow shadow-indigo-200"
                  >
                    <Plus size={13} /> Generate New Report
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Report No", "Date", "Client", "Stage of Inspection", "Status", "Type", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reportListByType[reportSubType].length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                            No {REPORT_TYPES.find((r) => r.key === reportSubType)?.label} reports for this customer yet
                          </td>
                        </tr>
                      ) : reportListByType[reportSubType].map((r) => (
                        <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-700">{r.reportNo || r.irNo}</td>
                          <td className="px-4 py-3 text-gray-600">{fmt(r.jobDetails?.reportDate || r.dtOfInspection || r.reportDate)}</td>
                          <td className="px-4 py-3 text-gray-700">{r.jobDetails?.client || r.client || r.customer || "—"}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{r.jobDetails?.stageOfInspection || r.inspectionStage || r.stageOfInspection || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "final" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                              {r.reportType || reportSubType?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => navigate(`/admin/reports/${reportSubType}/${r._id}/print`, { state: { customerId: id, reportSubType } })}
                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="View Report"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => navigate(`/admin/reports/${reportSubType}/${r._id}/edit`, { state: { customerId: id, reportSubType, customerName: customer?.companyName } })}
                                className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                title="Edit Report"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteReport(r._id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Report"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                Select a report type above to view its records
              </div>
            )}
          </div>
        )}

        {/* Quotations Tab */}
        {activeTab === "quotations" && (
          <div>
            {/* Type cards (Service / Training) */}
            <div className="p-5 grid grid-cols-2 gap-3 border-b border-gray-100">
              {QUOTATION_TYPES.map((qt) => {
                const count = quotations.filter(q => (q as any)._type === qt.key).length;
                const isSelected = quotationTypeFilter === qt.key;
                return (
                  <button
                    key={qt.key}
                    onClick={() => { setQuotationTypeFilter(isSelected ? null : qt.key); setQuotationStatusFilter(null); }}
                    className={`relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left hover:shadow-md ${
                      isSelected
                        ? "border-violet-400 bg-violet-50/70 shadow-sm shadow-violet-100"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className={`p-2 rounded-xl mb-2 ${qt.color}`}>
                      <FileText size={18} className={qt.textColor} />
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-violet-700" : "text-gray-500"}`}>
                      {qt.fullLabel}
                    </p>
                    <p className={`text-2xl font-extrabold mt-0.5 ${isSelected ? "text-violet-900" : "text-gray-800"}`}>
                      {count}
                    </p>
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-violet-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Add button + table — only shown when a type card is clicked */}
            {quotationTypeFilter ? (
              <div>
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {QUOTATION_TYPES.find(t => t.key === quotationTypeFilter)?.fullLabel}s
                    <span className="ml-2 text-gray-400 font-normal normal-case">
                      ({quotations.filter(q => (q as any)._type === quotationTypeFilter).length} records)
                    </span>
                  </p>
                  <button
                    onClick={() => navigate(`/admin/quotations/${quotationTypeFilter}/new`, { state: { customerId: id } })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:from-violet-700 hover:to-purple-700 transition-all shadow shadow-violet-200"
                  >
                    <Plus size={13} /> New {QUOTATION_TYPES.find(t => t.key === quotationTypeFilter)?.label} Quotation
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Quotation No", "Date", "Type", "Customer", "Subject", "Amount", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredQuotations.length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                          {`No ${quotationTypeFilter} quotations${quotationStatusFilter ? ` with status "${quotationStatusFilter}"` : ""}`}
                        </td></tr>
                      ) : filteredQuotations.map((q) => (
                        <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-violet-700">{q.quotationNo}</td>
                          <td className="px-4 py-3 text-gray-600">{fmt(q.date)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${(q as any)._type === "training" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                              {(q as any)._type === "training" ? "Training" : "Service"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-medium text-xs">
                            {typeof q.customerId === 'object' && (q.customerId as any)?.companyName
                              ? (q.customerId as any).companyName
                              : customer?.companyName || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">{q.subject || "—"}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">₹{(q.totalAmount || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[q.status] || "bg-gray-100 text-gray-600"}`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => navigate(`/admin/quotations/${(q as any)._type || 'service'}/${q._id}/print`, { state: { customerId: id } })} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="View"><Eye size={13} /></button>
                              <button onClick={() => navigate(`/admin/quotations/${(q as any)._type || 'service'}/${q._id}/edit`)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit"><Pencil size={13} /></button>
                              <button onClick={() => handleDelete(q)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                Select a quotation type above to view its records
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Invoice No", "Date", "Due Date", "Subject", "Total", "Paid", "Balance", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No invoices yet</td></tr>
                ) : invoices.map((inv) => {
                  const balance = inv.totalAmount - inv.paidAmount;
                  return (
                    <tr key={inv._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-700">{inv.invoiceNo}</td>
                      <td className="px-4 py-3 text-gray-600">{fmt(inv.date)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(inv.dueDate)}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[120px] truncate">{inv.subject || "—"}</td>
                      <td className="px-4 py-3 font-semibold">₹{inv.totalAmount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-emerald-600">₹{inv.paidAmount.toLocaleString("en-IN")}</td>
                      <td className={`px-4 py-3 font-semibold ${balance > 0 ? "text-red-500" : "text-gray-400"}`}>
                        ₹{balance.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || "bg-gray-100 text-gray-600"}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(inv)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(inv)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {/* Add/Edit Modal */}
      {isModalOpen && activeTab !== "reports" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{modalTitle}</h2>
                <p className="text-violet-100 text-sm mt-0.5">{customer.companyName}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col" style={{ maxHeight: "80vh" }}>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Quotation Form */}
                {activeTab === "quotations" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className={labelClass}>Subject</label>
                        <input value={quoForm.subject} onChange={(e) => setQuoForm((f) => ({ ...f, subject: e.target.value }))} className={inputClass} placeholder="e.g. NDT Services for XYZ Project" />
                      </div>
                      <div>
                        <label className={labelClass}>Date *</label>
                        <input type="date" required value={quoForm.date} onChange={(e) => setQuoForm((f) => ({ ...f, date: e.target.value }))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Valid Till</label>
                        <input type="date" value={quoForm.validTill} onChange={(e) => setQuoForm((f) => ({ ...f, validTill: e.target.value }))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Status</label>
                        <select value={quoForm.status} onChange={(e) => setQuoForm((f) => ({ ...f, status: e.target.value as Quotation["status"] }))} className={inputClass}>
                          {["Draft", "Sent", "Accepted", "Rejected"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Line Items *</label>
                      <LineItemsEditor items={quoForm.items} onChange={(items) => setQuoForm((f) => ({ ...f, items }))} />
                    </div>
                    <div className="flex justify-end">
                      <TotalsBlock items={quoForm.items} discount={quoForm.discount} taxPercent={quoForm.taxPercent} onDiscountChange={(v) => setQuoForm((f) => ({ ...f, discount: v }))} onTaxChange={(v) => setQuoForm((f) => ({ ...f, taxPercent: v }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Notes</label>
                      <textarea value={quoForm.notes} onChange={(e) => setQuoForm((f) => ({ ...f, notes: e.target.value }))} className={`${inputClass} resize-none`} rows={2} placeholder="Terms, conditions, or remarks..." />
                    </div>
                  </>
                )}

                {/* Invoice Form */}
                {activeTab === "invoices" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className={labelClass}>Subject</label>
                        <input value={invForm.subject} onChange={(e) => setInvForm((f) => ({ ...f, subject: e.target.value }))} className={inputClass} placeholder="e.g. Invoice for NDT Services" />
                      </div>
                      <div>
                        <label className={labelClass}>Invoice Date *</label>
                        <input type="date" required value={invForm.date} onChange={(e) => setInvForm((f) => ({ ...f, date: e.target.value }))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Due Date</label>
                        <input type="date" value={invForm.dueDate} onChange={(e) => setInvForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Status</label>
                        <select value={invForm.status} onChange={(e) => setInvForm((f) => ({ ...f, status: e.target.value as Invoice["status"] }))} className={inputClass}>
                          {["Draft", "Sent", "Paid", "Partial", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Payment Mode</label>
                        <select value={invForm.paymentMode || ""} onChange={(e) => setInvForm((f) => ({ ...f, paymentMode: e.target.value as Invoice["paymentMode"] }))} className={inputClass}>
                          <option value="">— Select —</option>
                          {["Cash", "UPI", "Bank Transfer", "Cheque"].map((m) => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Amount Paid (₹)</label>
                        <input type="number" min={0} value={invForm.paidAmount} onChange={(e) => setInvForm((f) => ({ ...f, paidAmount: Number(e.target.value) }))} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Line Items *</label>
                      <LineItemsEditor items={invForm.items} onChange={(items) => setInvForm((f) => ({ ...f, items }))} />
                    </div>
                    <div className="flex justify-end">
                      <TotalsBlock items={invForm.items} discount={invForm.discount} taxPercent={invForm.taxPercent} onDiscountChange={(v) => setInvForm((f) => ({ ...f, discount: v }))} onTaxChange={(v) => setInvForm((f) => ({ ...f, taxPercent: v }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Notes</label>
                      <textarea value={invForm.notes} onChange={(e) => setInvForm((f) => ({ ...f, notes: e.target.value }))} className={`${inputClass} resize-none`} rows={2} placeholder="Payment instructions, remarks..." />
                    </div>
                  </>
                )}
              </div>

              <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-white transition-all">
                  Discard
                </button>
                <button type="submit" disabled={submitting} className="flex-[2] py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-100 hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {submitting ? <Loader2 className="animate-spin" size={17} /> : <><Save size={17} /> {editTarget ? "Update" : "Save"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
