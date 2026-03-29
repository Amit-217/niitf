import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Save } from "lucide-react";
import {
  createVSSCUTReport,
  updateVSSCUTReport,
  getVSSCUTReportById,
  VSSCUTProbeModeData,
  VSSCUTCalibTable,
} from "../../../api/customerApi";
import { CustomerPickerBanner } from "../../../components/CustomerPickerBanner";
import api from "../../../api/axios";

// ─── Styles ──────────────────────────────────────────────────────────────────
const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-gray-200 p-5 mb-5";
const sectionTitleClass =
  "text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100";

// ─── SelectWithCustom ─────────────────────────────────────────────────────────
interface SelectWithCustomProps {
  value: string;
  onChange: (val: string) => void;
  customValue: string;
  onCustomChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}
const SelectWithCustom: React.FC<SelectWithCustomProps> = ({
  value,
  onChange,
  customValue,
  onCustomChange,
  options,
  placeholder = "Select...",
}) => (
  <div className="space-y-1">
    <select
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
        value={customValue}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder="Specify other value..."
        className={inputClass}
      />
    )}
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────
type ProbeMode = "45L" | "45T" | "60L" | "60T" | "70L" | "70T";
const PROBE_MODES: ProbeMode[] = ["45L", "45T", "60L", "60T", "70L", "70T"];

interface SkipRow {
  bp: string;
  mm: string;
  fsh: string;
}
const emptySkipRow = (): SkipRow => ({ bp: "", mm: "", fsh: "" });

interface ProbeModeFormData {
  half: SkipRow;
  one: SkipRow;
  oneHalf: SkipRow;
  two: SkipRow;
  dacDb: string;
  scanningDb: string;
}
const emptyPMD = (): ProbeModeFormData => ({
  half: emptySkipRow(),
  one: emptySkipRow(),
  oneHalf: emptySkipRow(),
  two: emptySkipRow(),
  dacDb: "",
  scanningDb: "",
});
const emptyCalibTable = (): Record<ProbeMode, ProbeModeFormData> => ({
  "45L": emptyPMD(),
  "45T": emptyPMD(),
  "60L": emptyPMD(),
  "60T": emptyPMD(),
  "70L": emptyPMD(),
  "70T": emptyPMD(),
});

const SKIPS: Array<{
  key: keyof Pick<ProbeModeFormData, "half" | "one" | "oneHalf" | "two">;
  label: string;
}> = [
  { key: "half", label: "½" },
  { key: "one", label: "1" },
  { key: "oneHalf", label: "1½" },
  { key: "two", label: "2" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export const VSSCUTReportFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const state = location.state as {
    customerId?: string;
    customerName?: string;
  } | null;
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(state?.customerId ?? "");
  const [customerName, setCustomerName] = useState(state?.customerName ?? "");

  // ── Job Details ──
  const [reportNo, setReportNo] = useState("");
  const [pageNo, setPageNo] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [weldJointNo, setWeldJointNo] = useState("");
  const [thicknessOfJob, setThicknessOfJob] = useState("");
  const [surfaceCondition, setSurfaceCondition] = useState("");
  const [surfaceConditionCustom, setSurfaceConditionCustom] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [material, setMaterial] = useState("");
  const [scanningTechnique, setScanningTechnique] = useState("");
  const [scanningTechniqueCustom, setScanningTechniqueCustom] = useState("");
  const [stageOfInspection, setStageOfInspection] = useState("");
  const [stageOfInspectionCustom, setStageOfInspectionCustom] = useState("");
  const [equipmentUsed, setEquipmentUsed] = useState("");
  const [equipmentUsedCustom, setEquipmentUsedCustom] = useState("");
  const [couplant, setCouplant] = useState("");
  const [couplantCustom, setCouplantCustom] = useState("");
  const [areaScanned, setAreaScanned] = useState("");
  const [areaScannedCustom, setAreaScannedCustom] = useState("");
  const [acceptanceStandard, setAcceptanceStandard] = useState("");
  const [acceptanceStandardCustom, setAcceptanceStandardCustom] = useState("");
  const [referenceDatum, setReferenceDatum] = useState("");
  const [referenceDatumCustom, setReferenceDatumCustom] = useState("");

  // ── Test Setup ──
  const [tsAngleRange, setTsAngleRange] = useState("");
  const [tsNormalRange, setTsNormalRange] = useState("");
  const [tsCalBlockAngle, setTsCalBlockAngle] = useState("");
  const [tsCalBlockNormal, setTsCalBlockNormal] = useState("");
  const [tsRefBlockAngle, setTsRefBlockAngle] = useState("");
  const [tsRefBlockNormal, setTsRefBlockNormal] = useState("");
  const [tsRefBlockNormalCustom, setTsRefBlockNormalCustom] = useState("");

  // ── Angle Probe Calibration ──
  const [apcFrequency, setApcFrequency] = useState("");
  const [apcFrequencyCustom, setApcFrequencyCustom] = useState("");
  const [apcSize, setApcSize] = useState("");
  const [apcSizeCustom, setApcSizeCustom] = useState("");
  const [apcType, setApcType] = useState("");
  const [apcTypeCustom, setApcTypeCustom] = useState("");
  const [probe45Sr, setProbe45Sr] = useState("");
  const [probe60Sr, setProbe60Sr] = useState("");
  const [probe70Sr, setProbe70Sr] = useState("");
  const [calibTable, setCalibTable] =
    useState<Record<ProbeMode, ProbeModeFormData>>(emptyCalibTable());

  // ── Normal Probe Calibration ──
  const [npProbeType, setNpProbeType] = useState("");
  const [npFrequency, setNpFrequency] = useState("");
  const [npFrequencyCustom, setNpFrequencyCustom] = useState("");
  const [npSize, setNpSize] = useState("");
  const [npSkip, setNpSkip] = useState("");
  const [npBp, setNpBp] = useState("");
  const [npDacDb, setNpDacDb] = useState("");
  const [npScanningDb, setNpScanningDb] = useState("");

  // ── Disposition & Remarks ──
  const [disposition, setDisposition] = useState("");
  const [remarks, setRemarks] = useState("");
  const [remarksCustom, setRemarksCustom] = useState("");

  // ── Users for inspector dropdown ──
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    api
      .get("/users?status=active&limit=100")
      .then((res: any) => setUsers(res.data ?? res ?? []))
      .catch(() => {});
  }, []);

  // ── Final Section ──
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorIdNo, setInspectorIdNo] = useState("");
  const [inspectorDate, setInspectorDate] = useState("");
  const [qcName, setQcName] = useState("");
  const [qcIdNo, setQcIdNo] = useState("");
  const [qcDate, setQcDate] = useState("");
  const [rqsName, setRqsName] = useState("");
  const [rqsIdNo, setRqsIdNo] = useState("");
  const [rqsDate, setRqsDate] = useState("");

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getVSSCUTReportById(id)
      .then((res: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = (res as any).data ?? res;
        if (r.customerId) setCustomerId(typeof r.customerId === "object" ? r.customerId?._id ?? "" : r.customerId);
        if (r.customer) setCustomerName(r.customer);
        setReportNo(r.reportNo ?? "");
        setPageNo(r.pageNo ?? "");
        setJobDescription(r.jobDescription ?? "");
        setReportDate(toDate(r.reportDate));
        setWeldJointNo(r.weldJointNo ?? "");
        setThicknessOfJob(r.thicknessOfJob ?? "");
        const [sc, scC] = fromOther(r.surfaceCondition, [
          "Ground and polished",
          "Smooth",
          "Rough",
          "Other",
        ]);
        setSurfaceCondition(sc);
        setSurfaceConditionCustom(scC);
        const period = r.periodOfInspection ?? "";
        if (period.includes(" To ")) {
          const parts = period.split(" To ");
          setPeriodFrom(toDate(parts[0]));
          setPeriodTo(toDate(parts[1]));
        } else {
          setPeriodFrom(toDate(period));
        }
        setMaterial(r.material ?? "");
        const [st, stC] = fromOther(r.scanningTechnique, [
          "Contact manual",
          "Other",
        ]);
        setScanningTechnique(st);
        setScanningTechniqueCustom(stC);
        const [si, siC] = fromOther(r.stageOfInspection, [
          "Before HT",
          "AA Periodic UT",
          "After Ageing",
          "After PPT",
          "Other",
        ]);
        setStageOfInspection(si);
        setStageOfInspectionCustom(siC);
        const [eu, euC] = fromOther(r.equipmentUsed, ["USM-36", "Other"]);
        setEquipmentUsed(eu);
        setEquipmentUsedCustom(euC);
        const [co, coC] = fromOther(r.couplant, [
          "Oil",
          "Grease",
          "Oil + Grease",
          "Other",
        ]);
        setCouplant(co);
        setCouplantCustom(coC);
        const [as_, asC] = fromOther(r.areaScanned, [
          "Weld + HAZ (Longitudinal & Transverse – 2 Directions)",
          "Weld Only",
          "Other",
        ]);
        setAreaScanned(as_);
        setAreaScannedCustom(asC);
        const [acc, accC] = fromOther(r.acceptanceStandard, [
          "MME/QC-HTW/M250/001 REV.0",
          "CUSTOMER",
          "Other",
        ]);
        setAcceptanceStandard(acc);
        setAcceptanceStandardCustom(accC);
        const [rd, rdC] = fromOther(r.referenceDatum, ["RT Location", "Other"]);
        setReferenceDatum(rd);
        setReferenceDatumCustom(rdC);
        const ts = r.testSetup ?? {};
        setTsAngleRange(ts.angleRange ?? "");
        setTsNormalRange(ts.normalRange ?? "");
        setTsCalBlockAngle(ts.standardCalBlock?.angle ?? "");
        setTsCalBlockNormal(ts.standardCalBlock?.normal ?? "");
        setTsRefBlockAngle(ts.identificationNoOfRefBlock?.angle ?? "");
        const [rbn, rbnC] = fromOther(ts.identificationNoOfRefBlock?.normal, [
          "2mmFBH (PJS-01-2007/4)",
          "CUSTOM",
          "Other",
        ]);
        setTsRefBlockNormal(rbn);
        setTsRefBlockNormalCustom(rbnC);
        const apc = r.angleProbeCalibration ?? {};
        const [apcF, apcFC] = fromOther(apc.frequency, [
          "4 MHz",
          "2 MHz",
          "5 MHz",
          "Other",
        ]);
        setApcFrequency(apcF);
        setApcFrequencyCustom(apcFC);
        const [apcSz, apcSzC] = fromOther(apc.size, [
          "8x9 mm",
          "10x10 mm",
          "Other",
        ]);
        setApcSize(apcSz);
        setApcSizeCustom(apcSzC);
        const [apcTp, apcTpC] = fromOther(apc.type, ["MWB", "SW", "Other"]);
        setApcType(apcTp);
        setApcTypeCustom(apcTpC);
        setProbe45Sr(apc.probe45SerialNo ?? "");
        setProbe60Sr(apc.probe60SerialNo ?? "");
        setProbe70Sr(apc.probe70SerialNo ?? "");
        if (apc.calibTable) setCalibTable(apc.calibTable);
        const npc = r.normalProbeCalibration ?? {};
        setNpProbeType(npc.probeType ?? "");
        const [npF, npFC] = fromOther(npc.frequency, [
          "4 MHz",
          "2 MHz",
          "5 MHz",
          "Other",
        ]);
        setNpFrequency(npF);
        setNpFrequencyCustom(npFC);
        setNpSize(npc.size ?? "");
        setNpSkip(npc.skip ?? "");
        setNpBp(npc.bp ?? "");
        setNpDacDb(npc.dacDb ?? "");
        setNpScanningDb(npc.scanningDb ?? "");
        setDisposition(r.disposition ?? "");
        const [rm, rmC] = fromOther(r.remarks, [
          "RECORDABLE INDICATIONS WAS OBSERVED - REFER ANNEXURE– I",
          "NO RECORDABLE INDICATIONS WAS OBSERVED",
          "Other",
        ]);
        setRemarks(rm);
        setRemarksCustom(rmC);
        const fs = r.finalSection ?? {};
        const insp = fs.inspector?.[0] ?? {};
        setInspectorName(insp.name ?? "");
        setInspectorIdNo(insp.idNo ?? "");
        setInspectorDate(toDate(insp.date));
        const qc = fs.qc ?? {};
        setQcName(qc.name ?? "");
        setQcIdNo(qc.idNo ?? "");
        setQcDate(toDate(qc.date));
        const rqs = fs.rqs ?? {};
        setRqsName(rqs.name ?? "");
        setRqsIdNo(rqs.idNo ?? "");
        setRqsDate(toDate(rqs.date));
      })
      .catch(() => toast.error("Failed to load report."));
  }, [id]);

  // ── Helpers ──
  const resolve = (val: string, custom: string) =>
    val === "Other" && custom.trim() ? custom.trim() : val;

  const updateCalibCell = (
    mode: ProbeMode,
    skip: keyof Pick<ProbeModeFormData, "half" | "one" | "oneHalf" | "two">,
    field: keyof SkipRow,
    val: string,
  ) =>
    setCalibTable((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], [skip]: { ...prev[mode][skip], [field]: val } },
    }));

  const updateCalibSingle = (
    mode: ProbeMode,
    field: "dacDb" | "scanningDb",
    val: string,
  ) =>
    setCalibTable((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], [field]: val },
    }));

  // ── Submit ──
  const handleSubmit = async (status: "draft" | "final") => {
    if (!isEditMode && !customerId) {
      toast.error("Please select a customer first.");
      return;
    }
    setSaving(true);
    try {
      const ct: VSSCUTCalibTable = {};
      PROBE_MODES.forEach((pm) => {
        ct[pm] = calibTable[pm] as VSSCUTProbeModeData;
      });

      const payload = {
        customerId,
        reportNo: reportNo.trim(),
        pageNo,
        status,
        jobDescription,
        reportDate: reportDate || undefined,
        weldJointNo,
        thicknessOfJob,
        surfaceCondition: resolve(surfaceCondition, surfaceConditionCustom),
        customer: customerName,
        periodOfInspection:
          periodFrom && periodTo
            ? `${periodFrom} To ${periodTo}`
            : periodFrom || periodTo || undefined,
        material,
        scanningTechnique: resolve(scanningTechnique, scanningTechniqueCustom),
        stageOfInspection: resolve(stageOfInspection, stageOfInspectionCustom),
        equipmentUsed: resolve(equipmentUsed, equipmentUsedCustom),
        couplant: resolve(couplant, couplantCustom),
        areaScanned: resolve(areaScanned, areaScannedCustom),
        acceptanceStandard: resolve(
          acceptanceStandard,
          acceptanceStandardCustom,
        ),
        referenceDatum: resolve(referenceDatum, referenceDatumCustom),
        testSetup: {
          angleRange: tsAngleRange,
          normalRange: tsNormalRange,
          standardCalBlock: {
            angle: tsCalBlockAngle,
            normal: tsCalBlockNormal,
          },
          identificationNoOfRefBlock: {
            angle: tsRefBlockAngle,
            normal: resolve(tsRefBlockNormal, tsRefBlockNormalCustom),
          },
        },
        angleProbeCalibration: {
          frequency: resolve(apcFrequency, apcFrequencyCustom),
          size: resolve(apcSize, apcSizeCustom),
          type: resolve(apcType, apcTypeCustom),
          probe45SerialNo: probe45Sr,
          probe60SerialNo: probe60Sr,
          probe70SerialNo: probe70Sr,
          calibTable: ct,
        },
        normalProbeCalibration: {
          probeType: npProbeType,
          frequency: resolve(npFrequency, npFrequencyCustom),
          size: npSize,
          skip: npSkip,
          bp: npBp,
          dacDb: npDacDb,
          scanningDb: npScanningDb,
        },
        disposition: disposition || undefined,
        remarks: resolve(remarks, remarksCustom),
        finalSection: {
          inspector: [
            {
              name: inspectorName,
              idNo: inspectorIdNo,
              date: inspectorDate || undefined,
            },
          ],
          qc: { name: qcName, idNo: qcIdNo, date: qcDate || undefined },
          rqs: { name: rqsName, idNo: rqsIdNo, date: rqsDate || undefined },
        },
      };
      if (id) {
        await updateVSSCUTReport(id, payload);
      } else {
        await createVSSCUTReport(payload);
      }
      toast.success(`VSSC-UT Report saved as ${status}.`);
      navigate(`/admin/customers/${customerId}`, {
        state: { activeTab: "reports", reportSubType: "vssc-ut" },
      });
    } catch {
      toast.error("Failed to save report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──
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
            VSSC Ultrasonic Test Report
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

      {/* Report No & Page No */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <label className={labelClass}>Page No.</label>
            <input
              type="text"
              value={pageNo}
              onChange={(e) => setPageNo(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Format No.</label>
            <input
              type="text"
              className={inputClass}
              defaultValue="FMT-NDT-VSSC-UT-01"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Job Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Job Description</label>
            <input
              type="text"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className={inputClass}
              placeholder="e.g. 783107 HS200 NOZZLE END SEGMENT [HS200-NES-20-WIL]"
            />
          </div>
          <div>
            <label className={labelClass}>Customer</label>
            <input
              type="text"
              value={customerName}
              disabled
              className={inputClass + " bg-gray-100 cursor-not-allowed"}
            />
          </div>
          <div>
            <label className={labelClass}>Report Date</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Weld Joint No.</label>
            <input
              type="text"
              value={weldJointNo}
              onChange={(e) => setWeldJointNo(e.target.value)}
              className={inputClass}
              placeholder="e.g. As per Annexure I"
            />
          </div>
          <div>
            <label className={labelClass}>Thickness of Job</label>
            <input
              type="text"
              value={thicknessOfJob}
              onChange={(e) => setThicknessOfJob(e.target.value)}
              className={inputClass}
              placeholder="e.g. 7.8MM / 7.7MM / 12MM / 18MM"
            />
          </div>
          <div>
            <label className={labelClass}>Surface Condition</label>
            <SelectWithCustom
              value={surfaceCondition}
              onChange={setSurfaceCondition}
              customValue={surfaceConditionCustom}
              onCustomChange={setSurfaceConditionCustom}
              options={["Ground and polished", "Smooth", "Rough", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Material</label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className={inputClass}
              placeholder="e.g. MDN 250"
            />
          </div>
          <div>
            <label className={labelClass}>Period of Inspection — From</label>
            <input
              type="date"
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Period of Inspection — To</label>
            <input
              type="date"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Scanning Technique</label>
            <SelectWithCustom
              value={scanningTechnique}
              onChange={setScanningTechnique}
              customValue={scanningTechniqueCustom}
              onCustomChange={setScanningTechniqueCustom}
              options={["Contact manual", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Stage of Inspection</label>
            <SelectWithCustom
              value={stageOfInspection}
              onChange={setStageOfInspection}
              customValue={stageOfInspectionCustom}
              onCustomChange={setStageOfInspectionCustom}
              options={[
                "Before HT",
                "AA Periodic UT",
                "After Ageing",
                "After PPT",
                "Other",
              ]}
            />
          </div>
          <div>
            <label className={labelClass}>Equipment Used</label>
            <SelectWithCustom
              value={equipmentUsed}
              onChange={setEquipmentUsed}
              customValue={equipmentUsedCustom}
              onCustomChange={setEquipmentUsedCustom}
              options={["USM-36", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Couplant</label>
            <SelectWithCustom
              value={couplant}
              onChange={setCouplant}
              customValue={couplantCustom}
              onCustomChange={setCouplantCustom}
              options={["Oil", "Grease", "Oil + Grease", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Area Scanned</label>
            <SelectWithCustom
              value={areaScanned}
              onChange={setAreaScanned}
              customValue={areaScannedCustom}
              onCustomChange={setAreaScannedCustom}
              options={[
                "Weld + HAZ (Longitudinal & Transverse – 2 Directions)",
                "Weld Only",
                "Other",
              ]}
            />
          </div>
          <div>
            <label className={labelClass}>Acceptance Standard</label>
            <SelectWithCustom
              value={acceptanceStandard}
              onChange={setAcceptanceStandard}
              customValue={acceptanceStandardCustom}
              onCustomChange={setAcceptanceStandardCustom}
              options={["MME/QC-HTW/M250/001 REV.0", "CUSTOMER", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Reference Datum</label>
            <SelectWithCustom
              value={referenceDatum}
              onChange={setReferenceDatum}
              customValue={referenceDatumCustom}
              onCustomChange={setReferenceDatumCustom}
              options={["RT Location", "Other"]}
            />
          </div>
        </div>
      </div>

      {/* Test Setup */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Test Setup</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>For Angle — Range</label>
            <input
              type="text"
              value={tsAngleRange}
              onChange={(e) => setTsAngleRange(e.target.value)}
              className={inputClass}
              placeholder="e.g. 0-100 mm"
            />
          </div>
          <div>
            <label className={labelClass}>For Normal — Range</label>
            <input
              type="text"
              value={tsNormalRange}
              onChange={(e) => setTsNormalRange(e.target.value)}
              className={inputClass}
              placeholder="e.g. 0-10 mm"
            />
          </div>
          <div>
            <label className={labelClass}>Standard Cal Block — For Angle</label>
            <input
              type="text"
              value={tsCalBlockAngle}
              onChange={(e) => setTsCalBlockAngle(e.target.value)}
              className={inputClass}
              placeholder="e.g. V-2 Block (MDN-250)"
            />
          </div>
          <div>
            <label className={labelClass}>
              Standard Cal Block — For Normal
            </label>
            <input
              type="text"
              value={tsCalBlockNormal}
              onChange={(e) => setTsCalBlockNormal(e.target.value)}
              className={inputClass}
              placeholder="e.g. Step Block (MDN 250)"
            />
          </div>
          <div>
            <label className={labelClass}>
              Idtn. No of Ref Block — For Angle
            </label>
            <input
              type="text"
              value={tsRefBlockAngle}
              onChange={(e) => setTsRefBlockAngle(e.target.value)}
              className={inputClass}
              placeholder="e.g. 'G' Notch (LSP 34 A side only)"
            />
          </div>
          <div>
            <label className={labelClass}>
              Idtn. No of Ref Block — For Normal
            </label>
            <SelectWithCustom
              value={tsRefBlockNormal}
              onChange={setTsRefBlockNormal}
              customValue={tsRefBlockNormalCustom}
              onCustomChange={setTsRefBlockNormalCustom}
              options={["2mmFBH (PJS-01-2007/4)", "CUSTOM", "Other"]}
            />
          </div>
        </div>
      </div>

      {/* Angle Probe Calibration */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Angle Probe Calibration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className={labelClass}>Frequency</label>
            <SelectWithCustom
              value={apcFrequency}
              onChange={setApcFrequency}
              customValue={apcFrequencyCustom}
              onCustomChange={setApcFrequencyCustom}
              options={["4 MHz", "2 MHz", "5 MHz", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Size</label>
            <SelectWithCustom
              value={apcSize}
              onChange={setApcSize}
              customValue={apcSizeCustom}
              onCustomChange={setApcSizeCustom}
              options={["8x9 mm", "10x10 mm", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <SelectWithCustom
              value={apcType}
              onChange={setApcType}
              customValue={apcTypeCustom}
              onCustomChange={setApcTypeCustom}
              options={["MWB", "SW", "Other"]}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className={labelClass}>45° Probe Sr. No.</label>
            <input
              type="text"
              value={probe45Sr}
              onChange={(e) => setProbe45Sr(e.target.value)}
              className={inputClass}
              placeholder="e.g. 63230"
            />
          </div>
          <div>
            <label className={labelClass}>60° Probe Sr. No.</label>
            <input
              type="text"
              value={probe60Sr}
              onChange={(e) => setProbe60Sr(e.target.value)}
              className={inputClass}
              placeholder="e.g. 63285"
            />
          </div>
          <div>
            <label className={labelClass}>70° Probe Sr. No.</label>
            <input
              type="text"
              value={probe70Sr}
              onChange={(e) => setProbe70Sr(e.target.value)}
              className={inputClass}
              placeholder="e.g. 63309"
            />
          </div>
        </div>

        {/* Calibration Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-gray-800 text-white text-center">
                <th className="border border-gray-400 px-2 py-2 w-12">Skip</th>
                {PROBE_MODES.map((pm) => (
                  <th
                    key={pm}
                    className="border border-gray-400 px-1 py-2 font-bold"
                    colSpan={3}
                  >
                    {pm}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-100 text-center text-gray-600 text-[11px]">
                <th className="border border-gray-300 px-1 py-1"></th>
                {PROBE_MODES.map((pm) => (
                  <React.Fragment key={pm}>
                    <th className="border border-gray-300 px-1 py-1">BP</th>
                    <th className="border border-gray-300 px-1 py-1">mm</th>
                    <th className="border border-gray-300 px-1 py-1">%FSH</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {SKIPS.map(({ key, label }) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-1 text-center font-semibold text-gray-700 bg-gray-50">
                    {label}
                  </td>
                  {PROBE_MODES.map((pm) => (
                    <React.Fragment key={pm}>
                      {(["bp", "mm", "fsh"] as const).map((field) => (
                        <td key={field} className="border border-gray-300 p-0">
                          <input
                            type="text"
                            value={calibTable[pm][key][field]}
                            onChange={(e) =>
                              updateCalibCell(pm, key, field, e.target.value)
                            }
                            className="w-full border-0 text-xs px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded text-center min-w-[40px]"
                          />
                        </td>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
              ))}
              <tr className="bg-amber-50">
                <td className="border border-gray-300 px-2 py-1.5 text-center text-[11px] font-bold text-gray-700 whitespace-nowrap">
                  DAC dB
                </td>
                {PROBE_MODES.map((pm) => (
                  <td
                    key={pm}
                    className="border border-gray-300 p-0"
                    colSpan={3}
                  >
                    <input
                      type="text"
                      value={calibTable[pm].dacDb}
                      onChange={(e) =>
                        updateCalibSingle(pm, "dacDb", e.target.value)
                      }
                      className="w-full border-0 text-xs px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded text-center bg-transparent"
                      placeholder="e.g. 46.0 dB"
                    />
                  </td>
                ))}
              </tr>
              <tr className="bg-amber-50">
                <td className="border border-gray-300 px-2 py-1.5 text-center text-[11px] font-bold text-gray-700 whitespace-nowrap">
                  Scan dB
                </td>
                {PROBE_MODES.map((pm) => (
                  <td
                    key={pm}
                    className="border border-gray-300 p-0"
                    colSpan={3}
                  >
                    <input
                      type="text"
                      value={calibTable[pm].scanningDb}
                      onChange={(e) =>
                        updateCalibSingle(pm, "scanningDb", e.target.value)
                      }
                      className="w-full border-0 text-xs px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded text-center bg-transparent"
                      placeholder="e.g. 46.0 + 10dB"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Normal Probe Calibration */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Normal Probe Calibration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Probe S. No / Type</label>
            <input
              type="text"
              value={npProbeType}
              onChange={(e) => setNpProbeType(e.target.value)}
              className={inputClass}
              placeholder="e.g. 75798 / MSEB 4E"
            />
          </div>
          <div>
            <label className={labelClass}>Frequency</label>
            <SelectWithCustom
              value={npFrequency}
              onChange={setNpFrequency}
              customValue={npFrequencyCustom}
              onCustomChange={setNpFrequencyCustom}
              options={["4 MHz", "2 MHz", "5 MHz", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Size</label>
            <input
              type="text"
              value={npSize}
              onChange={(e) => setNpSize(e.target.value)}
              className={inputClass}
              placeholder="e.g. 10 mm (TR)"
            />
          </div>
          <div>
            <label className={labelClass}>Skip</label>
            <input
              type="text"
              value={npSkip}
              onChange={(e) => setNpSkip(e.target.value)}
              className={inputClass}
              placeholder="e.g. 4.0"
            />
          </div>
          <div>
            <label className={labelClass}>BP – %FSH</label>
            <input
              type="text"
              value={npBp}
              onChange={(e) => setNpBp(e.target.value)}
              className={inputClass}
              placeholder="e.g. 80 %"
            />
          </div>
          <div>
            <label className={labelClass}>DAC dB</label>
            <input
              type="text"
              value={npDacDb}
              onChange={(e) => setNpDacDb(e.target.value)}
              className={inputClass}
              placeholder="e.g. 49.0 dB"
            />
          </div>
          <div>
            <label className={labelClass}>Scanning dB</label>
            <input
              type="text"
              value={npScanningDb}
              onChange={(e) => setNpScanningDb(e.target.value)}
              className={inputClass}
              placeholder="e.g. 49.0 + 10 dB"
            />
          </div>
        </div>
      </div>

      {/* Disposition & Remarks */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Disposition & Remarks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Disposition</label>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              <option>ACCEPTED</option>
              <option>NOT ACCEPTED</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Remarks</label>
            <SelectWithCustom
              value={remarks}
              onChange={setRemarks}
              customValue={remarksCustom}
              onCustomChange={setRemarksCustom}
              options={[
                "RECORDABLE INDICATIONS WAS OBSERVED - REFER ANNEXURE– I",
                "NO RECORDABLE INDICATIONS WAS OBSERVED",
                "Other",
              ]}
            />
          </div>
        </div>
      </div>

      {/* Final Section */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Inspector */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Examined By
            </p>
            <p className="text-xs font-semibold text-gray-700 uppercase mb-3">
              National Ind. Insp. & Training
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name</label>
                <select
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
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
                <label className={labelClass}>I.D. No.</label>
                <input
                  type="text"
                  value={inspectorIdNo}
                  onChange={(e) => setInspectorIdNo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={inspectorDate}
                  onChange={(e) => setInspectorDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          {/* QC */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Customer
            </p>
            <p className="text-xs font-semibold text-gray-700 uppercase mb-3">
              QC / WIL
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={qcName}
                  onChange={(e) => setQcName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>I.D. No.</label>
                <input
                  type="text"
                  value={qcIdNo}
                  onChange={(e) => setQcIdNo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={qcDate}
                  onChange={(e) => setQcDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          {/* RQS */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Client / TPI
            </p>
            <p className="text-xs font-semibold text-gray-700 uppercase mb-3">
              RQS / VSSC
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={rqsName}
                  onChange={(e) => setRqsName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>I.D. No.</label>
                <input
                  type="text"
                  value={rqsIdNo}
                  onChange={(e) => setRqsIdNo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={rqsDate}
                  onChange={(e) => setRqsDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
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
