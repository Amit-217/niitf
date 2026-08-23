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

// --- Styles ---

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const inputErrorClass =
  "w-full border-2 border-red-400 bg-red-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-gray-200 p-5 mb-5";
const sectionTitleClass =
  "text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100";

// --- SelectWithCustom ---

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

// --- Types ---

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

const emptySearchUnit = (): UTSearchUnit => ({
  model: "",
  angle: "",
  srNo: "",
  crystalSize: "",
  waveMode: "",
  frequency: "",
  frequencyCustom: "",
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
  qualification: "UT NDE Level II",
  designation: "",
  signature: "",
  idNo: "",
  date: "",
});

// --- Page ---

export const UTReportFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/employee")
    ? "/employee"
    : location.pathname.startsWith("/supervisor")
      ? "/supervisor"
      : "/admin";
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

  // -- Equipment Details --
  const [eqType, setEqType] = useState("");
  const [eqTypeCustom, setEqTypeCustom] = useState("");
  const [eqSrNo, setEqSrNo] = useState("");
  const [eqMake, setEqMake] = useState("");
  const [eqMakeCustom, setEqMakeCustom] = useState("");
  const [eqCalibDue, setEqCalibDue] = useState("");
  const [eqCouplant, setEqCouplant] = useState("");
  const [eqBasicCalib, setEqBasicCalib] = useState("");

  // -- Search Units --
  const [searchUnits, setSearchUnits] = useState<UTSearchUnit[]>([
    emptySearchUnit(),
  ]);

  // -- Technique Details --
  const [utMethodCustom, setUtMethodCustom] = useState("");
  const [utMethod, setUtMethod] = useState("");
  const [refCalibBlock, setRefCalibBlock] = useState("");
  const [refCalibBlockCustom, setRefCalibBlockCustom] = useState("");
  const [utCalibMethod, setUtCalibMethod] = useState("");
  const [scanningDb, setScanningDb] = useState("");
  const [scanningSens, setScanningSens] = useState("");
  const [scanningSensCustom, setScanningSensCustom] = useState("");

  // -- Angle Probe Calibration --
  const [calib0, setCalib0] = useState<CalibRow>(emptyCalib());
  const [calib45, setCalib45] = useState<CalibRow>(emptyCalib());
  const [calib60, setCalib60] = useState<CalibRow>(emptyCalib());
  const [calib70, setCalib70] = useState<CalibRow>(emptyCalib());

  // -- Observations --
  const [observations, setObservations] = useState<ObsRow[]>([emptyObs()]);

  // -- Conclusion --
  const [conclusion, setConclusion] = useState("");
  const [conclusionCustom, setConclusionCustom] = useState("");

  // -- Users for inspector dropdown --
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    api
      .get("/users?status=active&limit=100")
      .then((res: any) => setUsers(res.data ?? res ?? []))
      .catch(() => {});
  }, []);

  // -- Final Section --
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
      jobStage,
      jobSurface,
      jobJointType,
      jobSurfaceTemp,
      eqSrNo,
      eqCalibDue,
      eqCouplant,
      eqBasicCalib,
      utCalibMethod,
      scanningDb,
      // search unit row 0
      searchUnit0_model: searchUnits[0]?.model ?? "",
      searchUnit0_angle: searchUnits[0]?.angle ?? "",
      searchUnit0_srNo: searchUnits[0]?.srNo ?? "",
      searchUnit0_crystalSize: searchUnits[0]?.crystalSize ?? "",
      searchUnit0_frequency:
        (searchUnits[0]?.frequency === "Other"
          ? searchUnits[0]?.frequencyCustom
          : searchUnits[0]?.frequency) ?? "",
      // calib table rows
      calib0_range: calib0.range,
      calib0_refDb: calib0.refDb,
      calib45_range: calib45.range,
      calib45_refDb: calib45.refDb,
      calib60_range: calib60.range,
      calib60_refDb: calib60.refDb,
      calib70_range: calib70.range,
      calib70_refDb: calib70.refDb,
      // inspector 0
      inspectorQual_0: inspectors[0]?.qualification ?? "",
      inspectorDesig_0: inspectors[0]?.designation ?? "",
      inspectorDate_0: inspectors[0]?.date ?? "",
      // customer rep
      custName,
      custDesig,
      custDate,
      // client rep
      clientName,
      clientDesig,
      clientDate,
      // SelectWithCustom fields
      jobRefStd: jobRefStd === "Other" ? jobRefStdCustom : jobRefStd,
      jobAcceptance:
        jobAcceptance === "Other" ? jobAcceptanceCustom : jobAcceptance,
      jobExtent: jobExtent === "Other" ? jobExtentCustom : jobExtent,
      eqType: eqType === "Other" ? eqTypeCustom : eqType,
      eqMake: eqMake === "Other" ? eqMakeCustom : eqMake,
      utMethod: utMethod === "Other" ? utMethodCustom : utMethod,
      refCalibBlock:
        refCalibBlock === "Other" ? refCalibBlockCustom : refCalibBlock,
      scanningSens:
        scanningSens === "Other" ? scanningSensCustom : scanningSens,
      conclusion: conclusion === "Other" ? conclusionCustom : conclusion,
    };
    return map[key] ?? "";
  };
  const hasError = (key: string) => !!errors[key] && !getFieldValue(key);
  const fc = (key: string) => (hasError(key) ? inputErrorClass : inputClass);

  const updateUnit = (idx: number, key: keyof UTSearchUnit, val: string) =>
    setSearchUnits((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;

        let updatedRow = { ...row, [key]: val };

        if (key === "angle") {
          const crystalOptions = getCrystalSizeOptions(val);
          updatedRow.crystalSize = crystalOptions[0];
          updatedRow.waveMode = getWaveMode(val);
        }

        return updatedRow;
      }),
    );

  const addUnit = () => setSearchUnits((prev) => [...prev, emptySearchUnit()]);
  const removeUnit = (idx: number) =>
    setSearchUnits((prev) => prev.filter((_, i) => i !== idx));

  const updateObs = (idx: number, key: keyof ObsRow, val: string) =>
    setObservations((prev) =>
      prev.map((row, i) => {
        if (i === idx) {
          const updated = { ...row, [key]: val };
          if (key === "interpretation") {
            if (val === "No relevant Indication Found") {
              updated.evaluation = "Accepted";
            } else if (val === "Relevant Indication Found") {
              updated.evaluation = "Rejected";
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

  const updateCalib = (
    setter: React.Dispatch<React.SetStateAction<CalibRow>>,
    key: keyof CalibRow,
    val: string,
  ) => setter((prev) => ({ ...prev, [key]: val }));

  // -- Load existing report in edit mode --
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
        if (r.customerId)
          setCustomerId(
            typeof r.customerId === "object"
              ? (r.customerId?._id ?? "")
              : r.customerId,
          );
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
          "ASTM A 609",
          "ASTM A 435",
          "ASTM A 578",
          "ASTM A 388",
          "Other",
        ]);
        setJobRefStd(refStd);
        setJobRefStdCustom(refStdC);
        const [acc, accC] = fromOther(jd.acceptanceCriteria, [
          "ASME SEC VIII Div. 1 Appendix 12",
          "ASTM A 609",
          "ASTM A 435",
          "ASTM A 578",
          "ASTM A 388",
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
          '1" BWE set @ 80% of FSH on Job',
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
        const [con, conC] = fromOther(r.conclusion ?? "", conclusionOpts);
        setConclusion(con);
        setConclusionCustom(conC);

        const fs = r.finalSection ?? {};
        setInspectors(
          fs.inspector?.length
            ? fs.inspector.map((i: any) => ({
                name: i.name ?? "",
                qualification: i.qualification || "UT NDE Level II",
                designation: i.designation ?? "",
                signature: i.signature ?? "",
                idNo: i.idNo ?? "",
                date: toDate(i.date),
              }))
            : [emptyInspector()],
        );
        const custRep = fs.customer ?? {};
        setCustName(custRep.name ?? "");
        setCustDesig(custRep.designation ?? "");
        setCustSig(custRep.signature ?? "");
        setCustIdNo(custRep.idNo ?? "");
        setCustDate(toDate(custRep.date));
        const clientRep = fs.clientOrTPI ?? {};
        setClientName(clientRep.name ?? "");
        setClientDesig(clientRep.designation ?? "");
        setClientSig(clientRep.signature ?? "");
        setClientIdNo(clientRep.idNo ?? "");
        setClientDate(toDate(clientRep.date));
      })
      .catch(() => toast.error("Failed to load report."));
  }, [id]);

  // — Submit —
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
        },
        equipmentDetails: {
          equipmentType: resolve(eqType, eqTypeCustom) || undefined,
          srNo: eqSrNo,
          make: resolve(eqMake, eqMakeCustom),
          calibrationDue: eqCalibDue,
          couplant: eqCouplant,
          basicCalibrationBlock: eqBasicCalib,
        },
        searchUnitDetails: searchUnits
          .filter(
            (u) =>
              u.model.trim() ||
              u.angle.trim() ||
              u.srNo.trim() ||
              u.crystalSize.trim() ||
              u.waveMode.trim() ||
              u.frequency.trim(),
          )
          .map((u) => ({
            ...u,
            frequency:
              u.frequency === "Other" ? u.frequencyCustom || "" : u.frequency,
          })),
        techniqueDetails: {
          utMethod: resolve(utMethod, utMethodCustom),
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
        await updateUTReport(id, payload);
      } else {
        await createUTReport(payload);
      }

      toast.success(`UT Report saved as ${status}.`);
      if (state?.from === "reports-list") {
        navigate(`${basePath}/reports`);
      } else {
        navigate(`${basePath}/customers/${customerId}`, {
          state: { activeTab: "reports", reportSubType: "ut" },
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

  const angleProbeOptions = ["45°", "60°", "70°"];

  const getCrystalSizeOptions = (angle: string) => {
    if (angleProbeOptions.includes(angle)) {
      return ["8x9 mm", "20x22 mm"];
    }
    return ["Ø10 mm", "Ø24 mm"];
  };

  const getWaveMode = (angle: string) => {
    if (angleProbeOptions.includes(angle)) {
      return "Shear";
    }
    return "Longitudinal";
  };

  const calibAngles = [
    { label: "0°", state: calib0, setter: setCalib0, prefix: "calib0" },
    { label: "45°", state: calib45, setter: setCalib45, prefix: "calib45" },
    { label: "60°", state: calib60, setter: setCalib60, prefix: "calib60" },
    { label: "70°", state: calib70, setter: setCalib70, prefix: "calib70" },
  ];

  // const conclusionOptions = [
  //   "Examination completed as per applicable standards. No rejectable indications observed in inspected items",
  //   "Examination completed as per applicable standards. Rejectable indications observed in inspected items",
  //   "Examination completed as per applicable process. No rejectable indications observed in inspected items",
  //   "Examination completed as per applicable process. Rejectable indications observed in inspected items",
  //   "Other",
  // ];

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

      {/* — Missing Customer Banner — */}
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

      {/* — Job Details — */}
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
            <label className={labelClass}>Report Date</label>
            <input
              type="date"
              value={jobReportDate}
              onChange={(e) => setJobReportDate(e.target.value)}
              className={fc("jobReportDate")}
            />
          </div>
          <div>
            <label className={labelClass}>Project</label>
            <input
              type="text"
              value={jobProject}
              onChange={(e) => setJobProject(e.target.value)}
              className={fc("jobProject")}
              placeholder="e.g. VC-200412"
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
            <label className={labelClass}>Reference Std.</label>
            <SelectWithCustom
              value={jobRefStd}
              onChange={setJobRefStd}
              customValue={jobRefStdCustom}
              onCustomChange={setJobRefStdCustom}
              error={hasError("jobRefStd")}
              options={[
                "ASME Sec V Article 4",
                "ASTM A 609",
                "ASTM A 435",
                "ASTM A 578",
                "ASTM A 388",
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
              error={hasError("jobAcceptance")}
              options={[
                "ASME SEC VIII Div. 1 Appendix 12",
                "ASTM A 609",
                "ASTM A 435",
                "ASTM A 578",
                "ASTM A 388",
                "Other",
              ]}
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
              placeholder="e.g. IS 2062 E-250 BR"
            />
          </div>
          <div>
            <label className={labelClass}>Extent of Examination</label>
            <SelectWithCustom
              value={jobExtent}
              onChange={setJobExtent}
              customValue={jobExtentCustom}
              onCustomChange={setJobExtentCustom}
              error={hasError("jobExtent")}
              options={[
                "10%",
                "100%",
                "To the maximum extent possible",
                "Other",
              ]}
            />
          </div>
          {/* <div>
            <label className={labelClass}>Thickness</label>
            <input
              type="text"
              value={jobThickness}
              onChange={(e) => setJobThickness(e.target.value)}
              className={fc("jobThickness")}
              placeholder="e.g. 6,12 & 16 MM"
            />
          </div> */}
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

      {/* -- Equipment Details -- */}
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
              error={hasError("eqType")}
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
              className={fc("eqSrNo")}
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
              error={hasError("eqMake")}
              options={["Modsonic", "Waygate", "Kappawave", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Calibration Due</label>
            <input
              type="text"
              value={eqCalibDue}
              onChange={(e) => setEqCalibDue(e.target.value)}
              className={fc("eqCalibDue")}
              placeholder="e.g. 18-12-2025"
            />
          </div>
          <div>
            <label className={labelClass}>Couplant</label>
            <select
              value={eqCouplant}
              onChange={(e) => setEqCouplant(e.target.value)}
              className={fc("eqCouplant")}
            >
              <option value="">Select...</option>
              <option>Water</option>
              <option>Oil</option>
              <option>Grease</option>
              <option>Oil+ Grease</option>
              <option>Starch Powder + Water</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Basic Calibration Block</label>
            <select
              value={eqBasicCalib}
              onChange={(e) => setEqBasicCalib(e.target.value)}
              className={fc("eqBasicCalib")}
            >
              <option value="">Select...</option>
              <option>IIW V1</option>
              <option>IIW V2</option>
            </select>
          </div>
        </div>
      </div>

      {/* -- Search Unit Details -- */}
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
              {searchUnits.map((unit, idx) => {
                const modelErr =
                  !!errors[`searchUnit${idx}_model`] && !unit.model.trim();
                const angleErr =
                  !!errors[`searchUnit${idx}_angle`] && !unit.angle;
                const srNoErr =
                  !!errors[`searchUnit${idx}_srNo`] && !unit.srNo.trim();
                const crystalErr =
                  !!errors[`searchUnit${idx}_crystalSize`] && !unit.crystalSize;
                const freqVal =
                  unit.frequency === "Other"
                    ? (unit.frequencyCustom ?? "")
                    : unit.frequency;
                const freqErr =
                  !!errors[`searchUnit${idx}_frequency`] && !freqVal.trim();
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-1 py-1">
                      <input
                        type="text"
                        value={unit.model}
                        onChange={(e) =>
                          updateUnit(idx, "model", e.target.value)
                        }
                        className={modelErr ? inputErrorClass : inputClass}
                        placeholder="e.g. Modsonic"
                      />
                    </td>
                    <td className="border border-gray-200 px-1 py-1">
                      <select
                        value={unit.angle}
                        onChange={(e) =>
                          updateUnit(idx, "angle", e.target.value)
                        }
                        className={angleErr ? inputErrorClass : inputClass}
                      >
                        <option value="">Select...</option>
                        <option>45°</option>
                        <option>60°</option>
                        <option>70°</option>
                        <option>Normal</option>
                        <option>TR</option>
                      </select>
                    </td>
                    <td className="border border-gray-200 px-1 py-1">
                      <input
                        type="text"
                        value={unit.srNo}
                        onChange={(e) =>
                          updateUnit(idx, "srNo", e.target.value)
                        }
                        className={srNoErr ? inputErrorClass : inputClass}
                      />
                    </td>
                    <td className="border border-gray-200 px-1 py-1">
                      <select
                        value={unit.crystalSize}
                        onChange={(e) =>
                          updateUnit(idx, "crystalSize", e.target.value)
                        }
                        className={crystalErr ? inputErrorClass : inputClass}
                      >
                        <option value="">Select...</option>
                        {getCrystalSizeOptions(unit.angle).map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
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
                        <option value={getWaveMode(unit.angle)}>
                          {getWaveMode(unit.angle)}
                        </option>
                      </select>
                    </td>
                    <td className="border border-gray-200 px-1 py-1 w-[150px]">
                      <SelectWithCustom
                        value={unit.frequency}
                        onChange={(val) => updateUnit(idx, "frequency", val)}
                        customValue={unit.frequencyCustom || ""}
                        onCustomChange={(val) =>
                          setSearchUnits((prev) =>
                            prev.map((row, i) =>
                              i === idx
                                ? { ...row, frequencyCustom: val }
                                : row,
                            ),
                          )
                        }
                        error={freqErr}
                        options={["1 MHz", "2 MHz", "4 MHz", "Other"]}
                      />
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* -- Technique Details -- */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Technique Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>UT Method</label>
            <SelectWithCustom
              value={utMethod}
              onChange={setUtMethod}
              customValue={utMethodCustom}
              onCustomChange={setUtMethodCustom}
              error={hasError("utMethod")}
              options={["Pulse Echo", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>Reference Calibration Block</label>
            <SelectWithCustom
              value={refCalibBlock}
              onChange={setRefCalibBlock}
              customValue={refCalibBlockCustom}
              onCustomChange={setRefCalibBlockCustom}
              error={hasError("refCalibBlock")}
              options={["19 mm", "38 mm", "Job itself", "Other"]}
            />
          </div>
          <div>
            <label className={labelClass}>UT Calibration Method</label>
            <select
              value={utCalibMethod}
              onChange={(e) => setUtCalibMethod(e.target.value)}
              className={fc("utCalibMethod")}
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
              className={fc("scanningDb")}
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
              error={hasError("scanningSens")}
              options={[
                "Ø 2.5 mm SDH",
                "Ø 3mm SDH",
                "1ˢᵗ BWE set @ 80% of FSH on Job",
                "Other",
              ]}
            />
          </div>
        </div>
      </div>

      {/* -- Angle Probe Calibration -- */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Calibration Detail</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                <th className="border border-gray-200 px-3 py-2 text-left w-28">
                  Angle Probe
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
                  { key: "range", label: "Range " },
                  { key: "point1", label: "1st Point " },
                  { key: "point2", label: "2nd Point " },
                  { key: "point3", label: "3rd Point " },
                  { key: "refDb", label: "Ref dB " },
                ] as { key: keyof CalibRow; label: string }[]
              ).map((row) => (
                <tr key={row.key} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium text-gray-600 bg-gray-50">
                    {row.label}
                  </td>
                  {calibAngles.map((a) => {
                    const errKey = `${a.prefix}_${row.key}`;
                    const cellErr =
                      !!errors[errKey] && !a.state[row.key].trim();
                    return (
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
                          className={cellErr ? inputErrorClass : inputClass}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* -- Observations -- */}
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
                <th className="border border-gray-200 px-2 py-2 text-center">
                  Job Description
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center">
                  Drg No. / Joint No.
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center">
                  Size
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center w-16">
                  Qty(Nos)
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center">
                  Interpretation
                </th>
                <th className="border border-gray-200 px-2 py-2 text-center">
                  Evaluation
                </th>
                <th className="border border-gray-200 px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {observations.map((row, idx) => {
                const jobDescErr =
                  !!errors[`obs${idx}_jobDescription`] &&
                  !row.jobDescription?.trim();
                const drawingErr =
                  !!errors[`obs${idx}_drawingOrJointNo`] &&
                  !row.drawingOrJointNo?.trim();
                const sizeErr = !!errors[`obs${idx}_size`] && !row.size?.trim();
                const quantityErr =
                  !!errors[`obs${idx}_quantity`] &&
                  !row.quantity?.toString().trim();
                const interpErr =
                  !!errors[`obs${idx}_interpretation`] && !row.interpretation;
                const evalErr =
                  !!errors[`obs${idx}_evaluation`] && !row.evaluation;
                return (
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
                        className={jobDescErr ? inputErrorClass : inputClass}
                      />
                    </td>
                    <td className="border border-gray-200 px-1 py-1">
                      <input
                        type="text"
                        value={row.drawingOrJointNo}
                        onChange={(e) =>
                          updateObs(idx, "drawingOrJointNo", e.target.value)
                        }
                        className={drawingErr ? inputErrorClass : inputClass}
                      />
                    </td>
                    <td className="border border-gray-200 px-1 py-1">
                      <input
                        type="text"
                        value={row.size}
                        onChange={(e) => updateObs(idx, "size", e.target.value)}
                        className={sizeErr ? inputErrorClass : inputClass}
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
                          (quantityErr ? inputErrorClass : inputClass) + " w-16"
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
                        className={interpErr ? inputErrorClass : inputClass}
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
                        className={evalErr ? inputErrorClass : inputClass}
                      >
                        <option value="">Select...</option>
                        <option>Accepted</option>
                        <option>Rejected</option>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* -- Conclusion -- */}
      {/* <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Conclusion</h2>
        <div>
          <label className={labelClass}>Conclusion</label>
          <SelectWithCustom
            value={conclusion}
            onChange={setConclusion}
            customValue={conclusionCustom}
            onCustomChange={setConclusionCustom}
            error={hasError("conclusion")}
            options={conclusionOptions}
            placeholder="Select conclusion..."
          />
        </div>
      </div> */}

      {/* -- Final Section -- */}
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
                      <label className={labelClass}>Qualification</label>
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
                      <label className={labelClass}>Designation</label>
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
                      <label className={labelClass}>Date</label>
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

          {/* Customer representative */}
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

          {/* Client / TPI representative */}
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

      {/* -- Action Buttons -- */}
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
