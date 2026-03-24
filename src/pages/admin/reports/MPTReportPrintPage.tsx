import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMPTReportById, MPTReport } from '../../../api/customerApi';

// ─── Print Styles ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 12mm 10mm; }
  @media print {
    .no-print { display: none !important; }
    body { margin: 0; background: white; }
    #report-root { padding: 0; }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .report-table td, .report-table th {
    border: 1px solid #444;
    padding: 3px 5px;
    vertical-align: middle;
    word-break: break-word;
  }
  .section-hdr {
    background: #2d3748;
    color: #fff;
    font-weight: bold;
    font-size: 8.5pt;
    text-align: center;
    letter-spacing: 1px;
    padding: 4px 6px;
  }
  .col-hdr {
    background: #edf2f7;
    font-weight: bold;
    font-size: 8pt;
    text-align: center;
  }
  .lbl {
    background: #f7fafc;
    font-weight: 600;
    font-size: 8.5pt;
    white-space: nowrap;
    width: 18%;
  }
  .val { font-size: 9pt; }
  .report-title-table { width: 100%; border-collapse: collapse; }
  .report-title-table td { border: 1px solid #444; padding: 4px 8px; }
  .company-name { font-size: 11pt; font-weight: bold; text-transform: uppercase; text-align: center; }
  .report-title { font-size: 13pt; font-weight: bold; text-align: center; letter-spacing: 1px; text-transform: uppercase; }
  .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .obs-table td, .obs-table th { border: 1px solid #444; padding: 3px 4px; font-size: 8.5pt; vertical-align: top; word-break: break-word; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: -1px; }
  .sign-table td { border: 1px solid #444; padding: 3px 5px; font-size: 8.5pt; vertical-align: top; min-height: 18px; }
  .sign-lbl { font-weight: 600; font-size: 8pt; }
  .mt-n1 { margin-top: -1px; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const v = (val?: string | null) => val || '';

// ─── Print Page ───────────────────────────────────────────────────────────────

export const MPTReportPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<MPTReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getMPTReportById(id)
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (res as any)?.report ?? (res as any)?.data ?? res;
        setReport(data as MPTReport);
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial' }}>
        Loading report...
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial', gap: 12 }}>
        <p>Report not found.</p>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  const jd = report.jobDetails ?? {};
  const eq = report.equipmentDetails ?? {};
  const md = report.mediumDetails ?? {};
  const me = report.methodDescription ?? {};
  const fs = report.finalSection ?? {};
  const obs = report.observations ?? [];
  const inspectors = fs.inspector ?? [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* ── No-Print Action Bar ── */}
      <div className="no-print" style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '6px 14px', background: '#334155', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
        >
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          style={{ padding: '6px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          🖨 Print / Save as PDF
        </button>
        <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>
          {report.reportNo} — {report.status === 'final' ? '✅ Final' : '📝 Draft'}
        </span>
      </div>

      {/* ── Report Content ── */}
      <div id="report-root" style={{ background: '#f1f5f9', minHeight: '100vh', padding: '24px 16px' }}>
        <div style={{ width: '210mm', minHeight: '297mm', background: '#fff', margin: '0 auto', padding: '8mm', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>

          {/* ── HEADER TABLE ── */}
          <table className="report-title-table" style={{ marginBottom: -1 }}>
            <tbody>
              <tr>
                <td rowSpan={2} style={{ width: '18%', textAlign: 'center', verticalAlign: 'middle', padding: 6 }}>
                  {/* Company Logo placeholder */}
                  <div style={{ border: '1px solid #ccc', width: 60, height: 60, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#888', textAlign: 'center' }}>
                    NIIT<br />LOGO
                  </div>
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'bottom', paddingBottom: 2 }}>
                  <div className="company-name">National Industrial Inspection And Training</div>
                </td>
                <td rowSpan={2} style={{ width: '22%', verticalAlign: 'middle', fontSize: '8pt', lineHeight: 1.6 }}>
                  <div><strong>Format No:</strong> FMT-NDT-01</div>
                  <div><strong>Rev. No:</strong> 00</div>
                  <div><strong>Page No:</strong> 1/1</div>
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', paddingTop: 2, paddingBottom: 4 }}>
                  <div className="report-title">Magnetic Particle Examination Report</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── JOB DETAILS ── */}
          <table className="report-table mt-n1">
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <tbody>
              <tr><td colSpan={4} className="section-hdr">JOB DETAILS</td></tr>
              <tr>
                <td className="lbl">Customer</td>
                <td className="val">{v(jd.customer)}</td>
                <td className="lbl">Report No.:</td>
                <td className="val">{v(report.reportNo)}</td>
              </tr>
              <tr>
                <td className="lbl">Client</td>
                <td className="val">{v(jd.client)}</td>
                <td className="lbl">Report Date:</td>
                <td className="val">{fmtDate(jd.reportDate)}</td>
              </tr>
              <tr>
                <td className="lbl">Reference Std.</td>
                <td className="val">{v(jd.referenceStd)}</td>
                <td className="lbl">Inspection Date</td>
                <td className="val">{fmtDate(jd.inspectionDate)}</td>
              </tr>
              <tr>
                <td className="lbl">Acceptance Criteria</td>
                <td className="val">{v(jd.acceptanceCriteria)}</td>
                <td className="lbl">Inspection Time</td>
                <td className="val">{v(jd.inspectionTime)}</td>
              </tr>
              <tr>
                <td className="lbl">Stage of Inspection</td>
                <td className="val">{v(jd.stageOfInspection)}</td>
                <td className="lbl">Material</td>
                <td className="val">{v(jd.material)}</td>
              </tr>
              <tr>
                <td className="lbl">Extent of Examination</td>
                <td className="val">{v(jd.extentOfExamination)}</td>
                <td className="lbl">Thickness</td>
                <td className="val">{v(jd.thickness)}</td>
              </tr>
              <tr>
                <td className="lbl">Type of Joint</td>
                <td className="val">{v(jd.typeOfJoint)}</td>
                <td className="lbl">Surface Condition</td>
                <td className="val">{v(jd.surfaceCondition)}</td>
              </tr>
              <tr>
                <td className="lbl">Welding Process</td>
                <td className="val">{v(jd.weldingProcess)}</td>
                <td className="lbl"></td>
                <td className="val"></td>
              </tr>
            </tbody>
          </table>

          {/* ── EQUIPMENT DETAILS ── */}
          <table className="report-table mt-n1">
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <tbody>
              <tr><td colSpan={4} className="section-hdr">EQUIPMENT DETAILS</td></tr>
              <tr>
                <td className="lbl">Equip. Type</td>
                <td className="val">{v(eq.equipmentType)}</td>
                <td className="lbl">Sr. No.</td>
                <td className="val">{v(eq.srNo)}</td>
              </tr>
              <tr>
                <td className="lbl">Make</td>
                <td className="val">{v(eq.make)}</td>
                <td className="lbl">Calibration Due</td>
                <td className="val">{fmtDate(eq.calibrationDue)}</td>
              </tr>
              <tr>
                <td className="lbl">Yoke Spacing</td>
                <td className="val">{v(eq.yokeSpacing)}</td>
                <td className="lbl">Pie Gauge Calibration</td>
                <td className="val">{v(eq.pieGaugeCalibration)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── MEDIUM DETAILS ── */}
          <table className="report-table mt-n1">
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <tbody>
              <tr><td colSpan={4} className="section-hdr">MEDIUM DETAILS</td></tr>
              <tr>
                <td className="col-hdr">Material</td>
                <td className="col-hdr">Manufacturer</td>
                <td className="col-hdr">Batch No.</td>
                <td className="col-hdr">Expiry Date</td>
              </tr>
              <tr>
                <td className="lbl">Black Ink</td>
                <td className="val">{v(md.blackInk?.manufacturer)}</td>
                <td className="val">{v(md.blackInk?.batchNo)}</td>
                <td className="val">{v(md.blackInk?.expiryDate)}</td>
              </tr>
              <tr>
                <td className="lbl">White Contrast</td>
                <td className="val">{v(md.whiteContrast?.manufacturer)}</td>
                <td className="val">{v(md.whiteContrast?.batchNo)}</td>
                <td className="val">{v(md.whiteContrast?.expiryDate)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── METHOD DESCRIPTION ── */}
          <table className="report-table mt-n1">
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <tbody>
              <tr><td colSpan={4} className="section-hdr">METHOD DESCRIPTION</td></tr>
              <tr>
                <td className="lbl">Method</td>
                <td className="val">{v(me.method)}</td>
                <td className="lbl">Light Intensity</td>
                <td className="val">{v(me.lightIntensity)}</td>
              </tr>
              <tr>
                <td className="lbl">Magnetization Type</td>
                <td className="val">{v(me.magnetizationType)}</td>
                <td className="lbl">Light Equip. Used</td>
                <td className="val">{v(me.lightEquipmentUsed)}</td>
              </tr>
              <tr>
                <td className="lbl">Magnetizing Method</td>
                <td className="val">{v(me.magnetizingMethod)}</td>
                <td className="lbl">Bath Concentration</td>
                <td className="val">{v(me.bathConcentration)}</td>
              </tr>
              <tr>
                <td className="lbl">Demagnetization</td>
                <td className="val">{v(me.demagnetization)}</td>
                <td className="lbl">Mag. Field Dir. Verified By</td>
                <td className="val">{v(me.magneticFieldDirectionVerifiedBy)}</td>
              </tr>
              <tr>
                <td className="lbl">Gauss Meter Reading</td>
                <td className="val">{v(me.gaussMeterReading)}</td>
                <td className="lbl">Current</td>
                <td className="val">{v(me.current)}</td>
              </tr>
              <tr>
                <td className="lbl">Current Type</td>
                <td className="val">{v(me.currentType)}</td>
                <td className="lbl">Post Cleaning</td>
                <td className="val">{v(me.postCleaning)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── OBSERVATIONS ── */}
          <table className="obs-table mt-n1">
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '26%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr><th colSpan={7} className="section-hdr">OBSERVATIONS</th></tr>
              <tr>
                <th className="col-hdr">Sr. No.</th>
                <th className="col-hdr">Job Description</th>
                <th className="col-hdr">Drg No. / Joint No.</th>
                <th className="col-hdr">Size</th>
                <th className="col-hdr">Qty</th>
                <th className="col-hdr">Evaluation</th>
                <th className="col-hdr">Remark</th>
              </tr>
            </thead>
            <tbody>
              {obs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: '8px 4px' }}>No observations recorded</td>
                </tr>
              ) : obs.map((o, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center' }}>{o.srNo}</td>
                  <td>{v(o.jobDescription)}</td>
                  <td>{v(o.drawingOrJointNo)}</td>
                  <td>{v(o.size)}</td>
                  <td style={{ textAlign: 'center' }}>{o.quantity || ''}</td>
                  <td>{v(o.evaluation)}</td>
                  <td>{v(o.result)}{o.remark ? ` / ${o.remark}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── FINAL / SIGNATURE SECTION ── */}
          <table className="sign-table mt-n1">
            <colgroup>
              <col style={{ width: '33.33%' }} />
              <col style={{ width: '33.33%' }} />
              <col style={{ width: '33.34%' }} />
            </colgroup>
            <tbody>
              {/* Examined By row */}
              <tr>
                <td colSpan={3} style={{ padding: '3px 6px', fontWeight: 600, fontSize: '8.5pt' }}>
                  EXAMINED BY: &nbsp; National Industrial Inspection And Training
                </td>
              </tr>
              {/* Header row for signature columns */}
              <tr>
                <td className="col-hdr">CUSTOMER: {v(fs.customer?.name)}</td>
                <td className="col-hdr">CLIENT / TPI: {v(fs.clientOrTPI?.name)}</td>
                <td className="col-hdr">{inspectors[0] ? `INSPECTOR: ${inspectors[0].name}` : 'INSPECTOR:'}</td>
              </tr>
              <tr>
                <td>
                  <span className="sign-lbl">Name: </span>{v(fs.customer?.name)}
                </td>
                <td>
                  <span className="sign-lbl">Name: </span>{v(fs.clientOrTPI?.name)}
                </td>
                <td>
                  <span className="sign-lbl">Name: </span>{inspectors[0]?.name || ''}
                </td>
              </tr>
              <tr>
                <td style={{ minHeight: 28 }}>
                  <span className="sign-lbl">Qualification: </span>
                </td>
                <td style={{ minHeight: 28 }}>
                  <span className="sign-lbl">Designation: </span>
                </td>
                <td>
                  <span className="sign-lbl">Qualification: </span>{inspectors[0]?.qualification || ''}
                </td>
              </tr>
              <tr>
                <td style={{ minHeight: 28 }}>
                  <span className="sign-lbl">Signature: </span>{v(fs.customer?.signature)}
                </td>
                <td style={{ minHeight: 28 }}>
                  <span className="sign-lbl">Signature: </span>{v(fs.clientOrTPI?.signature)}
                </td>
                <td>
                  <span className="sign-lbl">Signature: </span>{inspectors[0]?.signature || ''}
                </td>
              </tr>
              <tr>
                <td>
                  <span className="sign-lbl">I.D. No.: </span>{v(fs.customer?.idNo)}
                </td>
                <td>
                  <span className="sign-lbl">I.D. No.: </span>{v(fs.clientOrTPI?.idNo)}
                </td>
                <td>
                  <span className="sign-lbl">I.D. No.: </span>{inspectors[0]?.idNo || ''}
                </td>
              </tr>
              <tr>
                <td>
                  <span className="sign-lbl">Date: </span>{fmtDate(fs.customer?.date)}
                </td>
                <td>
                  <span className="sign-lbl">Date: </span>{fmtDate(fs.clientOrTPI?.date)}
                </td>
                <td>
                  <span className="sign-lbl">Date: </span>{fmtDate(inspectors[0]?.date)}
                </td>
              </tr>

              {/* Additional inspectors */}
              {inspectors.slice(1).map((insp, i) => (
                <tr key={i}>
                  <td colSpan={3} style={{ padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #444', padding: '3px 5px', width: '25%' }}><span className="sign-lbl">Name: </span>{insp.name}</td>
                          <td style={{ border: '1px solid #444', padding: '3px 5px', width: '25%' }}><span className="sign-lbl">Qualification: </span>{insp.qualification}</td>
                          <td style={{ border: '1px solid #444', padding: '3px 5px', width: '17%' }}><span className="sign-lbl">Sig: </span>{insp.signature}</td>
                          <td style={{ border: '1px solid #444', padding: '3px 5px', width: '17%' }}><span className="sign-lbl">I.D. No.: </span>{insp.idNo}</td>
                          <td style={{ border: '1px solid #444', padding: '3px 5px', width: '16%' }}><span className="sign-lbl">Date: </span>{fmtDate(insp.date)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </>
  );
};
