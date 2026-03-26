import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { getUTGReportById } from "../../../api/customerApi";

// ─── Print Styles ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }
  @media screen { body.autoprint-mode { opacity: 0; } }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #report-root { padding: 0 !important; background: #fff !important; }
    #report-root > div {
      box-shadow: none !important;
      margin: 0 auto !important;
      width: 210mm !important;
      min-height: 297mm !important;
      padding: 5mm !important;
      box-sizing: border-box !important;
    }
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 7.5pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .report-table td, .report-table th {
    border: 1px solid #444;
    padding: 2px 4px;
    vertical-align: middle;
    word-break: break-word;
  }
  .section-hdr {
    background: #185FA5;
    color: #fff;
    font-weight: bold;
    font-size: 7.5pt;
    text-align: center;
    letter-spacing: 1px;
    padding: 2px 4px;
  }
  .col-hdr {
    background: #E6F1FB;
    font-weight: bold;
    font-size: 7pt;
    text-align: center;
  }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 7.5pt; white-space: nowrap; }
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
  .mt-n1 { margin-top: -1px; }
  .footer-text { font-size: 6pt; text-align: center; color: #555; margin-top: 4px; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const v = (s?: string | number | null) =>
  s !== undefined && s !== null ? String(s) : "";

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const UTGReportPrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locState = location.state as { customerId?: string; reportSubType?: string } | null;
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("autoprint") === "true";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const goBack = () => {
    if (locState?.customerId) {
      navigate(`/admin/customers/${locState.customerId}`, {
        state: { activeTab: "reports", reportSubType: locState.reportSubType ?? "utg" },
      });
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (!id) return;
    getUTGReportById(id)
      .then((res: any) => setReport((res as any).data ?? res))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && report && autoPrint) {
      document.body.classList.add("autoprint-mode");
      const t = setTimeout(() => {
        window.print();
        document.body.classList.remove("autoprint-mode");
      }, 600);
      return () => clearTimeout(t);
    }
  }, [loading, report, autoPrint]);

  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial" }}>
        Loading...
      </div>
    );

  if (!report)
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial", gap: 12 }}>
        <p>Report not found.</p>
        <button onClick={goBack} style={{ padding: "8px 16px", cursor: "pointer" }}>Go Back</button>
      </div>
    );

  const jd  = report.jobDetails       ?? {};
  const eq  = report.equipmentDetails ?? {};
  const sud = report.searchUnitDetails ?? [];
  const td  = report.techniqueDetails  ?? {};
  const techList = td.techniques ?? [];
  const obs = report.observations      ?? [];
  const fs  = report.finalSection      ?? {};
  const inspector = fs.inspector?.[0]  ?? {};

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* ── No-Print Action Bar ── */}
      <div
        className="no-print"
        style={{ padding: "10px 16px", background: "#1e293b", display: "flex", alignItems: "center", gap: 10 }}
      >
        <button
          onClick={goBack}
          style={{ padding: "6px 14px", background: "#334155", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
        >Back</button>
        <button
          onClick={() => window.print()}
          style={{ padding: "6px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
        >Download / Print</button>
        <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 12 }}>
          Report No: {v(report.reportNo)} &nbsp;|&nbsp; Status: {v(report.status)?.toUpperCase()}
        </span>
      </div>

      {/* ── Report Content ── */}
      <div id="report-root" style={{ background: "#e9eef5", minHeight: "100vh", padding: "16px" }}>
        <div style={{ width: "210mm", minHeight: "297mm", background: "#fff", margin: "0 auto", padding: "5mm", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", boxSizing: "border-box" }}>

          {/* ── HEADER ── */}
          <table className="report-title-table" style={{ marginBottom: -1 }}>
            <tbody>
              <tr>
                <td rowSpan={2} style={{ width: "14%", textAlign: "center", verticalAlign: "middle", padding: 4 }}>
                  <div style={{ border: "2px solid #1a3c8f", borderRadius: 4, width: 56, height: 56, margin: "0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#1a3c8f", fontWeight: "bold", textAlign: "center" }}>NIIT<br />LOGO</div>
                </td>
                <td style={{ textAlign: "center", verticalAlign: "middle", padding: "2px 6px" }}>
                  <div className="company-name">National Industrial Inspection &amp; Training</div>
                  <div className="company-sub">
                    THIRD PARTY INSPECTION | NDT SERVICES &amp; TRAINING | NDT CONSULTANCY | PHYSICAL CALIBRATION |<br />
                    FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT | QUALITY MANAGEMENT SYSTEM TRAINING
                  </div>
                  <div className="company-iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
                </td>
                <td rowSpan={2} style={{ width: "20%", verticalAlign: "middle", fontSize: "7.5pt", lineHeight: 1.6 }}>
                  <div><strong>Format No:</strong> FMT-NDT-UTG-01</div>
                  <div><strong>Rev. No:</strong> 00</div>
                  <div><strong>Page No:</strong> 1/1</div>
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: "center", padding: "3px 6px" }}>
                  <div className="report-title">Ultrasonic Thickness Gauging Report</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── JOB DETAILS ── */}
          <table className="report-table mt-n1">
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "32%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "32%" }} />
            </colgroup>
            <tbody>
              <tr><td colSpan={4} className="section-hdr">JOB DETAILS</td></tr>
              <tr>
                <td className="lbl">Customer</td>
                <td className="val">{v(jd.customer)}</td>
                <td className="lbl">Report No.</td>
                <td className="val">{v(report.reportNo)}</td>
              </tr>
              <tr>
                <td className="lbl">Client</td>
                <td className="val">{v(jd.client)}</td>
                <td className="lbl">Report Date</td>
                <td className="val">{fmtDate(jd.reportDate)}</td>
              </tr>
              <tr>
                <td className="lbl">Project</td>
                <td className="val">{v(jd.project)}</td>
                <td className="lbl">Inspection Date</td>
                <td className="val">{fmtDate(jd.inspectionDate)}</td>
              </tr>
              <tr>
                <td className="lbl">Reference Std.</td>
                <td className="val">{v(jd.referenceStd)}</td>
                <td className="lbl">Inspection Time</td>
                <td className="val">{v(jd.inspectionTime)}</td>
              </tr>
              <tr>
                <td className="lbl">Acceptance Criteria</td>
                <td className="val">{v(jd.acceptanceCriteria)}</td>
                <td className="lbl">Material</td>
                <td className="val">{v(jd.material)}</td>
              </tr>
              <tr>
                <td className="lbl">Stage of Inspection</td>
                <td className="val">{v(jd.stageOfInspection)}</td>
                <td className="lbl">Surface Condition</td>
                <td className="val">{v(jd.surfaceCondition)}</td>
              </tr>
              <tr>
                <td className="lbl">Extent of Examination</td>
                <td className="val">{v(jd.extentOfExamination)}</td>
                <td className="lbl">Surface Temperature</td>
                <td className="val">{v(jd.surfaceTemperature)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── EQUIPMENT DETAILS ── */}
          <table className="report-table mt-n1">
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "32%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "32%" }} />
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
                <td className="lbl">Couplant</td>
                <td className="val">{v(eq.couplant)}</td>
                <td className="lbl">Basic Calibration Block</td>
                <td className="val">{v(eq.basicCalibrationBlock)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── SEARCH UNIT DETAILS ── */}
          <table className="report-table mt-n1">
            <tbody>
              <tr><td colSpan={6} className="section-hdr">SEARCH UNIT DETAILS</td></tr>
              <tr>
                <td className="col-hdr" style={{ width: "22%" }}>Search Unit / Model</td>
                <td className="col-hdr" style={{ width: "12%" }}>Angle</td>
                <td className="col-hdr" style={{ width: "18%" }}>Sr. No.</td>
                <td className="col-hdr" style={{ width: "18%" }}>Crystal Size</td>
                <td className="col-hdr" style={{ width: "15%" }}>Wave Mode</td>
                <td className="col-hdr" style={{ width: "15%" }}>Frequency</td>
              </tr>
              {sud.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "4px", color: "#999", fontSize: "7.5pt" }}>No search units recorded.</td>
                </tr>
              ) : (
                sud.map((u: any, i: number) => (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>{v(u.searchUnit || u.model)}</td>
                    <td style={{ textAlign: "center" }}>{v(u.angle)}</td>
                    <td style={{ textAlign: "center" }}>{v(u.srNo)}</td>
                    <td style={{ textAlign: "center" }}>{v(u.crystalSize)}</td>
                    <td style={{ textAlign: "center" }}>{v(u.waveMode)}</td>
                    <td style={{ textAlign: "center" }}>{v(u.frequency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ── TECHNIQUE DETAILS ── */}
          <table className="report-table mt-n1">
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "78%" }} />
            </colgroup>
            <tbody>
              <tr><td colSpan={2} className="section-hdr">TECHNIQUE DETAILS</td></tr>
              <tr>
                <td className="lbl">UT Method</td>
                <td className="val">{v(td.utMethod)}</td>
              </tr>
            </tbody>
          </table>

          {techList.length > 0 && (
            <table className="report-table mt-n1">
              <tbody>
                <tr>
                  <td className="col-hdr" style={{ width: "22%" }}>Search Unit</td>
                  <td className="col-hdr" style={{ width: "12%" }}>Angle</td>
                  <td className="col-hdr" style={{ width: "18%" }}>Sr. No.</td>
                  <td className="col-hdr" style={{ width: "18%" }}>Crystal Size</td>
                  <td className="col-hdr" style={{ width: "15%" }}>Wave Mode</td>
                  <td className="col-hdr" style={{ width: "15%" }}>Frequency</td>
                </tr>
                {techList.map((t: any, i: number) => (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>{v(t.searchUnit)}</td>
                    <td style={{ textAlign: "center" }}>{v(t.angle)}</td>
                    <td style={{ textAlign: "center" }}>{v(t.srNo)}</td>
                    <td style={{ textAlign: "center" }}>{v(t.crystalSize)}</td>
                    <td style={{ textAlign: "center" }}>{v(t.waveMode)}</td>
                    <td style={{ textAlign: "center" }}>{v(t.frequency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── OBSERVATIONS ── */}
          <table className="obs-table mt-n1">
            <tbody>
              <tr><td colSpan={4} className="section-hdr">OBSERVATIONS</td></tr>
              <tr>
                <td className="col-hdr" style={{ width: "8%" }}>Sr. No.</td>
                <td className="col-hdr" style={{ width: "46%" }}>Item Name</td>
                <td className="col-hdr" style={{ width: "24%" }}>Measured Thickness (mm)</td>
                <td className="col-hdr" style={{ width: "22%" }}>Remark</td>
              </tr>
              {obs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "6px", fontSize: "7.5pt", color: "#999" }}>No observations recorded.</td>
                </tr>
              ) : (
                obs.map((o: any, i: number) => (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>{v(o.srNo)}</td>
                    <td>{v(o.itemName)}</td>
                    <td style={{ textAlign: "center" }}>{v(o.measuredThickness)}</td>
                    <td>{v(o.remark)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ── EXAMINED BY ── */}
          <table className="sign-table mt-n1">
            <colgroup>
              <col style={{ width: "33.3%" }} />
              <col style={{ width: "33.3%" }} />
              <col style={{ width: "33.4%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, fontSize: "7pt" }}>EXAMINED BY</td>
                <td style={{ fontWeight: 600, fontSize: "7pt" }}>CUSTOMER: <span>{v(fs.customer?.name)}</span></td>
                <td style={{ fontWeight: 600, fontSize: "7pt" }}>CLIENT / TPI: <span>{v(fs.clientOrTPI?.name)}</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, fontSize: "7.5pt" }}>National Industrial Inspection And Training</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Name: {v(inspector.name)}</td>
                <td>Name: {v(fs.customer?.name)}</td>
                <td>Name: {v(fs.clientOrTPI?.name)}</td>
              </tr>
              <tr>
                <td>{v(inspector.qualification)}{inspector.designation ? ` / ${inspector.designation}` : ""}</td>
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






