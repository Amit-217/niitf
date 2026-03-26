import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { getVSSCUTReportById, VSSCUTReport } from "../../../api/customerApi";

// ─── Print Styles ─────────────────────────────────────────────────────────────
const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 6mm 8mm; }
  #root { padding: 0 !important; max-width: none !important; }
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
    background: #2d3748; color: #fff; font-weight: bold;
    font-size: 7.5pt; text-align: center; letter-spacing: 1px; padding: 2px 4px;
  }
  .col-hdr { background: #edf2f7; font-weight: bold; font-size: 7pt; text-align: center; }
  .val { font-size: 7.5pt; }
  .report-title-table { width: 100%; border-collapse: collapse; }
  .report-title-table td { border: 1px solid #444; padding: 2px 6px; }
  .company-name { font-size: 9.5pt; font-weight: bold; text-transform: uppercase; text-align: center; color: #1a3c8f; }
  .company-sub { font-size: 6.5pt; text-align: center; color: #333; line-height: 1.5; }
  .company-iso { font-size: 6.5pt; text-align: center; font-weight: bold; color: #333; }
  .report-title { font-size: 10pt; font-weight: bold; text-align: center; letter-spacing: 1px; text-transform: uppercase; text-decoration: underline; margin: 4px 0; }
  .calib-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .calib-table td, .calib-table th { border: 1px solid #444; padding: 2px 3px; font-size: 7pt; text-align: center; vertical-align: middle; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const v = (s?: string) => s || "";
const fmtDate = (d?: string) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

const PROBE_MODES = ["45L", "45T", "60L", "60T", "70L", "70T"];
const SKIPS = [
  { key: "half", label: "½" },
  { key: "one", label: "1" },
  { key: "oneHalf", label: "1½" },
  { key: "two", label: "2" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const VSSCUTReportPrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locState = location.state as { customerId?: string; reportSubType?: string } | null;
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("autoprint") === "true";

  const [report, setReport] = useState<VSSCUTReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getVSSCUTReportById(id)
      .then((res) => setReport(res.data?.data ?? res.data))
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

  const goBack = () => {
    if (locState?.customerId) {
      navigate(`/admin/customers/${locState.customerId}`, {
        state: { activeTab: "reports", reportSubType: locState.reportSubType ?? "vssc-ut" },
      });
    } else {
      navigate(-1);
    }
  };

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apc = (report as any).angleProbeCalibration ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const npc = (report as any).normalProbeCalibration ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ts = (report as any).testSetup ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fs = (report as any).finalSection ?? {};
  const inspector = fs.inspector?.[0] ?? {};
  const ct = apc.calibTable ?? {};

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* Back button */}
      <div className="no-print" style={{ padding: "12px 16px", background: "#1e293b", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={goBack} style={{ padding: "6px 14px", background: "#334155", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
          ← Back
        </button>
        <button onClick={() => window.print()} style={{ padding: "6px 14px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
          Print / Save PDF
        </button>
      </div>

      {/* Report Content */}
      <div id="report-root" style={{ background: "#f1f5f9", minHeight: "100vh", padding: "24px 16px" }}>
        <div style={{ width: "210mm", minHeight: "297mm", background: "#fff", margin: "0 auto", padding: "5mm", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>

          {/* Company Header */}
          <table className="report-title-table" style={{ marginBottom: 4 }}>
            <tbody>
              <tr>
                <td style={{ width: "15%", textAlign: "center", verticalAlign: "middle" }}>
                  <div style={{ width: 60, height: 60, border: "1px solid #999", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "8pt", color: "#555" }}>LOGO</div>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div className="company-name">National Industrial Inspection &amp; Training</div>
                  <div className="company-sub">
                    THIRD PARTY INSPECTION | NDT SERVICES &amp; TRAINING | NDT CONSULTANCY | PHYSICAL CALIBRATION |<br />
                    FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT | QUALITY MANAGEMENT SYSTEM TRAINING
                  </div>
                  <div className="company-iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
                </td>
                <td style={{ width: "22%", verticalAlign: "top", fontSize: "7pt", paddingLeft: 4 }}>
                  <div>Format No: FMT-NDT-VSSC-UT-01</div>
                  <div>Rev. No: 00</div>
                  <div>Page No: <span className="val">{v(report.pageNo) || "1/1"}</span></div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="report-title">Ultrasonic Testing Report</div>

          {/* Report No + Date row */}
          <table className="report-table" style={{ marginBottom: 3 }}>
            <tbody>
              <tr>
                <td className="lbl" style={{ width: "15%" }}>Report No.</td>
                <td className="val" style={{ width: "35%" }}>{v(report.reportNo)}</td>
                <td className="lbl" style={{ width: "20%" }}>Report Date</td>
                <td className="val">{fmtDate(report.reportDate)}</td>
              </tr>
            </tbody>
          </table>

          {/* Job Details */}
          <table className="report-table" style={{ marginBottom: 3 }}>
            <tbody>
              <tr><td className="section-hdr" colSpan={4}>JOB DETAILS</td></tr>
              <tr>
                <td className="lbl">Job Description</td>
                <td className="val" colSpan={3}>{v(report.jobDescription)}</td>
              </tr>
              <tr>
                <td className="lbl">Weld Joint No.</td>
                <td className="val">{v(report.weldJointNo)}</td>
                <td className="lbl">Thickness of Job</td>
                <td className="val">{v(report.thicknessOfJob)}</td>
              </tr>
              <tr>
                <td className="lbl">Surface Condition</td>
                <td className="val">{v(report.surfaceCondition)}</td>
                <td className="lbl">Customer</td>
                <td className="val">{v(report.customer)}</td>
              </tr>
              <tr>
                <td className="lbl">Period of Inspection</td>
                <td className="val">{v(report.periodOfInspection)}</td>
                <td className="lbl">Material</td>
                <td className="val">{v(report.material)}</td>
              </tr>
              <tr>
                <td className="lbl">Scanning Technique</td>
                <td className="val">{v(report.scanningTechnique)}</td>
                <td className="lbl">Stage of Inspection</td>
                <td className="val">{v(report.stageOfInspection)}</td>
              </tr>
              <tr>
                <td className="lbl">Equipment Used</td>
                <td className="val">{v(report.equipmentUsed)}</td>
                <td className="lbl">Couplant</td>
                <td className="val">{v(report.couplant)}</td>
              </tr>
              <tr>
                <td className="lbl">Area Scanned</td>
                <td className="val" colSpan={3}>{v(report.areaScanned)}</td>
              </tr>
              <tr>
                <td className="lbl">Acceptance Standard</td>
                <td className="val">{v(report.acceptanceStandard)}</td>
                <td className="lbl">Reference Datum</td>
                <td className="val">{v(report.referenceDatum)}</td>
              </tr>
            </tbody>
          </table>

          {/* Test Setup */}
          <table className="report-table" style={{ marginBottom: 3 }}>
            <tbody>
              <tr><td className="section-hdr" colSpan={4}>TEST SETUP</td></tr>
              <tr>
                <td className="lbl">For Angle — Range</td>
                <td className="val">{v(ts.angleRange)}</td>
                <td className="lbl">For Normal — Range</td>
                <td className="val">{v(ts.normalRange)}</td>
              </tr>
              <tr>
                <td className="lbl">Std Cal Block (Angle)</td>
                <td className="val">{v(ts.standardCalBlock?.angle)}</td>
                <td className="lbl">Std Cal Block (Normal)</td>
                <td className="val">{v(ts.standardCalBlock?.normal)}</td>
              </tr>
              <tr>
                <td className="lbl">Idtn. Ref Block (Angle)</td>
                <td className="val">{v(ts.identificationNoOfRefBlock?.angle)}</td>
                <td className="lbl">Idtn. Ref Block (Normal)</td>
                <td className="val">{v(ts.identificationNoOfRefBlock?.normal)}</td>
              </tr>
            </tbody>
          </table>

          {/* Angle Probe Calibration */}
          <table className="report-table" style={{ marginBottom: 2 }}>
            <tbody>
              <tr><td className="section-hdr" colSpan={4}>ANGLE PROBE CALIBRATION</td></tr>
              <tr>
                <td className="lbl">Frequency</td>
                <td className="val">{v(apc.frequency)}</td>
                <td className="lbl">Size</td>
                <td className="val">{v(apc.size)}</td>
              </tr>
              <tr>
                <td className="lbl">Type</td>
                <td className="val">{v(apc.type)}</td>
                <td className="lbl">Sr. Nos. of Probes</td>
                <td className="val">
                  {apc.probe45SerialNo ? `45 – ${apc.probe45SerialNo}` : ""}
                  {apc.probe60SerialNo ? `  60 – ${apc.probe60SerialNo}` : ""}
                  {apc.probe70SerialNo ? `  70 – ${apc.probe70SerialNo}` : ""}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Calibration Table */}
          <table className="calib-table" style={{ marginBottom: 3 }}>
            <thead>
              <tr style={{ background: "#2d3748", color: "#fff" }}>
                <th style={{ width: "6%" }}>Skip</th>
                {PROBE_MODES.map(pm => (
                  <th key={pm} colSpan={3} style={{ fontSize: "7pt" }}>{pm}</th>
                ))}
              </tr>
              <tr style={{ background: "#edf2f7" }}>
                <th></th>
                {PROBE_MODES.map(pm => (
                  <>
                    <th key={pm + "bp"} style={{ fontSize: "6.5pt" }}>BP</th>
                    <th key={pm + "mm"} style={{ fontSize: "6.5pt" }}>mm</th>
                    <th key={pm + "fsh"} style={{ fontSize: "6.5pt" }}>%FSH</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {SKIPS.map(({ key, label }) => (
                <tr key={key}>
                  <td style={{ background: "#f7fafc", fontWeight: 600, textAlign: "center" }}>{label}</td>
                  {PROBE_MODES.map(pm => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const cell = (ct[pm] as any)?.[key] ?? {};
                    return (
                      <>
                        <td key={pm + "bp"}>{v(cell.bp)}</td>
                        <td key={pm + "mm"}>{v(cell.mm)}</td>
                        <td key={pm + "fsh"}>{v(cell.fsh)}</td>
                      </>
                    );
                  })}
                </tr>
              ))}
              <tr style={{ background: "#fffbeb" }}>
                <td style={{ fontWeight: 700, textAlign: "center", fontSize: "7pt" }}>DAC dB</td>
                {PROBE_MODES.map(pm => (
                  <td key={pm} colSpan={3} style={{ fontWeight: 500 }}>
                    {v((ct[pm] as any)?.dacDb)}
                  </td>
                ))}
              </tr>
              <tr style={{ background: "#fffbeb" }}>
                <td style={{ fontWeight: 700, textAlign: "center", fontSize: "7pt" }}>Scan dB</td>
                {PROBE_MODES.map(pm => (
                  <td key={pm} colSpan={3} style={{ fontWeight: 500 }}>
                    {v((ct[pm] as any)?.scanningDb)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Normal Probe Calibration */}
          <table className="report-table" style={{ marginBottom: 3 }}>
            <tbody>
              <tr><td className="section-hdr" colSpan={4}>NORMAL PROBE CALIBRATION</td></tr>
              <tr>
                <td className="lbl">Probe S. No / Type</td>
                <td className="val">{v(npc.probeType)}</td>
                <td className="lbl">Frequency</td>
                <td className="val">{v(npc.frequency)}</td>
              </tr>
              <tr>
                <td className="lbl">Size</td>
                <td className="val">{v(npc.size)}</td>
                <td className="lbl">Skip</td>
                <td className="val">{v(npc.skip)}</td>
              </tr>
              <tr>
                <td className="lbl">BP – %FSH</td>
                <td className="val">{v(npc.bp)}</td>
                <td className="lbl">DAC dB</td>
                <td className="val">{v(npc.dacDb)}</td>
              </tr>
              <tr>
                <td className="lbl">Scanning dB</td>
                <td className="val">{v(npc.scanningDb)}</td>
                <td></td><td></td>
              </tr>
            </tbody>
          </table>

          {/* Disposition & Remarks */}
          <table className="report-table" style={{ marginBottom: 3 }}>
            <tbody>
              <tr>
                <td className="lbl" style={{ width: "20%" }}>Disposition</td>
                <td style={{ fontWeight: 700, color: report.disposition === "ACCEPTED" ? "#276749" : "#000" }}>
                  {v(report.disposition)}
                </td>
              </tr>
              {report.remarks && (
                <tr>
                  <td className="lbl">Remarks</td>
                  <td className="val">{v(report.remarks)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Signature Section */}
          <table className="report-table">
            <tbody>
              <tr>
                <td style={{ width: "33%", textAlign: "center", fontWeight: 700, fontSize: "7pt", background: "#edf2f7", padding: "3px 4px" }}>
                  National Ind. Insp. &amp; Training
                </td>
                <td style={{ width: "33%", textAlign: "center", fontWeight: 700, fontSize: "7pt", background: "#edf2f7", padding: "3px 4px" }}>
                  QC / WIL
                </td>
                <td style={{ width: "34%", textAlign: "center", fontWeight: 700, fontSize: "7pt", background: "#edf2f7", padding: "3px 4px" }}>
                  RQS / VSSC
                </td>
              </tr>
              <tr style={{ height: 30 }}>
                <td style={{ verticalAlign: "bottom", paddingBottom: 2, fontSize: "7pt" }}>Signature:</td>
                <td style={{ verticalAlign: "bottom", paddingBottom: 2, fontSize: "7pt" }}>Signature:</td>
                <td style={{ verticalAlign: "bottom", paddingBottom: 2, fontSize: "7pt" }}>Signature:</td>
              </tr>
              <tr>
                <td style={{ fontSize: "7pt" }}>Name: <span>{v(inspector.name)}</span></td>
                <td style={{ fontSize: "7pt" }}>Name: <span>{v(fs.qc?.name)}</span></td>
                <td style={{ fontSize: "7pt" }}>Name: <span>{v(fs.rqs?.name)}</span></td>
              </tr>
              {inspector.qualification && (
                <tr>
                  <td style={{ fontSize: "7pt" }}>{v(inspector.qualification)}</td>
                  <td></td><td></td>
                </tr>
              )}
              <tr>
                <td style={{ fontSize: "7pt" }}>Date: <span>{fmtDate(inspector.date)}</span></td>
                <td style={{ fontSize: "7pt" }}>Date: <span>{fmtDate(fs.qc?.date)}</span></td>
                <td style={{ fontSize: "7pt" }}>Date: <span>{fmtDate(fs.rqs?.date)}</span></td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </>
  );
};
