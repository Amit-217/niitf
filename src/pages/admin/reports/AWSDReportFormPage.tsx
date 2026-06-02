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
  const [testDate, setTestDate] = useState("");
  const [inspectedBy, setInspectedBy] = useState("");
  const [certYear, setCertYear] = useState("");
  const [manufacturerOrContractor, setManufacturerOrContractor] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [footerDate, setFooterDate] = useState("");

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
        setProject(r.project ?? "");
        setDateOfInspection(toDate(r.dateOfInspection));

        setJobDescription(r.jobDescription ?? "");
        setDrawingNo(r.drawingNo ?? "");
        setCalibrationBlock(r.calibrationBlock ?? "");
        setQtyOfJts(r.qtyOfJts ?? "");
        setFlawDetectorSrNo(r.flawDetectorSrNo ?? "");
        const [wp, wpO] = fromOther(r.weldingProcess, [
          "SMAW", "GMAW", "FCAW", "SAW", "GTAW", "MAG", "Other",
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
        setTestDate(toDate(cert.testDate));
        setInspectedBy(cert.inspectedBy ?? "");
        setCertYear(cert.year ?? "");
        setManufacturerOrContractor(cert.manufacturerOrContractor ?? "");
        setAuthorizedBy(cert.authorizedBy ?? "");
        setVerifiedBy(cert.verifiedBy ?? "");
        setFooterDate(toDate(cert.date));
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
      testDate,
      inspectedBy,
      certYear,
      manufacturerOrContractor,
      authorizedBy,
      verifiedBy,
      weldingProcess: weldingProcess === "Other" ? weldingProcessOther : weldingProcess,
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
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, serialNo: (i + 1).toString() })),
    );

  // ── Submit ──
  const handleSubmit = async (status: "draft" | "final") => {
    if (!isEditMode && !customerId) {
      toast.error("Please select a customer first.");
      return;
    }

    if (status === "final") {
      const e: Record<string, boolean> = {};
      const mt = (v: string) => !v.trim();
      const oth = (v: string, o: string) => !v || (v === "Other" && !o.trim());

      if (!dateOfInspection) e.dateOfInspection = true;
      if (mt(project)) e.project = true;
      if (mt(jobDescription)) e.jobDescription = true;
      if (mt(drawingNo)) e.drawingNo = true;
      if (mt(calibrationBlock)) e.calibrationBlock = true;
      if (mt(qtyOfJts)) e.qtyOfJts = true;
      if (mt(flawDetectorSrNo)) e.flawDetectorSrNo = true;
      if (oth(weldingProcess, weldingProcessOther)) e.weldingProcess = true;
      if (mt(machineCalibration)) e.machineCalibration = true;
      if (mt(surfaceCondition)) e.surfaceCondition = true;
      if (mt(poNo)) e.poNo = true;
      if (mt(couplant)) e.couplant = true;
      if (mt(stageOfInspection)) e.stageOfInspection = true;
      if (mt(material)) e.material = true;
      if (mt(qapNo)) e.qapNo = true;
      if (mt(accStandard)) e.accStandard = true;
      if (mt(probe)) e.probe = true;
      if (mt(overallProbeAngle)) e.overallProbeAngle = true;
      if (mt(frequency)) e.frequency = true;
      if (mt(range)) e.range = true;
      if (mt(scanningSensitivity)) e.scanningSensitivity = true;
      if (mt(referenceDb)) e.referenceDb = true;
      if (mt(scanningDb)) e.scanningDb = true;
      if (!observations.some((o) => o.jointDetails.trim())) e.observations = true;
      if (!testDate) e.testDate = true;
      if (mt(inspectedBy)) e.inspectedBy = true;
      if (mt(certYear)) e.certYear = true;
      if (mt(manufacturerOrContractor)) e.manufacturerOrContractor = true;
      if (mt(authorizedBy)) e.authorizedBy = true;
      if (!footerDate) e.footerDate = true;

      if (Object.keys(e).length > 0) {
        setErrors(e);
        toast.error("Please fill all required fields before saving as Final.");
        return;
      }
      setErrors({});
    }

    setSaving(true);
    try {
      const payload = {
        customerId,
        reportNo: reportNo.trim(),
        status,
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
          testDate: testDate || undefined,
          inspectedBy,
          year: certYear,
          manufacturerOrContractor,
          authorizedBy,
          verifiedBy,
          date: footerDate || undefined,
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
      toast.error(getApiErrorMessage(error, "Failed to save report. Please try again."));
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
              className={inputClass + " bg-gray-50 font-mono font-bold text-indigo-700"}
              placeholder="Auto-generated"
            />
          </div>
          <div>
            <label className={labelClass}>Date of Inspection</label>
            <input type="date" value={dateOfInspection} onChange={(e) => setDateOfInspection(e.target.value)} className={fc("dateOfInspection")} />
          </div>
          <div>
            <label className={labelClass}>Project</label>
            <input type="text" value={project} onChange={(e) => setProject(e.target.value)} className={fc("project")} />
          </div>
          <div>
            <label className={labelClass}>Job Description</label>
            <input type="text" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className={fc("jobDescription")} />
          </div>
          <div>
            <label className={labelClass}>Drawing No</label>
            <input type="text" value={drawingNo} onChange={(e) => setDrawingNo(e.target.value)} className={fc("drawingNo")} />
          </div>
          <div>
            <label className={labelClass}>Calibration. Block</label>
            <input type="text" value={calibrationBlock} onChange={(e) => setCalibrationBlock(e.target.value)} className={fc("calibrationBlock")} />
          </div>
          <div>
            <label className={labelClass}>QTY of Jts.</label>
            <input type="text" value={qtyOfJts} onChange={(e) => setQtyOfJts(e.target.value)} className={fc("qtyOfJts")} />
          </div>
          <div>
            <label className={labelClass}>Flaw Detector/Sr. No.</label>
            <input type="text" value={flawDetectorSrNo} onChange={(e) => setFlawDetectorSrNo(e.target.value)} className={fc("flawDetectorSrNo")} />
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
            <input type="text" value={machineCalibration} onChange={(e) => setMachineCalibration(e.target.value)} className={fc("machineCalibration")} />
          </div>
          <div>
            <label className={labelClass}>Surface Condition</label>
            <input type="text" value={surfaceCondition} onChange={(e) => setSurfaceCondition(e.target.value)} className={fc("surfaceCondition")} />
          </div>
          <div>
            <label className={labelClass}>P.O. No.</label>
            <input type="text" value={poNo} onChange={(e) => setPoNo(e.target.value)} className={fc("poNo")} />
          </div>
          <div>
            <label className={labelClass}>Couplant</label>
            <input type="text" value={couplant} onChange={(e) => setCouplant(e.target.value)} className={fc("couplant")} />
          </div>
          <div>
            <label className={labelClass}>Stage of inspection</label>
            <input type="text" value={stageOfInspection} onChange={(e) => setStageOfInspection(e.target.value)} className={fc("stageOfInspection")} />
          </div>
          <div>
            <label className={labelClass}>Material</label>
            <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} className={fc("material")} />
          </div>
          <div>
            <label className={labelClass}>QAP NO.</label>
            <input type="text" value={qapNo} onChange={(e) => setQapNo(e.target.value)} className={fc("qapNo")} />
          </div>
          <div>
            <label className={labelClass}>Acc. Standard</label>
            <input type="text" value={accStandard} onChange={(e) => setAccStandard(e.target.value)} className={fc("accStandard")} />
          </div>
        </div>
      </div>

      {/* ── Probe Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Probe Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div>
            <label className={labelClass}>Probe</label>
            <input type="text" value={probe} onChange={(e) => setProbe(e.target.value)} className={fc("probe")} />
          </div>
          <div>
            <label className={labelClass}>Probe Angle</label>
            <input type="text" value={overallProbeAngle} onChange={(e) => setOverallProbeAngle(e.target.value)} className={fc("overallProbeAngle")} />
          </div>
          <div>
            <label className={labelClass}>Frequency</label>
            <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} className={fc("frequency")} />
          </div>
          <div>
            <label className={labelClass}>Range</label>
            <input type="text" value={range} onChange={(e) => setRange(e.target.value)} className={fc("range")} />
          </div>
          <div>
            <label className={labelClass}>Scanning Sensitivity</label>
            <input type="text" value={scanningSensitivity} onChange={(e) => setScanningSensitivity(e.target.value)} className={fc("scanningSensitivity")} />
          </div>
          <div>
            <label className={labelClass}>Reference dB</label>
            <input type="text" value={referenceDb} onChange={(e) => setReferenceDb(e.target.value)} className={fc("referenceDb")} />
          </div>
          <div>
            <label className={labelClass}>Scanning dB</label>
            <input type="text" value={scanningDb} onChange={(e) => setScanningDb(e.target.value)} className={fc("scanningDb")} />
          </div>
        </div>
      </div>

      {/* ── Observations Table ── */}
      <div
        className={
          sectionClass +
          (errors.observations && !observations.some((o) => o.jointDetails.trim())
            ? " ring-2 ring-red-400"
            : "")
        }
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
              Observations
            </h2>
            {errors.observations && !observations.some((o) => o.jointDetails.trim()) && (
              <span className="text-xs font-medium text-red-500">
                At least one row must have Joint Details filled.
              </span>
            )}
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
                <th rowSpan={2} className="border border-gray-200 px-2 py-2 w-10">Serial Number</th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">Joint Details</th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">Drawing No. / Part No.</th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">Job Thickness (mm)</th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">Part Number</th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">Transducer Angle</th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">Joint No</th>
                <th colSpan={4} className="border border-gray-200 px-2 py-2 bg-indigo-50 text-indigo-700">Decibels</th>
                <th colSpan={5} className="border border-gray-200 px-2 py-2 bg-orange-50 text-orange-700">Discontinuity</th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">Discontinuity Evaluation</th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2">Remarks</th>
                <th rowSpan={2} className="border border-gray-200 px-2 py-2 w-8"></th>
              </tr>
              <tr className="bg-gray-50 text-gray-600 text-center">
                <th className="border border-gray-200 px-2 py-1 bg-indigo-50">Indication Level (a)</th>
                <th className="border border-gray-200 px-2 py-1 bg-indigo-50">Reference Level (b)</th>
                <th className="border border-gray-200 px-2 py-1 bg-indigo-50">Attenuation Factor (c)</th>
                <th className="border border-gray-200 px-2 py-1 bg-indigo-50">Indication Rating (d)</th>
                <th className="border border-gray-200 px-2 py-1 bg-orange-50">Length (mm)</th>
                <th className="border border-gray-200 px-2 py-1 bg-orange-50">Angular Distance (Sound Path)</th>
                <th className="border border-gray-200 px-2 py-1 bg-orange-50">Depth from "A" Surface</th>
                <th className="border border-gray-200 px-2 py-1 bg-orange-50">Distance MM From X</th>
                <th className="border border-gray-200 px-2 py-1 bg-orange-50">Distance MM From Y</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    <input type="text" value={row.serialNo} onChange={(e) => updateObs(idx, "serialNo", e.target.value)} className={inputClass + " text-center"} />
                  </td>
                  <td className="border border-gray-200 px-1 py-1"><input type="text" value={row.jointDetails} onChange={(e) => updateObs(idx, "jointDetails", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1"><input type="text" value={row.drawingNoPartNo} onChange={(e) => updateObs(idx, "drawingNoPartNo", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1"><input type="text" value={row.jobThickness} onChange={(e) => updateObs(idx, "jobThickness", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1"><input type="text" value={row.partNo} onChange={(e) => updateObs(idx, "partNo", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1"><input type="text" value={row.transducerAngle} onChange={(e) => updateObs(idx, "transducerAngle", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1"><input type="text" value={row.jointNo} onChange={(e) => updateObs(idx, "jointNo", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30"><input type="text" value={row.indicationLevelA} onChange={(e) => updateObs(idx, "indicationLevelA", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30"><input type="text" value={row.referenceLevelB} onChange={(e) => updateObs(idx, "referenceLevelB", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30"><input type="text" value={row.attenuationFactorC} onChange={(e) => updateObs(idx, "attenuationFactorC", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30"><input type="text" value={row.indicationRatingD} onChange={(e) => updateObs(idx, "indicationRatingD", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30"><input type="text" value={row.length} onChange={(e) => updateObs(idx, "length", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30"><input type="text" value={row.angularDistance} onChange={(e) => updateObs(idx, "angularDistance", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30"><input type="text" value={row.depthFromASurface} onChange={(e) => updateObs(idx, "depthFromASurface", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30"><input type="text" value={row.distanceX} onChange={(e) => updateObs(idx, "distanceX", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30"><input type="text" value={row.distanceY} onChange={(e) => updateObs(idx, "distanceY", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1"><input type="text" value={row.discontinuityEvaluation} onChange={(e) => updateObs(idx, "discontinuityEvaluation", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1"><input type="text" value={row.remarks} onChange={(e) => updateObs(idx, "remarks", e.target.value)} className={inputClass} /></td>
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    {observations.length > 1 && (
                      <button type="button" onClick={() => removeObs(idx)} className="text-red-400 hover:text-red-600">
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
        <h2 className={sectionTitleClass}>Certification &amp; Signatures</h2>
        {/* Row 1: date/reference fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelClass}>Year (for certification)</label>
            <input type="text" value={certYear} onChange={(e) => setCertYear(e.target.value)} className={fc("certYear")} placeholder="e.g. 2025" />
          </div>
          <div>
            <label className={labelClass}>Test Date</label>
            <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} className={fc("testDate")} />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={footerDate}
              onChange={(e) => setFooterDate(e.target.value)}
              className={errors.footerDate && !footerDate ? inputErrorClass : inputClass}
            />
          </div>
        </div>
        {/* Row 2: personnel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelClass}>Inspected By</label>
            <input type="text" value={inspectedBy} onChange={(e) => setInspectedBy(e.target.value)} className={fc("inspectedBy")} />
          </div>
          <div>
            <label className={labelClass}>Manufacturer or Contractor</label>
            <input type="text" value={manufacturerOrContractor} onChange={(e) => setManufacturerOrContractor(e.target.value)} className={fc("manufacturerOrContractor")} />
          </div>
          <div>
            <label className={labelClass}>Authorized By</label>
            <input type="text" value={authorizedBy} onChange={(e) => setAuthorizedBy(e.target.value)} className={fc("authorizedBy")} />
          </div>
        </div>
        {/* Row 3: verified by */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Verified By</label>
            <input type="text" value={verifiedBy} onChange={(e) => setVerifiedBy(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="button" disabled={saving} onClick={() => handleSubmit("draft")} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save as Draft"}
        </button>
        <button type="button" disabled={saving} onClick={() => handleSubmit("final")} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save as Final"}
        </button>
      </div>
    </div>
  );
};
