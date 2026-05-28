import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash2, Loader2, Save, Printer, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import {
  createInvoice,
  getInvoiceById,
  updateInvoice,
} from "../../../api/invoiceApi";
import { getCustomers } from "../../../api/customerApi";

const UNITS = ["Nos", "No"];
const PAYMENT_MODES = [
  "Immediate after submission bill",
  "30 Days",
  "45 Days",
  "Other",
];
const STATUSES = ["Draft", "Sent", "Paid", "Partial", "Cancelled"];

const emptyItem = () => ({
  description: "",
  hsnSac: "",
  quantity: 1,
  unit: "Nos",
  unitPrice: 0,
  amount: 0,
});

const defaultForm = {
  customerId: "",
  customerName: "",
  quotationId: "",
  invoiceNo: "",
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  subject: "",
  deliveryNote: "",
  deliveryNoteDate: "",
  supplierRef: "",
  buyerOrderNo: "",
  buyerOrderDate: "",
  documentNo: "",
  dispatchedThrough: "",
  destination: "",
  termsOfDelivery: "",
  paymentMode: "Immediate after submission bill",
  paymentModeCustom: "",
  items: [emptyItem()],
  subtotal: 0,
  // discount: 0,
  cgst: { rate: 9, amount: 0 },
  sgst: { rate: 9, amount: 0 },
  igst: { rate: 0, amount: 0 },
  transportationCharges: 0,
  roundedOff: 0,
  totalAmount: 0,
  grandTotal: 0,
  paidAmount: 0,
  amountInWords: "",
  taxAmountInWords: "",
  status: "Draft",
  bankDetails: {
    bankName: "State Bank of India",
    accountNumber: "35005963456",
    ifscCode: "SBIN0014727",
    branch: "Baramati MIDC",
  },
  notes:
    "We declare that this invoice shows the actual price of the testing work described and that all particulars are true and correct.",
  showTotalAmounts: true,
  taxMode: "cgst_sgst" as "cgst_sgst" | "igst",
};

function calcTotals(form: typeof defaultForm) {
  const items = form.items.map((it) => ({
    ...it,
    amount: Number((it.quantity * it.unitPrice).toFixed(2)),
  }));
  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  // const afterDiscount = subtotal - (form.discount || 0);
  const cgstAmt = Number(((subtotal * (form.cgst.rate || 0)) / 100).toFixed(2));
  const sgstAmt = Number(((subtotal * (form.sgst.rate || 0)) / 100).toFixed(2));
  const igstAmt = Number(((subtotal * (form.igst.rate || 0)) / 100).toFixed(2));
  const totalBeforeRound =
    subtotal + cgstAmt + sgstAmt + igstAmt + (form.transportationCharges || 0);
  const grandTotal = Math.round(totalBeforeRound);
  const roundedOff = Number((grandTotal - totalBeforeRound).toFixed(2));
  return {
    items,
    subtotal: Number(subtotal.toFixed(2)),
    cgst: { rate: form.cgst.rate, amount: cgstAmt },
    sgst: { rate: form.sgst.rate, amount: sgstAmt },
    igst: { rate: form.igst.rate, amount: igstAmt },
    totalAmount: Number(subtotal.toFixed(2)),
    roundedOff,
    grandTotal,
  };
}

function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function helper(num: number): string {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] +
        (num % 10 ? " " + ones[num % 10] : "") +
        " "
      );
    if (num < 1000)
      return ones[Math.floor(num / 100)] + " Hundred " + helper(num % 100);
    if (num < 100000)
      return helper(Math.floor(num / 1000)) + "Thousand " + helper(num % 1000);
    if (num < 10000000)
      return helper(Math.floor(num / 100000)) + "Lakh " + helper(num % 100000);
    return (
      helper(Math.floor(num / 10000000)) + "Crore " + helper(num % 10000000)
    );
  }

  const intPart = Math.floor(Math.abs(n));
  const decPart = Math.round((Math.abs(n) - intPart) * 100);
  let result = helper(intPart).trim();
  if (decPart > 0) {
    result += " Rupees and " + helper(decPart).trim() + " Paise only.";
  } else {
    result += " Rupees only.";
  }
  return result;
}

export const InvoiceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);

  const locationCustomerId =
    (location.state as { customerId?: string } | null)?.customerId || "";

  const [form, setForm] = useState<typeof defaultForm>({
    ...defaultForm,
    customerId: locationCustomerId,
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const userStr = localStorage.getItem("user");
  const role = userStr ? JSON.parse(userStr)?.role : "EMPLOYEE";
  const basePath =
    role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin" : "/employee";

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const custRes = await getCustomers();
      const custData: any = custRes;
      setCustomers(
        Array.isArray(custData?.data?.data)
          ? custData.data.data
          : Array.isArray(custData?.data)
            ? custData.data
            : [],
      );

      if (isEdit && id) {
        const invRes = await getInvoiceById(id);
        const inv: any =
          (invRes as any)?.data?.data || (invRes as any)?.data || invRes;
        const resolvedCustomerId =
          typeof inv.customerId === "object"
            ? inv.customerId?._id || ""
            : inv.customerId || "";
        const matchedCustomer =
          custData?.data?.data?.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => c._id === resolvedCustomerId,
          ) ||
          custData?.data?.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => c._id === resolvedCustomerId,
          );
        setForm({
          ...defaultForm,
          ...inv,
          customerId: resolvedCustomerId,
          customerName:
            matchedCustomer?.companyName ||
            matchedCustomer?.name ||
            inv.customerName ||
            "",
          date: inv.date
            ? new Date(inv.date).toISOString().slice(0, 10)
            : defaultForm.date,
          dueDate: inv.dueDate
            ? new Date(inv.dueDate).toISOString().slice(0, 10)
            : "",
          buyerOrderDate: inv.buyerOrderDate
            ? new Date(inv.buyerOrderDate).toISOString().slice(0, 10)
            : "",
          deliveryNoteDate: inv.deliveryNoteDate
            ? new Date(inv.deliveryNoteDate).toISOString().slice(0, 10)
            : "",
          cgst: inv.cgst || { rate: 9, amount: 0 },
          sgst: inv.sgst || { rate: 9, amount: 0 },
          igst: inv.igst || { rate: 0, amount: 0 },
          taxMode: ((inv.igst?.rate ?? 0) > 0 ? "igst" : "cgst_sgst") as
            | "cgst_sgst"
            | "igst",
          bankDetails: inv.bankDetails || defaultForm.bankDetails,
          items:
            Array.isArray(inv.items) && inv.items.length > 0
              ? inv.items
              : [emptyItem()],
        });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recalculate whenever items, rates, or charges change
  useEffect(() => {
    const calc = calcTotals(form);
    const grandTotal = calc.grandTotal;
    setForm((prev) => ({
      ...prev,
      ...calc,
      amountInWords: numberToWords(grandTotal),
      taxAmountInWords: numberToWords(
        calc.cgst.amount + calc.sgst.amount + calc.igst.amount,
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(form.items),
    form.cgst.rate,
    form.sgst.rate,
    form.igst.rate,
    form.discount,
    form.transportationCharges,
  ]);

  const setField = (path: string, value: any) => {
    setForm((prev) => {
      const parts = path.split(".");
      if (parts.length === 1) return { ...prev, [path]: value };
      if (parts.length === 2) {
        const [p0, p1] = parts;
        return { ...prev, [p0]: { ...(prev as any)[p0], [p1]: value } };
      }
      return prev;
    });
  };

  const handleTaxModeChange = (mode: "cgst_sgst" | "igst") => {
    setForm((prev) => ({
      ...prev,
      taxMode: mode,
      cgst: mode === "igst" ? { ...prev.cgst, rate: 0 } : prev.cgst,
      sgst: mode === "igst" ? { ...prev.sgst, rate: 0 } : prev.sgst,
      igst: mode === "cgst_sgst" ? { ...prev.igst, rate: 0 } : prev.igst,
    }));
  };

  const updateItem = (idx: number, key: string, value: any) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, [key]: value };
        updated.amount = Number(
          (Number(updated.quantity) * Number(updated.unitPrice)).toFixed(2),
        );
        return updated;
      });
      return { ...prev, items };
    });
  };

  const addItem = () =>
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  const removeItem = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));

  const handleSave = async (andPrint = false) => {
    if (!form.customerName && !form.customerId) {
      toast.error("Please enter a customer");
      return;
    }
    if (form.items.length === 0 || form.items.every((it) => !it.description)) {
      toast.error("Add at least one line item");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        quotationId: form.quotationId || null,
        items: form.items
          .filter((it) => it.description)
          .map((it, i) => ({ ...it, srNo: i + 1 })),
      };
      let savedId = id;
      if (isEdit && id) {
        await updateInvoice(id, payload);
        toast.success("Invoice updated");
      } else {
        const res: any = await createInvoice(payload);
        savedId = res?.data?.data?._id || res?.data?._id;
        toast.success("Invoice created");
      }
      if (andPrint && savedId) {
        navigate(`${basePath}/invoices/${savedId}/print?autoprint=true`);
      } else {
        navigate(`${basePath}/invoices`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save invoice");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 size={28} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Invoice" : "New Invoice"}
        </h1>
      </div>

      {/* Basic Info */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-2">
          Invoice Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice No
            </label>
            <div className="input-field w-full bg-gray-50 text-gray-500 cursor-default flex items-center gap-2">
              {isEdit && form.invoiceNo ? (
                <span className="font-medium text-gray-800">
                  {form.invoiceNo}
                </span>
              ) : (
                <span className="italic text-xs">
                  Auto-generated on save (e.g. NIIT/INV/25-26/001)
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              className="input-field w-full"
              value={form.date}
              onChange={(e) => setField("date", e.target.value)}
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              className="input-field w-full"
              value={form.dueDate}
              onChange={(e) => setField("dueDate", e.target.value)}
            />
          </div> */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field w-full"
              value={form.customerId}
              onChange={(e) => {
                const match = customers.find((c) => c._id === e.target.value);
                setForm((prev) => ({
                  ...prev,
                  customerId: e.target.value,
                  customerName: match ? match.companyName || match.name : "",
                }));
              }}
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName || c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="input-field w-full"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Mode
            </label>
            <div className="space-y-1">
              <select
                className="input-field w-full"
                value={form.paymentMode}
                onChange={(e) => setField("paymentMode", e.target.value)}
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {form.paymentMode === "Other" && (
                <input
                  className="input-field w-full"
                  value={form.paymentModeCustom}
                  onChange={(e) =>
                    setField("paymentModeCustom", e.target.value)
                  }
                  placeholder="Specify custom payment terms..."
                />
              )}
            </div>
          </div>
          {/* <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              className="input-field w-full"
              value={form.subject}
              onChange={(e) => setField("subject", e.target.value)}
              placeholder="Invoice subject"
            />
          </div> */}
        </div>
      </div>

      {/* Reference Fields */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-2">
          Reference Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Note
            </label>
            <input
              className="input-field w-full"
              value={form.deliveryNote}
              onChange={(e) => setField("deliveryNote", e.target.value)}
              placeholder="Delivery Note"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Note Date
            </label>
            <input
              type="date"
              className="input-field w-full"
              value={form.deliveryNoteDate}
              onChange={(e) => setField("deliveryNoteDate", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier's Ref
            </label>
            <input
              className="input-field w-full"
              value={form.supplierRef}
              onChange={(e) => setField("supplierRef", e.target.value)}
              placeholder="Supplier's Ref"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer's Order No
            </label>
            <input
              className="input-field w-full"
              value={form.buyerOrderNo}
              onChange={(e) => setField("buyerOrderNo", e.target.value)}
              placeholder="Buyer's Order No"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer's Order Date
            </label>
            <input
              type="date"
              className="input-field w-full"
              value={form.buyerOrderDate}
              onChange={(e) => setField("buyerOrderDate", e.target.value)}
            />
          </div>
          {[
            { label: "Document No", key: "documentNo" },
            { label: "Dispatched Through", key: "dispatchedThrough" },
            { label: "Destination", key: "destination" },
            { label: "Other References", key: "otherReferences" },
            { label: "Terms of Delivery", key: "termsOfDelivery" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                className="input-field w-full"
                value={(form as any)[key] || ""}
                onChange={(e) => setField(key, e.target.value)}
                placeholder={label}
              />
            </div>
          ))}
          {/* <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terms of Delivery
            </label>
            <input
              className="input-field w-full"
              value={form.termsOfDelivery}
              onChange={(e) => setField("termsOfDelivery", e.target.value)}
              placeholder="Terms of delivery"
            />
          </div> */}
        </div>
      </div>

      {/* Line Items */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-2">
          Line Items
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left text-gray-600 font-semibold w-8">
                  #
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">
                  Description
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold w-28">
                  HSN/SAC
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold w-28">
                  Qty
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold w-24">
                  Unit
                </th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold w-28">
                  Rate (₹)
                </th>
                <th className="px-3 py-2 text-right text-gray-600 font-semibold w-28">
                  Amount (₹)
                </th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-500 text-center">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="input-field w-full"
                      value={it.description}
                      onChange={(e) =>
                        updateItem(idx, "description", e.target.value)
                      }
                      placeholder="Description of work"
                    />
                  </td>
                  <td className="px-1 py-2">
                    <input
                      className="input-field w-full"
                      value={it.hsnSac}
                      onChange={(e) =>
                        updateItem(idx, "hsnSac", e.target.value)
                      }
                      placeholder="HSN/SAC"
                    />
                  </td>
                  <td className="px-1 py-2 w-28">
                    <input
                      type="number"
                      min="1"
                      className="input-field w-full"
                      value={it.quantity}
                      onChange={(e) =>
                        updateItem(idx, "quantity", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="px-1 py-2">
                    <select
                      className="input-field w-full"
                      value={it.unit}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-1 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-field w-full"
                      value={it.unitPrice}
                      onChange={(e) =>
                        updateItem(idx, "unitPrice", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-800">
                    {it.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {form.items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end pr-5">
          <button
            onClick={addItem}
            className="inline-flex items-end gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* GST & Totals */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-2">
          Tax & Totals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {/* Tax mode toggle */}
            <div className="flex items-center gap-3">
              <label className="w-36 text-sm font-medium text-gray-700">
                Tax Type
              </label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleTaxModeChange("cgst_sgst")}
                  className={`px-4 py-1.5 transition-colors ${form.taxMode === "cgst_sgst" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  CGST + SGST
                </button>
                <button
                  type="button"
                  onClick={() => handleTaxModeChange("igst")}
                  className={`px-4 py-1.5 border-l border-gray-200 transition-colors ${form.taxMode === "igst" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  IGST
                </button>
              </div>
            </div>

            {/* CGST + SGST fields */}
            <div
              className={`flex items-center gap-3 ${form.taxMode === "igst" ? "opacity-40 pointer-events-none" : ""}`}
            >
              <label className="w-36 text-sm font-medium text-gray-700">
                CGST Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="28"
                step="0.5"
                className="input-field flex-1"
                value={form.cgst.rate}
                onChange={(e) => setField("cgst.rate", Number(e.target.value))}
                disabled={form.taxMode === "igst"}
              />
              <span className="text-sm text-gray-500 w-20 text-right">
                ₹ {form.cgst.amount.toFixed(2)}
              </span>
            </div>
            <div
              className={`flex items-center gap-3 ${form.taxMode === "igst" ? "opacity-40 pointer-events-none" : ""}`}
            >
              <label className="w-36 text-sm font-medium text-gray-700">
                SGST Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="28"
                step="0.5"
                className="input-field flex-1"
                value={form.sgst.rate}
                onChange={(e) => setField("sgst.rate", Number(e.target.value))}
                disabled={form.taxMode === "igst"}
              />
              <span className="text-sm text-gray-500 w-20 text-right">
                ₹ {form.sgst.amount.toFixed(2)}
              </span>
            </div>

            {/* IGST field */}
            <div
              className={`flex items-center gap-3 ${form.taxMode === "cgst_sgst" ? "opacity-40 pointer-events-none" : ""}`}
            >
              <label className="w-36 text-sm font-medium text-gray-700">
                IGST Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="28"
                step="0.5"
                className="input-field flex-1"
                value={form.igst.rate}
                onChange={(e) => setField("igst.rate", Number(e.target.value))}
                disabled={form.taxMode === "cgst_sgst"}
              />
              <span className="text-sm text-gray-500 w-20 text-right">
                ₹ {form.igst.amount.toFixed(2)}
              </span>
            </div>
            {/* <div className="flex items-center gap-3">
              <label className="w-36 text-sm font-medium text-gray-700">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field flex-1"
                value={form.discount}
                onChange={(e) => setField("discount", Number(e.target.value))}
              />
            </div> */}
            <div className="flex items-center gap-3">
              <label className="w-36 text-sm font-medium text-gray-700">
                Transport Charges
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field flex-1"
                value={form.transportationCharges}
                onChange={(e) =>
                  setField("transportationCharges", Number(e.target.value))
                }
              />
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹ {form.subtotal.toFixed(2)}</span>
            </div>
            {/* {form.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-red-600">
                  - ₹ {form.discount.toFixed(2)}
                </span>
              </div>
            )} */}
            {form.cgst.rate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">CGST ({form.cgst.rate}%)</span>
                <span>₹ {form.cgst.amount.toFixed(2)}</span>
              </div>
            )}
            {form.sgst.rate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">SGST ({form.sgst.rate}%)</span>
                <span>₹ {form.sgst.amount.toFixed(2)}</span>
              </div>
            )}
            {form.igst.rate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">IGST ({form.igst.rate}%)</span>
                <span>₹ {form.igst.amount.toFixed(2)}</span>
              </div>
            )}
            {form.transportationCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transport</span>
                <span>₹ {Number(form.transportationCharges).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Round Off</span>
              <span>
                {form.roundedOff >= 0 ? "+" : ""}₹ {form.roundedOff.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold text-base">
              <span>Grand Total</span>
              <span className="text-primary-700">
                ₹ {form.grandTotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 italic pt-1">
              {form.amountInWords}
            </p>
            {/* Print option — placed here so it's next to what it controls */}
            <div className="border-t pt-3 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showTotalAmounts}
                  onChange={(e) =>
                    setField("showTotalAmounts", e.target.checked)
                  }
                  className="w-4 h-4 accent-primary-600 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-600">
                  Show "Total Amount" row on printed invoice
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-2">
          Bank Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Bank Name", key: "bankDetails.bankName" },
            { label: "Account Number", key: "bankDetails.accountNumber" },
            { label: "IFSC Code", key: "bankDetails.ifscCode" },
            { label: "Branch", key: "bankDetails.branch" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                className="input-field w-full"
                value={(form.bankDetails as any)[key.split(".")[1]] || ""}
                onChange={(e) => setField(key, e.target.value)}
                placeholder={label}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-2">
          Declaration
        </h2>
        <textarea
          className="input-field w-full h-24 resize-none"
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Additional notes or declaration..."
        />
      </div>

      {/* Fixed Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end gap-3 shadow-lg">
        <button
          onClick={() => navigate(`${basePath}/invoices`)}
          className="px-5 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {isEdit ? "Update Invoice" : "Save Invoice"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          <Printer size={15} />
          Save & Print
        </button>
      </div>
    </div>
  );
};
