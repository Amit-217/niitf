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

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-gray-200 p-5 mb-5";
const sectionTitleClass =
  "text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100";

// â”€â”€â”€ SelectWithOther â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ObsRow {
  lineNo: number;
  indicationNo: string;
  transducerAngle: string;
  transducerAngleOther: string;
  fromFace: string;
  leg: string;
  dbIndicationLevel: string;
  dbReferenceLevel: string;
  dbAttenuationFactor: string;
  dbIndicationRating: string;
  length: string;
  angularDistance: string;
  depthFromA: string;
  distanceFromX: string;
  distanceFromY: string;
  interpretation: string;
  evaluation: string;
}

const emptyObs = (lineNo: number): ObsRow => ({
  lineNo,
  indicationNo: "",
  transducerAngle: "",
  transducerAngleOther: "",
  fromFace: "",
  leg: "",
  dbIndicationLevel: "",
  dbReferenceLevel: "",
  dbAttenuationFactor: "",
  dbIndicationRating: "",
  length: "",
  angularDistance: "",
  depthFromA: "",
  distanceFromX: "",
  distanceFromY: "",
  interpretation: "",
  evaluation: "",
});

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const AWSDReportFormPage: React.FC = () => {
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

  // â”€â”€ Header Fields â”€â”€
  const [reportNo, setReportNo] = useState("");
  const [project, setProject] = useState("");

  // â”€â”€ Job Info â”€â”€
  const [weldIdentification, setWeldIdentification] = useState("");
  const [materialThickness, setMaterialThickness] = useState("");
  const [weldJointAWS, setWeldJointAWS] = useState("");
  const [weldingProcess, setWeldingProcess] = useState("");
  const [weldingProcessOther, setWeldingProcessOther] = useState("");
  const [qualityRequirementsSection, setQualityRequirementsSection] =
    useState("");
  const [jobEvaluation, setJobEvaluation] = useState("");

  // â”€â”€ Observations â”€â”€
  const [observations, setObservations] = useState<ObsRow[]>(
    Array.from({ length: 3 }, (_, i) => emptyObs(i + 1)),
  );

  // â”€â”€ Footer / Certification â”€â”€
  const [testDate, setTestDate] = useState("");
  const [inspectedBy, setInspectedBy] = useState("");
  const [certYear, setCertYear] = useState("");
  const [manufacturerOrContractor, setManufacturerOrContractor] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("");
  const [footerDate, setFooterDate] = useState("");

  // â”€â”€ Load in edit mode â”€â”€
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
          // Handle populated customer object or string ID
          if (typeof r.customerId === "object" && r.customerId._id) {
            setCustomerId(r.customerId._id);
            setCustomerName(r.customerId.companyName || "");
          } else {
            setCustomerId(r.customerId);
          }
        }
        setReportNo(r.reportNo ?? "");
        setProject(r.project ?? "");
        setWeldIdentification(r.weldIdentification ?? "");
        setMaterialThickness(r.materialThickness ?? "");
        setWeldJointAWS(r.weldJointAWS ?? "");
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
        setQualityRequirementsSection(r.qualityRequirementsSection ?? "");
        setJobEvaluation(r.evaluation ?? r.remarks ?? "");
        if (r.observations?.length) {
          setObservations(
            r.observations.map((o: any) => {
              const [ta, taO] = fromOther(o.transducerAngle, [
                "45°",
                "60°",
                "70°",
                "Normal (0°)",
                "Other",
              ]);
              return {
                lineNo: o.lineNo,
                indicationNo: o.indicationNo ?? "",
                transducerAngle: ta,
                transducerAngleOther: taO,
                fromFace: o.fromFace ?? "",
                leg: o.leg ?? "",
                dbIndicationLevel: o.decibels?.indicationLevel ?? "",
                dbReferenceLevel: o.decibels?.referenceLevel ?? "",
                dbAttenuationFactor: o.decibels?.attenuationFactor ?? "",
                dbIndicationRating: o.decibels?.indicationRating ?? "",
                length: o.discontinuity?.length ?? "",
                angularDistance: o.discontinuity?.angularDistance ?? "",
                depthFromA: o.discontinuity?.depthFromA ?? "",
                distanceFromX: o.discontinuity?.distanceFromX ?? "",
                distanceFromY: o.discontinuity?.distanceFromY ?? "",
                interpretation: o.interpretation ?? "",
                evaluation: o.evaluation ?? o.remarks ?? "",
              };
            }),
          );
        }
        const cert = r.certification ?? {};
        setTestDate(toDate(cert.testDate));
        setInspectedBy(cert.inspectedBy ?? "");
        setCertYear(cert.year ?? "");
        setManufacturerOrContractor(cert.manufacturerOrContractor ?? "");
        setAuthorizedBy(cert.authorizedBy ?? "");
        setFooterDate(toDate(cert.date));
      })
      .catch(() => toast.error("Failed to load report."));
  }, [id]);

  // â”€â”€ Helpers â”€â”€
  const resolve = (val: string, other: string) =>
    val === "Other" && other.trim() ? other.trim() : val;

  const updateObs = (idx: number, key: keyof ObsRow, val: string) =>
    setObservations((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    );

  const addObs = () =>
    setObservations((prev) => [...prev, emptyObs(prev.length + 1)]);

  const removeObs = (idx: number) =>
    setObservations((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, lineNo: i + 1 })),
    );

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
        project,
        weldIdentification,
        materialThickness,
        weldJointAWS,
        weldingProcess: resolve(weldingProcess, weldingProcessOther),
        qualityRequirementsSection,
        evaluation: jobEvaluation,
        observations: observations
          .filter(
            (o) =>
              o.indicationNo.trim() || o.transducerAngle || o.interpretation,
          )
          .map((o) => ({
            lineNo: o.lineNo,
            indicationNo: o.indicationNo,
            transducerAngle: resolve(o.transducerAngle, o.transducerAngleOther),
            fromFace: o.fromFace,
            leg: o.leg,
            decibels: {
              indicationLevel: o.dbIndicationLevel,
              referenceLevel: o.dbReferenceLevel,
              attenuationFactor: o.dbAttenuationFactor,
              indicationRating: o.dbIndicationRating,
            },
            discontinuity: {
              length: o.length,
              angularDistance: o.angularDistance,
              depthFromA: o.depthFromA,
              distanceFromX: o.distanceFromX,
              distanceFromY: o.distanceFromY,
            },
            interpretation: o.interpretation,
            evaluation: o.evaluation,
          })),
        certification: {
          testDate: testDate || undefined,
          inspectedBy,
          year: certYear,
          manufacturerOrContractor,
          authorizedBy,
          date: footerDate || undefined,
        },
      };
      if (id) {
        await updateAWSDReport(id, payload);
      } else {
        await createAWSDReport(payload);
      }
      toast.success(`AWS D1.1 UT Report saved as ${status}.`);
      navigate(`/admin/customers/${customerId}`, {
        state: { activeTab: "reports", reportSubType: "awsd" },
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
            Report of UT of Welds (AWS D1.1)
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

      {/* Report No. + Project */}
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
            <label className={labelClass}>Project</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className={inputClass}
              placeholder="e.g. Structural Bridge Fabrication"
            />
          </div>
        </div>
      </div>

      {/* â”€â”€ Job Info â”€â”€ */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Job Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Weld Identification</label>
            <input
              type="text"
              value={weldIdentification}
              onChange={(e) => setWeldIdentification(e.target.value)}
              className={inputClass}
              placeholder="e.g. W-01 to W-10"
            />
          </div>
          <div>
            <label className={labelClass}>Material Thickness</label>
            <input
              type="text"
              value={materialThickness}
              onChange={(e) => setMaterialThickness(e.target.value)}
              className={inputClass}
              placeholder="e.g. 20 mm"
            />
          </div>
          <div>
            <label className={labelClass}>Weld Joint AWS</label>
            <input
              type="text"
              value={weldJointAWS}
              onChange={(e) => setWeldJointAWS(e.target.value)}
              className={inputClass}
              placeholder="e.g. B-U2-GF"
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
            />
          </div>
          <div>
            <label className={labelClass}>
              Quality Requirements â€” Section No.
            </label>
            <input
              type="text"
              value={qualityRequirementsSection}
              onChange={(e) => setQualityRequirementsSection(e.target.value)}
              className={inputClass}
              placeholder="e.g. Clause 8, Part F"
            />
          </div>
          <div>
            <label className={labelClass}>Evaluation</label>
            <input
              type="text"
              value={jobEvaluation}
              onChange={(e) => setJobEvaluation(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* â”€â”€ Observations Table â”€â”€ */}
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

        {/* Decibels sub-header */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase">
                <th
                  rowSpan={2}
                  className="border border-gray-200 px-2 py-2 text-center w-10"
                >
                  Line No.
                </th>
                <th
                  rowSpan={2}
                  className="border border-gray-200 px-2 py-2 text-center"
                >
                  Indication No.
                </th>
                <th
                  rowSpan={2}
                  className="border border-gray-200 px-2 py-2 text-left"
                >
                  Transducer Angle
                </th>
                <th
                  rowSpan={2}
                  className="border border-gray-200 px-2 py-2 text-center"
                >
                  From Face
                </th>
                <th
                  rowSpan={2}
                  className="border border-gray-200 px-2 py-2 text-center"
                >
                  Leg
                </th>
                <th
                  colSpan={4}
                  className="border border-gray-200 px-2 py-2 text-center bg-indigo-50 text-indigo-700"
                >
                  Decibels
                </th>
                <th
                  colSpan={5}
                  className="border border-gray-200 px-2 py-2 text-center bg-orange-50 text-orange-700"
                >
                  Discontinuity
                </th>
                <th
                  rowSpan={2}
                  className="border border-gray-200 px-2 py-2 text-center"
                >
                  Interpretation
                </th>
                <th
                  rowSpan={2}
                  className="border border-gray-200 px-2 py-2 w-8"
                ></th>
              </tr>
              <tr className="bg-gray-50 text-gray-600">
                <th className="border border-gray-200 px-2 py-1 text-center bg-indigo-50">
                  a. Indication Level
                </th>
                <th className="border border-gray-200 px-2 py-1 text-center bg-indigo-50">
                  b. Reference Level
                </th>
                <th className="border border-gray-200 px-2 py-1 text-center bg-indigo-50">
                  c. Attenuation Factor
                </th>
                <th className="border border-gray-200 px-2 py-1 text-center bg-indigo-50">
                  d. Indication Rating
                </th>
                <th className="border border-gray-200 px-2 py-1 text-center bg-orange-50">
                  Length
                </th>
                <th className="border border-gray-200 px-2 py-1 text-center bg-orange-50">
                  Angular Distance
                </th>
                <th className="border border-gray-200 px-2 py-1 text-center bg-orange-50">
                  Depth from &apos;A&apos; Surface
                </th>
                <th className="border border-gray-200 px-2 py-1 text-center bg-orange-50">
                  From X
                </th>
                <th className="border border-gray-200 px-2 py-1 text-center bg-orange-50">
                  From Y
                </th>
              </tr>
            </thead>
            <tbody>
              {observations.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1 text-center text-gray-500">
                    {row.lineNo}
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="text"
                      value={row.indicationNo}
                      onChange={(e) =>
                        updateObs(idx, "indicationNo", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 min-w-[130px]">
                    <SelectWithOther
                      value={row.transducerAngle}
                      onChange={(v) => updateObs(idx, "transducerAngle", v)}
                      otherValue={row.transducerAngleOther}
                      onOtherChange={(v) =>
                        updateObs(idx, "transducerAngleOther", v)
                      }
                      options={[
                        "45°",
                        "60°",
                        "70°",
                        "Normal (0°)",
                        "Other",
                      ]}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={row.fromFace}
                      onChange={(e) =>
                        updateObs(idx, "fromFace", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-1 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-</option>
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                      <option>D</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={row.leg}
                      onChange={(e) => updateObs(idx, "leg", e.target.value)}
                      className="w-full border border-gray-300 rounded px-1 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-</option>
                      <option>1</option>
                      <option>2</option>
                      <option>1.5</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30">
                    <input
                      type="text"
                      value={row.dbIndicationLevel}
                      onChange={(e) =>
                        updateObs(idx, "dbIndicationLevel", e.target.value)
                      }
                      className={inputClass}
                      placeholder="dB"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30">
                    <input
                      type="text"
                      value={row.dbReferenceLevel}
                      onChange={(e) =>
                        updateObs(idx, "dbReferenceLevel", e.target.value)
                      }
                      className={inputClass}
                      placeholder="dB"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30">
                    <input
                      type="text"
                      value={row.dbAttenuationFactor}
                      onChange={(e) =>
                        updateObs(idx, "dbAttenuationFactor", e.target.value)
                      }
                      className={inputClass}
                      placeholder="dB"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-indigo-50/30">
                    <input
                      type="text"
                      value={row.dbIndicationRating}
                      onChange={(e) =>
                        updateObs(idx, "dbIndicationRating", e.target.value)
                      }
                      className={inputClass}
                      placeholder="dB"
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30">
                    <input
                      type="text"
                      value={row.length}
                      onChange={(e) => updateObs(idx, "length", e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30">
                    <input
                      type="text"
                      value={row.angularDistance}
                      onChange={(e) =>
                        updateObs(idx, "angularDistance", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30">
                    <input
                      type="text"
                      value={row.depthFromA}
                      onChange={(e) =>
                        updateObs(idx, "depthFromA", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30">
                    <input
                      type="text"
                      value={row.distanceFromX}
                      onChange={(e) =>
                        updateObs(idx, "distanceFromX", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1 bg-orange-50/30">
                    <input
                      type="text"
                      value={row.distanceFromY}
                      onChange={(e) =>
                        updateObs(idx, "distanceFromY", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select
                      value={row.interpretation}
                      onChange={(e) =>
                        updateObs(idx, "interpretation", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-1 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-</option>
                      <option>Accept</option>
                      <option>Reject</option>
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

      {/* â”€â”€ Certification & Signatures â”€â”€ */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Certification &amp; Signatures</h2>
        <p className="text-xs text-gray-500 mb-4 italic">
          We, the undersigned, certify that the statements in this record are
          correct and that the welds were prepared and tested in conformance
          with the requirements of Clause 8, Part F of AWS D1.1/D1.1M, (year)
          Structural Welding Code — Steel.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Year (for certification)</label>
            <input
              type="text"
              value={certYear}
              onChange={(e) => setCertYear(e.target.value)}
              className={inputClass}
              placeholder="e.g. 2025"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left */}
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Test Date</label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Inspected By</label>
              <input
                type="text"
                value={inspectedBy}
                onChange={(e) => setInspectedBy(e.target.value)}
                className={inputClass}
                placeholder="e.g. Mr. Mayur Bankar"
              />
            </div>
          </div>
          {/* Right */}
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Manufacturer or Contractor</label>
              <input
                type="text"
                value={manufacturerOrContractor}
                onChange={(e) => setManufacturerOrContractor(e.target.value)}
                className={inputClass}
                placeholder="e.g. M/s XYZ Fabricators"
              />
            </div>
            <div>
              <label className={labelClass}>Authorized By</label>
              <input
                type="text"
                value={authorizedBy}
                onChange={(e) => setAuthorizedBy(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                value={footerDate}
                onChange={(e) => setFooterDate(e.target.value)}
                className={inputClass}
              />
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
