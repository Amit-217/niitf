import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createTrainingQuotation,
  getTrainingQuotationById,
  updateTrainingQuotation,
  createServiceQuotation,
  getServiceQuotationById,
  updateServiceQuotation,
} from "../../../api/quotationApi";
import { getCustomers } from "../../../api/customerApi";
import {
  Save,
  Ban,
  Plus,
  Trash2,
  ArrowLeft,
  FileText,
  Loader2,
} from "lucide-react";

export const QuotationFormPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    customerId?: string;
    from?: string;
  } | null;
  const isEditing = Boolean(id);
  const qType = type === "training" ? "Training" : "Service";

  const SERVICE_DESCRIPTIONS = [
    "Ultrasonic Testing Charges",
    "Liquid Penetrant Testing Charges",
    "Magnetic Particle Testing Charges",
    "RTFI Charges",
    "NDE Consultancy Charges",
  ];

  const TRAINING_DESCRIPTIONS = [
    "PT NDE",
    "MT NDE",
    "UT NDE",
    "RTFI NDE",
    "VT NDE",
    "ET NDE",
    "MFL NDE",
  ];

  const FIXED_CHARGE_DESCS = [
    "Transportation Charges",
    "Lodging Charges",
    "Boarding Charges",
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const hasErr = (key: string) => !!errors[key];
  const ic = (key: string) =>
    `w-full px-3 py-2 border rounded-lg${hasErr(key) ? " border-red-400 bg-red-50" : ""}`;

  // Form State
  const [formData, setFormData] = useState<any>({
    quotationNo: "",
    customerId: "",
    status: "Draft",
    enquiryReference: "By Call",
    date: new Date().toISOString().split("T")[0],
    contactPersons: [{ name: "", mobile: "" }],
    services: [
      {
        srNo: 1,
        description: "",
        level: "NA",
        sacCode: "",
        quantity: 0,
        unit: 0,
        price: 0,
        amount: 0,
      },
      {
        srNo: 2,
        description: "Transportation Charges",
        _isFixed: true,
        level: "NA",
        sacCode: "NA",
        quantity: 1,
        unit: 0,
        price: 0,
        amount: 0,
      },
      {
        srNo: 3,
        description: "Lodging Charges",
        _isFixed: true,
        level: "NA",
        sacCode: "NA",
        quantity: 1,
        unit: 0,
        price: 0,
        amount: 0,
      },
      {
        srNo: 4,
        description: "Boarding Charges",
        _isFixed: true,
        level: "NA",
        sacCode: "NA",
        quantity: 1,
        unit: 0,
        price: 0,
        amount: 0,
      },
    ],
    // Service Specific
    extraCharges: {
      transportation: 0,
      lodging: 0,
      boarding: 0,
      minimumVisit: "",
    },
    // Training Specific
    trainingDetails: {
      minCandidates: 5,
      trainingMode: "As per yours written practice",
      includes: { studyMaterial: true, examFee: true, certificateFee: true },
    },

    gstPercentage: 18,
    termsAndConditions: {
      paymentTerms:
        qType === "Training"
          ? "Immediate after completion of training & submission of certificates."
          : "Immediate after completion of inspection & before submission of reports.",
      trainingNote: "",
      materialHandling: "is in yours scope.",
      personnel: "is in ours scope.",
      machines: "",
      consumables: "",
    },
    preparedBy: {
      name: "Mr. Bajirao T. Kadam",
      designation: "ASNT Level III (RT, UT, MT, PT, VT, ET, MFL)",
    },
  });

  const [totals, setTotals] = useState({
    taxableSubtotal: 0,
    fixedCharges: 0,
    subtotal: 0,
    gstAmount: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line
  }, [formData.services, formData.extraCharges, formData.gstPercentage]);

  const calculateTotals = () => {
    // Fixed charges (transportation, lodging, boarding) are excluded from GST
    let taxableSubtotal = formData.services.reduce(
      (acc: number, cur: any) =>
        cur._isFixed ? acc : acc + (parseFloat(cur.amount) || 0),
      0,
    );
    let fixedCharges = formData.services.reduce(
      (acc: number, cur: any) =>
        cur._isFixed ? acc + (parseFloat(cur.amount) || 0) : acc,
      0,
    );
    const subtotal = taxableSubtotal + fixedCharges;
    const gstAmount =
      (taxableSubtotal * (parseFloat(formData.gstPercentage) || 0)) / 100;
    const totalAmount = subtotal + gstAmount;
    setTotals({ taxableSubtotal, fixedCharges, subtotal, gstAmount, totalAmount });
  };

  useEffect(() => {
    fetchInitData();
    // eslint-disable-next-line
  }, [id, type]);

  const fetchInitData = async () => {
    try {
      setIsLoading(true);
      const custRes = await getCustomers();
      setCustomers(custRes.data?.data || custRes.data || []);

      if (isEditing && id) {
        let res;
        if (type === "training") res = await getTrainingQuotationById(id);
        else res = await getServiceQuotationById(id);

        const data = res.data?.data || res.data;
        if (data) {
          if (data.date)
            data.date = new Date(data.date).toISOString().split("T")[0];
          // Normalize customerId: API may return a populated object instead of a plain ID string
          if (data.customerId && typeof data.customerId === "object") {
            data.customerId = data.customerId._id || "";
          }
          // Derive _isFixed and _isCustom for each service row
          if (data.services) {
            const descList =
              type === "training"
                ? TRAINING_DESCRIPTIONS
                : SERVICE_DESCRIPTIONS;
            data.services = data.services.map(
              (s: { description?: string; [key: string]: unknown }) => ({
                ...s,
                _isFixed: FIXED_CHARGE_DESCS.includes(s.description || ""),
                _isCustom: Boolean(
                  s.description &&
                  !FIXED_CHARGE_DESCS.includes(s.description || "") &&
                  !descList.includes(s.description),
                ),
              }),
            );
            // Add missing fixed rows for both service and training (backward compatibility)
            FIXED_CHARGE_DESCS.forEach((desc) => {
              if (
                !data.services.find(
                  (s: { description?: string }) => s.description === desc,
                )
              ) {
                data.services.push({
                  description: desc,
                  _isFixed: true,
                  level: "NA",
                  sacCode: "NA",
                  quantity: 1,
                  unit: "Per",
                  price: 0,
                  amount: 0,
                });
              }
            });
          }
          setFormData({ ...formData, ...data });
        }
      } else {
        // Pre-fill customer + contact person if navigated from customer page
        const custList = custRes.data?.data || custRes.data || [];
        const presetCustId = locationState?.customerId;
        const presetCust = presetCustId
          ? custList.find((c: { _id: string }) => c._id === presetCustId)
          : null;
        setFormData((prev: any) => ({
          ...prev,
          quotationNo: "",
          ...(presetCustId ? { customerId: presetCustId } : {}),
          ...(presetCust
            ? {
                contactPersons: [
                  {
                    ...prev.contactPersons[0],
                    name: presetCust.contactPerson || "",
                  },
                ],
              }
            : {}),
        }));
      }
    } catch (err) {
      toast.error("Failed to load initial data");
    } finally {
      setIsLoading(false);
    }
  };

  const getFinancialYear = () => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    // FY starts in April
    if (month >= 3) return `${year}-${year + 1}`;
    return `${year - 1}-${year}`;
  };

  const handleServiceChange = (index: number, field: string, value: any) => {
    const updated = [...formData.services];

    // Prevent negative values for quantity and price
    if (field === "quantity" || field === "price") {
      const num = parseFloat(value);
      updated[index][field] = isNaN(num) || num < 0 ? 0 : value;
    } else {
      updated[index][field] = value;
    }

    // Auto calculate amount
    if (field === "quantity" || field === "price") {
      const q = parseFloat(updated[index].quantity) || 0;
      const p = parseFloat(updated[index].price) || 0;
      updated[index].amount = q * p;
    }
    setFormData({ ...formData, services: updated });
  };

  const addServiceRow = () => {
    // Insert before fixed rows
    const fixedIndex = formData.services.findIndex(
      (s: { _isFixed?: boolean }) => s._isFixed,
    );
    const insertAt = fixedIndex === -1 ? formData.services.length : fixedIndex;
    const row = {
      srNo: insertAt + 1,
      description: "",
      _isCustom: false,
      level: "NA",
      sacCode: "",
      quantity: 1,
      unit: type === "service" ? "Per" : 0,
      price: 0,
      amount: 0,
    };
    const updated = [...formData.services];
    updated.splice(insertAt, 0, row);
    // Renumber all rows sequentially
    const renumbered = updated.map((s, idx) => ({ ...s, srNo: idx + 1 }));
    setFormData({ ...formData, services: renumbered });
  };

  const removeServiceRow = (index: number) => {
    if (formData.services[index]?._isFixed) return;
    const updated = [...formData.services];
    updated.splice(index, 1);
    // Renumber all rows sequentially
    const renumbered = updated.map((s, idx) => ({ ...s, srNo: idx + 1 }));
    setFormData({ ...formData, services: renumbered });
  };

  const handleSubmit = async (status: "Draft" | "Final") => {
    // Always enforce customer selection
    if (!formData.customerId) {
      toast.error("Please select a customer before saving.");
      return;
    }

    if (status === "Final") {
      const e: Record<string, boolean> = {};
      const mt = (v: string) => !v?.trim();

      // Core Info
      if (!formData.customerId) e.customerId = true;
      if (!formData.date) e.date = true;
      if (mt(formData.contactPersons?.[0]?.name)) e.contactName = true;

      // Services — for service type, each non-fixed row must have description
      if (type === "service") {
        (formData.services || []).forEach((s: any, i: number) => {
          if (!s._isFixed && !s.description?.trim())
            e[`service_${i}_description`] = true;
          if (!s._isFixed && !s.sacCode?.trim())
            e[`service_${i}_sacCode`] = true;
        });
      }
      // Training — each non-fixed row must have description and SAC code
      if (type === "training") {
        (formData.services || []).forEach((s: any, i: number) => {
          if (!s._isFixed && !s.description?.trim())
            e[`service_${i}_description`] = true;
          if (!s._isFixed && !s.sacCode?.trim())
            e[`service_${i}_sacCode`] = true;
        });
      }
      // At least one non-fixed row with description and amount > 0
      const validServices = (formData.services || []).filter(
        (s: any) =>
          !s._isFixed &&
          s.description?.trim() &&
          (parseFloat(s.amount) || 0) > 0,
      );
      if (validServices.length === 0) e.services = true;

      // Terms & Settings
      if (mt(formData.termsAndConditions?.paymentTerms)) e.paymentTerms = true;

      if (type === "service") {
        if (!formData.extraCharges?.minimumVisit?.toString().trim())
          e.minimumVisit = true;
        if (mt(formData.termsAndConditions?.materialHandling))
          e.materialHandling = true;
        if (mt(formData.termsAndConditions?.personnel)) e.personnel = true;
        if (!formData.termsAndConditions?.machines) e.machines = true;
        if (!formData.termsAndConditions?.consumables) e.consumables = true;
      }

      if (type === "training") {
        if (!formData.trainingDetails?.minCandidates) e.minCandidates = true;
        if (mt(formData.trainingDetails?.trainingMode)) e.trainingMode = true;
      }

      // Signature
      if (mt(formData.preparedBy?.name)) e.preparedByName = true;
      if (mt(formData.preparedBy?.designation)) e.preparedByDesig = true;

      if (Object.keys(e).length > 0) {
        setErrors(e);
        toast.error("Please fill all required fields before saving as Final.");
        return;
      }
      setErrors({});
    } else {
      setErrors({});
    }

    try {
      setIsSaving(true);

      // Calculate totals — fixed charges (transportation etc.) are excluded from GST
      let taxableSubtotal = formData.services.reduce(
        (acc: number, cur: any) =>
          cur._isFixed ? acc : acc + (parseFloat(cur.amount) || 0),
        0,
      );
      const fixedCharges = formData.services.reduce(
        (acc: number, cur: any) =>
          cur._isFixed ? acc + (parseFloat(cur.amount) || 0) : acc,
        0,
      );
      const subtotal = taxableSubtotal + fixedCharges;
      const gstAmount = (taxableSubtotal * formData.gstPercentage) / 100;
      const totalAmount = subtotal + gstAmount;

      const payload = {
        ...formData,
        status,
        services: formData.services.map((s: Record<string, unknown>) => {
          const copy = { ...s };
          delete copy["_isCustom"];
          delete copy["_isFixed"];
          return copy;
        }),
        subtotal,
        gstAmount,
        totalAmount,
      };

      if (isEditing && id) {
        if (type === "training") await updateTrainingQuotation(id, payload);
        else await updateServiceQuotation(id, payload);
        toast.success(`${qType} Quotation updated successfully`);
      } else {
        if (type === "training") await createTrainingQuotation(payload);
        else await createServiceQuotation(payload);
        toast.success(`${qType} Quotation created successfully`);
      }

      // Navigate back to where the user came from
      if (locationState?.from === "quotations-list") {
        navigate("/admin/quotations", { state: { activeTab: type } });
      } else {
        const customerId = formData.customerId || locationState?.customerId;
        if (customerId) {
          navigate(`/admin/customers/${customerId}`, {
            state: { activeTab: "quotations" },
          });
        } else {
          navigate("/admin/quotations", { state: { activeTab: type } });
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save quotation";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading form...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/admin/quotations", { state: { activeTab: type } })}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit" : "Create"} {qType} Quotation
        </h1>
      </div>

      <div className="mt-6 space-y-6">
        {/* Core Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              Core Info
            </h2>
            <span className="text-xs font-bold px-2 py-1 bg-violet-50 text-violet-700 rounded-lg animate-pulse">
              Auto-numbering Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Quotation No{" "}
                <span className="text-gray-400 font-normal">
                  {isEditing ? "" : "(Auto-generated)"}
                </span>
              </label>
              <input
                required
                readOnly
                type="text"
                value={
                  isEditing
                    ? formData.quotationNo
                    : `NIIT/${getFinancialYear()}/QTN/${new Date().getFullYear()}/... (Auto)`
                }
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 font-mono font-bold text-violet-700"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className={ic("date")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => {
                  const custId = e.target.value;
                  const selectedCust = customers.find((c) => c._id === custId);
                  setFormData({
                    ...formData,
                    customerId: custId,
                    contactPersons: selectedCust
                      ? [
                          {
                            ...formData.contactPersons[0],
                            name: selectedCust.contactPerson || "",
                          },
                        ]
                      : formData.contactPersons,
                  });
                }}
                className={`${ic("customerId")} focus:ring-2 focus:ring-primary-500 outline-none`}
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Enquiry Reference
              </label>
              <select
                value={formData.enquiryReference}
                onChange={(e) =>
                  setFormData({ ...formData, enquiryReference: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="By Mail">By Mail</option>
                <option value="By Call">By Call</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contact Person (Name)
            </label>
            <input
              type="text"
              value={formData.contactPersons[0]?.name || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactPersons: [
                    { ...formData.contactPersons[0], name: e.target.value },
                  ],
                })
              }
              className={ic("contactName")}
              placeholder="Mr. Name / Mr. Other"
            />
          </div>
        </div>

        {/* Services Table */}
        <div
          className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100${errors.services ? " ring-2 ring-red-400" : ""}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              Services / Items
              {errors.services && (
                <span className="ml-2 text-red-500 text-xs font-normal normal-case">
                  At least one service row with description and amount &gt; 0 is
                  required
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={addServiceRow}
              className="text-sm px-3 py-1.5 bg-primary-50 text-primary-700 font-bold rounded-lg flex items-center gap-1 hover:bg-primary-100"
            >
              <Plus size={16} /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-16 px-2 py-3 text-left text-sm font-semibold text-gray-500">
                    Sr.
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-gray-500 w-1/3">
                    Description
                  </th>
                  {type === "training" && (
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">
                      Level
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-24">
                    SAC Code
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-20">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-24">
                    Unit
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-28">
                    Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-32">
                    Amount
                  </th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {formData.services.map((row: any, i: number) => (
                  <tr key={i} className={row._isFixed ? "bg-amber-50" : ""}>
                    {/* Sr No */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={row.srNo}
                        onChange={(e) =>
                          handleServiceChange(i, "srNo", e.target.value)
                        }
                        className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center"
                      />
                    </td>

                    {/* Fixed Training Row */}
                    {type === "training" && row._isFixed ? (
                      <>
                        {/* Description colspan 3 */}
                        <td colSpan={3} className="px-2 py-2">
                          <div className="px-3 py-2 text-sm font-semibold text-gray-700 bg-amber-50 rounded-lg border border-amber-200">
                            {row.description}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Description */}
                        <td className="px-2 py-2">
                          {row._isFixed ? (
                            <div className="px-3 py-2 text-sm font-semibold text-gray-700 bg-amber-50 rounded-lg border border-amber-200">
                              {row.description}
                            </div>
                          ) : type === "service" ? (
                            <div className="flex flex-col gap-1">
                              <select
                                value={
                                  row._isCustom ? "__custom__" : row.description
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...formData.services];

                                  if (val === "__custom__") {
                                    updated[i] = {
                                      ...updated[i],
                                      _isCustom: true,
                                      description: "",
                                    };
                                  } else {
                                    updated[i] = {
                                      ...updated[i],
                                      _isCustom: false,
                                      description: val,
                                    };
                                  }

                                  setFormData({
                                    ...formData,
                                    services: updated,
                                  });
                                }}
                                className={`w-full px-3 py-2 border rounded-lg text-sm${errors[`service_${i}_description`] && !row.description?.trim() && !row._isCustom ? " border-red-400 bg-red-50" : ""}`}
                              >
                                <option value="">Select description...</option>

                                {SERVICE_DESCRIPTIONS.map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}

                                <option value="__custom__">Other</option>
                              </select>

                              {row._isCustom && (
                                <input
                                  type="text"
                                  value={row.description}
                                  onChange={(e) =>
                                    handleServiceChange(
                                      i,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  className={`w-full px-3 py-2 border rounded-lg text-sm${errors[`service_${i}_description`] && !row.description?.trim() ? " border-red-400 bg-red-50" : ""}`}
                                  placeholder="Enter custom description..."
                                  autoFocus
                                />
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <select
                                value={
                                  row._isCustom ? "__custom__" : row.description
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...formData.services];

                                  if (val === "__custom__") {
                                    updated[i] = {
                                      ...updated[i],
                                      _isCustom: true,
                                      description: "",
                                    };
                                  } else {
                                    updated[i] = {
                                      ...updated[i],
                                      _isCustom: false,
                                      description: val,
                                    };
                                  }

                                  setFormData({
                                    ...formData,
                                    services: updated,
                                  });
                                }}
                                className={`w-full min-w-[300px] px-3 py-2 border rounded-lg text-sm${errors[`service_${i}_description`] && !row.description?.trim() && !row._isCustom ? " border-red-400 bg-red-50" : ""}`}
                              >
                                <option value="">Select description...</option>

                                {TRAINING_DESCRIPTIONS.map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}

                                <option value="__custom__">Custom</option>
                              </select>

                              {row._isCustom && (
                                <input
                                  type="text"
                                  value={row.description}
                                  onChange={(e) =>
                                    handleServiceChange(
                                      i,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  className={`w-full px-3 py-2 border rounded-lg text-sm${errors[`service_${i}_description`] && !row.description?.trim() ? " border-red-400 bg-red-50" : ""}`}
                                  placeholder="Enter custom description..."
                                  autoFocus
                                />
                              )}
                            </div>
                          )}
                        </td>

                        {/* Level */}
                        {type === "training" && (
                          <td className="px-2 py-2">
                            <select
                              value={row.level}
                              onChange={(e) =>
                                handleServiceChange(i, "level", e.target.value)
                              }
                              className="w-16 px-3 py-2 border rounded-lg text-sm"
                            >
                              <option value="I">I</option>
                              <option value="II">II</option>
                            </select>
                          </td>
                        )}

                        {/* SAC Code */}
                        <td className="px-1 py-2">
                          <input
                            type="text"
                            value={row.sacCode}
                            placeholder="SAC Code"
                            onChange={(e) =>
                              handleServiceChange(i, "sacCode", e.target.value)
                            }
                            className={`w-24 px-3 py-2 border rounded-lg text-sm${errors[`service_${i}_sacCode`] && !row.sacCode?.trim() ? " border-red-400 bg-red-50" : ""}`}
                          />
                        </td>
                      </>
                    )}

                    {/* Quantity */}
                    <td className="px-1 w-28 py-2">
                      <input
                        type="number"
                        min="0"
                        value={row.quantity}
                        onChange={(e) =>
                          handleServiceChange(i, "quantity", e.target.value)
                        }
                        className="w-24 px-3 py-2 border rounded-lg text-sm"
                      />
                    </td>

                    {/* Unit */}
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={row.unit}
                        placeholder="Unit"
                        onChange={(e) =>
                          handleServiceChange(i, "unit", e.target.value)
                        }
                        className="w-24 px-3 py-2 border rounded-lg text-sm"
                      />
                    </td>

                    {/* Price */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={row.price}
                        onChange={(e) =>
                          handleServiceChange(i, "price", e.target.value)
                        }
                        className="w-24 px-3 py-2 border rounded-lg text-sm"
                      />
                    </td>

                    {/* Amount */}
                    <td className="px-2 py-2">
                      <input
                        readOnly
                        type="number"
                        value={row.amount}
                        className="w-24 px-3 py-2 border rounded-lg text-sm bg-gray-50 font-bold"
                      />
                    </td>

                    {/* Action */}
                    <td className="px-2 py-2 text-center">
                      {!row._isFixed && (
                        <button
                          type="button"
                          onClick={() => removeServiceRow(i)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {formData.services.length === 0 && (
              <p className="text-center text-gray-400 py-4 text-sm font-medium">
                No services added yet.
              </p>
            )}
          </div>
        </div>

        {/* Extra Charges / Training Config */}
        {type === "service" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
              Extra Charges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Minimum Visit
                </label>
                <input
                  type="text"
                  value={formData.extraCharges.minimumVisit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      extraCharges: {
                        ...formData.extraCharges,
                        minimumVisit: e.target.value,
                      },
                    })
                  }
                  className={ic("minimumVisit")}
                />
              </div>
            </div>
          </div>
        )}

        {type === "training" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
              Training Config
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Minimum Candidates required
                </label>
                <input
                  type="number"
                  value={formData.trainingDetails.minCandidates}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trainingDetails: {
                        ...formData.trainingDetails,
                        minCandidates: e.target.value,
                      },
                    })
                  }
                  className={ic("minCandidates")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Training Mode
                </label>
                <input
                  type="text"
                  value={formData.trainingDetails.trainingMode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trainingDetails: {
                        ...formData.trainingDetails,
                        trainingMode: e.target.value,
                      },
                    })
                  }
                  className={ic("trainingMode")}
                />
              </div>
            </div>
          </div>
        )}

        {/* GST & Terms */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
            Terms & Settings
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              GST Percentage (%)
            </label>
            <input
              type="number"
              value={formData.gstPercentage}
              onChange={(e) =>
                setFormData({ ...formData, gstPercentage: e.target.value })
              }
              className="w-1/4 px-3 py-2 border rounded-lg"
            />
          </div>

          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Payment Terms
          </label>
          <input
            type="text"
            value={formData.termsAndConditions.paymentTerms}
            onChange={(e) =>
              setFormData({
                ...formData,
                termsAndConditions: {
                  ...formData.termsAndConditions,
                  paymentTerms: e.target.value,
                },
              })
            }
            className={`${ic("paymentTerms")} mb-4`}
          />

          {type === "service" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Material Handling
                </label>
                <input
                  type="text"
                  value={formData.termsAndConditions.materialHandling}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsAndConditions: {
                        ...formData.termsAndConditions,
                        materialHandling: e.target.value,
                      },
                    })
                  }
                  className={ic("materialHandling")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  NDE Level II personnel
                </label>
                <input
                  type="text"
                  value={formData.termsAndConditions.personnel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsAndConditions: {
                        ...formData.termsAndConditions,
                        personnel: e.target.value,
                      },
                    })
                  }
                  className={ic("personnel")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Machines
                </label>
                <select
                  value={formData.termsAndConditions.machines}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsAndConditions: {
                        ...formData.termsAndConditions,
                        machines: e.target.value,
                      },
                    })
                  }
                  className={ic("machines")}
                >
                  <option value="">Select...</option>
                  <option value="is in our scope.">is in our scope.</option>
                  <option value="is in yours scope.">is in yours scope.</option>
                </select>
                {/* <input
                  type="text"
                  value={formData.termsAndConditions.machines}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsAndConditions: {
                        ...formData.termsAndConditions,
                        machines: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                /> */}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Consumables
                </label>
                <select
                  value={formData.termsAndConditions.consumables}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsAndConditions: {
                        ...formData.termsAndConditions,
                        consumables: e.target.value,
                      },
                    })
                  }
                  className={ic("consumables")}
                >
                  <option value="">Select...</option>
                  <option value="is in our scope.">is in our scope.</option>
                  <option value="is in yours scope.">is in yours scope.</option>
                </select>
                {/* <input
                  type="text"
                  value={formData.termsAndConditions.consumables}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsAndConditions: {
                        ...formData.termsAndConditions,
                        consumables: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                /> */}
              </div>
            </div>
          )}
        </div>

        {/* Signature Box */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
            Signature / Preparation Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Prepared By (Name)
              </label>
              <input
                type="text"
                value={formData.preparedBy.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preparedBy: {
                      ...formData.preparedBy,
                      name: e.target.value,
                    },
                  })
                }
                className={ic("preparedByName")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.preparedBy.designation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preparedBy: {
                      ...formData.preparedBy,
                      designation: e.target.value,
                    },
                  })
                }
                className={ic("preparedByDesig")}
              />
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between items-center text-gray-600">
              <span className="text-sm font-semibold">Taxable Amount</span>
              <span className="font-bold">
                ₹ {totals.taxableSubtotal.toLocaleString()}
              </span>
            </div>
            {totals.fixedCharges > 0 && (
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-sm font-semibold">
                  Transportation / Lodging / Boarding
                  <span className="ml-1 text-xs font-normal text-gray-400">(excl. GST)</span>
                </span>
                <span className="font-bold">
                  ₹ {totals.fixedCharges.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-gray-600">
              <span className="text-sm font-semibold">
                GST ({formData.gstPercentage}%)
              </span>
              <span className="font-bold text-blue-600">
                ₹ {totals.gstAmount.toLocaleString()}
              </span>
            </div>
            <div className="pt-3 border-t-2 border-gray-100 flex justify-between items-center text-gray-900">
              <span className="text-lg font-bold">Total Amount</span>
              <span className="text-2xl font-black text-primary-600 font-mono">
                ₹ {totals.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-white border-t border-gray-200 shadow-xl z-10 flex justify-end gap-3 rounded-none lg:rounded-bl-[2rem] transition-all">
          <button
            type="button"
            onClick={() => navigate("/admin/quotations", { state: { activeTab: type } })}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-2"
          >
            <Ban size={18} /> Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit("Draft")}
            className="px-6 py-2.5 rounded-xl border border-gray-300 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileText size={18} />
            )}
            Save as Draft
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit("Final")}
            className="px-8 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {isEditing ? "Save as Final" : "Create as Final"}
          </button>
        </div>
      </div>
    </div>
  );
};
