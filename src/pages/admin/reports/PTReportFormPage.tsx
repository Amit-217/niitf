import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import {
  createPTReport,
  updatePTReport,
  getPTReportById,
} from "../../../api/customerApi";
import { getApiErrorMessage } from "../../../api/error";
import api from "../../../api/axios";
import { CustomerPickerBanner } from "../../../components/CustomerPickerBanner";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const inputErrorClass =
  "w-full border-2 border-red-400 bg-red-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-gray-200 p-5 mb-5";
const sectionTitleClass =
  "text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100";

// ─── SelectWithCustom ─────────────────────────────────────────────────────────

interface SelectWithCustomProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  customValue: string;
  onCustomChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  error?: boolean;
}

const SelectWithCustom: React.FC<SelectWithCustomProps> = ({
  id,
  value,
  onChange,
  customValue,
  onCustomChange,
  options,
  placeholder = "Select...",
  error = false,
}) => (
  <div className="space-y-1">
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={error ? inputErrorClass : inputClass}
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
        value={customValue}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder="Specify other value..."
        className={error && !customValue.trim() ? inputErrorClass : inputClass}
      />
    )}
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ObsRow {
  srNo: number;
  jobDescription: string;
  drawingOrJointNo: string;
  size: string;
  quantity: string;
  interpretation: string;
  evaluation: string;
}

const emptyObs = (): ObsRow => ({
  srNo: 1,
  jobDescription: "",
  drawingOrJointNo: "",
  size: "",
  quantity: "",
  interpretation: "",
  evaluation: "",
});

interface InspRow {
  name: string;
  qualification: string;
  designation: string;
  signature: string;
  idNo: string;
  date: string;
}

const emptyInspector = (): InspRow => ({
  name: "",
  qualification: "PT NDE Level II",
  designation: "",
  signature: "",
  idNo: "",
  date: "",
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PTReportFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const state = location.state as {
    customerId?: string;
    customerName?: string;
    from?: string;
  } | null;
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(state?.customerId ?? "");
  const [customerName, setCustomerName] = useState(state?.customerName ?? "");

  // ── Job Details ──
  const [reportNo, setReportNo] = useState("");
  const jobCustomer = customerName;
  const [jobClient, setJobClient] = useState("");
  const [jobProject, setJobProject] = useState("");
  const [jobReportDate, setJobReportDate] = useState("");
  const [jobInspectionDate, setJobInspectionDate] = useState("");
  const [jobInspectionEndDate, setJobInspectionEndDate] = useState("");
  const [jobInspectionTime, setJobInspectionTime] = useState("");
  const [jobRefStd, setJobRefStd] = useState("");
  const [jobRefStdCustom, setJobRefStdCustom] = useState("");
  const [jobAcceptance, setJobAcceptance] = useState("");
  const [jobAcceptanceCustom, setJobAcceptanceCustom] = useState("");
  const [jobMaterial, setJobMaterial] = useState("");
  const [jobStage, setJobStage] = useState("");
  const [jobThickness, setJobThickness] = useState("");
  const [jobExtent, setJobExtent] = useState("");
  const [jobExtentCustom, setJobExtentCustom] = useState("");
  const [jobSurface, setJobSurface] = useState("");
  const [jobJointType, setJobJointType] = useState("");
  const [jobSurfaceTemp, setJobSurfaceTemp] = useState("");
  const [jobWeldingProcess, setJobWeldingProcess] = useState("");

  // ── Method Details ──
  const [penetrantMethod, setPenetrantMethod] = useState("");
  const [removalMethod, setRemovalMethod] = useState("");

  // ── Consumables ──
  const [penMfr, setPenMfr] = useState("");
  const [penMfrCustom, setPenMfrCustom] = useState("");
  const [penBatch, setPenBatch] = useState("");
  const [penExpiry, setPenExpiry] = useState("");

  const [devMfr, setDevMfr] = useState("");
  const [devMfrCustom, setDevMfrCustom] = useState("");
  const [devBatch, setDevBatch] = useState("");
  const [devExpiry, setDevExpiry] = useState("");

  const [cleanMfr, setCleanMfr] = useState("");
  const [cleanMfrCustom, setCleanMfrCustom] = useState("");
  const [cleanBatch, setCleanBatch] = useState("");
  const [cleanExpiry, setCleanExpiry] = useState("");

  // ── Method Description ──
  const [dwellTime, setDwellTime] = useState("");
  const [lightIntensity, setLightIntensity] = useState("");
  const [developingTime, setDevelopingTime] = useState("");
  const [lightEquip, setLightEquip] = useState("");
  const [lightEquipCustom, setLightEquipCustom] = useState("");
  const [postCleaning, setPostCleaning] = useState("");
  const [dryingTime, setDryingTime] = useState("");
  const [dryingTimeCustom, setDryingTimeCustom] = useState("");

  // ── Observations ──
  const [observations, setObservations] = useState<ObsRow[]>([emptyObs()]);

  // -- Conclusion --
  const [conclusion, setConclusion] = useState("");
  const [conclusionCustom, setConclusionCustom] = useState("");

  // ── Users for inspector dropdown ──
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    api
      .get("/users?status=active&limit=100")
      .then((res: any) => setUsers(res.data ?? res ?? []))
      .catch(() => {});
  }, []);

  // ── Final Section ──
  const [inspectors, setInspectors] = useState<InspRow[]>([emptyInspector()]);
  const [custName, setCustName] = useState("");
  const [custDesig, setCustDesig] = useState("");
  const [custSig, setCustSig] = useState("");
  const [custIdNo, setCustIdNo] = useState("");
  const [custDate, setCustDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientDesig, setClientDesig] = useState("");
  const [clientSig, setClientSig] = useState("");
  const [clientIdNo, setClientIdNo] = useState("");
  const [clientDate, setClientDate] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

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
    getPTReportById(id)
      .then((res: any) => {
        const r = (res as any).data ?? res;
        setCustomerId(
          typeof r.customerId === "object"
            ? (r.customerId?._id ?? "")
            : (r.customerId ?? ""),
        );
        setCustomerName(r.jobDetails?.customer ?? "");
        setReportNo(r.reportNo ?? "");
        const jd = r.jobDetails ?? {};
        setJobClient(jd.client ?? "");
        setJobProject(jd.project ?? "");
        setJobReportDate(toDate(jd.reportDate));
        setJobInspectionDate(toDate(jd.inspectionDate));
        setJobInspectionEndDate(toDate(jd.inspectionEndDate));
        setJobInspectionTime(jd.inspectionTime ?? "");
        const refStdOpts = ["ASME Sec. V, Article VI", "ASTM E 165", "Other"];
        const [rs, rsC] = fromOther(jd.referenceStandard, refStdOpts);
        setJobRefStd(rs);
        setJobRefStdCustom(rsC);
        const accOpts = [
          "ASME Sec. VIII Div. 1, Appendix 7",
          "ASME Sec. VIII Div. 1, Appendix 8",
          "Other",
        ];
        const [acc, accC] = fromOther(jd.acceptanceCriteria, accOpts);
        setJobAcceptance(acc);
        setJobAcceptanceCustom(accC);
        setJobMaterial(jd.material ?? "");
        setJobStage(jd.stageOfInspection ?? "");
        setJobThickness(jd.thickness ?? "");
        const extOpts = [
          "10%",
          "100%",
          "To the maximum extent possible",
          "Other",
        ];
        const [ext, extC] = fromOther(jd.extentOfExamination, extOpts);
        setJobExtent(ext);
        setJobExtentCustom(extC);
        setJobSurface(jd.surfaceCondition ?? "");
        setJobJointType(jd.typeOfJoint ?? "");
        setJobSurfaceTemp(jd.surfaceTemperature ?? "");
        setJobWeldingProcess(jd.weldingProcess ?? "");
        const met = r.methodDetails ?? {};
        setPenetrantMethod(met.penetrantMethod ?? "");
        setRemovalMethod(met.excessPenetrantRemovalMethod ?? "");
        const mfrOpts = [
          "Pradeep",
          "Dyeglo",
          "Ferrochem",
          "MR Chem",
          "Magnaflux",
          "Other",
        ];
        const con = r.consumablesDetails ?? {};
        const pen = con.penetrant ?? {};
        const [pMfr, pMfrC] = fromOther(pen.manufacturer, mfrOpts);
        setPenMfr(pMfr);
        setPenMfrCustom(pMfrC);
        setPenBatch(pen.batch ?? "");
        setPenExpiry(pen.expiryDate ?? "");
        const dev = con.developer ?? {};
        const [dMfr, dMfrC] = fromOther(dev.manufacturer, mfrOpts);
        setDevMfr(dMfr);
        setDevMfrCustom(dMfrC);
        setDevBatch(dev.batch ?? "");
        setDevExpiry(dev.expiryDate ?? "");
        const cln = con.cleaner ?? {};
        const [cMfr, cMfrC] = fromOther(cln.manufacturer, mfrOpts);
        setCleanMfr(cMfr);
        setCleanMfrCustom(cMfrC);
        setCleanBatch(cln.batch ?? "");
        setCleanExpiry(cln.expiryDate ?? "");
        const mdesc = r.methodDescription ?? {};
        setDwellTime(mdesc.dwellTime ?? "");
        setLightIntensity(mdesc.lightIntensity ?? "");
        setDevelopingTime(mdesc.developingTime ?? "");
        const leOpts = ["60 W Bulb", "NA", "Other"];
        const [le, leC] = fromOther(mdesc.lightEquipmentUsed, leOpts);
        setLightEquip(le);
        setLightEquipCustom(leC);
        setPostCleaning(mdesc.postCleaning ?? "");
        const dtOpts = ["10 Min", "NA", "Other"];
        const [dt, dtC] = fromOther(mdesc.dryingTime, dtOpts);
        setDryingTime(dt);
        setDryingTimeCustom(dtC);
        if (r.observations?.length) {
          setObservations(
            r.observations.map((o: any) => ({
              srNo: o.srNo,
              jobDescription: o.jobDescription ?? "",
              drawingOrJointNo: o.drawingOrJointNo ?? "",
              size: o.size ?? "",
              quantity: String(o.quantity ?? ""),
              interpretation: o.interpretation ?? "",
              evaluation: o.evaluation ?? o.remark ?? o.result ?? "",
            })),
          );
        }
        const conclusionOpts = [
          "Examination completed as per applicable standards. No rejectable indications observed in inspected items",
          "Examination completed as per applicable standards. Rejectable indications observed in inspected items",
          "Examination completed as per applicable process. No rejectable indications observed in inspected items",
          "Examination completed as per applicable process. Rejectable indications observed in inspected items",
          "Other",
        ];
        const [concl, conclC] = fromOther(r.conclusion ?? "", conclusionOpts);
        setConclusion(concl);
        setConclusionCustom(conclC);
        const fs = r.finalSection ?? {};
        setInspectors(
          fs.inspector?.length
            ? fs.inspector.map((i: any) => ({
                name: i.name ?? "",
                qualification: i.qualification || "PT NDE Level II",
                designation: i.designation ?? "",
                signature: i.signature ?? "",
                idNo: i.idNo ?? "",
                date: toDate(i.date),
              }))
            : [emptyInspector()],
        );
        const cust = fs.customer ?? {};
        setCustName(cust.name ?? "");
        setCustDesig(cust.designation ?? "");
        setCustSig(cust.signature ?? "");
        setCustIdNo(cust.idNo ?? "");
        setCustDate(toDate(cust.date));
        const cli = fs.clientOrTPI ?? {};
        setClientName(cli.name ?? "");
        setClientDesig(cli.designation ?? "");
        setClientSig(cli.signature ?? "");
        setClientIdNo(cli.idNo ?? "");
        setClientDate(toDate(cli.date));
      })
      .catch(() => toast.error("Failed to load report."));
  }, [id]);

  // -- Helpers --
  const resolve = (val: string, custom: string) =>
    val === "Other" && custom.trim() ? custom.trim() : val;

  const getFieldValue = (key: string): string => {
    const map: Record<string, string> = {
      jobClient,
      jobProject,
      jobReportDate,
      jobInspectionDate,
      jobInspectionEndDate,
      jobMaterial,
      jobThickness,
      dwellTime,
      lightIntensity,
      developingTime,
      penBatch,
      penExpiry,
      devBatch,
      devExpiry,
      cleanBatch,
      cleanExpiry,
      jobStage,
      jobJointType,
      jobSurface,
      jobWeldingProcess,
      jobSurfaceTemp,
      penetrantMethod,
      removalMethod,
      postCleaning,
      jobRefStd: jobRefStd === "Other" ? jobRefStdCustom : jobRefStd,
      jobAcceptance:
        jobAcceptance === "Other" ? jobAcceptanceCustom : jobAcceptance,
      jobExtent: jobExtent === "Other" ? jobExtentCustom : jobExtent,
      penMfr: penMfr === "Other" ? penMfrCustom : penMfr,
      devMfr: devMfr === "Other" ? devMfrCustom : devMfr,
      cleanMfr: cleanMfr === "Other" ? cleanMfrCustom : cleanMfr,
      lightEquip: lightEquip === "Other" ? lightEquipCustom : lightEquip,
      dryingTime: dryingTime === "Other" ? dryingTimeCustom : dryingTime,
      conclusion: conclusion === "Other" ? conclusionCustom : conclusion,
      inspectorQualification_0: inspectors[0]?.qualification ?? "",
      inspectorDesignation_0: inspectors[0]?.designation ?? "",
      inspectorDate_0: inspectors[0]?.date ?? "",
      custName,
      custDesig,
      custDate,
      clientName,
      clientDesig,
      clientDate,
    };
    return map[key] ?? "";
  };
  const hasError = (key: string) => !!errors[key] && !getFieldValue(key);
  const fc = (key: string) => (hasError(key) ? inputErrorClass : inputClass);

  const updateObs = (idx: number, key: keyof ObsRow, val: string) =>
    setObservations((prev) =>
      prev.map((row, i) => {
        if (i === idx) {
          const updated = { ...row, [key]: val };
          if (key === "interpretation") {
            if (val === "No relevant Indication Found") {
              updated.evaluation = "Accepted";
            } else if (val === "Relevant Indication Found") {
              updated.evaluation = "Not Accepted";
            } else {
              updated.evaluation = "";
            }
          }
          return updated;
        }
        return row;
      }),
    );

  const addObs = () =>
    setObservations((prev) => [
      ...prev,
      { ...emptyObs(), srNo: prev.length + 1 },
    ]);

  const removeObs = (idx: number) =>
    setObservations((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((row, i) => ({ ...row, srNo: i + 1 })),
    );

  const updateInsp = (idx: number, key: keyof InspRow, value: string) => {
    setInspectors((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row)),
    );
  };
  const addInspector = () =>
    setInspectors((prev) => [...prev, emptyInspector()]);
  const removeInspector = (idx: number) =>
    setInspectors((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit ──
  const handleSubmit = async (status: "draft" | "final") => {
    if (!customerId) {
      toast.error("Customer ID is missing.");
      return;
    }
    if (!isEditMode && !customerId) {
      toast.error("Please select a customer first.");
      return;
    }

    if (status === "final") {
      setErrors({});
    }

    setSaving(true);
    try {
      const payload = {
        customerId,
        reportNo: reportNo.trim(),
        status,
        jobDetails: {
          customer: jobCustomer,
          client: jobClient,
          project: jobProject,
          reportDate: jobReportDate || undefined,
          inspectionDate: jobInspectionDate || undefined,
          inspectionEndDate: jobInspectionEndDate || undefined,
          inspectionTime: jobInspectionTime,
          referenceStandard: resolve(jobRefStd, jobRefStdCustom),
          acceptanceCriteria: resolve(jobAcceptance, jobAcceptanceCustom),
          material: jobMaterial,
          stageOfInspection: jobStage || undefined,
          thickness: jobThickness,
          extentOfExamination: resolve(jobExtent, jobExtentCustom),
          surfaceCondition: jobSurface,
          typeOfJoint: jobJointType || undefined,
          surfaceTemperature: jobSurfaceTemp,
          weldingProcess: jobWeldingProcess || undefined,
        },
        methodDetails: {
          penetrantMethod: penetrantMethod || undefined,
          excessPenetrantRemovalMethod: removalMethod || undefined,
        },
        consumablesDetails: {
          penetrant: {
            manufacturer: resolve(penMfr, penMfrCustom),
            batch: penBatch,
            expiryDate: penExpiry,
          },
          developer: {
            manufacturer: resolve(devMfr, devMfrCustom),
            batch: devBatch,
            expiryDate: devExpiry,
          },
          cleaner: {
            manufacturer: resolve(cleanMfr, cleanMfrCustom),
            batch: cleanBatch,
            expiryDate: cleanExpiry,
          },
        },
        methodDescription: {
          dwellTime,
          lightIntensity,
          developingTime,
          lightEquipmentUsed: resolve(lightEquip, lightEquipCustom),
          postCleaning,
          dryingTime: resolve(dryingTime, dryingTimeCustom),
        },
        observations: observations
          .filter((o) => o.jobDescription.trim())
          .map((o) => ({
            srNo: o.srNo,
            jobDescription: o.jobDescription,
            drawingOrJointNo: o.drawingOrJointNo,
            size: o.size,
            quantity: Number(o.quantity) || 0,
            interpretation: o.interpretation || "",
            evaluation: o.evaluation || "",
          })),
        conclusion: resolve(conclusion, conclusionCustom) || undefined,
        finalSection: {
          examinedBy: "National Industrial Inspection And Training",
          inspector: inspectors
            .filter((i) => i.name.trim())
            .map((i) => ({ ...i, date: i.date || undefined })),
          customer: {
            name: custName,
            designation: custDesig,
            signature: custSig,
            idNo: custIdNo,
            date: custDate || undefined,
          },
          clientOrTPI: {
            name: clientName,
            designation: clientDesig,
            signature: clientSig,
            idNo: clientIdNo,
            date: clientDate || undefined,
          },
        },
      };
      if (id) {
        await updatePTReport(id, payload);
      } else {
        await createPTReport(payload);
      }

      toast.success(`PT Report saved as ${status}.`);
      if (state?.from === "reports-list") {
        navigate("/admin/reports");
      } else {
        navigate(`/admin/customers/${customerId}`, {
          state: { activeTab: "reports", reportSubType: "pt" },
        });
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to save report. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const mfrOptions = [
    "Pradeep",
    "Dyeglo",
    "Ferrochem",
    "MR Chem",
    "Magnaflux",
    "Other",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
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
            Liquid Penetrant Testing Report
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

      {/* Report No. */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Report No. {isEditMode ? "" : "(Auto-generated)"}
            </label>
            <input
              type="text"
              value={isEditMode ? reportNo : "NIIT/... (Auto-generated)"}
              readOnly
              className={
                inputClass + " bg-gray-50 font-mono font-bold text-indigo-700"
              }
              placeholder="Auto-generated on save"
            />
          </div>
          <div>
            <label className={labelClass}>Format No.</label>
            <input
              type="text"
              className={inputClass}
              defaultValue="FMT-NDT-PT-01"
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
            <label className={labelClass}>Customer</label>
            <input
              type="text"
              value={jobCustomer}
              disabled
              className={inputClass + " bg-gray-100 cursor-not-allowed"}
            />
          </div>
          <div>
            <label className={labelClass}>Client</label>
            <input
              type="text"
              value={jobClient}
              onChange={(e) => setJobClient(e.target.value)}
              className={fc("jobClient")}
            />
          </div>
          <div>
            <label className={labelClass}>Project</label>
            <input
              type="text"
              value={jobProject}
              onChange={(e) => setJobProject(e.target.value)}
              className={fc("jobProject")}
              placeholder="e.g. OIL COOLER FOR GEAR BOX"
            />
          </div>
          <div>
            <label className={labelClass}>Report Date</label>
            <input
              type="date"
              value={jobReportDate}
              onChange={(e) => setJobReportDate(e.target.value)}
              className={fc("jobReportDate")}
            />
          </div>
          <div>
            <label className={labelClass}>Inspection Start Date</label>
            <input
              type="date"
              value={jobInspectionDate}
              onChange={(e) => setJobInspectionDate(e.target.value)}
              className={fc("jobInspectionDate")}
            />
          </div>
          <div>
            <label className={labelClass}>Inspection End Date</label>
            <input
              type="date"
              value={jobInspectionEndDate}
              onChange={(e) => setJobInspectionEndDate(e.target.value)}
              className={fc("jobInspectionEndDate")}
            />
          </div>
          <div>
            <label className={labelClass}>Reference Standard</label>
            <SelectWithCustom
              value={jobRefStd}
              onChange={setJobRefStd}
              customValue={jobRefStdCustom}
              onCustomChange={setJobRefStdCustom}
              options={["ASME Sec. V, Article VI", "ASTM E 165", "Other"]}
              error={hasError("jobRefStd")}
            />
          </div>
          <div>
            <label className={labelClass}>Acceptance Criteria</label>
            <SelectWithCustom
              value={jobAcceptance}
              onChange={setJobAcceptance}
              customValue={jobAcceptanceCustom}
              onCustomChange={setJobAcceptanceCustom}
              options={[
                "ASME Sec. VIII Div. 1, Appendix 7",
                "ASME Sec. VIII Div. 1, Appendix 8",
                "Other",
              ]}
              error={hasError("jobAcceptance")}
            />
          </div>
          <div>
            <label className={labelClass}>Stage of Inspection</label>
            <select
              value={jobStage}
              onChange={(e) => setJobStage(e.target.value)}
              className={fc("jobStage")}
            >
              <option value="">Select...</option>
              <option>After Welding</option>
              <option>After Casting</option>
              <option>After Machining</option>
              <option>After Forging</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Material</label>
            <input
              type="text"
              value={jobMaterial}
              onChange={(e) => setJobMaterial(e.target.value)}
              className={fc("jobMaterial")}
              placeholder="e.g. IS 2062 E250 BR"
            />
          </div>
          <div>
            <label className={labelClass}>Extent of Examination</label>
            <SelectWithCustom
              value={jobExtent}
              onChange={setJobExtent}
              customValue={jobExtentCustom}
              onCustomChange={setJobExtentCustom}
              options={[
                "10%",
                "100%",
                "To the maximum extent possible",
                "Other",
              ]}
              error={hasError("jobExtent")}
            />
          </div>
          <div>
            <label className={labelClass}>Thickness</label>
            <input
              type="text"
              value={jobThickness}
              onChange={(e) => setJobThickness(e.target.value)}
              className={fc("jobThickness")}
              placeholder="e.g. 6, 12 & 16 MM"
            />
          </div>
          <div>
            <label className={labelClass}>Type of Joint</label>
            <select
              value={jobJointType}
              onChange={(e) => setJobJointType(e.target.value)}
              className={fc("jobJointType")}
            >
              <option value="">Select...</option>
              <option>Butt</option>
              <option>Corner</option>
              <option>T Joint</option>
              <option>NA</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Surface Condition</label>
            <select
              value={jobSurface}
              onChange={(e) => setJobSurface(e.target.value)}
              className={fc("jobSurface")}
            >
              <option value="">Select...</option>
              <option>Smooth</option>
              <option>Rough</option>
              <option>Ground and polished</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Welding Process</label>
            <select
              value={jobWeldingProcess}
              onChange={(e) => setJobWeldingProcess(e.target.value)}
              className={fc("jobWeldingProcess")}
            >
              <option value="">Select...</option>
              <option>SMAW</option>
              <option>GMAW</option>
              <option>FCAW</option>
              <option>SAW</option>
              <option>GTAW</option>
              <option>MAG</option>
              <option>N/A</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Surface Temperature</label>
            <select
              value={jobSurfaceTemp}
              onChange={(e) => setJobSurfaceTemp(e.target.value)}
              className={fc("jobSurfaceTemp")}
            >
              <option value="">Select...</option>
              <option>Room Temperature</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Method Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Method Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Penetrant Method</label>
            <select
              value={penetrantMethod}
              onChange={(e) => setPenetrantMethod(e.target.value)}
              className={fc("penetrantMethod")}
            >
              <option value="">Select...</option>
              <option>Visible Method</option>
              <option>Fluorescent</option>
              <option>Dual</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>
              Excess Penetrant Removal Method
            </label>
            <select
              value={removalMethod}
              onChange={(e) => setRemovalMethod(e.target.value)}
              className={fc("removalMethod")}
            >
              <option value="">Select...</option>
              <option>Solvent Removal</option>
              <option>Water Washable</option>
              <option>Post Emulsifiable</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Consumables Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Consumables Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 w-28">
                  Material
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                  Manufacture
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                  Batch No.
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                  Expiry Date
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: "Penetrant",
                  mfr: penMfr,
                  setMfr: setPenMfr,
                  mfrC: penMfrCustom,
                  setMfrC: setPenMfrCustom,
                  batch: penBatch,
                  setBatch: setPenBatch,
                  expiry: penExpiry,
                  setExpiry: setPenExpiry,
                  mfrKey: "penMfr",
                  batchKey: "penBatch",
                  expiryKey: "penExpiry",
                },
                {
                  label: "Developer",
                  mfr: devMfr,
                  setMfr: setDevMfr,
                  mfrC: devMfrCustom,
                  setMfrC: setDevMfrCustom,
                  batch: devBatch,
                  setBatch: setDevBatch,
                  expiry: devExpiry,
                  setExpiry: setDevExpiry,
                  mfrKey: "devMfr",
                  batchKey: "devBatch",
                  expiryKey: "devExpiry",
                },
                {
                  label: "Cleaner",
                  mfr: cleanMfr,
                  setMfr: setCleanMfr,
                  mfrC: cleanMfrCustom,
                  setMfrC: setCleanMfrCustom,
                  batch: cleanBatch,
                  setBatch: setCleanBatch,
                  expiry: cleanExpiry,
                  setExpiry: setCleanExpiry,
                  mfrKey: "cleanMfr",
                  batchKey: "cleanBatch",
                  expiryKey: "cleanExpiry",
                },
              ].map((row) => (
                <tr key={row.label}>
                  <td className="border border-gray-200 px-3 py-2 font-medium text-gray-600">
                    {row.label}
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <SelectWithCustom
                      value={row.mfr}
                      onChange={row.setMfr}
                      customValue={row.mfrC}
                      onCustomChange={row.setMfrC}
                      options={mfrOptions}
                      error={hasError(row.mfrKey)}
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="text"
                      value={row.batch}
                      onChange={(e) => row.setBatch(e.target.value)}
                      className={fc(row.batchKey)}
                      placeholder="Batch No."
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      type="text"
                      value={row.expiry}
                      onChange={(e) => row.setExpiry(e.target.value)}
                      className={fc(row.expiryKey)}
                      placeholder="e.g. 08/26"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Method Description ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Method Description</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Dwell Time</label>
            <input
              type="text"
              value={dwellTime}
              onChange={(e) => setDwellTime(e.target.value)}
              className={fc("dwellTime")}
              placeholder="e.g. 7 to 10 Min"
            />
          </div>
          <div>
            <label className={labelClass}>Light Intensity</label>
            <input
              type="text"
              value={lightIntensity}
              onChange={(e) => setLightIntensity(e.target.value)}
              className={fc("lightIntensity")}
              placeholder="e.g. 1250 lux"
            />
          </div>
          <div>
            <label className={labelClass}>Developing Time</label>
            <input
              type="text"
              value={developingTime}
              onChange={(e) => setDevelopingTime(e.target.value)}
              className={fc("developingTime")}
              placeholder="e.g. 15-20 Min"
            />
          </div>
          <div>
            <label className={labelClass}>Light Equipment Used</label>
            <SelectWithCustom
              value={lightEquip}
              onChange={setLightEquip}
              customValue={lightEquipCustom}
              onCustomChange={setLightEquipCustom}
              options={["60 W Bulb", "NA", "Other"]}
              error={hasError("lightEquip")}
            />
          </div>
          <div>
            <label className={labelClass}>Post Cleaning</label>
            <select
              value={postCleaning}
              onChange={(e) => setPostCleaning(e.target.value)}
              className={fc("postCleaning")}
            >
              <option value="">Select...</option>
              <option>Done</option>
              <option>Not Done</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Drying Time</label>
            <SelectWithCustom
              value={dryingTime}
              onChange={setDryingTime}
              customValue={dryingTimeCustom}
              onCustomChange={setDryingTimeCustom}
              options={["10 Min", "NA", "Other"]}
              error={hasError("dryingTime")}
            />
          </div>
        </div>
      </div>

      {/* ── Observations ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4">
          <h2
            className={sectionTitleClass.replace(
              " mb-4 pb-2 border-b border-gray-100",
              "",
            )}
          >
            Observations
          </h2>
          <button
            type="button"
            onClick={addObs}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                <th className="border border-gray-200 px-2 py-2 text-center w-10">
                  Sr.
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Job Description
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Drg No. / Joint No.
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Size
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center w-16">
                  Qty(Nos)
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Interpretation
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Evaluation
                </th>
                <th className="border border-gray-200 px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {observations.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1 text-center text-gray-500">
                    {row.srNo}
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.jobDescription}
                      onChange={(e) =>
                        updateObs(idx, "jobDescription", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_jobDescription`] &&
                        !row.jobDescription?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.drawingOrJointNo}
                      onChange={(e) =>
                        updateObs(idx, "drawingOrJointNo", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_drawingOrJointNo`] &&
                        !row.drawingOrJointNo?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.size}
                      onChange={(e) => updateObs(idx, "size", e.target.value)}
                      className={
                        !!errors[`obs${idx}_size`] && !row.size?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) =>
                        updateObs(idx, "quantity", e.target.value)
                      }
                      className={
                        (!!errors[`obs${idx}_quantity`] &&
                        !row.quantity?.toString().trim()
                          ? inputErrorClass
                          : inputClass) + " w-16"
                      }
                      min="0"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={row.interpretation}
                      onChange={(e) =>
                        updateObs(idx, "interpretation", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_interpretation`] &&
                        !row.interpretation
                          ? inputErrorClass
                          : inputClass
                      }
                    >
                      <option value="">Select...</option>
                      <option>No relevant Indication Found</option>
                      <option>Relevant Indication Found</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={row.evaluation}
                      onChange={(e) =>
                        updateObs(idx, "evaluation", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_evaluation`] && !row.evaluation
                          ? inputErrorClass
                          : inputClass
                      }
                    >
                      <option value="">Select...</option>
                      <option>Accepted</option>
                      <option>Not Accepted</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    {observations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeObs(idx)}
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

      {/* ── Conclusion ── */}
      {/* <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Conclusion</h2>
        <div>
          <label className={labelClass}>Conclusion</label>
          <SelectWithCustom
            value={conclusion}
            onChange={setConclusion}
            customValue={conclusionCustom}
            onCustomChange={setConclusionCustom}
            options={[
              "Examination completed as per applicable standards. No rejectable indications observed in inspected items",
              "Examination completed as per applicable standards. Rejectable indications observed in inspected items",
              "Examination completed as per applicable process. No rejectable indications observed in inspected items",
              "Examination completed as per applicable process. Rejectable indications observed in inspected items",
              "Other",
            ]}
            error={hasError("conclusion")}
          />
        </div>
      </div> */}

      {/* ── Examined By ── */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* NIIT Inspector(s) */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Examined By
            </p>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-700 uppercase">
                National Ind. Insp. &amp; Training
              </p>
              <button
                type="button"
                onClick={addInspector}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-2 py-1 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              {inspectors.map((insp, idx) => (
                <div key={idx} className="relative">
                  {inspectors.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => removeInspector(idx)}
                        className="absolute top-0 right-0 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-xs text-gray-400 mb-2">
                        Inspector {idx + 1}
                      </p>
                    </>
                  )}
                  <div className="space-y-2">
                    <div>
                      <label className={labelClass}>Name</label>
                      <select
                        value={insp.name}
                        onChange={(e) =>
                          updateInsp(idx, "name", e.target.value)
                        }
                        className={`${errors[`inspectorName_${idx}`] && !insp.name ? inputErrorClass : inputClass} bg-white`}
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
                      <label className={labelClass}>Qualification *</label>
                      <input
                        type="text"
                        value={insp.qualification}
                        onChange={(e) =>
                          updateInsp(idx, "qualification", e.target.value)
                        }
                        className={
                          !!errors[`inspectorQualification_${idx}`] &&
                          !insp.qualification.trim()
                            ? inputErrorClass
                            : inputClass
                        }
                        placeholder="e.g. PT NDE Level II"
                      />
                    </div>
                    {/* <div>
                      <label className={labelClass}>Designation *</label>
                      <input
                        type="text"
                        value={insp.designation}
                        onChange={(e) =>
                          updateInsp(idx, "designation", e.target.value)
                        }
                        className={
                          !!errors[`inspectorDesignation_${idx}`] &&
                          !insp.designation.trim()
                            ? inputErrorClass
                            : inputClass
                        }
                      />
                    </div> */}
                    <div>
                      <label className={labelClass}>Signature</label>
                      <input
                        type="text"
                        value={insp.signature}
                        onChange={(e) =>
                          updateInsp(idx, "signature", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Date *</label>
                      <input
                        type="date"
                        value={insp.date}
                        onChange={(e) =>
                          updateInsp(idx, "date", e.target.value)
                        }
                        className={
                          !!errors[`inspectorDate_${idx}`] && !insp.date
                            ? inputErrorClass
                            : inputClass
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Customer */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Customer
            </p>
            <p className="text-xs font-semibold text-gray-700 uppercase mb-3">
              {customerName || "-"}
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className={fc("custName")}
                />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input
                  type="text"
                  value={custDesig}
                  onChange={(e) => setCustDesig(e.target.value)}
                  className={fc("custDesig")}
                />
              </div>
              <div>
                <label className={labelClass}>Signature</label>
                <input
                  type="text"
                  value={custSig}
                  onChange={(e) => setCustSig(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={custDate}
                  onChange={(e) => setCustDate(e.target.value)}
                  className={fc("custDate")}
                />
              </div>
            </div>
          </div>
          {/* Client / TPI */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Client
            </p>
            <p className="text-xs font-semibold text-gray-700 uppercase mb-3">
              {jobClient || "-"}
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={fc("clientName")}
                />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input
                  type="text"
                  value={clientDesig}
                  onChange={(e) => setClientDesig(e.target.value)}
                  className={fc("clientDesig")}
                />
              </div>
              <div>
                <label className={labelClass}>Signature</label>
                <input
                  type="text"
                  value={clientSig}
                  onChange={(e) => setClientSig(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={clientDate}
                  onChange={(e) => setClientDate(e.target.value)}
                  className={fc("clientDate")}
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
