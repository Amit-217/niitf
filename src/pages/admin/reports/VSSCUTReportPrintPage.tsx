import React, { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  getVSSCUTReportById,
  getPublicVSSCUTReportById,
  VSSCUTReport,
} from "../../../api/customerApi";

// ─── Print Styles ─────────────────────────────────────────────────────────────
const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }
  @media screen { body.autoprint-mode { opacity: 0; } }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; min-height: 297mm !important; }
    #report-root { background: #fff !important; padding: 0 !important; display: block !important; }
    #report-root > div {
      width: 210mm !important; 
      margin: 0 !important; padding: 2mm 5mm 15mm 5mm !important;
      box-sizing: border-box !important; position: relative !important;
      page-break-after: auto !important;
      box-shadow: none !important;
    }
    .report {
      margin: 0 !important; box-shadow: none !important;
      width: 100% !important;
    }
    .screen-sign-table { display: none !important; }
    .print-fixed-footer {
      position: fixed !important;
      bottom: 5mm !important;
      left: 5mm !important;
      right: 5mm !important;
      background: #fff !important;
    }
    .report { overflow: visible !important; }
    .report-body { overflow: visible !important; }
    tfoot { display: table-footer-group !important; }
    .report-footer-wrap {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  .report { background: #fff; border: none; border-radius: 4px; overflow: hidden; }
  .rpt-header { padding: 6px 8px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
  .logo-box { width: 130px; height: 130px; background: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 2px; transform: translateY(-12px); }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #0C447C; }
  .hdr-center .org { font-size: 22px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 10px; color: #374151; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 10px; color: #0C447C; font-weight: 700; margin-top: 2px; }
  .footer-meta { background: #185FA5; color: #d7e8fb; font-size: 9px; text-align: center; padding: 3px 8px; }
  .footer-meta span { color: #fff; font-weight: 700; }
  /* B&W mode */
  .bw .rpt-header { background: #fff !important; border-bottom: 1px solid #444 !important; }
  .bw .hdr-center { color: #000 !important; }
  .bw .hdr-center .org { color: #000 !important; }
  .bw .hdr-center .sub { color: #333 !important; }
  .bw .hdr-center .iso { color: #000 !important; }
  .bw .logo-box { background: #fff !important; }
  .bw .section-hdr { background: #fff !important; color: #000 !important; }
  .bw .col-hdr { background: #fff !important; color: #000 !important; }
  .bw .calib-table th { background: #fff !important; color: #000 !important; }
  .bw .calib-table td:first-child { background: #fff !important; }
  .bw .rpt-title { background: #fff !important; color: #000 !important; }
  .bw .footer-meta { background: #fff !important; color: #000 !important; }
  .bw .footer-meta span { color: #000 !important; }
  .bw .std-tag { background: #fff !important; color: #000 !important; border: 1px solid #777 !important; }
  .bw .accept-badge { background: transparent !important; color: #000 !important; border: none !important; }
  .bw .reject-badge { background: transparent !important; color: #000 !important; border: none !important; }
  .bw .neutral-badge { background: transparent !important; color: #000 !important; border: none !important; }
  .bw .report-table td, .bw .report-table th { border-color: #888 !important; }
  .bw .obs-table td, .bw .obs-table th { border-color: #888 !important; }
  .bw .obs-table th { background: #fff !important; color: #000 !important; }
  .bw .sign-table td { border-color: #888 !important; }
  .bw .lbl { color: #000 !important; background: #fff !important; }
  .bw .footer { background: #fff !important; color: #000 !important; border-color: #000 !important; }
  .bw .report-body { color: #000 !important; border-color: #000 !important; }
  .rpt-title { background: #E6F1FB; text-align: center; padding: 7px; font-size: 15px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #b8cfe7; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 12px; font-weight: 700; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; text-align: left; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .report-table td, .report-table th { border: 1px solid #d9e1ea; padding: 2px 4px; vertical-align: middle; word-break: break-word; font-size: 11px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 11px; text-align: center; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 11px; white-space: nowrap; width: 22%; }
  .val { font-size: 11px; color: #000; }
  .mt-n1 { margin-top: -1px; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .report-body { border: 1px solid #444; border-radius: 4px; overflow: hidden; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .sign-table td { border: 1px solid #d9e1ea; padding: 2px 4px; font-size: 12px; vertical-align: top; }
  .calib-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .calib-table td, .calib-table th { border: 1px solid #d9e1ea; padding: 3px; font-size: 11px; text-align: center; vertical-align: middle; }
  .calib-table th { background: #E6F1FB; color: #0C447C; font-weight: 700; }
  .footer { background: #f8fafc; padding: 6px 10px; font-size: 10px; color: #4b5563; margin-top: 8px; border-top: 3px solid #185FA5; line-height: 1.4; display: flex; align-items: center; gap: 8px; }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

  @media screen {
    .print-blank-row { display: none; }
    .print-fixed-footer { display: none; }
    .print-sign-table { display: none; }
  }
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
  const conclusionText =
    v((report as unknown as { conclusion?: string }).conclusion) ||
    "Examination completed as per applicable standards. No rejectable indications observed in inspected items.";

  const ReportFooter = () => (
    <>
      <div className="footer">
        <div className="footer-text-block">
          Corp Office: 1st Floor, Plot No.PAP-3/28, Behind BSNL Office, MIDC,
          Baramati, Dist-Pune 413133 | Ph: +91 9860186056, +91 7875154431
          <br />
          Reg. Office: A/p - Kuthare, Tal - Patan, Dist-Satara 415112 | Website:
          www.niitindt.com | Email: niit04@gmail.com | info@niitindt.com
          <br />
          Powered by: Viplora Tech
        </div>
        <div className="qr-wrap">
          <QRCodeSVG value={qrUrl} size={48} />
        </div>
      </div>
      <div className="footer-meta">
        Format No: <span>FMT-NDT-VSSC-UT-01</span>
        &nbsp;|&nbsp; Rev. No: <span>00</span>
        &nbsp;|&nbsp; Report Date: <span>{fmtDate(report.reportDate)}</span>
      </div>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div
        className="no-print"
        style={{
          position: "fixed",
          top: 12,
          right: 16,
          zIndex: 100,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={() => setBwMode((b) => !b)}
          style={{
            padding: "7px 16px",
            background: bwMode ? "#374151" : "#185FA5",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {bwMode ? "Color Mode" : "B&W Mode"}
        </button>
        <button
          onClick={() => window.print()}
          style={{
            padding: "7px 16px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Print
        </button>
      </div>

      <div
        id="report-root"
        style={{ background: "#e9eef5", minHeight: "100vh", padding: "16px" }}
      >
        <div
          style={{
            position: "relative",
            width: "210mm",
            minHeight: "297mm",
            margin: "0 auto",
            padding: "5mm 5mm 35mm 5mm",
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            boxSizing: "border-box",
          }}
        >
          <div className={`report${bwMode ? " bw" : ""}`}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                borderSpacing: 0,
                margin: 0,
                padding: 0,
              }}
            >
              <thead style={{ display: "table-header-group" }}>
                <tr>
                  <td style={{ padding: "2mm 0 0 0" }}>
                    <div className="rpt-header">
                      <div className="logo-box">
                        <img src="/logo.png" alt="NIIT Logo" />
                      </div>
                      <div className="hdr-center">
                        <div className="org">
                          National Industrial Inspection and Training
                        </div>
                        <div className="sub">
                          THIRD PARTY INSPECTION | NDT SERVICES &amp; NDT
                          TRAINING | NDT CONSULTANCY
                          <br />
                          FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT
                        </div>
                        <div className="iso">
                          (AN ISO 9001:2015 CERTIFIED ORGANIZATION)
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>
              <tfoot style={{ display: "table-footer-group" }}>
                <tr>
                  <td style={{ padding: 0 }}>
                    <div className="report-footer-wrap">
                      <table className="sign-table mt-n1">
                        <colgroup>
                          <col style={{ width: "33.3%" }} />
                          <col style={{ width: "33.3%" }} />
                          <col style={{ width: "33.4%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 600, fontSize: "11px" }}>
                              EXAMINED BY
                            </td>
                            <td style={{ fontWeight: 600, fontSize: "11px" }}>
                              CUSTOMER:
                            </td>
                            <td style={{ fontWeight: 600, fontSize: "11px" }}>
                              CLIENT / TPI:
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600, fontSize: "11px" }}>
                              National Industrial Inspection And Training
                            </td>
                            <td style={{ fontWeight: 600, fontSize: "11px" }}>
                              {v(report.customer)}
                            </td>
                            <td style={{ fontWeight: 600, fontSize: "11px" }}>
                              -
                            </td>
                          </tr>
                          <tr>
                            <td>Name: {v(inspector.name) || "-"}</td>
                            <td>Name: {v(fs.qc?.name) || "-"}</td>
                            <td>Name: {v(fs.rqs?.name) || "-"}</td>
                          </tr>
                          <tr>
                            <td>
                              {v(inspector.qualification) || "UT NDE Level II"}
                              {inspector.designation
                                ? ` / ${inspector.designation}`
                                : ""}
                            </td>
                            <td>Designation: {v(fs.qc?.designation) || "-"}</td>
                            <td>Designation: {v(fs.rqs?.designation) || "-"}</td>
                          </tr>
                          <tr>
                            <td style={{ height: 28 }}>Signature:</td>
                            <td style={{ height: 28 }}>Signature:</td>
                            <td style={{ height: 28 }}>Signature:</td>
                          </tr>
                          <tr>
                            <td>I.D. No.: {v(inspector.idNo) || "-"}</td>
                            <td>I.D. No.: {v(fs.qc?.idNo) || "-"}</td>
                            <td>I.D. No.: {v(fs.rqs?.idNo) || "-"}</td>
                          </tr>
                          <tr>
                            <td>Date: {fmtDate(inspector.date) || "-"}</td>
                            <td>Date: {fmtDate(fs.qc?.date) || "-"}</td>
                            <td>Date: {fmtDate(fs.rqs?.date) || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div
                        className="tfoot-spacer"
                        style={{ height: "28mm" }}
                      ></div>
                    </div>
                  </td>
                </tr>
              </tfoot>
              <tbody style={{ display: "table-row-group" }}>
                <tr>
                  <td style={{ padding: 0, verticalAlign: "top" }}>
                    <div className="report-body">
                      <div className="rpt-title">Ultrasonic Testing Report</div>

                      {/* ── VSSC UT SPECIFIC HEADER ── */}
                      <table
                        className="report-table mt-n1"
                        style={{ marginBottom: 4 }}
                      >
                        <colgroup>
                          <col style={{ width: "28%" }} />
                          <col style={{ width: "36%" }} />
                          <col style={{ width: "36%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={3} style={{ padding: 0 }}>
                              <div style={{ display: "flex" }}>
                                <div
                                  style={{
                                    width: "50%",
                                    padding: "6px",
                                    fontWeight: 700,
                                    fontSize: "11px",
                                  }}
                                >
                                  Report No. {v(report.reportNo)}
                                </div>
                                <div
                                  style={{
                                    width: "50%",
                                    padding: "6px 12px",
                                    fontWeight: 700,
                                    fontSize: "11px",
                                    borderLeft: "1px solid #d9e1ea",
                                  }}
                                >
                                  Job Description: {v(report.jobDescription)}
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="val">
                              Report Date:{" "}
                              <strong>{fmtDate(report.reportDate)}</strong>
                            </td>
                            <td className="val">
                              Weld Joint No.:{" "}
                              <strong>{v(report.weldJointNo)}</strong>
                            </td>
                            <td className="val">
                              Thickness of Job:{" "}
                              <strong>{v(report.thicknessOfJob)}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td className="val">
                              Surface Condition:
                              <br />
                              <strong>{v(report.surfaceCondition)}</strong>
                            </td>
                            <td className="val">
                              Customer: <strong>{v(report.customer)}</strong>
                            </td>
                            <td className="val">
                              Period of Inspection:
                              <br />
                              <strong>{v(report.periodOfInspection)}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td className="val" style={{ padding: 0 }}>
                              <div
                                style={{
                                  padding: "4px 6px",
                                  borderBottom: "1px solid #d9e1ea",
                                }}
                              >
                                Material: <strong>{v(report.material)}</strong>
                              </div>
                              <div style={{ padding: "4px 6px" }}>
                                Equipment Used:{" "}
                                <strong>{v(report.equipmentUsed)}</strong>
                              </div>
                            </td>
                            <td
                              className="val"
                              style={{ verticalAlign: "top" }}
                            >
                              Scanning technique:
                              <br />
                              <strong>{v(report.scanningTechnique)}</strong>
                            </td>
                            <td
                              className="val"
                              style={{ verticalAlign: "top" }}
                            >
                              Stage of Inspection:
                              <br />
                              <strong>{v(report.stageOfInspection)}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td className="val" style={{ padding: 0 }}>
                              <div
                                style={{
                                  padding: "4px 6px",
                                  borderBottom: "1px solid #d9e1ea",
                                }}
                              >
                                Couplant: <strong>{v(report.couplant)}</strong>
                              </div>
                              <div style={{ padding: "4px 6px" }}>
                                Reference datum:
                                <br />
                                <strong>{v(report.referenceDatum)}</strong>
                              </div>
                            </td>
                            <td
                              className="val"
                              style={{ verticalAlign: "top" }}
                            >
                              Area scanned:
                              <br />
                              <strong>{v(report.areaScanned)}</strong>
                            </td>
                            <td
                              className="val"
                              style={{ verticalAlign: "top" }}
                            >
                              Acceptance Standard:
                              <br />
                              <strong>{v(report.acceptanceStandard)}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td className="val">
                              Test Setup
                              <br />
                              For Angle Range:{" "}
                              <strong>{v(ts.angleRange)}</strong>
                              <br />
                              For Normal Range:{" "}
                              <strong>{v(ts.normalRange)}</strong>
                            </td>
                            <td className="val">
                              Standard Cal Block:
                              <br />
                              For Angle:{" "}
                              <strong>{v(ts.standardCalBlock?.angle)}</strong>
                              <br />
                              For Normal:{" "}
                              <strong>{v(ts.standardCalBlock?.normal)}</strong>
                            </td>
                            <td className="val">
                              Idtn. No of Ref Block:
                              <br />
                              <strong>
                                For Angle:{" "}
                                {v(ts.identificationNoOfRefBlock?.angle)}
                              </strong>
                              <br />
                              <strong>
                                For Normal:{" "}
                                {v(ts.identificationNoOfRefBlock?.normal)}
                              </strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 0, verticalAlign: "top" }}>
                    <div className="report-body" style={{ borderTop: "none" }}>
                      {/* Angle Probe Calibration */}
                      <table
                        className="report-table"
                        style={{
                          marginBottom: 2,
                        }}
                      >
                        <tbody>
                          <tr>
                            <td className="section-hdr" colSpan={6}>
                              1. ANGLE PROBE CALIBRATION
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl" style={{ width: "12%" }}>
                              Frequency
                            </td>
                            <td
                              className="val"
                              style={{ width: "21.3%", fontWeight: 700 }}
                            >
                              {v(apc.frequency)}
                            </td>
                            <td className="lbl" style={{ width: "12%" }}>
                              Size
                            </td>
                            <td
                              className="val"
                              style={{ width: "21.3%", fontWeight: 700 }}
                            >
                              {v(apc.size)}
                            </td>
                            <td className="lbl" style={{ width: "12%" }}>
                              Type
                            </td>
                            <td
                              className="val"
                              style={{ width: "21.4%", fontWeight: 700 }}
                            >
                              {v(apc.type)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 0, verticalAlign: "top" }}>
                    <div className="report-body" style={{ borderTop: "none" }}>
                      {/* Calibration Table */}
                      <table
                        className="calib-table mt-n1"
                        style={{ marginBottom: 3 }}
                      >
                        <thead>
                          <tr style={{ background: "#f8fafc" }}>
                            <th
                              className="lbl"
                              style={{ width: "16%", textAlign: "left" }}
                              rowSpan={2}
                            >
                              Sr. Nos. of probes
                            </th>
                            <th className="col-hdr" colSpan={4}>
                              {v(apc.probe45SerialNo)}
                            </th>
                            <th className="col-hdr" colSpan={4}>
                              {v(apc.probe60SerialNo)}
                            </th>
                            <th className="col-hdr" colSpan={4}>
                              {v(apc.probe70SerialNo)}
                            </th>
                          </tr>
                          <tr style={{ background: "#f8fafc" }}>
                            {PROBE_MODES.map((pm) => (
                              <th
                                key={pm}
                                colSpan={2}
                                style={{ fontSize: "11px", fontWeight: 700 }}
                              >
                                {pm.replace("L", " L").replace("T", " T")}
                              </th>
                            ))}
                          </tr>
                          <tr style={{ background: "#fff" }}>
                            <th className="lbl" style={{ textAlign: "left" }}>
                              Scanning
                            </th>
                            {PROBE_MODES.map((pm) => (
                              <React.Fragment key={pm + "_hdr"}>
                                <th style={{ fontSize: "10px", width: "7%" }}>
                                  BP mm
                                </th>
                                <th style={{ fontSize: "10px", width: "7%" }}>
                                  %FSH
                                </th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white">
                            <td className="lbl" style={{ textAlign: "center" }}>
                              Skips
                            </td>
                            {PROBE_MODES.map((pm) => (
                              <React.Fragment key={pm + "_skip_hdr"}>
                                <td
                                  className="lbl"
                                  style={{ background: "#fff" }}
                                ></td>
                                <td
                                  className="lbl"
                                  style={{ background: "#fff" }}
                                ></td>
                              </React.Fragment>
                            ))}
                          </tr>
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
                                const cell = (ct[pm] as any)?.[key] ?? {};
                                return (
                                  <React.Fragment key={pm + "_" + key}>
                                    <td style={{ fontWeight: 500 }}>
                                      {v(cell.bp)}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>
                                      {v(cell.fsh)}
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          ))}
                          <tr>
                            <td
                              style={{
                                fontWeight: 700,
                                textAlign: "left",
                                fontSize: "11px",
                                background: "#f7fafc",
                              }}
                            >
                              DAC dB
                            </td>
                            {PROBE_MODES.map((pm) => (
                              <td
                                key={pm + "_dac"}
                                colSpan={2}
                                style={{ fontWeight: 600 }}
                              >
                                {v((ct[pm] as any)?.dacDb)}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td
                              style={{
                                fontWeight: 700,
                                textAlign: "left",
                                fontSize: "11px",
                                background: "#f7fafc",
                              }}
                            >
                              Scanning dB
                            </td>
                            {PROBE_MODES.map((pm) => (
                              <td
                                key={pm + "_scan"}
                                colSpan={2}
                                style={{ fontWeight: 600 }}
                              >
                                {v((ct[pm] as any)?.scanningDb)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 0, verticalAlign: "top" }}>
                    <div className="report-body" style={{ borderTop: "none" }}>
                      {/* Normal Probe Calibration */}
                      <table
                        className="report-table"
                        style={{ marginBottom: 3 }}
                      >
                        <tbody>
                          <tr>
                            <td className="section-hdr" colSpan={4}>
                              2. NORMAL PROBE CALIBRATION
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
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 0, verticalAlign: "top" }}>
                    <div className="report-body" style={{ borderTop: "none" }}>
                      {/* Disposition & Evaluation */}
                      <div
                        style={{
                          breakInside: "avoid",
                          pageBreakInside: "avoid",
                        }}
                      >
                        <table
                          className="report-table"
                          style={{ marginBottom: 3 }}
                        >
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
                            {(report.evaluation || report.remarks) && (
                              <tr>
                                <td className="lbl">Evaluation</td>
                                <td className="val">
                                  {v(report.evaluation || report.remarks)}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* -- Conclusion -- */}
                      <div
                        style={{
                          breakInside: "avoid",
                          pageBreakInside: "avoid",
                        }}
                      >
                        <table className="report-table mt-n1">
                          <tbody>
                            <tr>
                              <td colSpan={2} className="section-hdr">
                                3. CONCLUSION
                              </td>
                            </tr>
                            <tr>
                              <td className="lbl" style={{ width: "22%" }}>
                                Overall Evaluation
                              </td>
                              <td className="val">{conclusionText}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            className={`no-print ${bwMode ? "bw" : ""}`}
            style={{
              position: "absolute",
              bottom: "5mm",
              left: "5mm",
              right: "5mm",
            }}
          >
            <ReportFooter />
          </div>
        </div>
      </div>

      <div className={`print-fixed-footer${bwMode ? " bw" : ""}`}>
        <ReportFooter />
      </div>
    </>
  );
};
