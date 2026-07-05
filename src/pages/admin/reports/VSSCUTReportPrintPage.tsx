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

// --- Print Styles ---
const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }

  @media screen {
    body.autoprint-mode { background: #fff !important; }
    body.autoprint-mode > #root > * { opacity: 0 !important; visibility: hidden !important; }
    .print-page { margin: 0 auto 16px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
  }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #report-root { background: #fff !important; padding: 0 !important; }
    .print-page { min-height: 296mm; height: 296mm; margin: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; }
    .print-page:last-child { break-after: auto; page-break-after: auto; }
    .report-body { overflow: visible !important; }
  }

  body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  .print-page { width: 210mm; height: 297mm; background: #fff; box-sizing: border-box; padding: 0 5mm 5mm 5mm; display: flex; flex-direction: column; overflow: hidden; }
  .print-page-content { flex: 1 1 auto; }
  .print-page-foot { margin-top: auto; }
  .rpt-header { padding: 2px 8px; margin-bottom: 0; display: flex; align-items: center; gap: 8px; }
  .logo-box { width: 160px; height: 100px; background: #fff; border-radius: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 0px; transform: translateY(-4px); margin-top: 2px; }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #0C447C; }
  .hdr-center .org { font-size: 22px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 11px; color: #374151; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 11px; color: #0C447C; font-weight: 700; margin-top: 2px; }
  .footer-meta { background: #185FA5; color: #d7e8fb; font-size: 10px; text-align: center; padding: 3px 8px; }
  .footer-meta span { color: #fff; font-weight: 700; }

  /* B&W mode */
  .bw .rpt-header { background: #fff !important; border-bottom: none !important; }
  .bw thead, .bw thead tr, .bw thead td { border: none !important; }
  .bw .hdr-center { color: #000 !important; }
  .bw .hdr-center .org { color: #000 !important; }
  .bw .hdr-center .sub { color: #333 !important; }
  .bw .hdr-center .iso { color: #000 !important; }
  .bw .logo-box { background: #fff !important; }
  .bw .section-hdr { background: #fff !important; color: #000 !important; border-bottom: 1px solid #000 !important; }
  .bw .col-hdr { background: #fff !important; color: #000 !important; }
  .bw .calib-table th { background: #fff !important; color: #000 !important; }
  .bw .calib-table td:first-child { background: #fff !important; }
  .bw .rpt-title { background: #fff !important; color: #000 !important; border: 1px solid #000 !important; border-top: none !important; border-bottom: none !important; border-radius: 0 !important; }
  .bw .footer-meta { background: #fff !important; color: #000 !important; }
  .bw .footer-meta span { color: #000 !important; }
  .bw .std-tag { background: #fff !important; color: #000 !important; border: 1px solid #777 !important; }
  .bw .accept-badge { background: transparent !important; color: #000 !important; border: none !important; }
  .bw .reject-badge { background: transparent !important; color: #000 !important; border: none !important; }
  .bw .neutral-badge { background: transparent !important; color: #000 !important; border: none !important; }
  .bw .report-table td, .bw .report-table th { border-color: #000 !important; }
  .bw .obs-table td, .bw .obs-table th { border-color: #000 !important; }
  .bw .obs-table th { background: #fff !important; color: #000 !important; }
  .bw .sign-table td { border-color: #000 !important; }
  .bw .lbl { color: #000 !important; background: #fff !important; }
  .bw .footer { background: #fff !important; color: #000 !important; border-color: #000 !important; }
  .bw .report-body { color: #000 !important; border-top: 1px solid #000 !important; border-left: none !important; border-right: none !important; border-bottom: none !important; border-radius: 0 !important; }
  .bw .report-footer-wrap { border: 1px solid #000 !important; border-top: none !important; border-radius: 0 !important; }

  .rpt-title { background: #E6F1FB; text-align: center; padding: 7px; font-size: 16px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border: 1px solid #000; border-top: none; border-bottom: none; border-radius: 0; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 13px; font-weight: 700; padding: 4px 8px; letter-spacing: 0.5px; text-transform: uppercase; text-align: left !important; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; border: 1px solid #000; }
  .report-table td, .report-table th { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; word-break: break-word; font-size: 12px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 12px; text-align: left; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 12px; white-space: nowrap; width: 22%; text-align: left; }
  .val { font-size: 12px; color: #000; font-weight: 700; }
  .mt-n1 { margin-top: -1px; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .report-body { border-top: 1px solid #000; border-left: none; border-right: none; border-bottom: none; border-radius: 0; overflow: hidden; }
  .report-footer-wrap { border: 1px solid #000; border-top: none; border-radius: 0; overflow: hidden; margin-top: -1px; }
  .report-footer-wrap .sign-table tr:first-child td { border-top: none; }

  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .sign-table td { border: 1px solid #000; padding: 3px 4px; font-size: 12px; vertical-align: top; }
  .sign-table td:first-child { border-left: none; }
  .sign-table td:last-child { border-right: none; }
  .calib-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #000; }
  .calib-table td, .calib-table th { border: 1px solid #000; padding: 3px; font-size: 11px; text-align: center; vertical-align: middle; }
  .calib-table th { background: #E6F1FB; color: #0C447C; font-weight: 700; text-align: center; }
  .footer { background: #f8fafc; padding: 4px 10px; font-size: 11px; color: #4b5563; margin-top: 8px; border-top: 3px solid #185FA5; line-height: 1.4; display: flex; align-items: center; gap: 8px; }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
`;

// --- Helpers ---
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

// --- Component ---
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
        window.scrollTo(0, 10);
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);

        requestAnimationFrame(() => {
          window.print();
          document.body.classList.remove("autoprint-mode");
        });
      }, 1200);
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

  const qrUrl = `${window.location.origin}/#/reports/public/vssc-ut/${id}`;

  const apc = (report as any).angleProbeCalibration ?? {};
  const npc = (report as any).normalProbeCalibration ?? {};
  const ts = (report as any).testSetup ?? {};
  const fs = (report as any).finalSection ?? {};
  const inspector = fs.inspector?.[0] ?? {};
  const ct = apc.calibTable ?? {};
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

  const renderHeader = () => (
    <div className="rpt-header">
      <div className="logo-box">
        <img src="/logo.jpeg" alt="NIIT Logo" />
      </div>
      <div className="hdr-center">
        <div className="org">
          National Industrial Inspection and Training
        </div>
        <div className="sub">
          THIRD PARTY INSPECTION | NDT SERVICES &amp; NDT TRAINING | NDT
          CONSULTANCY
          <br />
          FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT
        </div>
        <div className="iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
      </div>
    </div>
  );

  const renderSignatures = () => (
    <div
      style={{
        breakInside: "avoid",
        pageBreakInside: "avoid",
      }}
    >
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
                National Industrial Inspection And Training
              </td>
              <td style={{ fontWeight: 600, fontSize: "11px" }}>QC / WIL</td>
              <td style={{ fontWeight: 600, fontSize: "11px" }}>RQS / VSSC</td>
            </tr>
            <tr>
              <td>Name:- {v(inspector.name) || "-"}</td>
              <td>Name:- {v(fs.qc?.name) || "-"}</td>
              <td>Name:- {v(fs.rqs?.name) || "-"}</td>
            </tr>
            <tr>
              <td style={{ height: "60px" }}>Signature:- {v(inspector.signature)}</td>
              <td style={{ height: "60px" }}>Signature:- {v(fs.qc?.signature)}</td>
              <td style={{ height: "60px" }}>Signature:- {v(fs.rqs?.signature)}</td>
            </tr>
            <tr>
              <td>Date:- {fmtDate(inspector.date) || "-"}</td>
              <td>Date:- {fmtDate(fs.qc?.date) || "-"}</td>
              <td>Date:- {fmtDate(fs.rqs?.date) || "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const fixedSections = (
    <>
      <div className="rpt-title">Ultrasonic Testing Report</div>

      {/* --- JOB DETAILS --- */}
      <table className="report-table mt-n1">
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
                    padding: "4px 6px",
                    fontWeight: 700,
                    fontSize: "12px",
                  }}
                >
                  Report No. {v(report.reportNo)}
                </div>
                <div
                  style={{
                    width: "50%",
                    padding: "4px 6px",
                    fontWeight: 700,
                    fontSize: "12px",
                    borderLeft: "1px solid #000",
                  }}
                >
                  Job Description: {v(report.jobDescription)}
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td className="val">
              Report Date: <span style={{ fontWeight:"300" }}>{fmtDate(report.reportDate)}</span>
            </td>
            <td className="val">
              Weld Joint No.: <span style={{ fontWeight:"300" }}>{v(report.weldJointNo)}</span>
            </td>
            <td className="val">
              Thickness: <span style={{ fontWeight:"300" }}>{v(report.thicknessOfJob)}</span>
            </td>
          </tr>
          <tr>
            <td className="val">
              Surface Condition: <span style={{ fontWeight:"300" }}>{v(report.surfaceCondition)}</span>
            </td>
            <td className="val">
              Customer: <span style={{ fontWeight:"300" }}>{v(report.customer)}</span>
            </td>
            <td className="val">
              Period: <span style={{ fontWeight:"300" }}>{v(report.periodOfInspection)}</span>
            </td>
          </tr>
          <tr>
            <td className="val" style={{ padding: 0 }}>
              <div
                style={{
                  padding: "2px 6px",
                  borderBottom: "1px solid #000",
                }}
              >
                Material: <span style={{ fontWeight:"300" }}>{v(report.material)}</span>
              </div>
              <div style={{ padding: "2px 6px" }}>
                Equipment: <span style={{ fontWeight:"300" }}>{v(report.equipmentUsed)}</span>
              </div>
            </td>
            <td className="val">
              Technique: <span style={{ fontWeight:"300" }}>{v(report.scanningTechnique)}</span>
            </td>
            <td className="val">
              Stage: <span style={{ fontWeight:"300" }}>{v(report.stageOfInspection)}</span>
            </td>
          </tr>
          <tr>
            <td className="val" style={{ padding: 0 }}>
              <div
                style={{
                  padding: "2px 6px",
                  borderBottom: "1px solid #000",
                }}
              >
                Couplant: <span style={{ fontWeight:"300" }}>{v(report.couplant)}</span>
              </div>
              <div style={{ padding: "2px 6px" }}>
                Datum: <span style={{ fontWeight:"300" }}>{v(report.referenceDatum)}</span>
              </div>
            </td>
            <td className="val">
              Area Scanned: <span style={{ fontWeight:"300" }}>{v(report.areaScanned)}</span>
            </td>
            <td className="val">
              Acceptance Std: <span style={{ fontWeight:"300" }}>{v(report.acceptanceStandard)}</span>
            </td>
          </tr>
          <tr>
            <td className="val">
              <span style={{ fontWeight: "bold" }}>Test Setup:</span>
              <br />
              Angle Range: <span style={{ fontWeight: "350" }}>{v(ts.angleRange)}</span> <br/> Normal:{" "}
              <span style={{ fontWeight: "350" }}>{v(ts.normalRange)}</span>
            </td>
            <td className="val">
              <span style={{ fontWeight: "bold" }}>Standard Cal Block:</span>
              <br />
              Angle: <span style={{ fontWeight: "350" }}>{v(ts.standardCalBlock?.angle)}</span> <br/> Normal:{" "}
              <span style={{ fontWeight: "350" }}>{v(ts.standardCalBlock?.normal)}</span>
            </td>
            <td className="val">
              <span style={{ fontWeight: "bold" }}>Ref Block Idtn:</span>
              <br />
              Angle:{" "}
              <span style={{ fontWeight: "350" }}>{v(ts.identificationNoOfRefBlock?.angle)}</span> <br/>
              Normal:{" "}
              <span style={{ fontWeight: "350" }}>{v(ts.identificationNoOfRefBlock?.normal)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* --- ANGLE PROBE CALIBRATION --- */}
      <table className="report-table mt-n1">
        <tbody>
          <tr>
            <td className="section-hdr" colSpan={3}>
              1. ANGLE PROBE CALIBRATION
            </td>
          </tr>
          <tr>
            <td className="val" style={{ width: "33.3%" }}>
              Frequency: <span style={{ fontWeight: "300" }}>{v(apc.frequency)}</span>
            </td>
            <td className="val" style={{ width: "33.3%" }}>
              Size: <span style={{ fontWeight: "300" }}>{v(apc.size)}</span>
            </td>
            <td className="val" style={{ width: "33.4%" }}>
              Type: <span style={{ fontWeight: "300" }}>{v(apc.type)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* --- CALIBRATION TABLE --- */}
      <table className="calib-table mt-n1">
        <thead>
          <tr>
            <th style={{ width: "16%" }}>Sr. Nos.</th>
            <th colSpan={4}>{v(apc.probe45SerialNo)}</th>
            <th colSpan={4}>{v(apc.probe60SerialNo)}</th>
            <th colSpan={4}>{v(apc.probe70SerialNo)}</th>
          </tr>
          <tr>
            <th>Scanning</th>
            {PROBE_MODES.map((pm) => (
              <th key={pm} colSpan={2}>
                {pm}
              </th>
            ))}
          </tr>
          <tr>
            <th>Skips</th>
            {PROBE_MODES.map((pm) => (
              <React.Fragment key={pm + "_h"}>
                <th style={{ width: "6%" }}>BP</th>
                <th style={{ width: "6%" }}>%FSH</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {SKIPS.map(({ key, label }) => (
            <tr key={key}>
              <td className="lbl">{label}</td>
              {PROBE_MODES.map((pm) => {
                const cell = (ct[pm] as any)?.[key] ?? {};
                return (
                  <React.Fragment key={pm + "_" + key}>
                    <td>{v(cell.bp)}</td>
                    <td>{v(cell.fsh)}</td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="lbl">DAC dB</td>
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
            <td className="lbl">Scanning dB</td>
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

      {/* --- NORMAL PROBE CALIBRATION --- */}
      <table className="report-table mt-n1">
        <tbody>
          <tr>
            <td className="section-hdr" colSpan={3}>
              2. NORMAL PROBE CALIBRATION
            </td>
          </tr>
          <tr>
            <td className="val" style={{ width: "33.3%" }}>
              Probe S. No / Type: <span style={{ fontWeight: "300" }}>{v(npc.probeType)}</span>
            </td>
            <td className="val" style={{ width: "33.3%" }}>
              Frequency: <span style={{ fontWeight: "300" }}>{v(npc.frequency)}</span>
            </td>
            <td className="val" style={{ width: "33.4%" }}>
              Size: <span style={{ fontWeight: "300" }}>{v(npc.size)}</span>
            </td>
          </tr>
          <tr>
  <td className="val">
    Skip:{" "}
    <span style={{ fontWeight: "300" }}>
      {v(npc.skip)} BP – {v(npc.bp)}
    </span>
  </td>

  <td className="val">
    DAC dB:<span style={{ fontWeight: "300" }}>{v(npc.dacDb)}</span>
  </td>

  <td className="val">
    Scanning dB: <span style={{ fontWeight: "300" }}>{v(npc.scanningDb)}</span>
  </td>
</tr>
<tr>
  <td className="val" colSpan={3}>
    Disposition: <span style={{ fontWeight: "300" }}>{v(report.disposition)}</span>
  </td>
</tr>

<tr>
  <td className="val" colSpan={3}>
    Remarks (If any): <span style={{ fontWeight: "300" }}>{v(report.evaluation)}</span>
  </td>
</tr>
        </tbody>
      </table>
    </>
  );


  // --- VSSC-UT is a single-content report (no observations split): all fixed
  //     calibration sections plus the signatures live on one self-contained A4
  //     page block with the footer pinned at its bottom. ---
  const pages = [
    <>
      {fixedSections}
      {renderSignatures()}
    </>,
  ];

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
        {pages.map((content, i) => (
          <div className={`print-page${bwMode ? " bw" : ""}`} key={i}>
            <div className="print-page-content">
              {renderHeader()}
              <div className="report-body">{content}</div>
            </div>
            <div className="print-page-foot">
              <ReportFooter />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
