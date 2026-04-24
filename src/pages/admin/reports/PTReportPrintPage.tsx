import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  getPTReportById,
  getPublicPTReportById,
  PTReport,
} from "../../../api/customerApi";

// --- Print Styles ---

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }
  @media screen { 
    body.autoprint-mode { background: #fff !important; }
    body.autoprint-mode > #root > *:not(.print-fixed-footer):not(.print-footer-fixed) { opacity: 0 !important; visibility: hidden !important; }
  }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #report-root { background: #fff !important; padding: 0 !important; display: block !important; }
    #report-root > div {
      width: 210mm !important; 
      margin: 0 !important; padding: 0mm 5mm 15mm 5mm !important;
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
      z-index: 999999 !important;
      contain: layout !important;
      pointer-events: none !important;
      transform: translateZ(0);
      will-change: transform;
    }
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  * { box-sizing: border-box; }

  .report {
    background: #fff;
    border: none;
    border-radius: 0;
    overflow: hidden;
  }
  .report-body { border-top: 1px solid #444; border-left: none; border-right: none; border-bottom: none; border-radius: 6px 6px 0 0; overflow: hidden; }
  .report-footer-wrap { border: 1px solid #444; border-top: none; border-radius: 0 0 6px 6px; overflow: hidden; margin-top: -1px; }
  .report-footer-wrap .sign-table.mt-n1 { margin-top: 0; }
  .report-footer-wrap .sign-table tr:first-child td { border-top: none; }

  .rpt-header {
    padding: 2px 10px;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo-box { width: 90px; height: 90px; background: #fff; border-radius: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 2px; transform: translateY(-4px); }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #0C447C; }
  .hdr-center .org { font-size: 22px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 10px; color: #374151; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 10px; color: #0C447C; font-weight: 700; margin-top: 2px; }
  .footer-meta { background: #185FA5; color: #d7e8fb; font-size: 9px; text-align: center; padding: 3px 8px; }
  .footer-meta span { color: #fff; font-weight: 700; }
  /* B&W mode */
  .bw .rpt-header { background: #fff !important; }
  .bw .hdr-center { color: #000 !important; }
  .bw .hdr-center .org { color: #000 !important; }
  .bw .hdr-center .sub { color: #333 !important; }
  .bw .hdr-center .iso { color: #000 !important; }
  .bw .logo-box { background: #fff !important; }
  .bw .section-hdr { background: #fff !important; color: #000 !important; }
  .bw .col-hdr { background: #fff !important; color: #000 !important; }
  .bw .rpt-title { background: #fff !important; color: #000 !important; }
  .bw .footer-meta { background: #fff !important; color: #000 !important; }
  .bw .footer-meta span { color: #000 !important; }

  .print-only { display: none !important; }
  .no-print-screen { display: block; }

  @media print {
    .print-only { display: block !important; }
    .no-print-screen { display: none !important; }
    .page-break { page-break-before: always; }
  }
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
  .rpt-title {
    background: #E6F1FB; text-align: center; padding: 5px;
    font-size: 16px; font-weight: 700; color: #0C447C;
    text-transform: uppercase; letter-spacing: 0.4px; 
    border: 1px solid #444; border-top: none; border-radius: 6px 6px 0 0;
  }
  .section-hdr {
    background: #185FA5; color: #fff; font-size: 13px; font-weight: 700;
    padding: 3px 8px; letter-spacing: 0.5px; text-transform: uppercase; text-align: left !important;
  }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; border: 1px solid #444; }
    .report-table td, .report-table th {
      border: 1px solid #444; padding: 2px 5px;
      vertical-align: middle; word-break: break-word; font-size: 11.5px;
    }
    .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 12px; text-align: left; color: #0C447C; }
    .lbl { background: #f7fafc; font-weight: 600; font-size: 11.5px; }
    .val { font-size: 11.5px; color: #000; }
    .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #444; }
    .obs-table td, .obs-table th { border: 1px solid #444; padding: 3px 6px; font-size: 11.5px; vertical-align: top; word-break: break-word; }
    .obs-table th { background: #E6F1FB; color: #0C447C; font-size: 11.5px; font-weight: 700; text-align: left; }
    .obs-table th:first-child, .obs-table td:first-child { width: 35px !important; min-width: 35px !important; max-width: 35px !important; text-align: center; }
    .obs-table tr { break-inside: avoid; page-break-inside: avoid; }
    .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
    .sign-table td { border: 1px solid #444; padding: 2px 6px; font-size: 11px; vertical-align: top; }
    .sign-table td:first-child { border-left: none; }
    .sign-table td:last-child { border-right: none; }
  .mt-n1 { margin-top: -1px; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .footer {
    background: #f8fafc; padding: 5px 10px; font-size: 11px; color: #4b5563;
    margin-top: 8px; border-top: 3px solid #185FA5; line-height: 1.4;
    display: flex; align-items: center; gap: 8px;
  }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

  @media screen {
    .print-blank-row { display: none; }
    .print-fixed-footer { display: none; }
    .print-sign-table { display: none; }
  }
`;

// --- Helpers ---

const v = (s?: string) => s || "";
const fmtDate = (d?: string) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

const dateRange = (start?: string | null, end?: string | null) => {
  const s = fmtDate(start || undefined);
  const e = fmtDate(end || undefined);
  if (s && e && s !== e) return `${s} to ${e}`;
  return s || e;
};

const splitTags = (text?: string | null) =>
  v(text || undefined)
    .split(/[,|;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

// --- Component ---

export const PTReportPrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locState = location.state as {
    customerId?: string;
    reportSubType?: string;
  } | null;
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("autoprint") === "true";

  const goBack = () => {
    if (locState?.customerId) {
      navigate(`/admin/customers/${locState.customerId}`, {
        state: {
          activeTab: "reports",
          reportSubType: locState.reportSubType ?? "pt",
        },
      });
    } else {
      navigate(-1);
    }
  };

  const [report, setReport] = useState<PTReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [bwMode, setBwMode] = useState(false);

  const isPublic = location.pathname.startsWith("/reports/public/");

  useEffect(() => {
    if (!id) return;
    const fetcher = isPublic ? getPublicPTReportById : getPTReportById;
    fetcher(id)
      .then((res) => setReport(res.data?.data ?? res.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [id, isPublic]);

  useEffect(() => {
    if (autoPrint) {
      document.body.classList.add("autoprint-mode");
      return () => document.body.classList.remove("autoprint-mode");
    }
  }, [autoPrint]);

  useEffect(() => {
    if (!loading && report && autoPrint) {
      setTimeout(() => {
        window.scrollTo(0, 10);
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);

        requestAnimationFrame(() => {
          window.print();
        });
      }, 1200);
    }
  }, [loading, report, autoPrint]);

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

  const qrUrl = `${window.location.origin}/reports/public/pt/${id}`;

  const jd = report.jobDetails ?? {};
  const md = report.methodDetails ?? {};
  const cons = (report as any).consumablesDetails ?? {};
  const desc = report.methodDescription ?? {};
  const obs = report.observations ?? [];
  const fs = report.finalSection ?? {};
  const inspector = fs.inspector?.[0] ?? {};

  const standards = splitTags(jd.referenceStandard);
  const acceptance = splitTags(jd.acceptanceCriteria);
  const rejectedCount = (report.observations ?? []).filter((o) =>
    /reject|repair|fail|not ok/i.test(
      v(o.evaluation || o.remark || o.result || o.interpretation),
    ),
  ).length;
  const conclusionText =
    v((report as unknown as { conclusion?: string }).conclusion) ||
    (rejectedCount > 0
      ? `Examination completed. ${rejectedCount} rejectable indication(s) identified; repair and re-examination required before final acceptance.`
      : "Examination completed as per applicable standards. No rejectable indications observed in inspected items.");

  const ReportFooter = () => (
    <>
      <div className="footer">
        <div className="footer-text-block">
          Corp Office: 1st Floor, Plot No.PAP 3/28, Behind BSNL Office, MIDC,
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
        Format No: <span>FMT-NDT-PT-01</span>
        &nbsp;|&nbsp; Rev. No: <span>00</span>
        &nbsp;|&nbsp; Report Date: <span>{fmtDate(jd.reportDate)}</span>
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
        style={{
          background: "#e9eef5",
          minHeight: "100vh",
          padding: "16px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "210mm",
            margin: "0 auto",
            padding: "0mm 5mm 25mm 5mm",
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            boxSizing: "border-box",
          }}
        >
          <div className={`report${bwMode ? " bw" : ""}`}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ display: "table-header-group" }}>
                <tr>
                  <td style={{ padding: 0 }}>
                    <div className="rpt-header">
                      <div className="logo-box">
                        <img src="/logo.png" alt="Logo" />
                      </div>
                      <div className="hdr-center">
                        <div className="org">
                          National Industrial Inspection And Training
                        </div>
                        <div className="sub">
                          THIRD PARTY INSPECTION | NDT SERVICES & NDT TRAINING |
                          NDT CONSULTANCY
                          <br />
                          FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT
                        </div>
                        <div className="iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>
              <tbody style={{ display: "table-row-group" }}>
                <tr>
                  <td style={{ padding: 0 }}>
                    <div className="report-body">
                      <div className="rpt-title">PENETRANT TESTING REPORT</div>

                      {/* --- JOB DETAILS --- */}
                      <table className="report-table">
                        <tbody>
                          <tr>
                            <td colSpan={4} className="section-hdr">
                              1. JOB DETAILS
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl" style={{ width: "22%" }}>Customer</td>
                            <td className="val" style={{ width: "28%" }}>{v(jd.customer)}</td>
                            <td className="lbl" style={{ width: "22%" }}>Report No.:</td>
                            <td className="val" style={{ width: "28%" }}>{v(report.reportNo)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Client</td>
                            <td className="val">{v(jd.client)}</td>
                            <td className="lbl">Report Date:</td>
                            <td className="val">
                              {fmtDate(jd.reportDate) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Project</td>
                            <td className="val">{v(jd.project) || "-"}</td>
                            <td className="lbl">Inspection Date</td>
                            <td className="val">
                              {dateRange(
                                jd.inspectionDate,
                                jd.inspectionEndDate,
                              ) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Reference standard</td>
                            <td className="val">
                              {standards.length > 0 ? (
                                standards.join(", ")
                              ) : (
                                "Not specified"
                              )}
                            </td>
                            <td className="lbl">Acceptance Criteria</td>
                            <td className="val">
                              {acceptance.length > 0 ? (
                                acceptance.join(", ")
                              ) : (
                                "Not specified"
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Material</td>
                            <td className="val">{v(jd.material) || "-"}</td>
                            <td className="lbl">Stage of Inspection</td>
                            <td className="val">
                              {v(jd.stageOfInspection) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Thickness</td>
                            <td className="val">{v(jd.thickness) || "-"}</td>
                            <td className="lbl">Extent of Examination</td>
                            <td className="val">
                              {v(jd.extentOfExamination) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Surface condition</td>
                            <td className="val">{v(jd.surfaceCondition) || "-"}</td>
                            <td className="lbl">Type of Joint</td>
                            <td className="val">{v(jd.typeOfJoint) || "-"}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Surface Temperature</td>
                            <td className="val">{v(jd.surfaceTemperature) || "-"}</td>
                            <td className="lbl">Welding Process</td>
                            <td className="val">{v(jd.weldingProcess) || "-"}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* --- METHOD DETAILS --- */}
                      <table className="report-table mt-n1">
                        <tbody>
                          <tr>
                            <td colSpan={4} className="section-hdr">
                              2. METHOD DETAILS
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl" style={{ width: "22%" }}>Penetrant Method</td>
                            <td className="val" colSpan={3}>{v(md.penetrantMethod)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Excess Penetrant <br />Removal method</td>
                            <td className="val" colSpan={3}>{v(md.excessPenetrantRemovalMethod)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* --- CONSUMABLES DETAILS --- */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "14%" }} />
                          <col style={{ width: "46%" }} />
                          <col style={{ width: "16%" }} />
                          <col style={{ width: "24%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={4} className="section-hdr">
                              3. CONSUMABLES DETAILS
                            </td>
                          </tr>
                          <tr>
                            <td className="col-hdr">Material</td>
                            <td className="col-hdr">Manufacture</td>
                            <td className="col-hdr">Batch</td>
                            <td className="col-hdr">Expiry Date</td>
                          </tr>
                          {[
                            { label: "Penetrant", data: cons.penetrant },
                            { label: "Developer", data: cons.developer },
                            { label: "Cleaner", data: cons.cleaner },
                          ].map((row) => (
                            <tr key={row.label}>
                              <td className="lbl">{row.label}</td>
                              <td className="val">
                                {v(row.data?.manufacturer)}
                              </td>
                              <td className="val">{v(row.data?.batch)}</td>
                              <td className="val">{v(row.data?.expiryDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* --- METHOD DESCRIPTION --- */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "15%" }} />
                          <col style={{ width: "18.33%" }} />
                          <col style={{ width: "15%" }} />
                          <col style={{ width: "18.33%" }} />
                          <col style={{ width: "15%" }} />
                          <col style={{ width: "18.33%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={6} className="section-hdr">
                              4. METHOD DESCRIPTION
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Dwell Time</td>
                            <td className="val">{v(desc.dwellTime)}</td>
                            <td className="lbl">Developing Time</td>
                            <td className="val">{v(desc.developingTime)}</td>
                            <td className="lbl">Post Cleaning</td>
                            <td className="val">{v(desc.postCleaning)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Light Intensity</td>
                            <td className="val">{v(desc.lightIntensity)}</td>
                            <td className="lbl">Light Equip. Used</td>
                            <td className="val">{v(desc.lightEquipmentUsed)}</td>
                            <td className="lbl">Drying Time</td>
                            <td className="val">{v(desc.dryingTime)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* --- 5. Observations & Signatures Logic --- */}
                      {(() => {
                        const obsPage1 = obs.slice(0, 9);
                        const obsPage2 = obs.slice(9);

                        const renderSignatures = () => (
                          <div className="report-footer-wrap mt-n1">
                            <table className="sign-table mt-n1">
                              <colgroup>
                                <col style={{ width: "33.3%" }} />
                                <col style={{ width: "33.3%" }} />
                                <col style={{ width: "33.4%" }} />
                              </colgroup>
                              <tbody>
                                <tr>
                                  <td style={{ fontWeight: 600, fontSize: "11px" }}>EXAMINED BY</td>
                                  <td style={{ fontWeight: 600, fontSize: "11px" }}>CUSTOMER:</td>
                                  <td style={{ fontWeight: 600, fontSize: "11px" }}>CLIENT :</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 600, fontSize: "11px" }}>National Industrial Inspection And Training</td>
                                  <td style={{ fontWeight: 600, fontSize: "11px" }}>{v(jd.customer)}</td>
                                  <td style={{ fontWeight: 600, fontSize: "11px" }}>{v(jd.client)}</td>
                                </tr>
                                <tr>
                                  <td>Name: {v(inspector.name) || "-"}</td>
                                  <td>Name: {v(jd.customerRepresentative) || "-"}</td>
                                  <td>Name: {v(jd.clientRepresentative) || "-"}</td>
                                </tr>
                                <tr>
                                  <td>{v(inspector.designation) || "PT NDE Level II"}</td>
                                  <td>Designation: {v(jd.customerDesignation) || "-"}</td>
                                  <td>Designation: {v(jd.clientDesignation) || "-"}</td>
                                </tr>
                                <tr>
                                  <td style={{ height: "30px" }}>Signature:</td>
                                  <td>Signature:</td>
                                  <td>Signature:</td>
                                </tr>
                                <tr>
                                  <td>Date: {fmtDate(jd.reportDate)}</td>
                                  <td>Date: {fmtDate(jd.reportDate)}</td>
                                  <td>Date: {fmtDate(jd.reportDate)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );

                        const renderObsTable = (data: any[], title: string) => (
                          <table className="obs-table mt-n1">
                            <colgroup>
                              <col style={{ width: "35px" }} />
                              <col style={{ width: "22%" }} />
                              <col style={{ width: "16%" }} />
                              <col style={{ width: "13%" }} />
                              <col style={{ width: "8%" }} />
                              <col style={{ width: "25%" }} />
                              <col style={{ width: "11%" }} />
                            </colgroup>
                            <thead>
                              <tr>
                                <td colSpan={7} className="section-hdr">{title}</td>
                              </tr>
                              <tr>
                                <td className="col-hdr">Sr.</td>
                                <td className="col-hdr">Job Description</td>
                                <td className="col-hdr">Drg No. / Joint No.</td>
                                <td className="col-hdr">Size</td>
                                <td className="col-hdr">Qty</td>
                                <td className="col-hdr">Interpretation</td>
                                <td className="col-hdr">Evaluation</td>
                              </tr>
                            </thead>
                            <tbody>
                              {data.length === 0 ? (
                                <tr>
                                  <td colSpan={7} style={{ textAlign: "center", padding: "6px", fontSize: "11px", color: "#999" }}>
                                    No observations recorded.
                                  </td>
                                </tr>
                              ) : (
                                data.map((o, i) => (
                                  <tr key={i}>
                                    <td>{o.srNo}</td>
                                    <td>{v(o.jobDescription)}</td>
                                    <td>{v(o.drawingOrJointNo)}</td>
                                    <td>{v(o.size)}</td>
                                    <td>{o.quantity ?? ""}</td>
                                    <td>{v(o.interpretation)}</td>
                                    <td>{v(o.evaluation)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        );

                        return (
                          <>
                            {/* --- PRINT ONLY SPLIT --- */}
                            <div className="print-only">
                              {renderObsTable(obsPage1, "5. OBSERVATIONS")}
                              {renderSignatures()}

                              {obsPage2.length > 0 && (
                                <div style={{ pageBreakBefore: "always" }}>
                                  {renderObsTable(obsPage2, "5. OBSERVATIONS (Contd.)")}
                                  {renderSignatures()}
                                </div>
                              )}
                            </div>

                            {/* --- SCREEN ONLY CONTINUOUS --- */}
                            <div className="no-print-screen">
                              {renderObsTable(obs, "5. OBSERVATIONS")}
                              {renderSignatures()}
                            </div>
                          </>
                        );
                      })()}
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
