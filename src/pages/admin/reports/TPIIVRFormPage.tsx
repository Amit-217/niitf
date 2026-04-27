import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import {
  createTPIIVRReport,
  updateTPIIVRReport,
  getTPIIVRReportById,
} from "../../../api/customerApi";
import { CustomerPickerBanner } from "../../../components/CustomerPickerBanner";
import api from "../../../api/axios";

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-gray-200 p-5 mb-5";
const sectionTitleClass =
  "text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100";

// ─── SelectWithOther ──────────────────────────────────────────────────────────

interface SelectWithOtherProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  otherValue: string;
  onOtherChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}

const SelectWithOther: React.FC<SelectWithOtherProps> = ({
  id,
  value,
  onChange,
  otherValue,
  onOtherChange,
  options,
  placeholder = "Select...",
}) => (
  <div className="space-y-1">
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    {value === "Other" && (
      <input
        type="text"
        value={otherValue}
        onChange={(e) => onOtherChange(e.target.value)}
        placeholder="Specify other value..."
        className={inputClass}
      />
    )}
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface InspectionItemRow {
  poLineNo: string;
  description: string;
  drgOrHeatNo: string;
  qtyOffered: string;
  qtyInspected: string;
  qtyAccepted: string;
  qtyHold: string;
  qtyReject: string;
  inspectionType: string;
}

interface RefDocRow {
  document: string;
  referenceNumber: string;
  revNo: string;
}

interface CalibRow {
  equipment: string;
  idNumber: string;
  calibrationDate: string;
  dueDate: string;
  nablCertified: string;
}

const emptyItem = (): InspectionItemRow => ({
  poLineNo: "",
  description: "",
  drgOrHeatNo: "",
  qtyOffered: "",
  qtyInspected: "",
  qtyAccepted: "",
  qtyHold: "",
  qtyReject: "",
  inspectionType: "",
});

const emptyRefDoc = (): RefDocRow => ({
  document: "",
  referenceNumber: "",
  revNo: "",
});

const emptyCalib = (): CalibRow => ({
  equipment: "",
  idNumber: "",
  calibrationDate: "",
  dueDate: "",
  nablCertified: "",
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export const TPIIVRFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const state = location.state as {
    customerId?: string;
    customerName?: string;
  } | null;
  const [customerId, setCustomerId] = useState(state?.customerId ?? "");
  const [customerName, setCustomerName] = useState(state?.customerName ?? "");

  const [saving, setSaving] = useState(false);

  // ── Header Fields ──
  const [irNo, setIrNo] = useState("");
  const [irRev, setIrRev] = useState("");
  const [dtOfInspection, setDtOfInspection] = useState("");
  const [client, setClient] = useState("");
  const [inspectionLocation, setInspectionLocation] = useState("");
  const [project, setProject] = useState("");
  const [appdQapNo, setAppdQapNo] = useState("");
  const [clientPoNo, setClientPoNo] = useState("");
  const [appdQapDt, setAppdQapDt] = useState("");
  const [poAmedNo, setPoAmedNo] = useState("");
  const [partName, setPartName] = useState("");
  const [poDate, setPoDate] = useState("");
  const [inspectionStage, setInspectionStage] = useState("");
  const [inspectionStageOther, setInspectionStageOther] = useState("");

  // ── Client Details ──
  const [clientRef, setClientRef] = useState("");
  const [clientRefOther, setClientRefOther] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [callDate, setCallDate] = useState("");
  const [inspAttDt, setInspAttDt] = useState("");

  // ── Vendor Details ──
  const [vendor, setVendor] = useState("");
  const [subVendor, setSubVendor] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");

  // ── Extra Visit ──
  const [extraVisitDate, setExtraVisitDate] = useState("");
  const [extraVisitComment, setExtraVisitComment] = useState("");

  // ── Inspection Items ──
  const [items, setItems] = useState<InspectionItemRow[]>([emptyItem()]);

  // ── Inspection Activities & Conclusion ──
  const [inspectionActivities, setInspectionActivities] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [conclusionOther, setConclusionOther] = useState("");

  // ── Reference Documents ──
  const [refDocs, setRefDocs] = useState<RefDocRow[]>([emptyRefDoc()]);

  // ── Calibration Status ──
  const [calibRows, setCalibRows] = useState<CalibRow[]>([emptyCalib()]);

  // ── Users for dropdown ──
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    api
      .get("/users?status=active&limit=100")
      .then((res: any) => setUsers(res.data ?? res ?? []))
      .catch(() => {});
  }, []);

  // ── Signatures ──
  const [vendorSignName, setVendorSignName] = useState("");
  const [vendorSignDate, setVendorSignDate] = useState("");
  const [niitSignName, setNiitSignName] = useState("");
  const [niitSignDate, setNiitSignDate] = useState("");

  // ── Load in edit mode ──
  useEffect(() => {
    if (!id) return;
    const toDate = (d?: string | null) => (d ? d.split("T")[0] : "");
    const fromOther = (
      val: string | undefined,
      opts: string[],
    ): [string, string] => {
      if (!val) return ["", ""];
      return opts.includes(val) ? [val, ""] : ["Other", val];
    };
    getTPIIVRReportById(id)
      .then((res: any) => {
        const r = (res as any).data ?? res;
        if (r.customerId) {
          if (typeof r.customerId === "object" && r.customerId._id) {
            setCustomerId(r.customerId._id);
            setCustomerName(r.customerId.companyName || "");
          } else {
            setCustomerId(r.customerId);
          }
        }
        setIrNo(r.irNo ?? "");
        setIrRev(r.irRev ?? "");
        setDtOfInspection(toDate(r.dtOfInspection));
        setClient(r.client ?? "");
        setInspectionLocation(r.inspectionLocation ?? "");
        setProject(r.project ?? "");
        setAppdQapNo(r.appdQapNo ?? "");
        setClientPoNo(r.clientPoNo ?? "");
        setAppdQapDt(toDate(r.appdQapDt));
        setPoAmedNo(r.poAmedNo ?? "");
        setPartName(r.partName ?? "");
        setPoDate(toDate(r.poDate));
        const [is_, isO] = fromOther(r.inspectionStage, [
          "UT IN P/M CONDITION",
          "STAGE",
          "FINAL",
          "STAGE & FINAL",
          "INCOMING",
          "IN-PROCESS",
          "DISPATCH",
          "Other",
        ]);
        setInspectionStage(is_);
        setInspectionStageOther(isO);
        const cd = r.clientDetails ?? {};
        const [cr, crO] = fromOther(cd.ref, [
          "By Mail",
          "By Phone",
          "By Email",
          "By Fax",
          "Other",
        ]);
        setClientRef(cr);
        setClientRefOther(crO);
        setClientContact(cd.contact ?? "");
        setCallDate(toDate(cd.callDate));
        setInspAttDt(toDate(cd.inspectionAttDt));
        const vd = r.vendorDetails ?? {};
        setVendor(vd.vendor ?? "");
        setSubVendor(vd.subVendor ?? "");
        setVendorContact(vd.contact ?? "");
        setVendorPhone(vd.phone ?? "");
        const ev = r.extraVisit ?? {};
        setExtraVisitDate(ev.date ?? "");
        setExtraVisitComment(ev.comment ?? "");
        if (r.inspectionItems?.length) {
          setItems(
            r.inspectionItems.map((i: any) => ({
              poLineNo: i.poLineNo ?? "",
              description: i.description ?? "",
              drgOrHeatNo: i.drgOrHeatNo ?? "",
              qtyOffered: String(i.qtyOffered ?? ""),
              qtyInspected: String(i.qtyInspected ?? ""),
              qtyAccepted: String(i.qtyAccepted ?? ""),
              qtyHold: String(i.qtyHold ?? ""),
              qtyReject: String(i.qtyReject ?? ""),
              inspectionType: i.inspectionType ?? "",
            })),
          );
        }
        setInspectionActivities(r.inspectionActivities ?? "");
        const conclusionOpts = [
          "Examination completed as per applicable standards. No rejectable indications observed in inspected items",
          "Examination completed as per applicable standards. Rejectable indications observed in inspected items",
          "Examination completed as per applicable process. No rejectable indications observed in inspected items",
          "Examination completed as per applicable process. Rejectable indications observed in inspected items",
          "Other",
        ];
        const [con, conO] = fromOther(r.conclusion ?? "", conclusionOpts);
        setConclusion(con);
        setConclusionOther(conO);
        setRefDocs(
          r.referenceDocuments?.length ? r.referenceDocuments : [emptyRefDoc()],
        );
        if (r.calibrationStatus?.length) {
          setCalibRows(
            r.calibrationStatus.map((c: any) => ({
              equipment: c.equipment ?? "",
              idNumber: c.idNumber ?? "",
              calibrationDate: toDate(c.calibrationDate),
              dueDate: toDate(c.dueDate),
              nablCertified: c.nablCertified ?? "",
            })),
          );
        }
        const sigs = r.signatures ?? {};
        setVendorSignName(sigs.vendor?.name ?? "");
        setVendorSignDate(toDate(sigs.vendor?.date));
        setNiitSignName(sigs.niit?.name ?? "");
        setNiitSignDate(toDate(sigs.niit?.date));
      })
      .catch(() => toast.error("Failed to load report."));
  }, [id]);

  // ── Helpers ──
  const resolve = (val: string, other: string) =>
    val === "Other" && other.trim() ? other.trim() : val;

  const updateItem = (idx: number, key: keyof InspectionItemRow, val: string) =>
    setItems((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateRefDoc = (idx: number, key: keyof RefDocRow, val: string) =>
    setRefDocs((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );
  const addRefDoc = () => setRefDocs((prev) => [...prev, emptyRefDoc()]);
  const removeRefDoc = (idx: number) =>
    setRefDocs((prev) => prev.filter((_, i) => i !== idx));

  const updateCalib = (idx: number, key: keyof CalibRow, val: string) =>
    setCalibRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );
  const addCalib = () => setCalibRows((prev) => [...prev, emptyCalib()]);
  const removeCalib = (idx: number) =>
    setCalibRows((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit ──
  const handleSubmit = async (status: "draft" | "final") => {
    if (!isEditMode && !customerId) {
      toast.error("Please select a customer first.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId,
        irNo: irNo.trim(),
        status,
        irRev,
        dtOfInspection: dtOfInspection || undefined,
        client,
        inspectionLocation,
        project,
        appdQapNo,
        clientPoNo,
        appdQapDt: appdQapDt || undefined,
        poAmedNo,
        partName,
        poDate: poDate || undefined,
        inspectionStage: resolve(inspectionStage, inspectionStageOther),
        clientDetails: {
          ref: resolve(clientRef, clientRefOther),
          contact: clientContact,
          callDate: callDate || undefined,
          inspectionAttDt: inspAttDt || undefined,
        },
        vendorDetails: {
          vendor,
          subVendor,
          contact: vendorContact,
          phone: vendorPhone,
        },
        extraVisit: {
          date: extraVisitDate,
          comment: extraVisitComment,
        },
        inspectionItems: items
          .filter((i) => i.description.trim())
          .map((i) => ({
            poLineNo: i.poLineNo,
            description: i.description,
            drgOrHeatNo: i.drgOrHeatNo,
            qtyOffered: Number(i.qtyOffered) || 0,
            qtyInspected: Number(i.qtyInspected) || 0,
            qtyAccepted: Number(i.qtyAccepted) || 0,
            qtyHold: Number(i.qtyHold) || 0,
            qtyReject: Number(i.qtyReject) || 0,
            inspectionType: i.inspectionType,
          })),
        inspectionActivities,
        conclusion: resolve(conclusion, conclusionOther) || undefined,
        referenceDocuments: refDocs.map((d) => ({
          document: d.document,
          referenceNumber: d.referenceNumber,
          revNo: d.revNo,
        })),
        calibrationStatus: calibRows
          .filter((c) => c.equipment.trim())
          .map((c) => ({
            equipment: c.equipment,
            idNumber: c.idNumber,
            calibrationDate: c.calibrationDate || undefined,
            dueDate: c.dueDate || undefined,
            nablCertified: c.nablCertified,
          })),
        signatures: {
          vendor: { name: vendorSignName, date: vendorSignDate || undefined },
          niit: { name: niitSignName, date: niitSignDate || undefined },
        },
      };
      if (id) {
        await updateTPIIVRReport(id, payload);
      } else {
        await createTPIIVRReport(payload);
      }
      toast.success(`IVR saved as ${status}.`);
      navigate(`/admin/customers/${customerId}`, {
        state: { activeTab: "reports", reportSubType: "tpi-ivr" },
      });
    } catch {
      toast.error("Failed to save report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Inspection Visit Report
          </h1>
          <p className="text-sm text-gray-500">{customerName}</p>
        </div>
      </div>

      {/* ── Missing Customer Banner ── */}
      {!customerId && (
        <CustomerPickerBanner
          onCustomerSelected={(id, name) => {
            setCustomerId(id);
            setCustomerName(name);
          }}
        />
      )}

      {/* ── I.R. No. ── */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>
              I.R No. {isEditMode ? "" : "(Auto-generated)"}
            </label>
            <input
              type="text"
              value={isEditMode ? irNo : "NIIT/... (Auto-generated)"}
              readOnly
              className={
                inputClass + " bg-gray-50 font-mono font-bold text-indigo-700"
              }
              placeholder="Auto-generated on save"
            />
          </div>
          <div>
            <label className={labelClass}>IR Rev.</label>
            <input
              type="text"
              value={irRev}
              onChange={(e) => setIrRev(e.target.value)}
              className={inputClass}
              placeholder="e.g. Rev.00"
            />
          </div>
          <div>
            <label className={labelClass}>Date of Inspection</label>
            <input
              type="date"
              value={dtOfInspection}
              onChange={(e) => setDtOfInspection(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Format No.</label>
            <input
              type="text"
              className={inputClass}
              defaultValue="NIIT-16 Rev.01"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* ── Job Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Job Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className={inputClass}
              placeholder="e.g. Metso Minerals (I) Pvt. Ltd."
            />
          </div>
          <div>
            <label className={labelClass}>Inspection Location</label>
            <input
              type="text"
              value={inspectionLocation}
              onChange={(e) => setInspectionLocation(e.target.value)}
              className={inputClass}
              placeholder="e.g. M/s Bharat Forge Ltd. Pune."
            />
          </div>
          <div>
            <label className={labelClass}>Project</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className={inputClass}
              placeholder="e.g. --"
            />
          </div>
          <div>
            <label className={labelClass}>Appd. QAP No.</label>
            <input
              type="text"
              value={appdQapNo}
              onChange={(e) => setAppdQapNo(e.target.value)}
              className={inputClass}
              placeholder="e.g. QAP/METSO/D56263 Rev.00"
            />
          </div>
          <div>
            <label className={labelClass}>Client PO No.</label>
            <input
              type="text"
              value={clientPoNo}
              onChange={(e) => setClientPoNo(e.target.value)}
              className={inputClass}
              placeholder="e.g. 7500188455"
            />
          </div>
          <div>
            <label className={labelClass}>Appd. QAP Date</label>
            <input
              type="date"
              value={appdQapDt}
              onChange={(e) => setAppdQapDt(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>PO Amed. No.</label>
            <input
              type="text"
              value={poAmedNo}
              onChange={(e) => setPoAmedNo(e.target.value)}
              className={inputClass}
              placeholder="e.g. ---"
            />
          </div>
          <div>
            <label className={labelClass}>Part Name</label>
            <input
              type="text"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              className={inputClass}
              placeholder="e.g. SHAFT STEDIMENT"
            />
          </div>
          <div>
            <label className={labelClass}>PO Date</label>
            <input
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Inspection Stage</label>
            <SelectWithOther
              value={inspectionStage}
              onChange={setInspectionStage}
              otherValue={inspectionStageOther}
              onOtherChange={setInspectionStageOther}
              options={[
                "UT IN P/M CONDITION",
                "STAGE",
                "FINAL",
                "STAGE & FINAL",
                "INCOMING",
                "IN-PROCESS",
                "DISPATCH",
                "Other",
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Client & Vendor Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Client &amp; Vendor Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Client Details */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
              Client Details
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Ref</label>
                <SelectWithOther
                  value={clientRef}
                  onChange={setClientRef}
                  otherValue={clientRefOther}
                  onOtherChange={setClientRefOther}
                  options={[
                    "By Mail",
                    "By Phone",
                    "By Email",
                    "By Fax",
                    "Other",
                  ]}
                />
              </div>
              <div>
                <label className={labelClass}>Contact</label>
                <input
                  type="text"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Mr. Abdul Najmi"
                />
              </div>
              <div>
                <label className={labelClass}>Call Date</label>
                <input
                  type="date"
                  value={callDate}
                  onChange={(e) => setCallDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Inspection Att. Date</label>
                <input
                  type="date"
                  value={inspAttDt}
                  onChange={(e) => setInspAttDt(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          {/* Vendor Details */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
              Vendor Details
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Vendor</label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Bharat Forge Ltd. Mundhwa, Pune."
                />
              </div>
              <div>
                <label className={labelClass}>Sub Vendor</label>
                <input
                  type="text"
                  value={subVendor}
                  onChange={(e) => setSubVendor(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. --"
                />
              </div>
              <div>
                <label className={labelClass}>Contact</label>
                <input
                  type="text"
                  value={vendorContact}
                  onChange={(e) => setVendorContact(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Mr. Sanskar Karav"
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="text"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. +91 8483024812"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Extra Visit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelClass}>Extra Visit / Date</label>
            <input
              type="text"
              value={extraVisitDate}
              onChange={(e) => setExtraVisitDate(e.target.value)}
              className={inputClass}
              placeholder="e.g. NA"
            />
          </div>
          <div>
            <label className={labelClass}>Comment</label>
            <input
              type="text"
              value={extraVisitComment}
              onChange={(e) => setExtraVisitComment(e.target.value)}
              className={inputClass}
              placeholder="e.g. NA"
            />
          </div>
        </div>
      </div>

      {/* ── Inspection Items ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
            Inspection Items
          </h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                <th className="border border-gray-200 px-2 py-2 text-left">
                  PO Line No.
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Description
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Drg No. / Heat No.
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center">
                  Offered
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center">
                  Inspected
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center">
                  Accepted
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center">
                  Hold
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center">
                  Reject
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Insp. Type
                </th>
                <th className="border border-gray-200 px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.poLineNo}
                      onChange={(e) =>
                        updateItem(idx, "poLineNo", e.target.value)
                      }
                      className={inputClass}
                      placeholder="01"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) =>
                        updateItem(idx, "description", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.drgOrHeatNo}
                      onChange={(e) =>
                        updateItem(idx, "drgOrHeatNo", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      value={row.qtyOffered}
                      onChange={(e) =>
                        updateItem(idx, "qtyOffered", e.target.value)
                      }
                      className={inputClass + " w-16"}
                      min="0"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      value={row.qtyInspected}
                      onChange={(e) =>
                        updateItem(idx, "qtyInspected", e.target.value)
                      }
                      className={inputClass + " w-16"}
                      min="0"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      value={row.qtyAccepted}
                      onChange={(e) =>
                        updateItem(idx, "qtyAccepted", e.target.value)
                      }
                      className={inputClass + " w-16"}
                      min="0"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      value={row.qtyHold}
                      onChange={(e) =>
                        updateItem(idx, "qtyHold", e.target.value)
                      }
                      className={inputClass + " w-16"}
                      min="0"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      value={row.qtyReject}
                      onChange={(e) =>
                        updateItem(idx, "qtyReject", e.target.value)
                      }
                      className={inputClass + " w-16"}
                      min="0"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={row.inspectionType}
                      onChange={(e) =>
                        updateItem(idx, "inspectionType", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      <option>STAGE</option>
                      <option>FINAL</option>
                      <option>STAGE / FINAL</option>
                      <option>INCOMING</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Inspection Activities & Conclusion ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          Inspection Activities &amp; Conclusion
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Inspection Activities</label>
            <textarea
              value={inspectionActivities}
              onChange={(e) => setInspectionActivities(e.target.value)}
              rows={5}
              className={inputClass}
              placeholder="Describe inspection activities performed..."
            />
          </div>
          <div>
            <label className={labelClass}>Conclusion</label>
            <SelectWithOther
              value={conclusion}
              onChange={setConclusion}
              otherValue={conclusionOther}
              onOtherChange={setConclusionOther}
              options={[
                "Examination completed as per applicable standards. No rejectable indications observed in inspected items",
                "Examination completed as per applicable standards. Rejectable indications observed in inspected items",
                "Examination completed as per applicable process. No rejectable indications observed in inspected items",
                "Examination completed as per applicable process. Rejectable indications observed in inspected items",
                "Other",
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Reference Documents ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
            Reference Documents for Inspection
          </h2>
          <button
            type="button"
            onClick={addRefDoc}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                <th className="border border-gray-200 px-2 py-2 text-left w-40">
                  Document
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Reference Number
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left w-32">
                  Rev. No.
                </th>
                <th className="border border-gray-200 px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {refDocs.map((doc, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={doc.document}
                      onChange={(e) =>
                        updateRefDoc(idx, "document", e.target.value)
                      }
                      className={inputClass}
                      placeholder="e.g. Drawing"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={doc.referenceNumber}
                      onChange={(e) =>
                        updateRefDoc(idx, "referenceNumber", e.target.value)
                      }
                      className={inputClass}
                      placeholder="e.g. xxxx"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={doc.revNo}
                      onChange={(e) =>
                        updateRefDoc(idx, "revNo", e.target.value)
                      }
                      className={inputClass}
                      placeholder="e.g. 00"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    {refDocs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRefDoc(idx)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Calibration Status ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
            Calibration Status of Instruments
          </h2>
          <button
            type="button"
            onClick={addCalib}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Equipment / Instrument
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  I.D. Number
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Calibration Date
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Due Date
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  NABL Certified
                </th>
                <th className="border border-gray-200 px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {calibRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.equipment}
                      onChange={(e) =>
                        updateCalib(idx, "equipment", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.idNumber}
                      onChange={(e) =>
                        updateCalib(idx, "idNumber", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="date"
                      value={row.calibrationDate}
                      onChange={(e) =>
                        updateCalib(idx, "calibrationDate", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) =>
                        updateCalib(idx, "dueDate", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={row.nablCertified}
                      onChange={(e) =>
                        updateCalib(idx, "nablCertified", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    {calibRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCalib(idx)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Signatures ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Signatures</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* For Vendor */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
              For Vendor
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Vendor Name</label>
                <input
                  type="text"
                  value={vendorSignName}
                  onChange={(e) => setVendorSignName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Mr. Ravindra Naral"
                />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={vendorSignDate}
                  onChange={(e) => setVendorSignDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          {/* For NIIT Surveyor */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
              For NIIT Surveyor, Baramati
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name</label>
                <select
                  value={niitSignName}
                  onChange={(e) => setNiitSignName(e.target.value)}
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Select....</option>
                  {users.map((u) => (
                    <option key={u._id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={niitSignDate}
                  onChange={(e) => setNiitSignDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSubmit("draft")}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save as Draft"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSubmit("final")}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save as Final"}
        </button>
      </div>
    </div>
  );
};
