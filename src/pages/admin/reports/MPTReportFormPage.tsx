import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import {
  createMPTReport,
  updateMPTReport,
  getMPTReportById,
  MPTObservation,
  MPTInspector,
} from "../../../api/customerApi";
import { getApiErrorMessage } from "../../../api/error";
import { CustomerPickerBanner } from "../../../components/CustomerPickerBanner";
import api from "../../../api/axios";

// Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬ Styles Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const inputErrorClass =
  "w-full border-2 border-red-400 bg-red-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-gray-200 p-5 mb-5";
const sectionTitleClass =
  "text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100";

// Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬ SelectWithOther Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬

interface SelectWithOtherProps {
  id: string;
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

// Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬ Form State Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬

interface ObsRow extends Omit<MPTObservation, "quantity"> {
  quantity: string;
}

interface InspRow extends Omit<MPTInspector, "date"> {
  date: string;
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

const emptyInspector = (): InspRow => ({
  name: "",
  qualification: "MT NDE Level II",
  designation: "",
  signature: "",
  idNo: "",
  date: "",
});

export const MPTReportFormPage: React.FC = () => {
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

  // Ã¢"â‚¬Ã¢"â‚¬ Job Details Ã¢"â‚¬Ã¢"â‚¬
  const [reportNo, setReportNo] = useState("");
  const jobCustomer = customerName;
  const [jobClient, setJobClient] = useState("");
  const [jobProject, setJobProject] = useState("");
  const [jobReportDate, setJobReportDate] = useState("");
  const [jobInspectionDate, setJobInspectionDate] = useState("");
  const [jobInspectionEndDate, setJobInspectionEndDate] = useState("");
  const [jobReferenceStd, setJobReferenceStd] = useState("");
  const [jobReferenceStdOther, setJobReferenceStdOther] = useState("");
  const [jobAcceptanceCriteria, setJobAcceptanceCriteria] = useState("");
  const [jobAcceptanceCriteriaOther, setJobAcceptanceCriteriaOther] =
    useState("");
  const [jobInspectionTime, setJobInspectionTime] = useState("");
  const [jobStageOfInspection, setJobStageOfInspection] = useState("");
  const [jobMaterial, setJobMaterial] = useState("");
  const [jobThickness, setJobThickness] = useState("");
  const [jobTypeOfJoint, setJobTypeOfJoint] = useState("");
  const [jobSurfaceCondition, setJobSurfaceCondition] = useState("");
  const [jobExtentOfExamination, setJobExtentOfExamination] = useState("");
  const [jobExtentOfExaminationOther, setJobExtentOfExaminationOther] =
    useState("");
  const [jobWeldingProcess, setJobWeldingProcess] = useState("");

  // Ã¢"â‚¬Ã¢"â‚¬ Equipment Details Ã¢"â‚¬Ã¢"â‚¬
  const [eqType, setEqType] = useState("");
  const [eqSrNo, setEqSrNo] = useState("");
  const [eqMake, setEqMake] = useState("");
  const [eqMakeOther, setEqMakeOther] = useState("");
  const [eqCalibrationDue, setEqCalibrationDue] = useState("");
  const [eqYokeSpacing, setEqYokeSpacing] = useState("");
  const [eqPieGauge, setEqPieGauge] = useState("");

  // Ã¢"â‚¬Ã¢"â‚¬ Medium Details Ã¢"â‚¬Ã¢"â‚¬
  const [biManufacturer, setBiManufacturer] = useState("");
  const [biManufacturerOther, setBiManufacturerOther] = useState("");
  const [biBatchNo, setBiBatchNo] = useState("");
  const [biExpiryDate, setBiExpiryDate] = useState("");
  const [wcManufacturer, setWcManufacturer] = useState("");
  const [wcManufacturerOther, setWcManufacturerOther] = useState("");
  const [wcBatchNo, setWcBatchNo] = useState("");
  const [wcExpiryDate, setWcExpiryDate] = useState("");

  // Ã¢"â‚¬Ã¢"â‚¬ Method Description Ã¢"â‚¬Ã¢"â‚¬
  const [method, setMethod] = useState("");
  const [lightIntensity, setLightIntensity] = useState("");
  const [magnetizationType, setMagnetizationType] = useState("");
  const [lightEquipUsed, setLightEquipUsed] = useState("");
  const [magnetizingMethod, setMagnetizingMethod] = useState("");
  const [bathConcentration, setBathConcentration] = useState("");
  const [bathConcentrationOther, setBathConcentrationOther] = useState("");
  const [demagnetization, setDemagnetization] = useState("");
  const [magFieldVerifiedBy, setMagFieldVerifiedBy] = useState("");
  const [gaussMeterReading, setGaussMeterReading] = useState("");
  const [current, setCurrent] = useState("");
  const [currentType, setCurrentType] = useState("");
  const [currentTypeOther, setCurrentTypeOther] = useState("");
  const [postCleaning, setPostCleaning] = useState("");

  // ── Conclusion ──
  const [conclusion, setConclusion] = useState("");
  const [conclusionOther, setConclusionOther] = useState("");

  // Ã¢"â‚¬Ã¢"â‚¬ Observations Ã¢"â‚¬Ã¢"â‚¬
  const [observations, setObservations] = useState<ObsRow[]>([emptyObs()]);

  // Ã¢"â‚¬Ã¢"â‚¬ Final Section Ã¢"â‚¬Ã¢"â‚¬
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
  const [inspectors, setInspectors] = useState<InspRow[]>([emptyInspector()]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const getFieldValue = (key: string): string => {
    const map: Record<string, string> = {
      jobClient,
      jobProject,
      jobReportDate,
      jobInspectionDate,
      jobInspectionEndDate,
      jobStageOfInspection,
      jobThickness,
      jobMaterial,
      jobTypeOfJoint,
      jobSurfaceCondition,
      jobWeldingProcess,
      eqType,
      eqSrNo,
      eqCalibrationDue,
      eqYokeSpacing,
      eqPieGauge,
      biBatchNo,
      biExpiryDate,
      wcBatchNo,
      wcExpiryDate,
      method,
      lightIntensity,
      magnetizationType,
      lightEquipUsed,
      magnetizingMethod,
      demagnetization,
      magFieldVerifiedBy,
      gaussMeterReading,
      current,
      postCleaning,
      jobReferenceStd:
        jobReferenceStd === "Other" ? jobReferenceStdOther : jobReferenceStd,
      jobAcceptanceCriteria:
        jobAcceptanceCriteria === "Other"
          ? jobAcceptanceCriteriaOther
          : jobAcceptanceCriteria,
      jobExtentOfExamination:
        jobExtentOfExamination === "Other"
          ? jobExtentOfExaminationOther
          : jobExtentOfExamination,
      eqMake: eqMake === "Other" ? eqMakeOther : eqMake,
      biManufacturer:
        biManufacturer === "Other" ? biManufacturerOther : biManufacturer,
      wcManufacturer:
        wcManufacturer === "Other" ? wcManufacturerOther : wcManufacturer,
      bathConcentration:
        bathConcentration === "Other"
          ? bathConcentrationOther
          : bathConcentration,
      currentType: currentType === "Other" ? currentTypeOther : currentType,
      conclusion: conclusion === "Other" ? conclusionOther : conclusion,
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

  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    api
      .get("/users?status=active&limit=100")
      .then((res: any) => setUsers(res.data ?? res ?? []))
      .catch(() => {});
  }, []);

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
    getMPTReportById(id)
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
        const [refStd, refStdO] = fromOther(jd.referenceStd, [
          "ASME SEC V Article 7",
          "ASTM E 709",
          "Other",
        ]);
        setJobReferenceStd(refStd);
        setJobReferenceStdOther(refStdO);
        const [acc, accO] = fromOther(jd.acceptanceCriteria, [
          "ASME SEC VIII Appendix 6",
          "ASME SEC VIII Appendix 7",
          "ASME B 16.34",
          "Other",
        ]);
        setJobAcceptanceCriteria(acc);
        setJobAcceptanceCriteriaOther(accO);
        setJobInspectionTime(jd.inspectionTime ?? "");
        setJobStageOfInspection(jd.stageOfInspection ?? "");
        setJobMaterial(jd.material ?? "");
        setJobThickness(jd.thickness ?? "");
        setJobTypeOfJoint(jd.typeOfJoint ?? "");
        setJobSurfaceCondition(jd.surfaceCondition ?? "");
        const [ext, extO] = fromOther(jd.extentOfExamination, [
          "10%",
          "100%",
          "To the maximum extent possible",
          "Other",
        ]);
        setJobExtentOfExamination(ext);
        setJobExtentOfExaminationOther(extO);
        setJobWeldingProcess(jd.weldingProcess ?? "");
        const eq = r.equipmentDetails ?? {};
        setEqType(eq.equipmentType ?? "");
        setEqSrNo(eq.srNo ?? "");
        const [make, makeO] = fromOther(eq.make, [
          "EECI",
          "Ferrochem",
          "Other",
        ]);
        setEqMake(make);
        setEqMakeOther(makeO);
        setEqCalibrationDue(toDate(eq.calibrationDue));
        setEqYokeSpacing(eq.yokeSpacing ?? "");
        setEqPieGauge(eq.pieGaugeCalibration ?? "");
        const md = r.mediumDetails ?? {};
        const bi = md.blackInk ?? {};
        const [biMfr, biMfrO] = fromOther(bi.manufacturer, [
          "Pradeep",
          "Dyeglo",
          "Ferrochem",
          "MR Chem",
          "Magnaflux",
          "Other",
        ]);
        setBiManufacturer(biMfr);
        setBiManufacturerOther(biMfrO);
        setBiBatchNo(bi.batchNo ?? "");
        setBiExpiryDate(bi.expiryDate ?? "");
        const wc = md.whiteContrast ?? {};
        const [wcMfr, wcMfrO] = fromOther(wc.manufacturer, [
          "Pradeep",
          "Dyeglo",
          "Ferrochem",
          "MR Chem",
          "Magnaflux",
          "Other",
        ]);
        setWcManufacturer(wcMfr);
        setWcManufacturerOther(wcMfrO);
        setWcBatchNo(wc.batchNo ?? "");
        setWcExpiryDate(wc.expiryDate ?? "");
        const method = r.methodDescription ?? {};
        setMethod(method.method ?? "");
        setLightIntensity(method.lightIntensity ?? "");
        setMagnetizationType(method.magnetizationType ?? "");
        setLightEquipUsed(method.lightEquipmentUsed ?? "");
        setMagnetizingMethod(method.magnetizingMethod ?? "");
        const [bath, bathO] = fromOther(method.bathConcentration, [
          "Ready Bath",
          "Other",
        ]);
        setBathConcentration(bath);
        setBathConcentrationOther(bathO);
        setDemagnetization(method.demagnetization ?? "");
        setMagFieldVerifiedBy(method.magneticFieldDirectionVerifiedBy ?? "");
        setGaussMeterReading(method.gaussMeterReading ?? "");
        setCurrent(method.current ?? "");
        const [ct, ctO] = fromOther(method.currentType, [
          "AC",
          "DC",
          "HWDC",
          "Other",
        ]);
        setCurrentType(ct);
        setCurrentTypeOther(ctO);
        setPostCleaning(method.postCleaning ?? "");
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
        if (r.observations?.length) {
          setObservations(
            r.observations.map((o: any) => ({
              srNo: o.srNo,
              jobDescription: o.jobDescription ?? "",
              drawingOrJointNo: o.drawingOrJointNo ?? "",
              size: o.size ?? "",
              quantity: String(o.quantity ?? ""),
              interpretation: o.interpretation ?? "",
              evaluation: o.evaluation ?? o.result ?? o.remark ?? "",
            })),
          );
        }
        const fs = r.finalSection ?? {};
        setInspectors(
          fs.inspector?.length
            ? fs.inspector.map((i: any) => ({
                name: i.name ?? "",
                qualification: i.qualification || "MT NDE Level II",
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

  // Ã¢"â‚¬Ã¢"â‚¬ Helpers Ã¢"â‚¬Ã¢"â‚¬
  const resolveCustom = (val: string, other: string) =>
    val === "Other" && other.trim() ? other.trim() : val;

  const updateObs = (idx: number, key: keyof ObsRow, value: string) => {
    setObservations((prev) =>
      prev.map((row, i) => {
        if (i === idx) {
          const updated = { ...row, [key]: value };
          if (key === "interpretation") {
            if (value === "No relevant Indication Found") {
              updated.evaluation = "Accepted";
            } else if (value === "Relevant Indication Found") {
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
  };

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

  // Ã¢"â‚¬Ã¢"â‚¬ Submit Ã¢"â‚¬Ã¢"â‚¬
  const handleSubmit = async (status: "draft" | "final") => {
    if (!customerId && !id) {
      toast.error("Customer ID is missing. Go back and try again.");
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
          referenceStd: resolveCustom(jobReferenceStd, jobReferenceStdOther),
          acceptanceCriteria: resolveCustom(
            jobAcceptanceCriteria,
            jobAcceptanceCriteriaOther,
          ),
          inspectionTime: jobInspectionTime,
          stageOfInspection: jobStageOfInspection || undefined,
          material: jobMaterial,
          thickness: jobThickness,
          typeOfJoint: jobTypeOfJoint || undefined,
          surfaceCondition: jobSurfaceCondition,
          extentOfExamination: resolveCustom(
            jobExtentOfExamination,
            jobExtentOfExaminationOther,
          ),
          weldingProcess: jobWeldingProcess || undefined,
        },
        equipmentDetails: {
          equipmentType: eqType || undefined,
          srNo: eqSrNo,
          make: resolveCustom(eqMake, eqMakeOther),
          calibrationDue: eqCalibrationDue || undefined,
          yokeSpacing: eqYokeSpacing,
          pieGaugeCalibration: eqPieGauge || undefined,
        },
        mediumDetails: {
          blackInk: {
            manufacturer: resolveCustom(biManufacturer, biManufacturerOther),
            batchNo: biBatchNo,
            expiryDate: biExpiryDate,
          },
          whiteContrast: {
            manufacturer: resolveCustom(wcManufacturer, wcManufacturerOther),
            batchNo: wcBatchNo,
            expiryDate: wcExpiryDate,
          },
        },
        methodDescription: {
          method: method || undefined,
          lightIntensity,
          magnetizationType: magnetizationType || undefined,
          lightEquipmentUsed: lightEquipUsed || undefined,
          magnetizingMethod: magnetizingMethod || undefined,
          bathConcentration: resolveCustom(
            bathConcentration,
            bathConcentrationOther,
          ),
          demagnetization: demagnetization || undefined,
          magneticFieldDirectionVerifiedBy: magFieldVerifiedBy || undefined,
          gaussMeterReading,
          current,
          currentType: resolveCustom(currentType, currentTypeOther),
          postCleaning: postCleaning || undefined,
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
        conclusion: resolveCustom(conclusion, conclusionOther) || undefined,
        finalSection: {
          examinedBy: "National Industrial Inspection And Training",
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
          inspector: inspectors
            .filter((i) => i.name.trim())
            .map((i) => ({ ...i, date: i.date || undefined })),
        },
      };

      if (id) {
        await updateMPTReport(id, payload);
      } else {
        await createMPTReport(payload);
      }

      toast.success(`MPT Report ${id ? "updated" : "saved"} as ${status}.`);
      if (state?.from === "reports-list") {
        navigate(`${basePath}/reports`);
      } else {
        navigate(`${basePath}/customers/${customerId}`, {
          state: { activeTab: "reports", reportSubType: "mpt" },
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

  // Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬ Render Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬Ã¢"â‚¬

  const manufacturerOptions = [
    "Pradeep",
    "Dyeglo",
    "Ferrochem",
    "MR Chem",
    "Magnaflux",
    "Other",
  ];

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
            Magnetic Particle Testing Report
          </h1>
          <p className="text-sm text-gray-500">{customerName}</p>
        </div>
      </div>
      {/* â”€â”€ Missing Customer Banner â”€â”€ */}
      {!customerId && (
        <CustomerPickerBanner
          onCustomerSelected={(id, name) => {
            setCustomerId(id);
            setCustomerName(name);
          }}
        />
      )}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="reportNo">Report No. {isEditMode ? "" : "(Auto-generated)"}</label>
            <input
              id="reportNo"
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
              defaultValue="FMT-NDT-01"
              readOnly
            />
          </div>
        </div>
      </div>
      {/* Ã¢"â‚¬Ã¢"â‚¬ Job Details Ã¢"â‚¬Ã¢"â‚¬ */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Job Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="jobCustomer">Customer</label>
            <input
              id="jobCustomer"
              type="text"
              value={jobCustomer}
              disabled
              className={inputClass + " bg-gray-100 cursor-not-allowed"}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobClient">Client</label>
            <input
              id="jobClient"
              type="text"
              value={jobClient}
              onChange={(e) => setJobClient(e.target.value)}
              className={fc("jobClient")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobProject">Project</label>
            <input
              id="jobProject"
              type="text"
              value={jobProject}
              onChange={(e) => setJobProject(e.target.value)}
              className={fc("jobProject")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobReportDate">Report Date</label>
            <input
              id="jobReportDate"
              type="date"
              value={jobReportDate}
              onChange={(e) => setJobReportDate(e.target.value)}
              className={fc("jobReportDate")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobInspectionDate">Inspection Start Date</label>
            <input
              id="jobInspectionDate"
              type="date"
              value={jobInspectionDate}
              onChange={(e) => setJobInspectionDate(e.target.value)}
              className={fc("jobInspectionDate")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobInspectionEndDate">Inspection End Date</label>
            <input
              id="jobInspectionEndDate"
              type="date"
              value={jobInspectionEndDate}
              onChange={(e) => setJobInspectionEndDate(e.target.value)}
              className={fc("jobInspectionEndDate")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobReferenceStd">Reference Std.</label>
            <SelectWithOther
              id="jobReferenceStd"
              value={jobReferenceStd}
              onChange={setJobReferenceStd}
              otherValue={jobReferenceStdOther}
              onOtherChange={setJobReferenceStdOther}
              options={["ASME SEC V Article 7", "ASTM E 709", "Other"]}
              placeholder="Select...."
              error={hasError("jobReferenceStd")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobAcceptanceCriteria">Acceptance Criteria</label>
            <SelectWithOther
              id="jobAcceptanceCriteria"
              value={jobAcceptanceCriteria}
              onChange={setJobAcceptanceCriteria}
              otherValue={jobAcceptanceCriteriaOther}
              onOtherChange={setJobAcceptanceCriteriaOther}
              options={[
                "ASME SEC VIII Appendix 6",
                "ASME SEC VIII Appendix 7",
                "ASME B 16.34",
                "Other",
              ]}
              placeholder="Select...."
              error={hasError("jobAcceptanceCriteria")}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="jobStage">Stage of Inspection</label>
            <select
              id="jobStage"
              value={jobStageOfInspection}
              onChange={(e) => setJobStageOfInspection(e.target.value)}
              className={fc("jobStageOfInspection")}
            >
              <option value="">Select...</option>
              <option>After Welding</option>
              <option>After Casting</option>
              <option>After Machining</option>
              <option>After Forging</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="jobExt">Extent of Examination</label>
            <SelectWithOther
              id="jobExt"
              value={jobExtentOfExamination}
              onChange={setJobExtentOfExamination}
              otherValue={jobExtentOfExaminationOther}
              onOtherChange={setJobExtentOfExaminationOther}
              options={[
                "10%",
                "100%",
                "To the maximum extent possible",
                "Other",
              ]}
              placeholder="Select Extent..."
              error={hasError("jobExtentOfExamination")}
            />
          </div>
          {/* <div>
            <label className={labelClass} htmlFor="jobThickness">Thickness</label>
            <input
              id="jobThickness"
              type="text"
              value={jobThickness}
              onChange={(e) => setJobThickness(e.target.value)}
              className={fc("jobThickness")}
              placeholder="e.g. As per Drawing"
            />
          </div> */}

          <div>
            <label className={labelClass} htmlFor="jobMaterial">Material</label>
            <input
              id="jobMaterial"
              type="text"
              value={jobMaterial}
              onChange={(e) => setJobMaterial(e.target.value)}
              className={fc("jobMaterial")}
              placeholder="e.g. As per Drawing"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="jobTypeOfJoint">Type of Joint</label>
            <select
              id="jobTypeOfJoint"
              value={jobTypeOfJoint}
              onChange={(e) => setJobTypeOfJoint(e.target.value)}
              className={fc("jobTypeOfJoint")}
            >
              <option value="">Select...</option>
              <option>Butt</option>
              <option>Corner</option>
              <option>T Joint</option>
              <option>N/A</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="jobSurface">Surface Condition</label>
            <input
              id="jobSurface"
              type="text"
              value={jobSurfaceCondition}
              onChange={(e) => setJobSurfaceCondition(e.target.value)}
              className={fc("jobSurfaceCondition")}
              placeholder="e.g. Smooth"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobWelding">Welding Process</label>
            <select
              id="jobWelding"
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
        </div>
      </div>
      {/* Ã¢"â‚¬Ã¢"â‚¬ Equipment Details Ã¢"â‚¬Ã¢"â‚¬ */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Equipment Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="eqType">Equipment Type</label>
            <select
              id="eqType"
              value={eqType}
              onChange={(e) => setEqType(e.target.value)}
              className={fc("eqType")}
            >
              <option value="">Select...</option>
              <option>Yoke</option>
              <option>Headshot</option>
              <option>Coilshot</option>
              <option>Prod</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="eqSrNo">Sr. No.</label>
            <input
              id="eqSrNo"
              type="text"
              value={eqSrNo}
              onChange={(e) => setEqSrNo(e.target.value)}
              className={fc("eqSrNo")}
              placeholder="e.g. MNH13K45"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="eqMake">Make</label>
            <SelectWithOther
              id="eqMake"
              value={eqMake}
              onChange={setEqMake}
              otherValue={eqMakeOther}
              onOtherChange={setEqMakeOther}
              options={["EECI", "Ferrochem", "Other"]}
              error={hasError("eqMake")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="eqCalibration">Calibration Due</label>
            <input
              id="eqCalibration"
              type="date"
              value={eqCalibrationDue}
              onChange={(e) => setEqCalibrationDue(e.target.value)}
              className={fc("eqCalibrationDue")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="eqYoke">Spacing</label>
            <input
              id="eqYoke"
              type="text"
              value={eqYokeSpacing}
              onChange={(e) => setEqYokeSpacing(e.target.value)}
              className={fc("eqYokeSpacing")}
              placeholder="e.g. 100 mm"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="eqPie">Pie Gauge Calibration</label>
            <select
              id="eqPie"
              value={eqPieGauge}
              onChange={(e) => setEqPieGauge(e.target.value)}
              className={fc("eqPieGauge")}
            >
              <option value="">Select...</option>
              <option>Done</option>
            </select>
          </div>
        </div>
      </div>
      {/* Ã¢"â‚¬Ã¢"â‚¬ Medium Details Ã¢"â‚¬Ã¢"â‚¬ */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Medium Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                  Material
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                  Manufacturer
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
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-medium text-gray-600 whitespace-nowrap">
                  Black Ink
                </td>
                <td className="border border-gray-200 px-2 py-1">
                  <SelectWithOther
                    id="biMfr"
                    value={biManufacturer}
                    onChange={setBiManufacturer}
                    otherValue={biManufacturerOther}
                    onOtherChange={setBiManufacturerOther}
                    options={manufacturerOptions}
                    error={hasError("biManufacturer")}
                  />
                </td>
                <td className="border border-gray-200 px-2 py-1">
                  <input
                    type="text"
                    value={biBatchNo}
                    onChange={(e) => setBiBatchNo(e.target.value)}
                    className={fc("biBatchNo")}
                    placeholder="Batch No."
                  />
                </td>
                <td className="border border-gray-200 px-2 py-1">
                  <input
                    type="text"
                    value={biExpiryDate}
                    onChange={(e) => setBiExpiryDate(e.target.value)}
                    className={fc("biExpiryDate")}
                    placeholder="e.g. MAR 2027"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-medium text-gray-600 whitespace-nowrap">
                  White Contrast
                </td>
                <td className="border border-gray-200 px-2 py-1">
                  <SelectWithOther
                    id="wcMfr"
                    value={wcManufacturer}
                    onChange={setWcManufacturer}
                    otherValue={wcManufacturerOther}
                    onOtherChange={setWcManufacturerOther}
                    options={manufacturerOptions}
                    error={hasError("wcManufacturer")}
                  />
                </td>
                <td className="border border-gray-200 px-2 py-1">
                  <input
                    type="text"
                    value={wcBatchNo}
                    onChange={(e) => setWcBatchNo(e.target.value)}
                    className={fc("wcBatchNo")}
                    placeholder="Batch No."
                  />
                </td>
                <td className="border border-gray-200 px-2 py-1">
                  <input
                    type="text"
                    value={wcExpiryDate}
                    onChange={(e) => setWcExpiryDate(e.target.value)}
                    className={fc("wcExpiryDate")}
                    placeholder="e.g. MAR 2027"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Ã¢"â‚¬Ã¢"â‚¬ Method Description Ã¢"â‚¬Ã¢"â‚¬ */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Method Description</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="method">Method</label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={fc("method")}
            >
              <option value="">Select...</option>
              <option>Visible</option>
              <option>Fluorescent</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="lightIntensity">Light Intensity</label>

            <div className="relative">
              <input
                id="lightIntensity"
                type="text"
                value={lightIntensity.replace(/ (lux|µW\/cm²)$/, "")}
                onChange={(e) => {
                  const inputValue = e.target.value.replace(
                    / (lux|µW\/cm²)$/,
                    "",
                  );
                  const unit = method === "Visible" ? "lux" : "µW/cm²";

                  setLightIntensity(`${inputValue} ${unit}`);
                }}
                className={`${fc("lightIntensity")} pr-20`}
                placeholder={method === "Visible" ? "e.g. 1180" : "e.g. 1200"}
              />

              {method && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  {method === "Visible" ? "lux" : "µW/cm²"}
                </span>
              )}
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="magType">Magnetization Type</label>
            <select
              id="magType"
              value={magnetizationType}
              onChange={(e) => setMagnetizationType(e.target.value)}
              className={fc("magnetizationType")}
            >
              <option value="">Select...</option>
              <option>Longitudinal</option>
              <option>Circular</option>
              <option>Longitudinal &amp; Circular</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="lightEquip">Light Equipment Used</label>
            <select
              id="lightEquip"
              value={lightEquipUsed}
              onChange={(e) => setLightEquipUsed(e.target.value)}
              className={fc("lightEquipUsed")}
            >
              <option value="">Select...</option>
              <option>Bulb</option>
              <option>N/A</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="magMethod">Magnetizing Method</label>
            <select
              id="magMethod"
              value={magnetizingMethod}
              onChange={(e) => setMagnetizingMethod(e.target.value)}
              className={fc("magnetizingMethod")}
            >
              <option value="">Select...</option>
              <option>Wet Continuous</option>
              <option>Dry Continuous</option>
              <option>Wet Residual</option>
              <option>Dry Residual</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="bathConc">Bath Concentration</label>
            <SelectWithOther
              id="bathConc"
              value={bathConcentration}
              onChange={setBathConcentration}
              otherValue={bathConcentrationOther}
              onOtherChange={setBathConcentrationOther}
              options={["Ready Bath", "Other"]}
              error={hasError("bathConcentration")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="demag">Demagnetization</label>
            <select
              id="demag"
              value={demagnetization}
              onChange={(e) => setDemagnetization(e.target.value)}
              className={fc("demagnetization")}
            >
              <option value="">Select...</option>
              <option>Done</option>
              <option>N/A</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="magFieldVerify">Magnetic Field Direction Verified By</label>
            <select
              id="magFieldVerify"
              value={magFieldVerifiedBy}
              onChange={(e) => setMagFieldVerifiedBy(e.target.value)}
              className={fc("magFieldVerifiedBy")}
            >
              <option value="">Select...</option>
              <option>Pie Gauge</option>
              <option>Shims</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="gaussMeter">Gauss Meter Reading</label>
            <input
              id="gaussMeter"
              type="text"
              value={gaussMeterReading}
              onChange={(e) => setGaussMeterReading(e.target.value)}
              className={fc("gaussMeterReading")}
              placeholder="e.g. 35 Gauss"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="current">Current</label>
            <input
              id="current"
              type="text"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={fc("current")}
              placeholder="e.g. 1.0 Amp"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="currentType">Current Type</label>
            <SelectWithOther
              id="currentType"
              value={currentType}
              onChange={setCurrentType}
              otherValue={currentTypeOther}
              onOtherChange={setCurrentTypeOther}
              options={["AC", "DC", "HWDC", "Other"]}
              error={hasError("currentType")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="postCleaning">Post Cleaning</label>
            <select
              id="postCleaning"
              value={postCleaning}
              onChange={(e) => setPostCleaning(e.target.value)}
              className={fc("postCleaning")}
            >
              <option value="">Select...</option>
              <option>Done</option>
            </select>
          </div>
        </div>
      </div>
      {/* Ã¢"â‚¬Ã¢"â‚¬ Observations Ã¢"â‚¬Ã¢"â‚¬ */}
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
          <table className="w-full text-sm border-collapse min-w-[900px]">
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
                <th className="border border-gray-200 px-2 py-2 text-center">
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
      {/* ── Conclusion ──
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Conclusion</h2>
        <div className="max-w-2xl">
          <label className={labelClass} htmlFor="conclusion">Conclusion</label>
          <SelectWithOther
            id="conclusion"
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
            placeholder="Select conclusion..."
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
                        placeholder="e.g. MT NDE Level II"
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
      {/* Ã¢"â‚¬Ã¢"â‚¬ Action Buttons Ã¢"â‚¬Ã¢"â‚¬ */}
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
