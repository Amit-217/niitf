import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { createMPTReport, MPTObservation, MPTInspector } from '../../../api/customerApi';

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const labelClass = 'block text-xs font-medium text-gray-700 mb-1';
const sectionClass = 'bg-white rounded-xl border border-gray-200 p-5 mb-5';
const sectionTitleClass = 'text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100';

// ─── SelectWithOther ──────────────────────────────────────────────────────────

interface SelectWithOtherProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  otherValue: string;
  onOtherChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}

const SelectWithOther: React.FC<SelectWithOtherProps> = ({
  id, value, onChange, otherValue, onOtherChange, options, placeholder = 'Select...',
}) => (
  <div className="space-y-1">
    <select id={id} value={value} onChange={e => onChange(e.target.value)} className={inputClass}>
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {value === 'Custom' && (
      <input
        type="text"
        value={otherValue}
        onChange={e => onOtherChange(e.target.value)}
        placeholder="Specify custom value..."
        className={inputClass}
      />
    )}
  </div>
);

// ─── Form State ───────────────────────────────────────────────────────────────

interface ObsRow extends Omit<MPTObservation, 'quantity'> {
  quantity: string;
}

interface InspRow extends Omit<MPTInspector, 'date'> {
  date: string;
}

const emptyObs = (): ObsRow => ({
  srNo: 1, jobDescription: '', drawingOrJointNo: '', size: '',
  quantity: '', evaluation: '', result: '', remark: '',
});

const emptyInspector = (): InspRow => ({
  name: '', qualification: '', designation: '', signature: '', idNo: '', date: '',
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export const MPTReportFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { customerId?: string; customerName?: string } | null;
  const customerId = state?.customerId ?? '';
  const customerName = state?.customerName ?? '';

  const [saving, setSaving] = useState(false);

  // ── Job Details ──
  const [reportNo, setReportNo] = useState('');
  const [jobCustomer, setJobCustomer] = useState(customerName);
  const [jobClient, setJobClient] = useState('');
  const [jobReportDate, setJobReportDate] = useState('');
  const [jobInspectionDate, setJobInspectionDate] = useState('');
  const [jobReferenceStd, setJobReferenceStd] = useState('ASME SEC V Article 7, ASTM E 709');
  const [jobAcceptanceCriteria, setJobAcceptanceCriteria] = useState('');
  const [jobInspectionTime, setJobInspectionTime] = useState('');
  const [jobStageOfInspection, setJobStageOfInspection] = useState('');
  const [jobMaterial, setJobMaterial] = useState('');
  const [jobExtentOfExamination, setJobExtentOfExamination] = useState('');
  const [jobExtentOther, setJobExtentOther] = useState('');
  const [jobThickness, setJobThickness] = useState('');
  const [jobTypeOfJoint, setJobTypeOfJoint] = useState('');
  const [jobSurfaceCondition, setJobSurfaceCondition] = useState('');
  const [jobWeldingProcess, setJobWeldingProcess] = useState('');

  // ── Equipment Details ──
  const [eqType, setEqType] = useState('Yoke');
  const [eqSrNo, setEqSrNo] = useState('');
  const [eqMake, setEqMake] = useState('');
  const [eqMakeOther, setEqMakeOther] = useState('');
  const [eqCalibrationDue, setEqCalibrationDue] = useState('');
  const [eqYokeSpacing, setEqYokeSpacing] = useState('');
  const [eqPieGauge, setEqPieGauge] = useState('Done');

  // ── Medium Details ──
  const [biManufacturer, setBiManufacturer] = useState('');
  const [biManufacturerOther, setBiManufacturerOther] = useState('');
  const [biBatchNo, setBiBatchNo] = useState('');
  const [biExpiryDate, setBiExpiryDate] = useState('');
  const [wcManufacturer, setWcManufacturer] = useState('');
  const [wcManufacturerOther, setWcManufacturerOther] = useState('');
  const [wcBatchNo, setWcBatchNo] = useState('');
  const [wcExpiryDate, setWcExpiryDate] = useState('');

  // ── Method Description ──
  const [method, setMethod] = useState('');
  const [lightIntensity, setLightIntensity] = useState('');
  const [magnetizationType, setMagnetizationType] = useState('');
  const [lightEquipUsed, setLightEquipUsed] = useState('Bulb');
  const [magnetizingMethod, setMagnetizingMethod] = useState('');
  const [bathConcentration, setBathConcentration] = useState('');
  const [bathConcentrationOther, setBathConcentrationOther] = useState('');
  const [demagnetization, setDemagnetization] = useState('');
  const [magFieldVerifiedBy, setMagFieldVerifiedBy] = useState('Pie Gauge');
  const [gaussMeterReading, setGaussMeterReading] = useState('');
  const [current, setCurrent] = useState('');
  const [currentType, setCurrentType] = useState('');
  const [currentTypeOther, setCurrentTypeOther] = useState('');
  const [postCleaning, setPostCleaning] = useState('Done');

  // ── Observations ──
  const [observations, setObservations] = useState<ObsRow[]>([emptyObs()]);

  // ── Final Section ──
  const [examinedBy, setExaminedBy] = useState('');
  const [custName, setCustName] = useState('');
  const [custSig, setCustSig] = useState('');
  const [custIdNo, setCustIdNo] = useState('');
  const [custDate, setCustDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientSig, setClientSig] = useState('');
  const [clientIdNo, setClientIdNo] = useState('');
  const [clientDate, setClientDate] = useState('');
  const [inspectors, setInspectors] = useState<InspRow[]>([emptyInspector()]);

  // ── Helpers ──
  const resolveCustom = (val: string, other: string) =>
    val === 'Custom' && other.trim() ? other.trim() : val;

  const updateObs = (idx: number, key: keyof ObsRow, value: string) => {
    setObservations(prev =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row))
    );
  };

  const addObs = () =>
    setObservations(prev => [...prev, { ...emptyObs(), srNo: prev.length + 1 }]);

  const removeObs = (idx: number) =>
    setObservations(prev =>
      prev.filter((_, i) => i !== idx).map((row, i) => ({ ...row, srNo: i + 1 }))
    );

  const updateInsp = (idx: number, key: keyof InspRow, value: string) => {
    setInspectors(prev =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row))
    );
  };

  const addInspector = () => setInspectors(prev => [...prev, emptyInspector()]);
  const removeInspector = (idx: number) =>
    setInspectors(prev => prev.filter((_, i) => i !== idx));

  // ── Submit ──
  const handleSubmit = async (status: 'draft' | 'final') => {
    if (!customerId) {
      toast.error('Customer ID is missing. Go back and try again.');
      return;
    }
    if (!reportNo.trim()) {
      toast.error('Report No. is required.');
      return;
    }

    setSaving(true);
    try {
      await createMPTReport({
        customerId,
        reportNo: reportNo.trim(),
        status,
        jobDetails: {
          customer: jobCustomer,
          client: jobClient,
          reportDate: jobReportDate || undefined,
          inspectionDate: jobInspectionDate || undefined,
          referenceStd: jobReferenceStd,
          acceptanceCriteria: jobAcceptanceCriteria,
          inspectionTime: jobInspectionTime,
          stageOfInspection: jobStageOfInspection,
          material: jobMaterial,
          extentOfExamination: resolveCustom(jobExtentOfExamination, jobExtentOther),
          thickness: jobThickness,
          typeOfJoint: jobTypeOfJoint,
          surfaceCondition: jobSurfaceCondition,
          weldingProcess: jobWeldingProcess,
        },
        equipmentDetails: {
          equipmentType: eqType,
          srNo: eqSrNo,
          make: resolveCustom(eqMake, eqMakeOther),
          calibrationDue: eqCalibrationDue || undefined,
          yokeSpacing: eqYokeSpacing,
          pieGaugeCalibration: eqPieGauge,
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
          method,
          lightIntensity,
          magnetizationType,
          lightEquipmentUsed: lightEquipUsed,
          magnetizingMethod,
          bathConcentration: resolveCustom(bathConcentration, bathConcentrationOther),
          demagnetization,
          magneticFieldDirectionVerifiedBy: magFieldVerifiedBy,
          gaussMeterReading,
          current,
          currentType: resolveCustom(currentType, currentTypeOther),
          postCleaning,
        },
        observations: observations
          .filter(o => o.jobDescription.trim())
          .map(o => ({
            srNo: o.srNo,
            jobDescription: o.jobDescription,
            drawingOrJointNo: o.drawingOrJointNo,
            size: o.size,
            quantity: Number(o.quantity) || 0,
            evaluation: o.evaluation,
            result: o.result,
            remark: o.remark,
          })),
        finalSection: {
          examinedBy,
          customer: { name: custName, signature: custSig, idNo: custIdNo, date: custDate || undefined },
          clientOrTPI: { name: clientName, signature: clientSig, idNo: clientIdNo, date: clientDate || undefined },
          inspector: inspectors
            .filter(i => i.name.trim())
            .map(i => ({ ...i, date: i.date || undefined })),
        },
      });

      toast.success(`MPT Report saved as ${status}.`);
      navigate(-1);
    } catch {
      toast.error('Failed to save report. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const manufacturerOptions = ['Pradeep', 'Dyeglo', 'Ferrochem', 'MR Chem', 'Magnaflux', 'Custom'];

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
          <h1 className="text-xl font-bold text-gray-900">Magnetic Particle Examination Report</h1>
          <p className="text-sm text-gray-500">{customerName}</p>
        </div>
      </div>

      {/* Report No. + Status row */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="reportNo">Report No. *</label>
            <input
              id="reportNo"
              type="text"
              value={reportNo}
              onChange={e => setReportNo(e.target.value)}
              className={inputClass}
              placeholder="e.g. NIIT/JF/MT/25-26/01"
            />
          </div>
          <div>
            <label className={labelClass}>Format No.</label>
            <input type="text" className={inputClass} defaultValue="FMT-NDT-01" readOnly />
          </div>
        </div>
      </div>

      {/* ── Job Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Job Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="jobCustomer">Customer</label>
            <input id="jobCustomer" type="text" value={jobCustomer} onChange={e => setJobCustomer(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="reportNo2">Report No.</label>
            <input id="reportNo2" type="text" value={reportNo} readOnly className={inputClass + ' bg-gray-50'} />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobClient">Client</label>
            <input id="jobClient" type="text" value={jobClient} onChange={e => setJobClient(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobReportDate">Report Date</label>
            <input id="jobReportDate" type="date" value={jobReportDate} onChange={e => setJobReportDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobReferenceStd">Reference Std.</label>
            <input id="jobReferenceStd" type="text" value={jobReferenceStd} onChange={e => setJobReferenceStd(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobInspectionDate">Inspection Date</label>
            <input id="jobInspectionDate" type="date" value={jobInspectionDate} onChange={e => setJobInspectionDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobAcceptanceCriteria">Acceptance Criteria</label>
            <input id="jobAcceptanceCriteria" type="text" value={jobAcceptanceCriteria} onChange={e => setJobAcceptanceCriteria(e.target.value)} className={inputClass} placeholder="e.g. ASME SEC VIII Appendix 6" />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobInspectionTime">Inspection Time</label>
            <input id="jobInspectionTime" type="text" value={jobInspectionTime} onChange={e => setJobInspectionTime(e.target.value)} className={inputClass} placeholder="e.g. 10:30 AM to 05:30 PM" />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobStage">Stage of Inspection</label>
            <select id="jobStage" value={jobStageOfInspection} onChange={e => setJobStageOfInspection(e.target.value)} className={inputClass}>
              <option value="">Select...</option>
              <option>After welding</option>
              <option>As Casting</option>
              <option>After Machining</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="jobMaterial">Material</label>
            <input id="jobMaterial" type="text" value={jobMaterial} onChange={e => setJobMaterial(e.target.value)} className={inputClass} placeholder="e.g. As per Drawing" />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobExtent">Extent of Examination</label>
            <SelectWithOther
              id="jobExtent"
              value={jobExtentOfExamination}
              onChange={setJobExtentOfExamination}
              otherValue={jobExtentOther}
              onOtherChange={setJobExtentOther}
              options={['10%', '100%', 'To the maximum extent possible', 'Custom']}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobThickness">Thickness</label>
            <input id="jobThickness" type="text" value={jobThickness} onChange={e => setJobThickness(e.target.value)} className={inputClass} placeholder="e.g. As per Drawing" />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobTypeOfJoint">Type of Joint</label>
            <select id="jobTypeOfJoint" value={jobTypeOfJoint} onChange={e => setJobTypeOfJoint(e.target.value)} className={inputClass}>
              <option value="">Select...</option>
              <option>Butt</option>
              <option>Corner</option>
              <option>T Joint</option>
              <option>NA</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="jobSurface">Surface Condition</label>
            <input id="jobSurface" type="text" value={jobSurfaceCondition} onChange={e => setJobSurfaceCondition(e.target.value)} className={inputClass} placeholder="e.g. Smooth" />
          </div>
          <div>
            <label className={labelClass} htmlFor="jobWelding">Welding Process</label>
            <select id="jobWelding" value={jobWeldingProcess} onChange={e => setJobWeldingProcess(e.target.value)} className={inputClass}>
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

      {/* ── Equipment Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Equipment Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="eqType">Equipment Type</label>
            <select id="eqType" value={eqType} onChange={e => setEqType(e.target.value)} className={inputClass}>
              <option>Yoke</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="eqSrNo">Sr. No.</label>
            <input id="eqSrNo" type="text" value={eqSrNo} onChange={e => setEqSrNo(e.target.value)} className={inputClass} placeholder="e.g. MNH13K45" />
          </div>
          <div>
            <label className={labelClass} htmlFor="eqMake">Make</label>
            <SelectWithOther
              id="eqMake"
              value={eqMake}
              onChange={setEqMake}
              otherValue={eqMakeOther}
              onOtherChange={setEqMakeOther}
              options={['EECI', 'Ferrochem', 'Custom']}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="eqCalibration">Calibration Due</label>
            <input id="eqCalibration" type="date" value={eqCalibrationDue} onChange={e => setEqCalibrationDue(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="eqYoke">Yoke Spacing</label>
            <input id="eqYoke" type="text" value={eqYokeSpacing} onChange={e => setEqYokeSpacing(e.target.value)} className={inputClass} placeholder="e.g. 100 mm" />
          </div>
          <div>
            <label className={labelClass} htmlFor="eqPie">Pie Gauge Calibration</label>
            <select id="eqPie" value={eqPieGauge} onChange={e => setEqPieGauge(e.target.value)} className={inputClass}>
              <option>Done</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Medium Details ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Medium Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">Material</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">Manufacturer</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">Batch No.</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-medium text-gray-600 whitespace-nowrap">Black Ink</td>
                <td className="border border-gray-200 px-2 py-1">
                  <SelectWithOther
                    id="biMfr"
                    value={biManufacturer}
                    onChange={setBiManufacturer}
                    otherValue={biManufacturerOther}
                    onOtherChange={setBiManufacturerOther}
                    options={manufacturerOptions}
                  />
                </td>
                <td className="border border-gray-200 px-2 py-1">
                  <input type="text" value={biBatchNo} onChange={e => setBiBatchNo(e.target.value)} className={inputClass} placeholder="Batch No." />
                </td>
                <td className="border border-gray-200 px-2 py-1">
                  <input type="text" value={biExpiryDate} onChange={e => setBiExpiryDate(e.target.value)} className={inputClass} placeholder="e.g. MAR 2027" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-medium text-gray-600 whitespace-nowrap">White Contrast</td>
                <td className="border border-gray-200 px-2 py-1">
                  <SelectWithOther
                    id="wcMfr"
                    value={wcManufacturer}
                    onChange={setWcManufacturer}
                    otherValue={wcManufacturerOther}
                    onOtherChange={setWcManufacturerOther}
                    options={manufacturerOptions}
                  />
                </td>
                <td className="border border-gray-200 px-2 py-1">
                  <input type="text" value={wcBatchNo} onChange={e => setWcBatchNo(e.target.value)} className={inputClass} placeholder="Batch No." />
                </td>
                <td className="border border-gray-200 px-2 py-1">
                  <input type="text" value={wcExpiryDate} onChange={e => setWcExpiryDate(e.target.value)} className={inputClass} placeholder="e.g. MAR 2027" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Method Description ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Method Description</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="method">Method</label>
            <select id="method" value={method} onChange={e => setMethod(e.target.value)} className={inputClass}>
              <option value="">Select...</option>
              <option>Visible</option>
              <option>Fluorescent</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="lightIntensity">Light Intensity</label>
            <input id="lightIntensity" type="text" value={lightIntensity} onChange={e => setLightIntensity(e.target.value)} className={inputClass} placeholder="e.g. 1180 lux" />
          </div>
          <div>
            <label className={labelClass} htmlFor="magType">Magnetization Type</label>
            <select id="magType" value={magnetizationType} onChange={e => setMagnetizationType(e.target.value)} className={inputClass}>
              <option value="">Select...</option>
              <option>Longitudinal</option>
              <option>Circular</option>
              <option>Longitudinal &amp; Circular</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="lightEquip">Light Equipment Used</label>
            <select id="lightEquip" value={lightEquipUsed} onChange={e => setLightEquipUsed(e.target.value)} className={inputClass}>
              <option>Bulb</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="magMethod">Magnetizing Method</label>
            <select id="magMethod" value={magnetizingMethod} onChange={e => setMagnetizingMethod(e.target.value)} className={inputClass}>
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
              options={['Ready Bath', 'Custom']}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="demag">Demagnetization</label>
            <select id="demag" value={demagnetization} onChange={e => setDemagnetization(e.target.value)} className={inputClass}>
              <option value="">Select...</option>
              <option>Done</option>
              <option>N/A</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="magFieldVerify">Magnetic Field Direction Verified By</label>
            <select id="magFieldVerify" value={magFieldVerifiedBy} onChange={e => setMagFieldVerifiedBy(e.target.value)} className={inputClass}>
              <option>Pie Gauge</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="gaussMeter">Gauss Meter Reading</label>
            <input id="gaussMeter" type="text" value={gaussMeterReading} onChange={e => setGaussMeterReading(e.target.value)} className={inputClass} placeholder="Enter reading" />
          </div>
          <div>
            <label className={labelClass} htmlFor="current">Current</label>
            <input id="current" type="text" value={current} onChange={e => setCurrent(e.target.value)} className={inputClass} placeholder="Enter current value" />
          </div>
          <div>
            <label className={labelClass} htmlFor="currentType">Current Type</label>
            <SelectWithOther
              id="currentType"
              value={currentType}
              onChange={setCurrentType}
              otherValue={currentTypeOther}
              onOtherChange={setCurrentTypeOther}
              options={['AC', 'DC', 'HWDC', 'Custom']}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="postCleaning">Post Cleaning</label>
            <select id="postCleaning" value={postCleaning} onChange={e => setPostCleaning(e.target.value)} className={inputClass}>
              <option>Done</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Observations ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionTitleClass.replace(' mb-4 pb-2 border-b border-gray-100', '')}>Observations</h2>
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
                <th className="border border-gray-200 px-2 py-2 text-center w-10">Sr.</th>
                <th className="border border-gray-200 px-2 py-2 text-left">Job Description</th>
                <th className="border border-gray-200 px-2 py-2 text-left">Drg No. / Joint No.</th>
                <th className="border border-gray-200 px-2 py-2 text-left">Size</th>
                <th className="border border-gray-200 px-2 py-2 text-center">Qty</th>
                <th className="border border-gray-200 px-2 py-2 text-left">Evaluation</th>
                <th className="border border-gray-200 px-2 py-2 text-left">Result</th>
                <th className="border border-gray-200 px-2 py-2 text-left">Remark</th>
                <th className="border border-gray-200 px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {observations.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1 text-center text-gray-500">{row.srNo}</td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input type="text" value={row.jobDescription} onChange={e => updateObs(idx, 'jobDescription', e.target.value)} className={inputClass} />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input type="text" value={row.drawingOrJointNo} onChange={e => updateObs(idx, 'drawingOrJointNo', e.target.value)} className={inputClass} />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input type="text" value={row.size} onChange={e => updateObs(idx, 'size', e.target.value)} className={inputClass} />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input type="number" value={row.quantity} onChange={e => updateObs(idx, 'quantity', e.target.value)} className={inputClass + ' w-16'} min="0" />
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select value={row.evaluation} onChange={e => updateObs(idx, 'evaluation', e.target.value)} className={inputClass}>
                      <option value="">Select...</option>
                      <option>No relevant Indication Found</option>
                      <option>Relevant Indication Found</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <select value={row.result} onChange={e => updateObs(idx, 'result', e.target.value)} className={inputClass}>
                      <option value="">Select...</option>
                      <option>Accepted</option>
                      <option>Not Accepted</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-1 py-1">
                    <input type="text" value={row.remark} onChange={e => updateObs(idx, 'remark', e.target.value)} className={inputClass} />
                  </td>
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

      {/* ── Final Section ── */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Final Section</h2>

        <div className="mb-4">
          <label className={labelClass} htmlFor="examinedBy">Examined By</label>
          <input id="examinedBy" type="text" value={examinedBy} onChange={e => setExaminedBy(e.target.value)} className={inputClass + ' max-w-sm'} placeholder="Organization / Person name" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Customer */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Customer</p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name</label>
                <input type="text" value={custName} onChange={e => setCustName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Signature</label>
                <input type="text" value={custSig} onChange={e => setCustSig(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>I.D. No.</label>
                <input type="text" value={custIdNo} onChange={e => setCustIdNo(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" value={custDate} onChange={e => setCustDate(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Client / TPI */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Client / TPI</p>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Name</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Signature</label>
                <input type="text" value={clientSig} onChange={e => setClientSig(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>I.D. No.</label>
                <input type="text" value={clientIdNo} onChange={e => setClientIdNo(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" value={clientDate} onChange={e => setClientDate(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Inspectors */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-600 uppercase">Inspector(s)</p>
            <button
              type="button"
              onClick={addInspector}
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Inspector
            </button>
          </div>
          <div className="space-y-3">
            {inspectors.map((insp, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-4 bg-gray-50 relative">
                {inspectors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInspector(idx)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <p className="text-xs text-gray-400 mb-3">Inspector {idx + 1}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input type="text" value={insp.name} onChange={e => updateInsp(idx, 'name', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Qualification</label>
                    <input type="text" value={insp.qualification} onChange={e => updateInsp(idx, 'qualification', e.target.value)} className={inputClass} placeholder="e.g. MT NDE Level II" />
                  </div>
                  <div>
                    <label className={labelClass}>Designation</label>
                    <input type="text" value={insp.designation} onChange={e => updateInsp(idx, 'designation', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Signature</label>
                    <input type="text" value={insp.signature} onChange={e => updateInsp(idx, 'signature', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>I.D. No.</label>
                    <input type="text" value={insp.idNo} onChange={e => updateInsp(idx, 'idNo', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Date</label>
                    <input type="date" value={insp.date} onChange={e => updateInsp(idx, 'date', e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
            ))}
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
          onClick={() => handleSubmit('draft')}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSubmit('final')}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save as Final'}
        </button>
      </div>
    </div>
  );
};
