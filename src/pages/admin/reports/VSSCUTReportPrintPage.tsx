import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getVSSCUTReportById, getPublicVSSCUTReportById, VSSCUTReport } from "../../../api/customerApi";

// ─── Print Styles ─────────────────────────────────────────────────────────────
const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }
  @media screen { body.autoprint-mode { opacity: 0; } }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #report-root { background: #fff !important; padding: 0 !important; }
    #report-root > div { width: 210mm !important; min-height: 297mm !important; height: 297mm !important; margin: 0 auto !important; padding: 3mm !important; box-sizing: border-box !important; box-shadow: none !important; overflow: hidden !important; }
    .report { margin: 0 !important; box-shadow: none !important; width: calc(100% / 0.92) !important; transform: scale(0.92); transform-origin: top left; }
    .rpt-header { padding: 8px 10px !important; }
    .rpt-title { padding: 5px !important; font-size: 11px !important; }
    .section-hdr { padding: 4px 7px !important; font-size: 8.5px !important; }
    .footer { padding: 4px 8px !important; font-size: 7px !important; line-height: 1.25 !important; }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  .report { background: #fff; border: 1px solid #444; border-radius: 6px; overflow: hidden; }
  .rpt-header { background: #185FA5; padding: 10px 12px; display: flex; align-items: center; gap: 12px; }
  .logo-box { width: 90px; height: 90px; background: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 3px; }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #fff; }
  .hdr-center .org { font-size: 14px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 8px; color: #d7e8fb; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 8px; color: #eef6ff; font-weight: 700; margin-top: 2px; }
  .footer-meta { background: #185FA5; color: #d7e8fb; font-size: 8px; text-align: center; padding: 3px 8px; }
  .footer-meta span { color: #fff; font-weight: 700; }
  /* B&W mode */
  .bw .rpt-header { background: #fff !important; border-bottom: 2px solid #111 !important; }
  .bw .hdr-center { color: #111 !important; }
  .bw .hdr-center .org { color: #111 !important; }
  .bw .hdr-center .sub { color: #444 !important; }
  .bw .hdr-center .iso { color: #111 !important; }
  .bw .logo-box { background: #f0f0f0 !important; border: 1px solid #aaa !important; }
  .bw .section-hdr { background: #c8c8c8 !important; color: #000 !important; border-left: 3px solid #000 !important; }
  .bw .col-hdr { background: #e0e0e0 !important; color: #000 !important; }
  .bw .rpt-title { background: #e0e0e0 !important; color: #000 !important; border-bottom: 2px solid #555 !important; }
  .bw .footer-meta { background: #d0d0d0 !important; color: #000 !important; }
  .bw .footer-meta span { color: #000 !important; }
  .bw .std-tag { background: #e0e0e0 !important; color: #000 !important; border: 1px solid #999 !important; }
  .bw .accept-badge { background: #e8e8e8 !important; color: #000 !important; border: 1px solid #888 !important; }
  .bw .reject-badge { background: #d8d8d8 !important; color: #000 !important; border: 1px solid #444 !important; border-left: 3px solid #000 !important; }
  .bw .neutral-badge { background: #f0f0f0 !important; color: #000 !important; border: 1px solid #999 !important; }
  .bw .report-table td, .bw .report-table th { border-color: #999 !important; }
  .bw .obs-table td, .bw .obs-table th { border-color: #999 !important; }
  .bw .obs-table th { background: #d8d8d8 !important; color: #000 !important; }
  .bw .sign-table td { border-color: #999 !important; }
  .bw .lbl { background: #ebebeb !important; }
  .bw .footer { background: #ebebeb !important; color: #333 !important; border-color: #999 !important; }
  .rpt-title { background: #E6F1FB; text-align: center; padding: 7px; font-size: 13px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #b8cfe7; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 10px; font-weight: 700; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .report-table td, .report-table th { border: 1px solid #d9e1ea; padding: 4px 6px; vertical-align: middle; word-break: break-word; font-size: 10px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 9px; text-align: center; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 9px; white-space: nowrap; }
  .val { font-size: 10px; }
  .mt-n1 { margin-top: -1px; }
  .calib-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .calib-table td, .calib-table th { border: 1px solid #d9e1ea; padding: 3px; font-size: 9px; text-align: center; vertical-align: middle; }
  .calib-table th { background: #E6F1FB; color: #0C447C; font-weight: 700; }
  .footer { background: #f8fafc; padding: 6px 10px; font-size: 8px; color: #4b5563; border-top: 1px solid #d9e1ea; line-height: 1.4; display: flex; align-items: center; gap: 8px; }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
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
  const locState = location.state as {
    customerId?: string;
    reportSubType?: string;
  } | null;
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("autoprint") === "true";

  const [report, setReport] = useState<VSSCUTReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [bwMode, setBwMode] = useState(false);

  const isPublic = location.pathname.startsWith("/reports/public/");

  useEffect(() => {
    if (!id) return;
    const fetcher = isPublic ? getPublicVSSCUTReportById : getVSSCUTReportById;
    fetcher(id)
      .then((res) => setReport(res.data?.data ?? res.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [id, isPublic]);

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
        state: {
          activeTab: "reports",
          reportSubType: locState.reportSubType ?? "vssc-ut",
        },
      });
    } else {
      navigate(-1);
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "Arial",
        }}
      >
        Loading...
      </div>
    );

  if (!report)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "Arial",
          gap: 12,
        }}
      >
        <p>Report not found.</p>
        <button
          onClick={goBack}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Go Back
        </button>
      </div>
    );

  const qrUrl = `${window.location.origin}/reports/public/vssc-ut/${id}`;

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

      <div className="no-print" style={{ position: 'fixed', top: 12, right: 16, zIndex: 100, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setBwMode(b => !b)}
          style={{ padding: '7px 16px', background: bwMode ? '#374151' : '#185FA5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          {bwMode ? 'Color Mode' : 'B&W Mode'}
        </button>
        <button
          onClick={() => window.print()}
          style={{ padding: '7px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          Print
        </button>
      </div>

      {/* Report Content */}
      <div
        id="report-root"
        style={{ background: "#e9eef5", minHeight: "100vh", padding: "16px" }}
      >
        <div
          style={{
            width: "210mm",
            minHeight: "297mm",
            margin: "0 auto",
            padding: "5mm",
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            boxSizing: "border-box",
          }}
        >
          <div className={`report${bwMode ? ' bw' : ''}`}>
            <div className="rpt-header">
              <div className="logo-box">
                <img src="/logo.png" alt="NIIT Logo" />
              </div>
              <div className="hdr-center">
                <div className="org">
                  National Industrial Inspection &amp; Training
                </div>
                <div className="sub">
                  THIRD PARTY INSPECTION | NDT SERVICES &amp; TRAINING | NDT
                  CONSULTANCY | PHYSICAL CALIBRATION | FACTORY INSPECTION UNDER
                  MAHARASHTRA FACTORY ACT | QUALITY MANAGEMENT SYSTEM TRAINING
                </div>
                <div className="iso">
                  (AN ISO 9001:2015 CERTIFIED ORGANIZATION)
                </div>
              </div>
            </div>
            <div className="rpt-title">Ultrasonic Testing Report</div>

            {/* Report No + Date row */}
            <table className="report-table mt-n1" style={{ marginBottom: 3 }}>
              <tbody>
                <tr>
                  <td className="lbl" style={{ width: "15%" }}>
                    Report No.
                  </td>
                  <td className="val" style={{ width: "35%" }}>
                    {v(report.reportNo)}
                  </td>
                  <td className="lbl" style={{ width: "20%" }}>
                    Report Date
                  </td>
                  <td className="val">{fmtDate(report.reportDate)}</td>
                </tr>
              </tbody>
            </table>

            {/* Job Details */}
            <table className="report-table" style={{ marginBottom: 3 }}>
              <tbody>
                <tr>
                  <td className="section-hdr" colSpan={4}>
                    JOB DETAILS
                  </td>
                </tr>
                <tr>
                  <td className="lbl">Job Description</td>
                  <td className="val" colSpan={3}>
                    {v(report.jobDescription)}
                  </td>
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
                  <td className="val" colSpan={3}>
                    {v(report.areaScanned)}
                  </td>
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
                <tr>
                  <td className="section-hdr" colSpan={4}>
                    TEST SETUP
                  </td>
                </tr>
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
                  <td className="val">
                    {v(ts.identificationNoOfRefBlock?.angle)}
                  </td>
                  <td className="lbl">Idtn. Ref Block (Normal)</td>
                  <td className="val">
                    {v(ts.identificationNoOfRefBlock?.normal)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Angle Probe Calibration */}
            <table className="report-table" style={{ marginBottom: 2 }}>
              <tbody>
                <tr>
                  <td className="section-hdr" colSpan={4}>
                    ANGLE PROBE CALIBRATION
                  </td>
                </tr>
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
                <tr style={{ background: "#185FA5", color: "#fff" }}>
                  <th style={{ width: "6%" }}>Skip</th>
                  {PROBE_MODES.map((pm) => (
                    <th key={pm} colSpan={3} style={{ fontSize: "7pt" }}>
                      {pm}
                    </th>
                  ))}
                </tr>
                <tr style={{ background: "#E6F1FB" }}>
                  <th></th>
                  {PROBE_MODES.map((pm) => (
                    <>
                      <th key={pm + "bp"} style={{ fontSize: "6.5pt" }}>
                        BP
                      </th>
                      <th key={pm + "mm"} style={{ fontSize: "6.5pt" }}>
                        mm
                      </th>
                      <th key={pm + "fsh"} style={{ fontSize: "6.5pt" }}>
                        %FSH
                      </th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SKIPS.map(({ key, label }) => (
                  <tr key={key}>
                    <td
                      style={{
                        background: "#f7fafc",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {label}
                    </td>
                    {PROBE_MODES.map((pm) => {
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
                  <td
                    style={{
                      fontWeight: 700,
                      textAlign: "center",
                      fontSize: "7pt",
                    }}
                  >
                    DAC dB
                  </td>
                  {PROBE_MODES.map((pm) => (
                    <td key={pm} colSpan={3} style={{ fontWeight: 500 }}>
                      {v((ct[pm] as any)?.dacDb)}
                    </td>
                  ))}
                </tr>
                <tr style={{ background: "#fffbeb" }}>
                  <td
                    style={{
                      fontWeight: 700,
                      textAlign: "center",
                      fontSize: "7pt",
                    }}
                  >
                    Scan dB
                  </td>
                  {PROBE_MODES.map((pm) => (
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
                <tr>
                  <td className="section-hdr" colSpan={4}>
                    NORMAL PROBE CALIBRATION
                  </td>
                </tr>
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
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {/* Disposition & Remarks */}
            <table className="report-table" style={{ marginBottom: 3 }}>
              <tbody>
                <tr>
                  <td className="lbl" style={{ width: "20%" }}>
                    Disposition
                  </td>
                  <td
                    style={{
                      fontWeight: 700,
                      color:
                        report.disposition === "ACCEPTED"
                          ? "#276749"
                          : "#c53030",
                    }}
                  >
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
                  <td
                    style={{
                      width: "33%",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "7pt",
                      background: "#E6F1FB",
                      padding: "3px 4px",
                    }}
                  >
                    National Ind. Insp. &amp; Training
                  </td>
                  <td
                    style={{
                      width: "33%",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "7pt",
                      background: "#E6F1FB",
                      padding: "3px 4px",
                    }}
                  >
                    QC / WIL
                  </td>
                  <td
                    style={{
                      width: "34%",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "7pt",
                      background: "#E6F1FB",
                      padding: "3px 4px",
                    }}
                  >
                    RQS / VSSC
                  </td>
                </tr>
                <tr style={{ height: 30 }}>
                  <td
                    style={{
                      verticalAlign: "bottom",
                      paddingBottom: 2,
                      fontSize: "7pt",
                    }}
                  >
                    Signature:
                  </td>
                  <td
                    style={{
                      verticalAlign: "bottom",
                      paddingBottom: 2,
                      fontSize: "7pt",
                    }}
                  >
                    Signature:
                  </td>
                  <td
                    style={{
                      verticalAlign: "bottom",
                      paddingBottom: 2,
                      fontSize: "7pt",
                    }}
                  >
                    Signature:
                  </td>
                </tr>
                <tr>
                  <td style={{ fontSize: "7pt" }}>Name: {v(inspector.name)}</td>
                  <td style={{ fontSize: "7pt" }}>Name: {v(fs.qc?.name)}</td>
                  <td style={{ fontSize: "7pt" }}>Name: {v(fs.rqs?.name)}</td>
                </tr>
                {inspector.qualification && (
                  <tr>
                    <td style={{ fontSize: "7pt" }}>
                      {v(inspector.qualification)}
                    </td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
                <tr>
                  <td style={{ fontSize: "7pt" }}>
                    Date: {fmtDate(inspector.date)}
                  </td>
                  <td style={{ fontSize: "7pt" }}>
                    Date: {fmtDate(fs.qc?.date)}
                  </td>
                  <td style={{ fontSize: "7pt" }}>
                    Date: {fmtDate(fs.rqs?.date)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="footer">
              <div className="footer-text-block">
                Corp Office: 1st Floor, Plot No.PAP 3/28, Behind BSNL Office,
                MIDC, Baramati, Dist-Pune 413133 | Ph: +91 9608168056, +91
                7875154431
                <br />
                Reg. Office: A/p - Kuthare, Tal - Patan, Dist-Satara 415112 |
                Website: www.niitindt.com | Email: niit04@gmail.com |
                info@niitindt.com
              </div>
              <div className="qr-wrap">
                <QRCodeSVG value={qrUrl} size={48} />
              </div>
            </div>
            <div className="footer-meta">
              Format No: <span>FMT-NDT-VSSC-UT-01</span>
              &nbsp;|&nbsp; Rev. No: <span>00</span>
              &nbsp;|&nbsp; Report Date: <span>{fmtDate(report.reportDate)}</span>
              &nbsp;|&nbsp; Page: <span>{v(report.pageNo) || "1 of 1"}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
