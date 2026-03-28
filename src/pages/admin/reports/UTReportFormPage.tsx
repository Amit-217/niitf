import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import {
  createUTReport,
  updateUTReport,
  getUTReportById,
  UTSearchUnit,
} from "../../../api/customerApi";
import { getApiErrorMessage } from "../../../api/error";
import { CustomerPickerBanner } from "../../../components/CustomerPickerBanner";
import api from "../../../api/axios";

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-gray-200 p-5 mb-5";
const sectionTitleClass =
  "text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100";

// â”€â”€â”€ SelectWithCustom â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SelectWithCustomProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  customValue: string;
  onCustomChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}

const SelectWithCustom: React.FC<SelectWithCustomProps> = ({
  id,
  value,
  onChange,
  customValue,
  onCustomChange,
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
        value={customValue}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder="Specify other value..."
        className={inputClass}
      />
    )}
  </div>
);

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ObsRow {
  srNo: number;
  jobDescription: string;
  drawingOrJointNo: string;
  size: string;
  quantity: string;
  evaluation: string;
  remark: string;
}

const emptyObs = (): ObsRow => ({
  srNo: 1,
  jobDescription: "",
  drawingOrJointNo: "",
  size: "",
  quantity: "",
  evaluation: "",
  remark: "",
});

const emptySearchUnit = (): UTSearchUnit => ({
  model: "",
  angle: "",
  srNo: "",
  crystalSize: "",
  waveMode: "",
  frequency: "",
});

interface CalibRow {
  range: string;
  point1: string;
  point2: string;
  point3: string;
  refDb: string;
}
const emptyCalib = (): CalibRow => ({
  range: "",
  point1: "",
  point2: "",
  point3: "",
  refDb: "",
});

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const UTReportFormPage: React.FC = () => {
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

  // — Job Details —
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

  // â”€â”€ Equipment Details â”€â”€
  const [eqType, setEqType] = useState("");
  const [eqTypeCustom, setEqTypeCustom] = useState("");
  const [eqSrNo, setEqSrNo] = useState("");
  const [eqMake, setEqMake] = useState("");
  const [eqMakeCustom, setEqMakeCustom] = useState("");
  const [eqCalibDue, setEqCalibDue] = useState("");
  const [eqCouplant, setEqCouplant] = useState("");
  const [eqBasicCalib, setEqBasicCalib] = useState("");

  // â”€â”€ Search Units â”€â”€
  const [searchUnits, setSearchUnits] = useState<UTSearchUnit[]>([
    emptySearchUnit(),
  ]);

  // â”€â”€ Technique Details â”€â”€
  const [utMethod, setUtMethod] = useState("");
  const [refCalibBlock, setRefCalibBlock] = useState("");
  const [refCalibBlockCustom, setRefCalibBlockCustom] = useState("");
  const [utCalibMethod, setUtCalibMethod] = useState("");
  const [scanningDb, setScanningDb] = useState("");
  const [scanningSens, setScanningSens] = useState("");
  const [scanningSensCustom, setScanningSensCustom] = useState("");

  // â”€â”€ Angle Probe Calibration â”€â”€
  const [calib0, setCalib0] = useState<CalibRow>(emptyCalib());
  const [calib45, setCalib45] = useState<CalibRow>(emptyCalib());
  const [calib60, setCalib60] = useState<CalibRow>(emptyCalib());
  const [calib70, setCalib70] = useState<CalibRow>(emptyCalib());

  // â”€â”€ Observations â”€â”€
  const [observations, setObservations] = useState<ObsRow[]>([emptyObs()]);

  // ── Users for inspector dropdown ──
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    api
      .get("/users?status=active&limit=100")
      .then((res: any) => setUsers(res.data ?? res ?? []))
      .catch(() => {});
  }, []);

  // â”€â”€ Final Section â”€â”€
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorQual, setInspectorQual] = useState("UT NDE Level II");
  const [inspectorIdNo, setInspectorIdNo] = useState("");
  const [inspectorDate, setInspectorDate] = useState("");
  const [custName, setCustName] = useState("");
  const [custDesig, setCustDesig] = useState("");
  const [custIdNo, setCustIdNo] = useState("");
  const [custDate, setCustDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientDesig, setClientDesig] = useState("");
  const [clientIdNo, setClientIdNo] = useState("");
  const [clientDate, setClientDate] = useState("");

  // â”€â”€ Helpers â”€â”€
  const resolve = (val: string, custom: string) =>
    val === "Other" && custom.trim() ? custom.trim() : val;

  const updateUnit = (idx: number, key: keyof UTSearchUnit, val: string) =>
    setSearchUnits((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: val } : row)),
    );

  const addUnit = () => setSearchUnits((prev) => [...prev, emptySearchUnit()]);
  const removeUnit = (idx: number) =>
    setSearchUnits((prev) => prev.filter((_, i) => i !== idx));

  const updateObs = (idx: number, key: keyof ObsRow, val: string) =>
    setObservations((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: val } : row)),
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

  const updateCalib = (
    setter: React.Dispatch<React.SetStateAction<CalibRow>>,
    key: keyof CalibRow,
    val: string,
  ) => setter((prev) => ({ ...prev, [key]: val }));

  // â”€â”€ Load existing report in edit mode â”€â”€
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
    getUTReportById(id)
      .then((res: any) => {
        const r = (res as any).data ?? res;
        if (r.customerId) setCustomerId(r.customerId);
        if (r.jobDetails?.customer) setCustomerName(r.jobDetails.customer);
        setReportNo(r.reportNo ?? "");

        const jd = r.jobDetails ?? {};
        setJobClient(jd.client ?? "");
        setJobProject(jd.project ?? "");
        setJobReportDate(toDate(jd.reportDate));
        setJobInspectionDate(toDate(jd.inspectionDate));
        setJobInspectionEndDate(toDate(jd.inspectionEndDate));
        setJobInspectionTime(jd.inspectionTime ?? "");
        const [refStd, refStdC] = fromOther(jd.referenceStd, [
          "ASME Sec V Article 4",
          "ASTM SA 609",
          "ASTM SA 435",
          "ASTM 578",
          "ASTM SA 388",
          "Other",
        ]);
        setJobRefStd(refStd);
        setJobRefStdCustom(refStdC);
        const [acc, accC] = fromOther(jd.acceptanceCriteria, [
          "ASME SEC VIII Div. 1 Appendix 12",
          "ASTM SA 609",
          "ASTM SA 435",
          "ASTM 578",
          "ASTM SA 388",
          "Other",
        ]);
        setJobAcceptance(acc);
        setJobAcceptanceCustom(accC);
        setJobMaterial(jd.material ?? "");
        setJobStage(jd.stageOfInspection ?? "");
        setJobThickness(jd.thickness ?? "");
        const [ext, extC] = fromOther(jd.extentOfExamination, [
          "10%",
          "100%",
          "To the maximum extent possible",
          "Other",
        ]);
        setJobExtent(ext);
        setJobExtentCustom(extC);
        setJobSurface(jd.surfaceCondition ?? "");
        setJobJointType(jd.typeOfJoint ?? "");
        setJobSurfaceTemp(jd.surfaceTemperature ?? "");
        setJobWeldingProcess(jd.weldingProcess ?? "");

        const eq = r.equipmentDetails ?? {};
        const [eqT, eqTC] = fromOther(eq.equipmentType, [
          "Einstein-II DGS",
          "USM 36",
          "Kappawave",
          "USM 100",
          "Other",
        ]);
        setEqType(eqT);
        setEqTypeCustom(eqTC);
        setEqSrNo(eq.srNo ?? "");
        const [eqMk, eqMkC] = fromOther(eq.make, [
          "Modsonic",
          "Waygate",
          "Kappawave",
          "Other",
        ]);
        setEqMake(eqMk);
        setEqMakeCustom(eqMkC);
        setEqCalibDue(eq.calibrationDue ?? "");
        setEqCouplant(eq.couplant ?? "");
        setEqBasicCalib(eq.basicCalibrationBlock ?? "");

        if (r.searchUnitDetails?.length) setSearchUnits(r.searchUnitDetails);

        const td = r.techniqueDetails ?? {};
        setUtMethod(td.utMethod ?? "");
        const [rcb, rcbC] = fromOther(td.referenceCalibrationBlock, [
          "19 mm",
          "38 mm",
          "Job itself",
          "Other",
        ]);
        setRefCalibBlock(rcb);
        setRefCalibBlockCustom(rcbC);
        setUtCalibMethod(td.utCalibrationMethod ?? "");
        setScanningDb(td.scanningDb ?? "");
        const scanningSensOpts = [
          "Ø 2.5 mm SDH",
          "Ø 3mm SDH",
          "1” BWE set @ 80% of FSH on Job",
          "Other",
        ];
        const [ss, ssC] = fromOther(td.scanningSensitivity, scanningSensOpts);
        setScanningSens(ss);
        setScanningSensCustom(ssC);

        const apc = r.angleProbeCalibration ?? {};
        if (apc.deg0) setCalib0(apc.deg0);
        if (apc.deg45) setCalib45(apc.deg45);
        if (apc.deg60) setCalib60(apc.deg60);
        if (apc.deg70) setCalib70(apc.deg70);

        if (r.observations?.length) {
          setObservations(
            r.observations.map((o: any) => ({
              srNo: o.srNo,
              jobDescription: o.jobDescription ?? "",
              drawingOrJointNo: o.drawingOrJointNo ?? "",
              size: o.size ?? "",
              quantity: String(o.quantity ?? ""),
              evaluation: o.evaluation ?? "",
              remark: o.remark ?? "",
            })),
          );
        }

        const fs = r.finalSection ?? {};
        const insp = fs.inspector?.[0] ?? {};
        setInspectorName(insp.name ?? "");
        setInspectorQual(insp.qualification || "UT NDE Level II");
        setInspectorIdNo(insp.idNo ?? "");
        setInspectorDate(toDate(insp.date));
        const custRep = fs.customer ?? {};
        setCustName(custRep.name ?? "");
        setCustDesig(custRep.designation ?? "");
        setCustIdNo(custRep.idNo ?? "");
        setCustDate(toDate(custRep.date));
        const clientRep = fs.clientOrTPI ?? {};
        setClientName(clientRep.name ?? "");
        setClientDesig(clientRep.designation ?? "");
        setClientIdNo(clientRep.idNo ?? "");
        setClientDate(toDate(clientRep.date));
      })
      .catch(() => toast.error("Failed to load report."));
  }, [id]);

  // â”€â”€ Submit â”€â”€
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
          project: jobProject,
          reportDate: jobReportDate || undefined,
          inspectionDate: jobInspectionDate || undefined,
          inspectionEndDate: jobInspectionEndDate || undefined,
          inspectionTime: jobInspectionTime,
          referenceStd: resolve(jobRefStd, jobRefStdCustom),
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
        equipmentDetails: {
          equipmentType: resolve(eqType, eqTypeCustom) || undefined,
          srNo: eqSrNo,
          make: resolve(eqMake, eqMakeCustom),
          calibrationDue: eqCalibDue,
          couplant: eqCouplant,
          basicCalibrationBlock: eqBasicCalib,
        },
        searchUnitDetails: searchUnits,
        techniqueDetails: {
          utMethod: utMethod || undefined,
          referenceCalibrationBlock: resolve(
            refCalibBlock,
            refCalibBlockCustom,
          ),
          utCalibrationMethod: utCalibMethod,
          scanningDb,
          scanningSensitivity: resolve(scanningSens, scanningSensCustom),
        },
        angleProbeCalibration: {
          deg0: calib0,
          deg45: calib45,
          deg60: calib60,
          deg70: calib70,
        },
        observations: observations
          .filter((o) => o.jobDescription.trim())
          .map((o) => ({
            srNo: o.srNo,
            jobDescription: o.jobDescription,
            drawingOrJointNo: o.drawingOrJointNo,
            size: o.size,
            quantity: Number(o.quantity) || 0,
            evaluation: o.evaluation || "",
            remark: o.remark || "",
          })),
        finalSection: {
          examinedBy: "National Industrial Inspection And Training",
          inspector: [
            {
              name: inspectorName,
              qualification: inspectorQual,
              idNo: inspectorIdNo,
              date: inspectorDate || undefined,
            },
          ],
          customer: {
            name: custName,
            designation: custDesig,
            idNo: custIdNo,
            date: custDate || undefined,
          },
          clientOrTPI: {
            name: clientName,
            designation: clientDesig,
            idNo: clientIdNo,
            date: clientDate || undefined,
          },
        },
      };
      if (id) {
        await updateUTReport(id, payload);
      } else {
        await createUTReport(payload);
      }

      toast.success(`UT Report saved as ${status}.`);
      navigate(`/admin/customers/${customerId}`, {
        state: { activeTab: "reports", reportSubType: "ut" },
      });
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to save report. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const calibAngles = [
    { label: "0Â°", state: calib0, setter: setCalib0 },
    { label: "45Â°", state: calib45, setter: setCalib45 },
    { label: "60Â°", state: calib60, setter: setCalib60 },
    { label: "70Â°", state: calib70, setter: setCalib70 },
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
            Ultrasonic Testing Report
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
              defaultValue="FMT-NDT-UT-01"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* â”€â”€ Job Details â”€â”€ */}
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
            <label className={labelClass}>Report No.</label>
            <input
              type="text"
              value={isEditMode ? reportNo : "NIIT/... (Auto-generated)"}
              readOnly
              className={inputClass + " bg-gray-50 font-mono text-indigo-700"}
            />
          </div>
          <div>
            <label className={labelClass}>Client</label>
            <input
              type="text"
              value={jobClient}
              onChange={(e) => setJobClient(e.target.value)}
              className={inputClass}
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
            <SelectWithCustom
              value={jobRefStd}
              onChange={setJobRefStd}
              customValue={jobRefStdCustom}
              onCustomChange={setJobRefStdCustom}
              options={[
                "ASME Sec V Article 4",
                "ASTM SA 609",
                "ASTM SA 435",
                "ASTM 578",
                "ASTM SA 388",
                "Other",
              ]}
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
                "ASME SEC VIII Div. 1 Appendix 12",
                "ASTM SA 609",
                "ASTM SA 435",
                "ASTM 578",
                "ASTM SA 388",
                "Other",
              ]}
            />
          </div>
          <div>
            <label className={labelClass}>Inspection Time</label>
            <input
              type="text"
              value={jobInspectionTime}
              onChange={(e) => setJobInspectionTime(e.target.value)}
              className={inputClass}
              placeholder="e.g. 02:00 PM to 05:00 PM"
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
            <select
              value={jobStage}
              onChange={(e) => setJobStage(e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              <option>After welding</option>
              <option>As Casting</option>
              <option>As Rolled</option>
              <option>As Forged</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Thickness</label>
            <input
              type="text"
              value={jobThickness}
              onChange={(e) => setJobThickness(e.target.value)}
              className={inputClass}
              placeholder="e.g. 6,12 & 16 MM"
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
            />
          </div>
          <div>
            <label className={labelClass}>Surface Condition</label>
            <select
              value={jobSurface}
              onChange={(e) => setJobSurface(e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              <option>Smooth</option>
              <option>Rough</option>
              <option>Ground and polished</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Type of Joint</label>
            <select
              value={jobJointType}
              onChange={(e) => setJobJointType(e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              <option>Butt</option>
              <option>Corner</option>
              <option>T Joint</option>
              <option>NA</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Surface Temperature</label>
            <select
              value={jobSurfaceTemp}
              onChange={(e) => setJobSurfaceTemp(e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              <option>Room Temperature</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Welding Process</label>
            <select
              value={jobWeldingProcess}
              onChange={(e) => setJobWeldingProcess(e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              <option>SMAW</option>
              <option>GMAW</option>
              <option>FCAW</option>
              <option>SAW</option>
              <option>GTAW</option>
              <option>MAG</option>
            </select>
          </div>
        </div>
      </div>

      {/* â”€â”€ Equipment Details â”€â”€ */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Equipment Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Equipment Type</label>
            <SelectWithCustom
              value={eqType}
              onChange={setEqType}
              customValue={eqTypeCustom}
              onCustomChange={setEqTypeCustom}
              options={[
                "Einstein-II DGS",
                "USM 36",
                "Kappawave",
                "USM 100",
                "Other",
              ]}
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
            <SelectWithCustom
              value={eqMake}
              onChange={setEqMake}
              customValue={eqMakeCustom}
              onCustomChange={setEqMakeCustom}
              options={["Modsonic", "Waygate", "Kappawave", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Calibration Due</label>
            <input
              type="text"
              value={eqCalibDue}
              onChange={(e) => setEqCalibDue(e.target.value)}
              className={inputClass}
              placeholder="e.g. 18-12-2025"
            />
          </div>
          <div>
            <label className={labelClass}>Couplant</label>
            <select
              value={eqCouplant}
              onChange={(e) => setEqCouplant(e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              <option>Water</option>
              <option>Oil+ Grease</option>
              <option>Starch</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Basic Calibration Block</label>
            <select
              value={eqBasicCalib}
              onChange={(e) => setEqBasicCalib(e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              <option>IIW V1</option>
              <option>IIW V2</option>
            </select>
          </div>
        </div>
      </div>

      {/* â”€â”€ Search Unit Details â”€â”€ */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4">
          <h2
            className={sectionTitleClass.replace(
              " mb-4 pb-2 border-b border-gray-100",
              "",
            )}
          >
            Search Unit Details
          </h2>
          <button
            type="button"
            onClick={addUnit}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Model
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
              {searchUnits.map((unit, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={unit.model}
                      onChange={(e) => updateUnit(idx, "model", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Modsonic"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={unit.angle}
                      onChange={(e) => updateUnit(idx, "angle", e.target.value)}
                      className={inputClass}
                    >
                      <option>45Â°</option>
                      <option>60Â°</option>
                      <option>70Â°</option>
                      <option>Normal</option>
                      <option>TR</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={unit.srNo}
                      onChange={(e) => updateUnit(idx, "srNo", e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={unit.crystalSize}
                      onChange={(e) =>
                        updateUnit(idx, "crystalSize", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option>8x9 mm / 20x22mm</option>
                      <option>Ã˜10 mm / Ã˜24 mm</option>
                      <option>8x9 mm</option>
                      <option>20x22mm</option>
                      <option>Ã˜10 mm</option>
                      <option>Ã˜24 mm</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={unit.waveMode}
                      onChange={(e) =>
                        updateUnit(idx, "waveMode", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option>Shear</option>
                      <option>Longitudinal</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={unit.frequency}
                      onChange={(e) =>
                        updateUnit(idx, "frequency", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option>2 / 4 MHz</option>
                      <option>2 MHz</option>
                      <option>4 MHz</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    {searchUnits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUnit(idx)}
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

      {/* â”€â”€ Technique Details â”€â”€ */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Technique Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>UT Method</label>
            <select
              value={utMethod}
              onChange={(e) => setUtMethod(e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              <option>Pulse Echo</option>
              <option>Through Transmission</option>
              <option>TOFD</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Reference Calibration Block</label>
            <SelectWithCustom
              value={refCalibBlock}
              onChange={setRefCalibBlock}
              customValue={refCalibBlockCustom}
              onCustomChange={setRefCalibBlockCustom}
              options={["19 mm", "38 mm", "Job itself", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>UT Calibration Method</label>
            <select
              value={utCalibMethod}
              onChange={(e) => setUtCalibMethod(e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              <option>By DAC Method</option>
              <option>DGS Method</option>
              <option>Backwall Reduction Method</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Scanning dB</label>
            <input
              type="text"
              value={scanningDb}
              onChange={(e) => setScanningDb(e.target.value)}
              className={inputClass}
              placeholder="e.g. Ref dB+6dB"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Scanning Sensitivity</label>
            <SelectWithCustom
              value={scanningSens}
              onChange={setScanningSens}
              customValue={scanningSensCustom}
              onCustomChange={setScanningSensCustom}
              options={[
                "Ã˜ 2.5 mm SDH",
                "Ã˜ 3mm SDH",
                '1" BWE set @ 80% of FSH on Job',
                "Other",
              ]}
            />
          </div>
        </div>
      </div>

      {/* â”€â”€ Angle Probe Calibration â”€â”€ */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Angle Probe Calibration Detail</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                <th className="border border-gray-200 px-3 py-2 text-left w-28">
                  Point
                </th>
                {calibAngles.map((a) => (
                  <th
                    key={a.label}
                    className="border border-gray-200 px-2 py-2 text-center"
                  >
                    {a.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  { key: "range", label: "Range" },
                  { key: "point1", label: "1st Point" },
                  { key: "point2", label: "2nd Point" },
                  { key: "point3", label: "3rd Point" },
                  { key: "refDb", label: "Ref dB" },
                ] as { key: keyof CalibRow; label: string }[]
              ).map((row) => (
                <tr key={row.key} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium text-gray-600 bg-gray-50">
                    {row.label}
                  </td>
                  {calibAngles.map((a) => (
                    <td
                      key={a.label}
                      className="border border-gray-200 px-1 py-1"
                    >
                      <input
                        type="text"
                        value={a.state[row.key]}
                        onChange={(e) =>
                          updateCalib(a.setter, row.key, e.target.value)
                        }
                        className={inputClass}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* â”€â”€ Observations â”€â”€ */}
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
                  Qty
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
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.drawingOrJointNo}
                      onChange={(e) =>
                        updateObs(idx, "drawingOrJointNo", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.size}
                      onChange={(e) => updateObs(idx, "size", e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) =>
                        updateObs(idx, "quantity", e.target.value)
                      }
                      className={inputClass + " w-16"}
                      min="0"
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
                      <option>No relevant Indication Found</option>
                      <option>Relevant Indication Found</option>
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

      {/* â”€â”€ Examined By â”€â”€ */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Examined By
            </p>
            <p className="text-xs font-semibold text-gray-700 uppercase mb-3">
              National Ind. Insp. & Training
            </p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Inspector Name</label>
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
                />
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
                <label className={labelClass}>I.D. No.</label>
                <input
                  type="text"
                  value={custIdNo}
                  onChange={(e) => setCustIdNo(e.target.value)}
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
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-0.5">
              Client / TPI
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
                <label className={labelClass}>I.D. No.</label>
                <input
                  type="text"
                  value={clientIdNo}
                  onChange={(e) => setClientIdNo(e.target.value)}
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

      {/* â”€â”€ Action Buttons â”€â”€ */}
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
