import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getPTReportById, PTReport } from '../../../api/customerApi';

// ─── Print Styles ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 6mm 8mm; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }
  @media screen { body.autoprint-mode { opacity: 0; } }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: white; }
    #report-root { padding: 0 !important; background: white !important; }
    #report-root > div { box-shadow: none !important; padding: 0 !important; width: 100% !important; min-height: auto !important; }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .report-table td, .report-table th {
    border: 1px solid #444;
    padding: 2px 4px;
    vertical-align: middle;
    word-break: break-word;
  }
  .section-hdr {
    background: #2d3748;
    color: #fff;
    font-weight: bold;
    font-size: 7.5pt;
    text-align: center;
    letter-spacing: 1px;
    padding: 2px 4px;
  }
  .col-hdr {
    background: #edf2f7;
    font-weight: bold;
    font-size: 7pt;
    text-align: center;
  }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 7.5pt; white-space: nowrap; width: 22%; }
  .val { font-size: 7.5pt; }
  .report-title-table { width: 100%; border-collapse: collapse; }
  .report-title-table td { border: 1px solid #444; padding: 2px 6px; }
  .company-name { font-size: 9.5pt; font-weight: bold; text-transform: uppercase; text-align: center; color: #1a3c8f; }
  .company-sub { font-size: 6.5pt; text-align: center; color: #333; line-height: 1.5; }
  .company-iso { font-size: 6.5pt; text-align: center; font-weight: bold; color: #333; }
  .report-title { font-size: 10pt; font-weight: bold; text-align: center; letter-spacing: 1px; text-transform: uppercase; text-decoration: underline; margin: 4px 0; }
  .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .obs-table td, .obs-table th { border: 1px solid #444; padding: 2px 3px; font-size: 7.5pt; vertical-align: top; word-break: break-word; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: -1px; }
  .sign-table td { border: 1px solid #444; padding: 2px 4px; font-size: 7.5pt; vertical-align: top; min-height: 14px; }
  .sign-lbl { font-weight: 600; font-size: 7pt; }
  .mt-n1 { margin-top: -1px; }
  .footer-text { font-size: 6pt; text-align: center; color: #555; margin-top: 4px; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const v = (s?: string) => s || '';
const fmtDate = (d?: string) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const PTReportPrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('autoprint') === 'true';

  const [report, setReport] = useState<PTReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getPTReportById(id)
      .then(res => setReport(res.data?.data ?? res.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && report && autoPrint) {
      document.body.classList.add('autoprint-mode');
      const t = setTimeout(() => {
        window.print();
        document.body.classList.remove('autoprint-mode');
      }, 600);
      return () => clearTimeout(t);
    }
  }, [loading, report, autoPrint]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial' }}>Loading...</div>;
  if (!report) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial', gap: 12 }}>
      <p>Report not found.</p>
      <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>Go Back</button>
    </div>
  );

  const jd = report.jobDetails ?? {};
  const md = report.methodDetails ?? {};
  const cons = (report as any).consumablesDetails ?? {};
  const desc = report.methodDescription ?? {};
  const obs = report.observations ?? [];
  const fs = report.finalSection ?? {};
  const inspector = fs.inspector?.[0] ?? {};

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* ── No-Print Action Bar ── */}
      <div className="no-print" style={{ background: '#1e293b', padding: '10px 16px', display: autoPrint ? 'none' : 'flex', gap: 10, alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ padding: '6px 14px', background: '#334155', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          ← Back
        </button>
        <button onClick={() => window.print()} style={{ padding: '6px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          🖨 Print / Save as PDF
        </button>
        <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>
          {report.reportNo} — {report.status === 'final' ? '✅ Final' : '📝 Draft'}
        </span>
      </div>

      {/* ── Report Content ── */}
      <div id="report-root" style={{ background: '#f1f5f9', minHeight: '100vh', padding: '24px 16px' }}>
        <div style={{ width: '210mm', minHeight: '297mm', background: '#fff', margin: '0 auto', padding: '5mm', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>

          {/* ── HEADER ── */}
          <table className="report-title-table" style={{ marginBottom: -1 }}>
            <tbody>
              <tr>
                <td rowSpan={2} style={{ width: '14%', textAlign: 'center', verticalAlign: 'middle', padding: 4 }}>
                  <div style={{ border: '2px solid #1a3c8f', borderRadius: 4, width: 56, height: 56, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#1a3c8f', fontWeight: 'bold', textAlign: 'center' }}>
                    niit
                  </div>
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '2px 6px' }}>
                  <div className="company-name">National Industrial Inspection &amp; Training</div>
                  <div className="company-sub">
                    THIRD PARTY INSPECTION | NDT SERVICES &amp; TRAINING | NDT CONSULTANCY | PHYSICAL CALIBRATION |<br />
                    FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT | QUALITY MANAGEMENT SYSTEM TRAINING
                  </div>
                  <div className="company-iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
                </td>
                <td rowSpan={2} style={{ width: '20%', verticalAlign: 'middle', fontSize: '7.5pt', lineHeight: 1.6 }}>
                  <div><strong>Format No:</strong> FMT-NDT-PT-01</div>
                  <div><strong>Rev. No:</strong> 00</div>
                  <div><strong>Page No:</strong> 1/1</div>
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', padding: '3px 6px' }}>
                  <div className="report-title">Liquid Penetrant Test Report</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── JOB DETAILS ── */}
          <table className="report-table mt-n1">
            <colgroup><col style={{ width: '22%' }} /><col style={{ width: '28%' }} /><col style={{ width: '22%' }} /><col style={{ width: '28%' }} /></colgroup>
            <tbody>
              <tr><td colSpan={4} className="section-hdr">JOB DETAILS</td></tr>
              <tr>
                <td className="lbl">Customer</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(jd.customer)}</td>
                <td className="lbl">Report No.</td>
                <td className="val">{v(report.reportNo)}</td>
              </tr>
              <tr>
                <td className="lbl">Client</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(jd.client)}</td>
                <td className="lbl">Report Date</td>
                <td className="val">{fmtDate(jd.reportDate)}</td>
              </tr>
              <tr>
                <td className="lbl">Project</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(jd.project)}</td>
                <td className="lbl">Inspection Date</td>
                <td className="val">{fmtDate(jd.inspectionDate)}{jd.inspectionEndDate ? ` to ${fmtDate(jd.inspectionEndDate)}` : ''}</td>
              </tr>
              <tr>
                <td className="lbl">Reference Standard</td>
                <td className="val">{v(jd.referenceStandard)}</td>
                <td className="lbl">Inspection Time</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(jd.inspectionTime)}</td>
              </tr>
              <tr>
                <td className="lbl">Acceptance Criteria</td>
                <td className="val">{v(jd.acceptanceCriteria)}</td>
                <td className="lbl">Material</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(jd.material)}</td>
              </tr>
              <tr>
                <td className="lbl">Stage of Inspection</td>
                <td className="val">{v(jd.stageOfInspection)}</td>
                <td className="lbl">Thickness</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(jd.thickness)}</td>
              </tr>
              <tr>
                <td className="lbl">Extent of Examination</td>
                <td className="val">{v(jd.extentOfExamination)}</td>
                <td className="lbl">Surface Condition</td>
                <td className="val">{v(jd.surfaceCondition)}</td>
              </tr>
              <tr>
                <td className="lbl">Type of Joint</td>
                <td className="val">{v(jd.typeOfJoint)}</td>
                <td className="lbl">Surface Temperature</td>
                <td className="val">{v(jd.surfaceTemperature)}</td>
              </tr>
              <tr>
                <td className="lbl">Welding Process</td>
                <td className="val" colSpan={3}>{v(jd.weldingProcess)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── METHOD DETAILS ── */}
          <table className="report-table mt-n1">
            <colgroup><col style={{ width: '22%' }} /><col style={{ width: '28%' }} /><col style={{ width: '22%' }} /><col style={{ width: '28%' }} /></colgroup>
            <tbody>
              <tr><td colSpan={4} className="section-hdr">METHOD DETAILS</td></tr>
              <tr>
                <td className="lbl">Penetrant Method</td>
                <td className="val">{v(md.penetrantMethod)}</td>
                <td className="lbl">Excess Penetrant Removal Method</td>
                <td className="val">{v(md.excessPenetrantRemovalMethod)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── CONSUMABLES DETAILS ── */}
          <table className="report-table mt-n1">
            <colgroup><col style={{ width: '14%' }} /><col style={{ width: '46%' }} /><col style={{ width: '16%' }} /><col style={{ width: '24%' }} /></colgroup>
            <tbody>
              <tr><td colSpan={4} className="section-hdr">CONSUMABLES DETAILS</td></tr>
              <tr>
                <td className="col-hdr">Material</td>
                <td className="col-hdr">Manufacture</td>
                <td className="col-hdr">Batch</td>
                <td className="col-hdr">Expiry Date</td>
              </tr>
              {[
                { label: 'Penetrant', data: cons.penetrant },
                { label: 'Developer', data: cons.developer },
                { label: 'Cleaner', data: cons.cleaner },
              ].map(row => (
                <tr key={row.label}>
                  <td className="lbl">{row.label}</td>
                  <td className="val">{v(row.data?.manufacturer)}</td>
                  <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(row.data?.batch)}</td>
                  <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(row.data?.expiryDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── METHOD DESCRIPTION ── */}
          <table className="report-table mt-n1">
            <colgroup><col style={{ width: '22%' }} /><col style={{ width: '28%' }} /><col style={{ width: '22%' }} /><col style={{ width: '28%' }} /></colgroup>
            <tbody>
              <tr><td colSpan={4} className="section-hdr">METHOD DESCRIPTION</td></tr>
              <tr>
                <td className="lbl">Dwell Time</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(desc.dwellTime)}</td>
                <td className="lbl">Light Intensity</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(desc.lightIntensity)}</td>
              </tr>
              <tr>
                <td className="lbl">Developing Time</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(desc.developingTime)}</td>
                <td className="lbl">Light Equip. Used</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(desc.lightEquipmentUsed)}</td>
              </tr>
              <tr>
                <td className="lbl">Post Cleaning</td>
                <td className="val">{v(desc.postCleaning)}</td>
                <td className="lbl">Drying Time</td>
                <td className="val" style={{ color: '#c00', fontWeight: 600 }}>{v(desc.dryingTime)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── OBSERVATIONS ── */}
          <table className="obs-table mt-n1">
            <tbody>
              <tr><td colSpan={7} className="section-hdr">OBSERVATIONS</td></tr>
              <tr>
                <td className="col-hdr" style={{ width: '6%' }}>Sr. No.</td>
                <td className="col-hdr" style={{ width: '18%' }}>Job Description</td>
                <td className="col-hdr" style={{ width: '16%' }}>Drg No. / Joint No.</td>
                <td className="col-hdr" style={{ width: '14%' }}>Size</td>
                <td className="col-hdr" style={{ width: '10%' }}>Quantity in Nos.</td>
                <td className="col-hdr" style={{ width: '22%' }}>Evaluation</td>
                <td className="col-hdr" style={{ width: '14%' }}>Remark</td>
              </tr>
              {obs.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '6px', fontSize: '7.5pt', color: '#999' }}>No observations recorded.</td></tr>
              ) : obs.map((o, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center' }}>{o.srNo}</td>
                  <td style={{ color: '#c00', fontWeight: 600 }}>{v(o.jobDescription)}</td>
                  <td style={{ color: '#c00', fontWeight: 600 }}>{v(o.drawingOrJointNo)}</td>
                  <td style={{ color: '#c00', fontWeight: 600 }}>{v(o.size)}</td>
                  <td style={{ textAlign: 'center', color: '#c00', fontWeight: 600 }}>{o.quantity ?? ''}</td>
                  <td>{v(o.evaluation)}</td>
                  <td>{v((o as any).result ?? o.remark)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── EXAMINED BY ── */}
          <table className="sign-table mt-n1">
            <colgroup><col style={{ width: '33.3%' }} /><col style={{ width: '33.3%' }} /><col style={{ width: '33.4%' }} /></colgroup>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, fontSize: '7pt' }}>EXAMINED BY</td>
                <td style={{ fontWeight: 600, fontSize: '7pt' }}>CUSTOMER: <span style={{ color: '#c00' }}>{v(fs.customer?.name)}</span></td>
                <td style={{ fontWeight: 600, fontSize: '7pt' }}>CLIENT / TPI: <span style={{ color: '#c00' }}>{v(fs.clientOrTPI?.name)}</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, fontSize: '7.5pt' }}>National Industrial Inspection And Training</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td style={{ minHeight: 14 }}>Name: {v(inspector.name)}</td>
                <td>Name: {v(fs.customer?.name)}</td>
                <td>Name: {v(fs.clientOrTPI?.name)}</td>
              </tr>
              <tr>
                <td>{v(inspector.qualification)}{inspector.designation ? ` / ${inspector.designation}` : ''}</td>
                <td>Designation: {v(fs.customer?.designation)}</td>
                <td>Designation: {v(fs.clientOrTPI?.designation)}</td>
              </tr>
              <tr>
                <td style={{ height: 28 }}>Signature:</td>
                <td>Signature:</td>
                <td>Signature:</td>
              </tr>
              <tr>
                <td style={{ height: 28 }}></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>I.D. No.: {v(inspector.idNo)}</td>
                <td>I.D. No.: {v(fs.customer?.idNo)}</td>
                <td>I.D. No.: {v(fs.clientOrTPI?.idNo)}</td>
              </tr>
              <tr>
                <td>Date: {fmtDate(inspector.date)}</td>
                <td>Date: {fmtDate(fs.customer?.date)}</td>
                <td>Date: {fmtDate(fs.clientOrTPI?.date)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── Footer ── */}
          <div className="footer-text">
            Corp Office: 1st Floor, Plot No.PAP 3/28, Behind BSNL Office, MIDC, Baramati, Dist-Pune 413133 Ph. +91 9860186056, +91 7875154431<br />
            Reg. Office: A/p - Kuthare, Tal - Patan, Dist-Satara 415112 | Website: www.niitindt.com | Email: niit04@gmail.com | info@niitindt.com
          </div>

        </div>
      </div>
    </>
  );
};
