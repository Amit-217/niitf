import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import {
  createAWSDReport,
  updateAWSDReport,
  getAWSDReportById,
} from "../../../api/customerApi";
import { CustomerPickerBanner } from "../../../components/CustomerPickerBanner";
import { getApiErrorMessage } from "../../../api/error";
import api from "../../../api/axios";

// ─── Styles ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const inputErrorClass =
  "w-full border-2 border-red-400 bg-red-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-gray-200 p-5 mb-5";
const sectionTitleClass =
  "text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100";

// ─── SelectWithOther ─────────────────────────────────────────────────────────

interface SelectWithOtherProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  otherValue: string;
  onOtherChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  error?: boolean;
}

const SelectWithOther: React.FC<SelectWithOtherProps> = ({
  id,
  value,
  onChange,
  otherValue,
  onOtherChange,
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
        value={otherValue}
        onChange={(e) => onOtherChange(e.target.value)}
        placeholder="Specify other value..."
        className={error && !otherValue.trim() ? inputErrorClass : inputClass}
      />
    )}
  </div>
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface ObsRow {
  serialNo: string;
  jointDetails: string;
  drawingNoPartNo: string;
  jobThickness: string;
  partNo: string;
  transducerAngle: string;
  jointNo: string;
  indicationLevelA: string;
  referenceLevelB: string;
  attenuationFactorC: string;
  indicationRatingD: string;
  length: string;
  angularDistance: string;
  depthFromASurface: string;
  distanceX: string;
  distanceY: string;
  discontinuityEvaluation: string;
  remarks: string;
}

const emptyObs = (lineNo: number): ObsRow => ({
  serialNo: lineNo.toString(),
  jointDetails: "",
  drawingNoPartNo: "",
  jobThickness: "",
  partNo: "",
  transducerAngle: "",
  jointNo: "",
  indicationLevelA: "",
  referenceLevelB: "",
  attenuationFactorC: "",
  indicationRatingD: "",
  length: "",
  angularDistance: "",
  depthFromASurface: "",
  distanceX: "",
  distanceY: "",
  discontinuityEvaluation: "",
  remarks: "",
});

interface InspRow {
  name: string;
  qualification: string;
  designation: string;
  signature: string;
  date: string;
}

const emptyInspector = (): InspRow => ({
  name: "",
  qualification: "UT NDE Level II",
  designation: "",
  signature: "",
  date: "",
});

// ─── Page ────────────────────────────────────────────────────────────────────

export const AWSDReportFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const state = location.state as {
    customerId?: string;
    customerName?: string;
    from?: string;
  } | null;
  const [customerId, setCustomerId] = useState(state?.customerId ?? "");
  const [customerName, setCustomerName] = useState(state?.customerName ?? "");

  const [saving, setSaving] = useState(false);

  // ── Header Fields ──
  const [reportNo, setReportNo] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [project, setProject] = useState("");
  const [dateOfInspection, setDateOfInspection] = useState("");

  // ── Job Info ──
  const [jobDescription, setJobDescription] = useState("");
  const [drawingNo, setDrawingNo] = useState("");
  const [calibrationBlock, setCalibrationBlock] = useState("");
  const [qtyOfJts, setQtyOfJts] = useState("");
  const [flawDetectorSrNo, setFlawDetectorSrNo] = useState("");
  const [weldingProcess, setWeldingProcess] = useState("");
  const [weldingProcessOther, setWeldingProcessOther] = useState("");
  const [machineCalibration, setMachineCalibration] = useState("");
  const [surfaceCondition, setSurfaceCondition] = useState("");
  const [poNo, setPoNo] = useState("");
  const [couplant, setCouplant] = useState("");
  const [stageOfInspection, setStageOfInspection] = useState("");
  const [material, setMaterial] = useState("");
  const [qapNo, setQapNo] = useState("");
  const [accStandard, setAccStandard] = useState("AWS D1.1 Table 8.3");

  // ── Probe Details ──
  const [probe, setProbe] = useState("");
  const [overallProbeAngle, setOverallProbeAngle] = useState("");
  const [frequency, setFrequency] = useState("");
  const [range, setRange] = useState("");
  const [scanningSensitivity, setScanningSensitivity] = useState("");
  const [referenceDb, setReferenceDb] = useState("");
  const [scanningDb, setScanningDb] = useState("");

  // ── Observations ──
  const [observations, setObservations] = useState<ObsRow[]>(
    Array.from({ length: 3 }, (_, i) => emptyObs(i + 1)),
  );

  // ── Footer / Certification ──
  const [inspectors, setInspectors] = useState<InspRow[]>([emptyInspector()]);
  const [manufacturerOrContractor, setManufacturerOrContractor] = useState("");
  const [custName, setCustName] = useState("");
  const [custDesig, setCustDesig] = useState("");
  const [custSig, setCustSig] = useState("");
  const [custDate, setCustDate] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientDesig, setClientDesig] = useState("");
  const [clientSig, setClientSig] = useState("");
  const [clientDate, setClientDate] = useState("");

  // ── Users for inspector dropdown ──
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    api
      .get("/users?status=active&limit=100")
      .then((res: any) => setUsers(res.data ?? res ?? []))
      .catch(() => {});
  }, []);

  const [errors, setErrors] = useState<Record<string, boolean>>({});

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
    getAWSDReportById(id)
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
        setReportNo(r.reportNo ?? "");
        setReportDate(toDate(r.reportDate));
        setProject(r.project ?? "");
        setDateOfInspection(toDate(r.dateOfInspection));

        setJobDescription(r.jobDescription ?? "");
        setDrawingNo(r.drawingNo ?? "");
        setCalibrationBlock(r.calibrationBlock ?? "");
        setQtyOfJts(r.qtyOfJts ?? "");
        setFlawDetectorSrNo(r.flawDetectorSrNo ?? "");
        const [wp, wpO] = fromOther(r.weldingProcess, [
          "SMAW",
          "GMAW",
          "FCAW",
          "SAW",
          "GTAW",
          "MAG",
          "Other",
        ]);
        setWeldingProcess(wp);
        setWeldingProcessOther(wpO);
        setMachineCalibration(r.machineCalibration ?? "");
        setSurfaceCondition(r.surfaceCondition ?? "");
        setPoNo(r.poNo ?? "");
        setCouplant(r.couplant ?? "");
        setStageOfInspection(r.stageOfInspection ?? "");
        setMaterial(r.material ?? "");
        setQapNo(r.qapNo ?? "");
        setAccStandard(r.accStandard ?? "AWS D1.1 Table 8.3");

        setProbe(r.probe ?? "");
        setOverallProbeAngle(r.probeAngle ?? "");
        setFrequency(r.frequency ?? "");
        setRange(r.range ?? "");
        setScanningSensitivity(r.scanningSensitivity ?? "");
        setReferenceDb(r.referenceDb ?? "");
        setScanningDb(r.scanningDb ?? "");

        if (r.observations?.length) {
          setObservations(
            r.observations.map((o: any) => ({
              serialNo: o.serialNo ?? "",
              jointDetails: o.jointDetails ?? "",
              drawingNoPartNo: o.drawingNoPartNo ?? "",
              jobThickness: o.jobThickness ?? "",
              partNo: o.partNo ?? "",
              transducerAngle: o.transducerAngle ?? "",
              jointNo: o.jointNo ?? "",
              indicationLevelA: o.decibels?.indicationLevelA ?? "",
              referenceLevelB: o.decibels?.referenceLevelB ?? "",
              attenuationFactorC: o.decibels?.attenuationFactorC ?? "",
              indicationRatingD: o.decibels?.indicationRatingD ?? "",
              length: o.discontinuity?.length ?? "",
              angularDistance: o.discontinuity?.angularDistance ?? "",
              depthFromASurface: o.discontinuity?.depthFromASurface ?? "",
              distanceX: o.discontinuity?.distanceX ?? "",
              distanceY: o.discontinuity?.distanceY ?? "",
              discontinuityEvaluation: o.discontinuityEvaluation ?? "",
              remarks: o.remarks ?? "",
            })),
          );
        }
        const cert = r.certification ?? {};
        setInspectors([
          {
            name: cert.inspectedBy ?? "",
            qualification: cert.year || "UT NDE Level II",
            designation: cert.inspectorDesignation ?? "",
            signature: cert.inspectorSignature ?? "",
            date: toDate(cert.testDate),
          },
        ]);
        setManufacturerOrContractor(cert.manufacturerOrContractor ?? "");
        setCustName(cert.authorizedBy ?? "");
        setCustDesig(cert.custDesignation ?? "");
        setCustSig(cert.custSignature ?? "");
        setCustDate(toDate(cert.date));
        setVerifiedBy(cert.verifiedBy ?? "");
        setClientName(cert.reviewedBy ?? "");
        setClientDesig(cert.clientDesignation ?? "");
        setClientSig(cert.clientSignature ?? "");
        setClientDate(toDate(cert.reviewedByDate));
      })
      .catch(() => toast.error("Failed to load report."));
  }, [id]);

  // ── Helpers ──
  const resolve = (val: string, other: string) =>
    val === "Other" && other.trim() ? other.trim() : val;

  const getFieldValue = (key: string): string => {
    const map: Record<string, string> = {
      project,
      dateOfInspection,
      jobDescription,
      drawingNo,
      calibrationBlock,
      qtyOfJts,
      flawDetectorSrNo,
      machineCalibration,
      surfaceCondition,
      poNo,
      couplant,
      material,
      stageOfInspection,
      qapNo,
      accStandard,
      probe,
      overallProbeAngle,
      frequency,
      range,
      scanningSensitivity,
      referenceDb,
      scanningDb,
      manufacturerOrContractor,
      verifiedBy,
      custName,
      custDesig,
      custDate,
      clientName,
      clientDesig,
      clientDate,
      inspectorName_0: inspectors[0]?.name ?? "",
      inspectorQual_0: inspectors[0]?.qualification ?? "",
      inspectorDesig_0: inspectors[0]?.designation ?? "",
      inspectorDate_0: inspectors[0]?.date ?? "",
      weldingProcess:
        weldingProcess === "Other" ? weldingProcessOther : weldingProcess,
    };
    return map[key] ?? "";
  };
  const hasError = (key: string) => !!errors[key] && !getFieldValue(key);
  const fc = (key: string) => (hasError(key) ? inputErrorClass : inputClass);

  const updateObs = (idx: number, key: keyof ObsRow, val: string) =>
    setObservations((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );

  const addObs = () =>
    setObservations((prev) => [...prev, emptyObs(prev.length + 1)]);

  const removeObs = (idx: number) =>
    setObservations((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, serialNo: (i + 1).toString() })),
    );

  const updateInsp = (idx: number, key: keyof InspRow, val: string) =>
    setInspectors((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );
  const addInspector = () =>
    setInspectors((prev) => [...prev, emptyInspector()]);
  const removeInspector = (idx: number) =>
    setInspectors((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit ──
  const handleSubmit = async (status: "draft" | "final") => {
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
        reportDate: reportDate || undefined,
        project,
        dateOfInspection: dateOfInspection || undefined,
        jobDescription,
        drawingNo,
        calibrationBlock,
        qtyOfJts,
        flawDetectorSrNo,
        weldingProcess: resolve(weldingProcess, weldingProcessOther),
        machineCalibration,
        surfaceCondition,
        poNo,
        couplant,
        stageOfInspection,
        material,
        qapNo,
        accStandard,
        probe,
        probeAngle: overallProbeAngle,
        frequency,
        range,
        scanningSensitivity,
        referenceDb,
        scanningDb,
        observations: observations
          .filter(
            (o) =>
              o.serialNo.trim() || o.jointDetails.trim() || o.remarks.trim(),
          )
          .map((o) => ({
            serialNo: o.serialNo,
            jointDetails: o.jointDetails,
            drawingNoPartNo: o.drawingNoPartNo,
            jobThickness: o.jobThickness,
            partNo: o.partNo,
            transducerAngle: o.transducerAngle,
            jointNo: o.jointNo,
            decibels: {
              indicationLevelA: o.indicationLevelA,
              referenceLevelB: o.referenceLevelB,
              attenuationFactorC: o.attenuationFactorC,
              indicationRatingD: o.indicationRatingD,
            },
            discontinuity: {
              length: o.length,
              angularDistance: o.angularDistance,
              depthFromASurface: o.depthFromASurface,
              distanceX: o.distanceX,
              distanceY: o.distanceY,
            },
            discontinuityEvaluation: o.discontinuityEvaluation,
            remarks: o.remarks,
          })),
        certification: {
          inspectedBy: inspectors[0]?.name ?? "",
          year: inspectors[0]?.qualification ?? "",
          inspectorDesignation: inspectors[0]?.designation ?? "",
          inspectorSignature: inspectors[0]?.signature ?? "",
          testDate: inspectors[0]?.date || undefined,
          manufacturerOrContractor,
          authorizedBy: custName,
          custDesignation: custDesig,
          custSignature: custSig,
          date: custDate || undefined,
          verifiedBy,
          reviewedBy: clientName,
          clientDesignation: clientDesig,
          clientSignature: clientSig,
          reviewedByDate: clientDate || undefined,
        },
      };
      if (id) {
        await updateAWSDReport(id, payload);
      } else {
        await createAWSDReport(payload);
      }
      toast.success(`AWS D1.1 UT Report saved as ${status}.`);
      if (state?.from === "reports-list") {
        navigate("/admin/reports");
      } else {
        navigate(`/admin/customers/${customerId}`, {
          state: { activeTab: "reports", reportSubType: "awsd" },
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
            ULTRASONIC INSPECTION REPORT (AWS D1.1)
          </h1>
          <p className="text-sm text-gray-500">{customerName}</p>
        </div>
      </div>

      {!customerId && (
        <CustomerPickerBanner
          onCustomerSelected={(id, name) => {
            setCustomerId(id);
            setCustomerName(name);
          }}
        />
      )}

      {/* Top Details */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Report No.</label>
            <input
              type="text"
              value={isEditMode ? reportNo : "NIIT/... (Auto-generated)"}
              readOnly
              className={
                inputClass + " bg-gray-50 font-mono font-bold text-indigo-700"
              }
              placeholder="Auto-generated"
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
            <label className={labelClass}>Date of Inspection</label>
            <input
              type="date"
              value={dateOfInspection}
              onChange={(e) => setDateOfInspection(e.target.value)}
              className={fc("dateOfInspection")}
            />
          </div>
          <div>
            <label className={labelClass}>Project</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className={fc("project")}
            />
          </div>
          <div>
            <label className={labelClass}>Job Description</label>
            <input
              type="text"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className={fc("jobDescription")}
            />
          </div>
          <div>
            <label className={labelClass}>Drawing No</label>
            <input
              type="text"
              value={drawingNo}
              onChange={(e) => setDrawingNo(e.target.value)}
              className={fc("drawingNo")}
            />
          </div>
          <div>
            <label className={labelClass}>Calibration. Block</label>
            <input
              type="text"
              value={calibrationBlock}
              onChange={(e) => setCalibrationBlock(e.target.value)}
              className={fc("calibrationBlock")}
            />
          </div>
          <div>
            <label className={labelClass}>QTY of Jts.</label>
            <input
              type="text"
              value={qtyOfJts}
              onChange={(e) => setQtyOfJts(e.target.value)}
              className={fc("qtyOfJts")}
            />
          </div>
          <div>
            <label className={labelClass}>Flaw Detector/Sr. No.</label>
            <input
              type="text"
              value={flawDetectorSrNo}
              onChange={(e) => setFlawDetectorSrNo(e.target.value)}
              className={fc("flawDetectorSrNo")}
            />
          </div>
          <div>
            <label className={labelClass}>Welding Process</label>
            <SelectWithOther
              value={weldingProcess}
              onChange={setWeldingProcess}
              otherValue={weldingProcessOther}
              onOtherChange={setWeldingProcessOther}
              options={["SMAW", "GMAW", "FCAW", "SAW", "GTAW", "MAG", "Other"]}
              error={hasError("weldingProcess")}
            />
          </div>
          <div>
            <label className={labelClass}>Machine Calibration</label>
            <input
              type="text"
              value={machineCalibration}
              onChange={(e) => setMachineCalibration(e.target.value)}
              className={fc("machineCalibration")}
            />
          </div>
          <div>
            <label className={labelClass}>Surface Condition</label>
            <select
              value={surfaceCondition}
              onChange={(e) => setSurfaceCondition(e.target.value)}
              className={fc("surfaceCondition")}
            >
              <option value="">Select...</option>
              <option>Smooth</option>
              <option>Rough</option>
              <option>Ground and polished</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>P.O. No.</label>
            <input
              type="text"
              value={poNo}
              onChange={(e) => setPoNo(e.target.value)}
              className={fc("poNo")}
            />
          </div>
          <div>
            <label className={labelClass}>Couplant</label>
            <select
              value={couplant}
              onChange={(e) => setCouplant(e.target.value)}
              className={fc("couplant")}
            >
              <option value="">Select...</option>
              <option>Water</option>
              <option>Oil</option>
              <option>Grease</option>
              <option>Oil+ Grease</option>
              <option>Starch</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Stage of inspection</label>
            {/* <input
              type="text"
              value={stageOfInspection}
              onChange={(e) => setStageOfInspection(e.target.value)}
              className={fc("stageOfInspection")}
            /> */}
            <select
              value={stageOfInspection}
              onChange={(e) => setStageOfInspection(e.target.value)}
              className={fc("stageOfInspection")}
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
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className={fc("material")}
            />
          </div>
          <div>
            <label className={labelClass}>QAP NO.</label>
            <input
              type="text"
              value={qapNo}
              onChange={(e) => setQapNo(e.target.value)}
              className={fc("qapNo")}
            />
          </div>
          <div>
            <label className={labelClass}>Acc. Standard</label>
            <input
              type="text"
              value={accStandard}
              onChange={(e) => setAccStandard(e.target.value)}
              className={fc("accStandard")}
            />
          </div>
        </div>
      </div>

      {/* ── Probe Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Probe Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div>
            <label className={labelClass}>Probe</label>
            <input
              type="text"
              value={probe}
              onChange={(e) => setProbe(e.target.value)}
              className={fc("probe")}
            />
          </div>
          <div>
            <label className={labelClass}>Probe Angle</label>
            <input
              type="text"
              value={overallProbeAngle}
              onChange={(e) => setOverallProbeAngle(e.target.value)}
              className={fc("overallProbeAngle")}
            />
          </div>
          <div>
            <label className={labelClass}>Frequency</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className={fc("frequency")}
            />
          </div>
          <div>
            <label className={labelClass}>Range</label>
            <input
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className={fc("range")}
            />
          </div>
          <div>
            <label className={labelClass}>Scanning Sensitivity</label>
            <input
              type="text"
              value={scanningSensitivity}
              onChange={(e) => setScanningSensitivity(e.target.value)}
              className={fc("scanningSensitivity")}
            />
          </div>
          <div>
            <label className={labelClass}>Reference dB</label>
            <input
              type="text"
              value={referenceDb}
              onChange={(e) => setReferenceDb(e.target.value)}
              className={fc("referenceDb")}
            />
          </div>
          <div>
            <label className={labelClass}>Scanning dB</label>
            <input
              type="text"
              value={scanningDb}
              onChange={(e) => setScanningDb(e.target.value)}
              className={fc("scanningDb")}
            />
          </div>
        </div>
      </div>

      {/* ── Observations Table ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
              Observations
            </h2>
          </div>
          <button
            type="button"
            onClick={addObs}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-center">
                <th
                  rowSpan={2}
                  className="border border-gray-200 px-2 py-2 w-10"
                >
                  Serial Number
                </th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">
                  Joint Details
                </th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">
                  Drawing No. / Part No.
                </th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">
                  Job Thickness (mm)
                </th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">
                  Part Number
                </th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">
                  Transducer Angle
                </th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">
                  Joint No
                </th>
                <th
                  colSpan={4}
                  className="border border-gray-200 px-2 py-2 bg-indigo-50 text-indigo-700"
                >
                  Decibels
                </th>
                <th
                  colSpan={5}
                  className="border border-gray-200 px-2 py-2 bg-orange-50 text-orange-700"
                >
                  Discontinuity
                </th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">
                  Discontinuity Evaluation
                </th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">
                  Remarks
                </th>
                <th
                  rowSpan={2}
                  className="border border-gray-200 px-2 py-2 w-8"
                ></th>
              </tr>
              <tr className="bg-gray-50 text-gray-600 text-center">
                <th className="border border-gray-200 px-2 py-1 bg-indigo-50">
                  Indication Level (a)
                </th>
                <th className="border border-gray-200 px-2 py-1 bg-indigo-50">
                  Reference Level (b)
                </th>
                <th className="border border-gray-200 px-2 py-1 bg-indigo-50">
                  Attenuation Factor (c)
                </th>
                <th className="border border-gray-200 px-2 py-1 bg-indigo-50">
                  Indication Rating (d)
                </th>
                <th className="border border-gray-200 px-2 py-1 bg-orange-50">
                  Length (mm)
                </th>
                <th className="border border-gray-200 px-2 py-1 bg-orange-50">
                  Angular Distance (Sound Path)
                </th>
                <th className="border border-gray-200 px-2 py-1 bg-orange-50">
                  Depth from "A" Surface
                </th>
                <th className="border border-gray-200 px-2 py-1 bg-orange-50">
                  Distance MM From X
                </th>
                <th className="border border-gray-200 px-2 py-1 bg-orange-50">
                  Distance MM From Y
                </th>
              </tr>
            </thead>
            <tbody>
              {observations.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    <input
                      type="text"
                      value={row.serialNo}
                      onChange={(e) =>
                        updateObs(idx, "serialNo", e.target.value)
                      }
                      className={
                        (!!errors[`obs${idx}_serialNo`] && !row.serialNo?.trim()
                          ? inputErrorClass
                          : inputClass) + " text-center"
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.jointDetails}
                      onChange={(e) =>
                        updateObs(idx, "jointDetails", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_jointDetails`] &&
                        !row.jointDetails?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.drawingNoPartNo}
                      onChange={(e) =>
                        updateObs(idx, "drawingNoPartNo", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_drawingNoPartNo`] &&
                        !row.drawingNoPartNo?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.jobThickness}
                      onChange={(e) =>
                        updateObs(idx, "jobThickness", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_jobThickness`] &&
                        !row.jobThickness?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.partNo}
                      onChange={(e) => updateObs(idx, "partNo", e.target.value)}
                      className={
                        !!errors[`obs${idx}_partNo`] && !row.partNo?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.transducerAngle}
                      onChange={(e) =>
                        updateObs(idx, "transducerAngle", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_transducerAngle`] &&
                        !row.transducerAngle?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.jointNo}
                      onChange={(e) =>
                        updateObs(idx, "jointNo", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_jointNo`] && !row.jointNo?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30">
                    <input
                      type="text"
                      value={row.indicationLevelA}
                      onChange={(e) =>
                        updateObs(idx, "indicationLevelA", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_indicationLevelA`] &&
                        !row.indicationLevelA?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30">
                    <input
                      type="text"
                      value={row.referenceLevelB}
                      onChange={(e) =>
                        updateObs(idx, "referenceLevelB", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_referenceLevelB`] &&
                        !row.referenceLevelB?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30">
                    <input
                      type="text"
                      value={row.attenuationFactorC}
                      onChange={(e) =>
                        updateObs(idx, "attenuationFactorC", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_attenuationFactorC`] &&
                        !row.attenuationFactorC?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30">
                    <input
                      type="text"
                      value={row.indicationRatingD}
                      onChange={(e) =>
                        updateObs(idx, "indicationRatingD", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_indicationRatingD`] &&
                        !row.indicationRatingD?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30">
                    <input
                      type="text"
                      value={row.length}
                      onChange={(e) => updateObs(idx, "length", e.target.value)}
                      className={
                        !!errors[`obs${idx}_length`] && !row.length?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30">
                    <input
                      type="text"
                      value={row.angularDistance}
                      onChange={(e) =>
                        updateObs(idx, "angularDistance", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_angularDistance`] &&
                        !row.angularDistance?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30">
                    <input
                      type="text"
                      value={row.depthFromASurface}
                      onChange={(e) =>
                        updateObs(idx, "depthFromASurface", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_depthFromASurface`] &&
                        !row.depthFromASurface?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30">
                    <input
                      type="text"
                      value={row.distanceX}
                      onChange={(e) =>
                        updateObs(idx, "distanceX", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_distanceX`] &&
                        !row.distanceX?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30">
                    <input
                      type="text"
                      value={row.distanceY}
                      onChange={(e) =>
                        updateObs(idx, "distanceY", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_distanceY`] &&
                        !row.distanceY?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.discontinuityEvaluation}
                      onChange={(e) =>
                        updateObs(
                          idx,
                          "discontinuityEvaluation",
                          e.target.value,
                        )
                      }
                      className={
                        !!errors[`obs${idx}_discontinuityEvaluation`] &&
                        !row.discontinuityEvaluation?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={(e) =>
                        updateObs(idx, "remarks", e.target.value)
                      }
                      className={
                        !!errors[`obs${idx}_remarks`] && !row.remarks?.trim()
                          ? inputErrorClass
                          : inputClass
                      }
                    />
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

      {/* ── Certification & Signatures ── */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Examined By */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5">
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
                      <label className={labelClass}>Name *</label>
                      <select
                        value={insp.name}
                        onChange={(e) =>
                          updateInsp(idx, "name", e.target.value)
                        }
                        className={`${errors[`inspectorName_${idx}`] && !insp.name.trim() ? inputErrorClass : inputClass} bg-white`}
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
                          !!errors[`inspectorQual_${idx}`] &&
                          !insp.qualification.trim()
                            ? inputErrorClass
                            : inputClass
                        }
                        placeholder="e.g. UT NDE Level II"
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
                          !!errors[`inspectorDesig_${idx}`] &&
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
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5">
              Customer
            </p>
            <input
              type="text"
              value={manufacturerOrContractor}
              onChange={(e) => setManufacturerOrContractor(e.target.value)}
              className={
                fc("manufacturerOrContractor") + " mb-3 text-xs font-semibold"
              }
              placeholder="Company name"
            />
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className={fc("custName")}
                />
              </div>
              <div>
                <label className={labelClass}>Designation *</label>
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
                <label className={labelClass}>Date *</label>
                <input
                  type="date"
                  value={custDate}
                  onChange={(e) => setCustDate(e.target.value)}
                  className={fc("custDate")}
                />
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5">
              Client
            </p>
            <input
              type="text"
              value={verifiedBy}
              onChange={(e) => setVerifiedBy(e.target.value)}
              className={
                (!!errors.verifiedBy && !verifiedBy.trim()
                  ? inputErrorClass
                  : inputClass) + " mb-3 text-xs font-semibold"
              }
              placeholder="Company / TPI name"
            />
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={fc("clientName")}
                />
              </div>
              <div>
                <label className={labelClass}>Designation *</label>
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
                <label className={labelClass}>Date *</label>
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
