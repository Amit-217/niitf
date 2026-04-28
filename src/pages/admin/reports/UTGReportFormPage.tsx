import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import {
  createUTGReport,
  updateUTGReport,
  getUTGReportById,
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

interface SearchUnitRow {
  searchUnit: string;
  model: string;
  angle: string;
  srNo: string;
  crystalSize: string;
  crystalSizeOther: string;
  waveMode: string;
  frequency: string;
  frequencyOther: string;
}

interface ObsRow {
  srNo: number;
  itemName: string;
  measuredThickness: string;
  evaluation: string;
}

const emptySearchUnit = (): SearchUnitRow => ({
  searchUnit: "",
  model: "",
  angle: "",
  srNo: "",
  crystalSize: "",
  crystalSizeOther: "",
  waveMode: "",
  frequency: "",
  frequencyOther: "",
});

const emptyObs = (): ObsRow => ({
  srNo: 1,
  itemName: "",
  measuredThickness: "",
  evaluation: "",
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export const UTGReportFormPage: React.FC = () => {
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

  // ── Job Details ──
  const [reportNo, setReportNo] = useState("");
  const jobCustomer = customerName;
  const [jobClient, setJobClient] = useState("");
  const [jobReportDate, setJobReportDate] = useState("");
  const [jobProject, setJobProject] = useState("");
  const [jobInspectionDate, setJobInspectionDate] = useState("");
  const [jobInspectionEndDate, setJobInspectionEndDate] = useState("");
  const [jobRefStd, setJobRefStd] = useState("");
  const [jobRefStdOther, setJobRefStdOther] = useState("");
  const [jobInspectionTime, setJobInspectionTime] = useState("");
  const [jobAcceptanceCriteria, setJobAcceptanceCriteria] = useState("");
  const [jobAcceptanceCriteriaOther, setJobAcceptanceCriteriaOther] =
    useState("");
  const [jobMaterial, setJobMaterial] = useState("");
  const [jobStage, setJobStage] = useState("");
  const [jobStageOther, setJobStageOther] = useState("");
  const [jobSurfaceCondition, setJobSurfaceCondition] = useState("");
  const [jobSurfaceConditionOther, setJobSurfaceConditionOther] = useState("");
  const [jobExtent, setJobExtent] = useState("");
  const [jobExtentOther, setJobExtentOther] = useState("");
  const [jobSurfaceTemp, setJobSurfaceTemp] = useState("");
  const [jobSurfaceTempOther, setJobSurfaceTempOther] = useState("");

  // ── Equipment Details ──
  const [eqType, setEqType] = useState("");
  const [eqTypeOther, setEqTypeOther] = useState("");
  const [eqSrNo, setEqSrNo] = useState("");
  const [eqMake, setEqMake] = useState("");
  const [eqMakeOther, setEqMakeOther] = useState("");
  const [eqCalibrationDue, setEqCalibrationDue] = useState("");
  const [eqCouplant, setEqCouplant] = useState("");
  const [eqCouplantOther, setEqCouplantOther] = useState("");
  const [eqCalibBlock, setEqCalibBlock] = useState("");
  const [eqCalibBlockOther, setEqCalibBlockOther] = useState("");

  // ── Search Unit Details ──
  const [searchUnits, setSearchUnits] = useState<SearchUnitRow[]>([
    emptySearchUnit(),
  ]);

  // ── Technique Details ──

  const [utMethod, setUtMethod] = useState("");
  const [utMethodOther, setUtMethodOther] = useState("");

  // ── Observations ──
  const [observations, setObservations] = useState<ObsRow[]>([emptyObs()]);

  // ── Users for inspector dropdown ──
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    api
      .get("/users?status=active&limit=100")
      .then((res: any) => setUsers(res.data ?? res ?? []))
      .catch(() => { });
  }, []);

  // ── Examined By ──
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorQual, setInspectorQual] = useState("UTG NDE Level II");
  const [inspectorSig, setInspectorSig] = useState("");
  const [inspectorIdNo, setInspectorIdNo] = useState("");
  const [inspectorDate, setInspectorDate] = useState("");
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

  // ── Helpers ──
  const resolve = (val: string, other: string) =>
    val === "Other" && other.trim() ? other.trim() : val;

  const updateSearchUnit = (
    idx: number,
    key: keyof SearchUnitRow,
    val: string,
  ) =>
    setSearchUnits((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );
  const addSearchUnit = () =>
    setSearchUnits((prev) => [...prev, emptySearchUnit()]);
  const removeSearchUnit = (idx: number) =>
    setSearchUnits((prev) => prev.filter((_, i) => i !== idx));

  const updateObs = (idx: number, key: keyof ObsRow, val: string) =>
    setObservations((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );
  const addObs = () =>
    setObservations((prev) => [
      ...prev,
      { ...emptyObs(), srNo: prev.length + 1 },
    ]);
  const removeObs = (idx: number) =>
    setObservations((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, srNo: i + 1 })),
    );

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
    getUTGReportById(id)
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
        if (r.jobDetails?.customer && !customerName)
          setCustomerName(r.jobDetails.customer);
        setReportNo(r.reportNo ?? "");
        const jd = r.jobDetails ?? {};
        setJobClient(jd.client ?? "");
        setJobReportDate(toDate(jd.reportDate));
        setJobProject(jd.project ?? "");
        setJobInspectionDate(toDate(jd.inspectionDate));
        setJobInspectionEndDate(toDate(jd.inspectionEndDate));
        const [refStd, refStdO] = fromOther(jd.referenceStd, [
          "ASME Sec V Article 4",
          "ASME Sec V Article 5",
          "Other",
        ]);
        setJobRefStd(refStd);
        setJobRefStdOther(refStdO);
        setJobInspectionTime(jd.inspectionTime ?? "");
        const [acc, accO] = fromOther(jd.acceptanceCriteria, [
          "ASME SEC VIII Appendix 4",
          "ASME SEC VIII Appendix 12",
          "ASME B 31.3",
          "Other",
        ]);
        setJobAcceptanceCriteria(acc);
        setJobAcceptanceCriteriaOther(accO);
        setJobMaterial(jd.material ?? "");
        const [stage, stageO] = fromOther(jd.stageOfInspection, [
          "After welding",
          "As Casting",
          "As Rolled",
          "As Forged",
          "In-service",
          "Other",
        ]);
        setJobStage(stage);
        setJobStageOther(stageO);
        const [surf, surfO] = fromOther(jd.surfaceCondition, [
          "Smooth",
          "Rough",
          "Ground and polished",
          "Other",
        ]);
        setJobSurfaceCondition(surf);
        setJobSurfaceConditionOther(surfO);
        const [ext, extO] = fromOther(jd.extentOfExamination, [
          "10%",
          "100%",
          "Random",
          "Other",
        ]);
        setJobExtent(ext);
        setJobExtentOther(extO);
        const [temp, tempO] = fromOther(jd.surfaceTemperature, [
          "Room Temperature",
          "Other",
        ]);
        setJobSurfaceTemp(temp);
        setJobSurfaceTempOther(tempO);
        const eq = r.equipmentDetails ?? {};
        const [eqT, eqTO] = fromOther(eq.equipmentType, [
          "Modsonic",
          "EEC",
          "Waygate",
          "Other",
        ]);
        setEqType(eqT);
        setEqTypeOther(eqTO);
        setEqSrNo(eq.srNo ?? "");
        const [eqMk, eqMkO] = fromOther(eq.make, [
          "Modsonic",
          "Waygate",
          "Kappawave",
          "Other",
        ]);
        setEqMake(eqMk);
        setEqMakeOther(eqMkO);
        setEqCalibrationDue(toDate(eq.calibrationDue));
        const [coup, coupO] = fromOther(eq.couplant, [
          "Oil",
          "Oil + Grease",
          "Grease",
          "Other",
        ]);
        setEqCouplant(coup);
        setEqCouplantOther(coupO);
        const [calb, calbO] = fromOther(eq.basicCalibrationBlock, [
          "Step Block",
          "IIW V1",
          "IIW V2",
          "Other",
        ]);
        setEqCalibBlock(calb);
        setEqCalibBlockOther(calbO);
        if (r.searchUnitDetails?.length) {
          setSearchUnits(
            r.searchUnitDetails.map((u: any) => {
              const [cs, csO] = fromOther(u.crystalSize, [
                "Ø5mm",
                "Ø10mm",
                "8x9 mm",
                "20x22 mm",
                "Other",
              ]);
              const [fr, frO] = fromOther(u.frequency, [
                "2 MHz",
                "4 MHz",
                "5 MHz",
                "Other",
              ]);
              return {
                searchUnit: u.searchUnit ?? "",
                model: u.model ?? "",
                angle: u.angle ?? "",
                srNo: u.srNo ?? "",
                crystalSize: cs,
                crystalSizeOther: csO,
                waveMode: u.waveMode ?? "",
                frequency: fr,
                frequencyOther: frO,
              };
            }),
          );
        }
        const td = r.techniqueDetails ?? {};
        const [utm, utmO] = fromOther(td.utMethod, [
          "Pulse Echo – Contact",
          "Through Transmission",
          "Immersion",
          "Other",
        ]);
        setUtMethod(utm);
        setUtMethodOther(utmO);
        if (r.observations?.length) {
          setObservations(
            r.observations.map((o: any) => ({
              srNo: o.srNo,
              itemName: o.itemName ?? "",
              measuredThickness: o.measuredThickness ?? "",
              evaluation: o.evaluation ?? o.remark ?? o.result ?? "",
            })),
          );
        }
        const fs = r.finalSection ?? {};
        const insp = fs.inspector?.[0] ?? {};
        setInspectorName(insp.name ?? "");
        setInspectorQual(insp.qualification || "UT NDE Level II");
        setInspectorSig(insp.signature ?? "");
        setInspectorIdNo(insp.idNo ?? "");
        setInspectorDate(toDate(insp.date));
        const cust = fs.customer ?? {};
        setCustName(cust.name ?? "");
        setCustDesig(cust.designation ?? "");
        setCustSig(cust.signature ?? "");
        setCustIdNo(cust.idNo ?? "");
        setCustDate(toDate(cust.date));
        const clientRep = fs.clientOrTPI ?? {};
        setClientName(clientRep.name ?? "");
        setClientDesig(clientRep.designation ?? "");
        setClientSig(clientRep.signature ?? "");
        setClientIdNo(clientRep.idNo ?? "");
        setClientDate(toDate(clientRep.date));
      })
      .catch(() => toast.error("Failed to load report."));
  }, [id]);

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
        reportNo: reportNo.trim(),
        status,
        jobDetails: {
          customer: jobCustomer,
          client: jobClient,
          reportDate: jobReportDate || undefined,
          project: jobProject,
          inspectionDate: jobInspectionDate || undefined,
          inspectionEndDate: jobInspectionEndDate || undefined,
          referenceStd: resolve(jobRefStd, jobRefStdOther),
          inspectionTime: jobInspectionTime,
          acceptanceCriteria: resolve(
            jobAcceptanceCriteria,
            jobAcceptanceCriteriaOther,
          ),
          material: jobMaterial,
          stageOfInspection: resolve(jobStage, jobStageOther),
          surfaceCondition: resolve(
            jobSurfaceCondition,
            jobSurfaceConditionOther,
          ),
          extentOfExamination: resolve(jobExtent, jobExtentOther),
          surfaceTemperature: resolve(jobSurfaceTemp, jobSurfaceTempOther),
        },
        equipmentDetails: {
          equipmentType: resolve(eqType, eqTypeOther),
          srNo: eqSrNo,
          make: resolve(eqMake, eqMakeOther),
          calibrationDue: eqCalibrationDue || undefined,
          couplant: resolve(eqCouplant, eqCouplantOther),
          basicCalibrationBlock: resolve(eqCalibBlock, eqCalibBlockOther),
        },
        searchUnitDetails: searchUnits
          .filter((u) => u.searchUnit.trim())
          .map((u) => ({
            searchUnit: u.searchUnit,
            angle: u.angle,
            srNo: u.srNo,
            crystalSize: resolve(u.crystalSize, u.crystalSizeOther),
            waveMode: u.waveMode,
            frequency: resolve(u.frequency, u.frequencyOther),
          })),
        techniqueDetails: {
          utMethod: resolve(utMethod, utMethodOther),
        },
        observations: observations
          .filter((o) => o.itemName.trim())
          .map((o) => ({
            srNo: o.srNo,
            itemName: o.itemName,
            measuredThickness: o.measuredThickness,
            evaluation: o.evaluation,
          })),
        finalSection: {
          examinedBy: "National Industrial Inspection And Training",
          inspector: [
            {
              name: inspectorName,
              qualification: inspectorQual,
              signature: inspectorSig,
              idNo: inspectorIdNo,
              date: inspectorDate || undefined,
            },
          ],
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
        await updateUTGReport(id, payload);
      } else {
        await createUTGReport(payload);
      }
      toast.success(`UTG Report saved as ${status}.`);
      navigate(`/admin/customers/${customerId}`, {
        state: { activeTab: "reports", reportSubType: "utg" },
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
            Ultrasonic Thickness Gauging Report
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
              defaultValue="FMT-NDT-UTG-01"
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
              className={inputClass}
              placeholder="e.g. MTA AUTOMOTIVE"
            />
          </div>
          <div>
            <label className={labelClass}>Report Date</label>
            <input
              type="date"
              value={jobReportDate}
              onChange={(e) => setJobReportDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Project</label>
            <input
              type="text"
              value={jobProject}
              onChange={(e) => setJobProject(e.target.value)}
              className={inputClass}
              placeholder="e.g. VC-200412"
            />
          </div>
          <div>
            <label className={labelClass}>Inspection Start Date</label>
            <input
              type="date"
              value={jobInspectionDate}
              onChange={(e) => setJobInspectionDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Inspection End Date</label>
            <input
              type="date"
              value={jobInspectionEndDate}
              onChange={(e) => setJobInspectionEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Reference Std.</label>
            <SelectWithOther
              value={jobRefStd}
              onChange={setJobRefStd}
              otherValue={jobRefStdOther}
              onOtherChange={setJobRefStdOther}
              options={[
                "ASME Sec V Article 4",
                "ASME Sec V Article 5",
                "Other",
              ]}
            />
          </div>
          <div>
            <label className={labelClass}>Acceptance Criteria</label>
            <SelectWithOther
              value={jobAcceptanceCriteria}
              onChange={setJobAcceptanceCriteria}
              otherValue={jobAcceptanceCriteriaOther}
              onOtherChange={setJobAcceptanceCriteriaOther}
              options={[
                "ASME SEC VIII Appendix 4",
                "ASME SEC VIII Appendix 12",
                "ASME B 31.3",
                "Other",
              ]}
              placeholder="Select Acceptance Criteria"
            />
          </div>
          <div>
            <label className={labelClass}>Material</label>
            <input
              type="text"
              value={jobMaterial}
              onChange={(e) => setJobMaterial(e.target.value)}
              className={inputClass}
              placeholder="e.g. IS 2062 E-250 BR"
            />
          </div>
          <div>
            <label className={labelClass}>Stage of Inspection</label>
            <SelectWithOther
              value={jobStage}
              onChange={setJobStage}
              otherValue={jobStageOther}
              onOtherChange={setJobStageOther}
              options={[
                "After welding",
                "As Casting",
                "As Rolled",
                "As Forged",
                "In-service",
                "Other",
              ]}
            />
          </div>
          <div>
            <label className={labelClass}>Surface Condition</label>
            <SelectWithOther
              value={jobSurfaceCondition}
              onChange={setJobSurfaceCondition}
              otherValue={jobSurfaceConditionOther}
              onOtherChange={setJobSurfaceConditionOther}
              options={["Smooth", "Rough", "Ground and polished", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Extent of Examination</label>
            <SelectWithOther
              value={jobExtent}
              onChange={setJobExtent}
              otherValue={jobExtentOther}
              onOtherChange={setJobExtentOther}
              options={["10%", "100%", "Random", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Surface Temperature</label>
            <SelectWithOther
              value={jobSurfaceTemp}
              onChange={setJobSurfaceTemp}
              otherValue={jobSurfaceTempOther}
              onOtherChange={setJobSurfaceTempOther}
              options={["Room Temperature", "Other"]}
            />
          </div>
        </div>
      </div>

      {/* ── Equipment Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Equipment Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Equipment Type</label>
            <SelectWithOther
              value={eqType}
              onChange={setEqType}
              otherValue={eqTypeOther}
              onOtherChange={setEqTypeOther}
              options={["Modsonic", "EEC", "Waygate", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Sr. No.</label>
            <input
              type="text"
              value={eqSrNo}
              onChange={(e) => setEqSrNo(e.target.value)}
              className={inputClass}
              placeholder="e.g. E4238-0215"
            />
          </div>
          <div>
            <label className={labelClass}>Make</label>
            <SelectWithOther
              value={eqMake}
              onChange={setEqMake}
              otherValue={eqMakeOther}
              onOtherChange={setEqMakeOther}
              options={["Modsonic", "Waygate", "Kappawave", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Calibration Due</label>
            <input
              type="date"
              value={eqCalibrationDue}
              onChange={(e) => setEqCalibrationDue(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Couplant</label>
            <SelectWithOther
              value={eqCouplant}
              onChange={setEqCouplant}
              otherValue={eqCouplantOther}
              onOtherChange={setEqCouplantOther}
              options={["Oil", "Oil + Grease", "Grease", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Basic Calibration Block</label>
            <SelectWithOther
              value={eqCalibBlock}
              onChange={setEqCalibBlock}
              otherValue={eqCalibBlockOther}
              onOtherChange={setEqCalibBlockOther}
              options={["Step Block", "IIW V1", "IIW V2", "Other"]}
            />
          </div>
        </div>
      </div>

      {/* ── Search Unit Details ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
            Search Unit Details
          </h2>
          <button
            type="button"
            onClick={addSearchUnit}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Search Unit / Model
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Angle
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Sr. No.
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Crystal Size
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Wave Mode
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Frequency
                </th>
                <th className="border border-gray-200 px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {searchUnits.map((u, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={u.searchUnit}
                      onChange={(e) =>
                        updateSearchUnit(idx, "searchUnit", e.target.value)
                      }
                      className={inputClass}
                      placeholder="e.g. Modsonic / Normal"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={u.angle}
                      onChange={(e) =>
                        updateSearchUnit(idx, "angle", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      <option>T/R</option>
                      <option>Normal (0°)</option>
                      <option>45°</option>
                      <option>60°</option>
                      <option>70°</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={u.srNo}
                      onChange={(e) =>
                        updateSearchUnit(idx, "srNo", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 min-w-[140px]">
                    <SelectWithOther
                      value={u.crystalSize}
                      onChange={(v) => updateSearchUnit(idx, "crystalSize", v)}
                      otherValue={u.crystalSizeOther}
                      onOtherChange={(v) =>
                        updateSearchUnit(idx, "crystalSizeOther", v)
                      }
                      options={["Ø5mm", "Ø10mm", "8x9 mm", "20x22 mm", "Other"]}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={u.waveMode}
                      onChange={(e) =>
                        updateSearchUnit(idx, "waveMode", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      <option>Longitudinal</option>
                      <option>Shear</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1 min-w-[130px]">
                    <SelectWithOther
                      value={u.frequency}
                      onChange={(v) => updateSearchUnit(idx, "frequency", v)}
                      otherValue={u.frequencyOther}
                      onOtherChange={(v) =>
                        updateSearchUnit(idx, "frequencyOther", v)
                      }
                      options={["2 MHz", "4 MHz", "5 MHz", "Other"]}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    {searchUnits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSearchUnit(idx)}
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

      {/* ── Technique Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Technique Details</h2>
        <div className="max-w-sm">
          <label className={labelClass}>UT Method</label>
          <SelectWithOther
            value={utMethod}
            onChange={setUtMethod}
            otherValue={utMethodOther}
            onOtherChange={setUtMethodOther}
            options={[
              "Pulse Echo – Contact",
              "Through Transmission",
              "Immersion",
              "Other",
            ]}
          />
        </div>
      </div>

      {/* ── Observations ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
            Observations
          </h2>
          <button
            type="button"
            onClick={addObs}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                <th className="border border-gray-200 px-2 py-2 text-center w-10">
                  Sr.
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Item Name
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Measured Thickness (mm)
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left w-32">
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
                      value={row.itemName}
                      onChange={(e) =>
                        updateObs(idx, "itemName", e.target.value)
                      }
                      className={inputClass}
                      placeholder="e.g. Panel"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.measuredThickness}
                      onChange={(e) =>
                        updateObs(idx, "measuredThickness", e.target.value)
                      }
                      className={inputClass}
                      placeholder="e.g. 12.5"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={row.evaluation}
                      onChange={(e) =>
                        updateObs(idx, "evaluation", e.target.value)
                      }
                      className={inputClass}
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

      {/* ── Examined By ── */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* NIIT Inspector */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Examined By
            </p>
            <p className="text-xs font-semibold text-gray-700 uppercase mb-3">
              National Ind. Insp. &amp; Training
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
                <label className={labelClass}>Qualification</label>
                <input
                  type="text"
                  value={inspectorQual}
                  onChange={(e) => setInspectorQual(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. UT NDE Level II"
                />
              </div>
              <div>
                <label className={labelClass}>Signature</label>
                <input
                  type="text"
                  value={inspectorSig}
                  onChange={(e) => setInspectorSig(e.target.value)}
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
          {/* Customer */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Customer
            </p>
            <p className="text-xs font-semibold text-gray-700 uppercase mb-3">
              {customerName || "—"}
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input
                  type="text"
                  value={custDesig}
                  onChange={(e) => setCustDesig(e.target.value)}
                  className={inputClass}
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
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          {/* Client / TPI */}
          <div className="bosrder border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Client
            </p>
            <p className="text-xs font-semibold text-gray-700 uppercase mb-3">
              {jobClient || "—"}
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input
                  type="text"
                  value={clientDesig}
                  onChange={(e) => setClientDesig(e.target.value)}
                  className={inputClass}
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
