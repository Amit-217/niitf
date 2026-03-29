import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  getTPIIVRReportById,
  getPublicTPIIVRReportById,
} from "../../../api/customerApi";

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
    #report-root > div { width: 210mm !important; min-height: 297mm !important; margin: 0 auto !important; padding: 3mm !important; box-sizing: border-box !important; box-shadow: none !important; }
    .report { margin: 0 !important; box-shadow: none !important; width: calc(100% / 0.92) !important; transform: scale(0.92); transform-origin: top left; }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  .report { background: #fff; border: none; border-radius: 6px; overflow: hidden; }
  .rpt-header { background: #185FA5; padding: 10px 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
  .logo-box { width: 90px; height: 90px; background: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 3px; }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #fff; }
  .hdr-center .org { font-size: 15px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 9px; color: #d7e8fb; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 9px; color: #eef6ff; font-weight: 700; margin-top: 2px; }
  .footer-meta { background: #185FA5; color: #d7e8fb; font-size: 8px; text-align: center; padding: 3px 8px; }
  .footer-meta span { color: #fff; font-weight: 700; }
  /* B&W mode */
  .bw .rpt-header { background: #fff !important; border-bottom: 2px solid #000 !important; }
  .bw .hdr-center { color: #000 !important; }
  .bw .hdr-center .org { color: #000 !important; }
  .bw .hdr-center .sub { color: #333 !important; }
  .bw .hdr-center .iso { color: #000 !important; }
  .bw .logo-box { background: transparent !important; border: none !important; width: 110px !important; height: 110px !important; }
  .bw .section-hdr { background: #d0d0d0 !important; color: #000 !important; border-left: 3px solid #000 !important; }
  .bw .col-hdr { background: #e8e8e8 !important; color: #000 !important; }
  .bw .rpt-title { background: #e0e0e0 !important; color: #000 !important; border-bottom: 2px solid #555 !important; }
  .bw .footer-meta { background: #e0e0e0 !important; color: #000 !important; }
  .bw .footer-meta span { color: #000 !important; }
  .bw .std-tag { background: #e8e8e8 !important; color: #000 !important; border: 1px solid #777 !important; }
  .bw .accept-badge { background: #e8e8e8 !important; color: #000 !important; border: 1px solid #777 !important; }
  .bw .reject-badge { background: #e0e0e0 !important; color: #000 !important; border: 1px solid #444 !important; border-left: 3px solid #000 !important; }
  .bw .neutral-badge { background: #f0f0f0 !important; color: #000 !important; border: 1px solid #777 !important; }
  .bw .report-table td, .bw .report-table th { border-color: #888 !important; }
  .bw .obs-table td, .bw .obs-table th { border-color: #888 !important; }
  .bw .obs-table th { background: #e0e0e0 !important; color: #000 !important; }
  .bw .sign-table td { border-color: #888 !important; }
  .bw .lbl { background: #f0f0f0 !important; }
  .bw .footer { background: #f5f5f5 !important; color: #000 !important; border-color: #000 !important; }
  .bw .report-body { border-color: #000 !important; }
  .rpt-title { background: #E6F1FB; text-align: center; padding: 7px; font-size: 14px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #b8cfe7; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 11px; font-weight: 700; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .report-table td, .report-table th { border: 1px solid #d9e1ea; padding: 4px 6px; vertical-align: middle; word-break: break-word; font-size: 11px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 10px; text-align: center; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 10px; white-space: nowrap; }
  .val { font-size: 11px; }
  .items-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .items-table td, .items-table th { border: 1px solid #d9e1ea; padding: 3px 4px; font-size: 11px; vertical-align: middle; word-break: break-word; text-align: center; }
  .items-table th { background: #E6F1FB; color: #0C447C; font-weight: 700; }
  .items-table td.text-left { text-align: left; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .sign-table td { border: 1px solid #d9e1ea; padding: 4px 6px; font-size: 11px; vertical-align: top; }
  .mt-n1 { margin-top: -1px; }
  .report-body { border: 1px solid #444; border-radius: 4px; overflow: hidden; }
  .activities-box { border: 1px solid #d9e1ea; padding: 6px 8px; font-size: 11px; min-height: 40px; white-space: pre-wrap; word-break: break-word; }
  .footer { background: #f8fafc; padding: 6px 10px; font-size: 9px; color: #4b5563; margin-top: 8px; border-top: 3px solid #185FA5; line-height: 1.4; display: flex; align-items: center; gap: 8px; }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

  @media print {
    .print-fixed-footer { position: fixed !important; bottom: 10mm !important; left: 0 !important; width: 100% !important; display: flex !important; justify-content: center !important; z-index: 99999 !important; background: transparent !important; }
    .print-fixed-footer-inner { width: 193.2mm !important; transform: none !important; background: transparent !important; margin: 0 auto !important; }
    .tfoot-content { visibility: hidden !important; }
  }
  @media screen {
    .print-fixed-footer { display: none; }
    .tfoot-content { visibility: visible; }
  }
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

export const TPIIVRReportPrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locState = location.state as {
    customerId?: string;
    reportSubType?: string;
  } | null;
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("autoprint") === "true";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bwMode, setBwMode] = useState(false);

  const goBack = () => {
    if (locState?.customerId) {
      navigate(`/admin/customers/${locState.customerId}`, {
        state: {
          activeTab: "reports",
          reportSubType: locState.reportSubType ?? "tpi-ivr",
        },
      });
    } else {
      navigate(-1);
    }
  };

  const isPublic = location.pathname.startsWith("/reports/public/");

  useEffect(() => {
    if (!id) return;
    const fetcher = isPublic ? getPublicTPIIVRReportById : getTPIIVRReportById;
    fetcher(id)
      .then((res: any) => setReport((res as any).data ?? res))
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

  const qrUrl = `${window.location.origin}/reports/public/tpi-ivr/${id}`;

  const cd = report.clientDetails ?? {};
  const vd = report.vendorDetails ?? {};
  const ev = report.extraVisit ?? {};
  const items = report.inspectionItems ?? [];
  const refs = report.referenceDocuments ?? [];
  const calib = report.calibrationStatus ?? [];
  const sigs = report.signatures ?? {};

  const ReportFooter = () => (
    <>
      <div className="footer">
        <div className="footer-text-block">
          Corp Office: 1st Floor, Plot No.PAP 3/28, Behind BSNL Office, MIDC,
          Baramati, Dist-Pune 413133 | Ph: +91 9860186056, +91 7875154431
          <br />
          Reg. Office: A/p - Kuthare, Tal - Patan, Dist-Satara 415112 | Website:
          www.niitindt.com | Email: niit04@gmail.com | info@niitindt.com
        </div>
        <div className="qr-wrap">
          <QRCodeSVG value={qrUrl} size={48} />
        </div>
      </div>
      <div className="footer-meta">
        I.R. No: <span>{v(report.irNo)}</span>
        &nbsp;|&nbsp; IR Rev.: <span>{v(report.irRev)}</span>
        &nbsp;|&nbsp; Format No: <span>NIIT-16 Rev.01</span>
        &nbsp;|&nbsp; Date: <span>{fmtDate(report.dtOfInspection)}</span>
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

      {/* ── Report Content ── */}
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
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className={`report${bwMode ? " bw" : ""}`} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <table
              style={{
                width: "100%",
                height: "100%",
                borderCollapse: "collapse",
                borderSpacing: 0,
                margin: 0,
                padding: 0,
              }}
            >
              <thead style={{ display: "table-header-group" }}>
                <tr>
                  <td style={{ padding: "5mm 0 0 0" }}>
                    <div className="rpt-header">
                      <div className="logo-box">
                        <img src="/logo.png" alt="NIIT Logo" />
                      </div>
                      <div className="hdr-center">
                        <div className="org">
                          National Industrial Inspection &amp; Training
                        </div>
                        <div className="sub">
                          THIRD PARTY INSPECTION | NDT SERVICES &amp; TRAINING |
                          NDT CONSULTANCY | PHYSICAL CALIBRATION | FACTORY
                          INSPECTION UNDER MAHARASHTRA FACTORY ACT | QUALITY
                          MANAGEMENT SYSTEM TRAINING
                        </div>
                        <div className="iso">
                          (AN ISO 9001:2015 CERTIFIED ORGANIZATION)
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>
              <tbody style={{ display: "table-row-group" }}>
                <tr>
                  <td style={{ padding: 0, verticalAlign: "top" }}>
                    <div className="report-body">
                      <div className="rpt-title">Inspection Visit Report</div>
                      <div
                        style={{
                          padding: "5px 10px",
                          fontSize: "10px",
                          borderBottom: "1px solid #d9e1ea",
                          background: "#f8fafc",
                        }}
                      >
                        <strong>Client:</strong> {v(report.client)} &nbsp;&nbsp;{" "}
                        <strong>Inspection Location:</strong>{" "}
                        {v(report.inspectionLocation)}
                      </div>

                      {/* ── JOB DETAILS ── */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "18%" }} />
                          <col style={{ width: "32%" }} />
                          <col style={{ width: "18%" }} />
                          <col style={{ width: "32%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={4} className="section-hdr">
                              JOB DETAILS
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Project</td>
                            <td className="val">{v(report.project)}</td>
                            <td className="lbl">Part Name</td>
                            <td className="val">{v(report.partName)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Appd. QAP No.</td>
                            <td className="val">{v(report.appdQapNo)}</td>
                            <td className="lbl">Appd. QAP Date</td>
                            <td className="val">{fmtDate(report.appdQapDt)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Client PO No.</td>
                            <td className="val">{v(report.clientPoNo)}</td>
                            <td className="lbl">PO Date</td>
                            <td className="val">{fmtDate(report.poDate)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">PO Amed. No.</td>
                            <td className="val">{v(report.poAmedNo)}</td>
                            <td className="lbl">Inspection Stage</td>
                            <td className="val">{v(report.inspectionStage)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* ── CLIENT & VENDOR DETAILS ── */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "50%" }} />
                          <col style={{ width: "50%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td className="section-hdr">CLIENT DETAILS</td>
                            <td className="section-hdr">VENDOR DETAILS</td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                verticalAlign: "top",
                                padding: "3px 5px",
                              }}
                            >
                              <table
                                style={{
                                  width: "100%",
                                  borderCollapse: "collapse",
                                }}
                              >
                                <tbody>
                                  <tr>
                                    <td
                                      style={{
                                        fontSize: "11px",
                                        paddingBottom: 2,
                                      }}
                                    >
                                      <strong>Ref:</strong> {v(cd.ref)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      style={{
                                        fontSize: "11px",
                                        paddingBottom: 2,
                                      }}
                                    >
                                      <strong>Contact:</strong> {v(cd.contact)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      style={{
                                        fontSize: "11px",
                                        paddingBottom: 2,
                                      }}
                                    >
                                      <strong>Call Date:</strong>{" "}
                                      {fmtDate(cd.callDate)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{ fontSize: "11px" }}>
                                      <strong>Inspection Att. Date:</strong>{" "}
                                      {fmtDate(cd.inspectionAttDt)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                            <td
                              style={{
                                verticalAlign: "top",
                                padding: "3px 5px",
                                borderLeft: "1px solid #444",
                              }}
                            >
                              <table
                                style={{
                                  width: "100%",
                                  borderCollapse: "collapse",
                                }}
                              >
                                <tbody>
                                  <tr>
                                    <td
                                      style={{
                                        fontSize: "11px",
                                        paddingBottom: 2,
                                      }}
                                    >
                                      <strong>Vendor:</strong> {v(vd.vendor)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      style={{
                                        fontSize: "11px",
                                        paddingBottom: 2,
                                      }}
                                    >
                                      <strong>Sub Vendor:</strong>{" "}
                                      {v(vd.subVendor)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      style={{
                                        fontSize: "11px",
                                        paddingBottom: 2,
                                      }}
                                    >
                                      <strong>Contact:</strong> {v(vd.contact)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{ fontSize: "11px" }}>
                                      <strong>Phone:</strong> {v(vd.phone)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td
                              colSpan={2}
                              style={{ fontSize: "11px", padding: "2px 5px" }}
                            >
                              <strong>Extra Visit / Date:</strong> {v(ev.date)}{" "}
                              &nbsp;&nbsp; <strong>Comment:</strong>{" "}
                              {v(ev.comment)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* ── INSPECTION ITEMS ── */}
                      <table className="items-table mt-n1">
                        <tbody>
                          <tr>
                            <td colSpan={9} className="section-hdr">
                              INSPECTION ITEMS
                            </td>
                          </tr>
                          <tr>
                            <td className="col-hdr" style={{ width: "8%" }}>
                              PO Line No.
                            </td>
                            <td
                              className="col-hdr"
                              style={{ width: "24%", textAlign: "left" }}
                            >
                              Description
                            </td>
                            <td
                              className="col-hdr"
                              style={{ width: "16%", textAlign: "left" }}
                            >
                              Drg No. / Heat No.
                            </td>
                            <td className="col-hdr" style={{ width: "8%" }}>
                              Offered
                            </td>
                            <td className="col-hdr" style={{ width: "8%" }}>
                              Inspected
                            </td>
                            <td className="col-hdr" style={{ width: "8%" }}>
                              Accepted
                            </td>
                            <td className="col-hdr" style={{ width: "7%" }}>
                              Hold
                            </td>
                            <td className="col-hdr" style={{ width: "7%" }}>
                              Reject
                            </td>
                            <td className="col-hdr" style={{ width: "14%" }}>
                              Insp. Type
                            </td>
                          </tr>
                          {items.length === 0 ? (
                            <tr>
                              <td
                                colSpan={9}
                                style={{
                                  textAlign: "center",
                                  padding: "5px",
                                  color: "#999",
                                  fontSize: "11px",
                                }}
                              >
                                No items recorded.
                              </td>
                            </tr>
                          ) : (
                            items.map((item: any, i: number) => (
                              <tr key={i}>
                                <td>{v(item.poLineNo)}</td>
                                <td
                                  className="text-left"
                                  style={{ textAlign: "left" }}
                                >
                                  {v(item.description)}
                                </td>
                                <td
                                  className="text-left"
                                  style={{ textAlign: "left" }}
                                >
                                  {v(item.drgOrHeatNo)}
                                </td>
                                <td>{v(item.qtyOffered)}</td>
                                <td>{v(item.qtyInspected)}</td>
                                <td>{v(item.qtyAccepted)}</td>
                                <td>{v(item.qtyHold)}</td>
                                <td>{v(item.qtyReject)}</td>
                                <td>{v(item.inspectionType)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>

                      {/* ── INSPECTION ACTIVITIES ── */}
                      <table className="report-table mt-n1">
                        <tbody>
                          <tr>
                            <td className="section-hdr">
                              INSPECTION ACTIVITIES
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="activities-box">
                        {v(report.inspectionActivities) || " "}
                      </div>

                      {/* ── CONCLUSION ── */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "22%" }} />
                          <col style={{ width: "78%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td className="lbl">Conclusion</td>
                            <td className="val">{v(report.conclusion)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* ── REFERENCE DOCUMENTS ── */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "30%" }} />
                          <col style={{ width: "50%" }} />
                          <col style={{ width: "20%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={3} className="section-hdr">
                              REFERENCE DOCUMENTS FOR INSPECTION
                            </td>
                          </tr>
                          <tr>
                            <td className="col-hdr">Document</td>
                            <td className="col-hdr">Reference Number</td>
                            <td className="col-hdr">Rev. No.</td>
                          </tr>
                          {refs.length === 0 ? (
                            <tr>
                              <td
                                colSpan={3}
                                style={{
                                  textAlign: "center",
                                  padding: "4px",
                                  color: "#999",
                                  fontSize: "11px",
                                }}
                              >
                                No reference documents recorded.
                              </td>
                            </tr>
                          ) : (
                            refs.map((doc: any, i: number) => (
                              <tr key={i}>
                                <td className="lbl" style={{ fontWeight: 500 }}>
                                  {v(doc.document)}
                                </td>
                                <td className="val">
                                  {v(doc.referenceNumber)}
                                </td>
                                <td
                                  className="val"
                                  style={{ textAlign: "center" }}
                                >
                                  {v(doc.revNo)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>

                      {/* ── CALIBRATION STATUS ── */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "28%" }} />
                          <col style={{ width: "18%" }} />
                          <col style={{ width: "18%" }} />
                          <col style={{ width: "18%" }} />
                          <col style={{ width: "18%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={5} className="section-hdr">
                              CALIBRATION STATUS OF INSTRUMENTS
                            </td>
                          </tr>
                          <tr>
                            <td className="col-hdr">Equipment / Instrument</td>
                            <td className="col-hdr">I.D. Number</td>
                            <td className="col-hdr">Calibration Date</td>
                            <td className="col-hdr">Due Date</td>
                            <td className="col-hdr">NABL Certified</td>
                          </tr>
                          {calib.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                style={{
                                  textAlign: "center",
                                  padding: "4px",
                                  color: "#999",
                                  fontSize: "11px",
                                }}
                              >
                                No calibration records.
                              </td>
                            </tr>
                          ) : (
                            calib.map((c: any, i: number) => (
                              <tr key={i}>
                                <td className="val">{v(c.equipment)}</td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    fontSize: "11px",
                                  }}
                                >
                                  {v(c.idNumber)}
                                </td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    fontSize: "11px",
                                  }}
                                >
                                  {fmtDate(c.calibrationDate)}
                                </td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    fontSize: "11px",
                                  }}
                                >
                                  {fmtDate(c.dueDate)}
                                </td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    fontSize: "11px",
                                  }}
                                >
                                  {v(c.nablCertified)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>

                      {/* ── SIGNATURES ── */}
                      <table className="sign-table mt-n1">
                        <colgroup>
                          <col style={{ width: "50%" }} />
                          <col style={{ width: "50%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td
                              style={{
                                fontWeight: 600,
                                fontSize: "11px",
                                textAlign: "center",
                              }}
                            >
                              FOR VENDOR
                            </td>
                            <td
                              style={{
                                fontWeight: 600,
                                fontSize: "11px",
                                textAlign: "center",
                              }}
                            >
                              FOR NIIT SURVEYOR, BARAMATI
                            </td>
                          </tr>
                          <tr>
                            <td style={{ height: 32 }}></td>
                            <td style={{ height: 32 }}></td>
                          </tr>
                          <tr>
                            <td>Name: {v(sigs.vendor?.name)}</td>
                            <td>Name: {v(sigs.niit?.name)}</td>
                          </tr>
                          <tr>
                            <td>Signature:</td>
                            <td>Signature:</td>
                          </tr>
                          <tr>
                            <td>Date: {fmtDate(sigs.vendor?.date)}</td>
                            <td>Date: {fmtDate(sigs.niit?.date)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {/* ── end report-body ── */}
                  </td>
                </tr>
              </tbody>
              <tfoot style={{ display: "table-footer-group" }}>
                <tr>
                  <td style={{ padding: "0 0 5mm 0" }}>
                    <div className="tfoot-content">
                      <ReportFooter />
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* The fixed footer that only appears in print on every page at the bottom */}
      <div className="print-fixed-footer">
        <div
          className={`print-fixed-footer-inner ${bwMode ? "bw" : ""}`}
          style={{ border: "none", boxShadow: "none" }}
        >
          <ReportFooter />
        </div>
      </div>
    </>
  );
};
