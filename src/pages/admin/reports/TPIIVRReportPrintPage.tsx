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
    body.autoprint-mode { opacity: 1; overflow: hidden !important; height: 297mm !important; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; height: 297mm !important; overflow: hidden !important; }
    #report-root { background: #fff !important; padding: 0 !important; display: block !important; height: 297mm !important; overflow: hidden !important; }
    #report-root > div {
      width: 210mm !important; height: 297mm !important;
      margin: 0 !important; padding: 5mm 8mm 50mm 8mm !important;
      box-sizing: border-box !important; position: relative !important;
      overflow: hidden !important; break-inside: avoid !important;
      page-break-after: avoid !important;
    }
    .report { 
      margin: 0 !important; box-shadow: none !important; 
      width: 100% !important; 
      zoom: 0.86;
      transform: scale(0.86); transform-origin: top center;
    }
    .print-fixed-footer { position: absolute !important; bottom: 5mm !important; left: 0 !important; width: 100% !important; display: flex !important; justify-content: center !important; background: transparent !important; margin: 0 !important; }
    .print-fixed-footer-inner { width: 200mm !important; transform: none !important; background: transparent !important; margin: 0 auto !important; }
    .tfoot-content { display: none !important; }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  .report { background: #fff; border: none; border-radius: 6px; overflow: hidden; }
  .rpt-header { background: #185FA5; padding: 8px 10px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; }
  .logo-box { width: 80px; height: 80px; background: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 2px; }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #fff; }
  .hdr-center .org { font-size: 15px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 9px; color: #d7e8fb; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 9px; color: #eef6ff; font-weight: 700; margin-top: 2px; }
  .footer-meta { background: #185FA5; color: #d7e8fb; font-size: 8px; text-align: center; padding: 3px 8px; }
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
  .bw .items-table td, .bw .items-table th { border-color: #888 !important; }
  .bw .activities-box { border-color: #888 !important; }
  .rpt-title { background: #E6F1FB; text-align: center; padding: 7px; font-size: 14px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #b8cfe7; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 11px; font-weight: 700; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .report-table td, .report-table th { border: 1px solid #d9e1ea; padding: 3px 5px; vertical-align: middle; word-break: break-word; font-size: 10px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 9.5px; text-align: center; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 10px; white-space: nowrap; }
  .val { font-size: 10.5px; color: #000; }
  .items-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .items-table td, .items-table th { border: 1px solid #d9e1ea; padding: 3px 5px; font-size: 10px; vertical-align: middle; word-break: break-word; text-align: center; }
  .items-table th { background: #E6F1FB; color: #0C447C; font-weight: 700; }
  .items-table td.text-left { text-align: left; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .sign-table td { border: 1px solid #d9e1ea; padding: 4px 6px; font-size: 11px; vertical-align: top; }
  .mt-n1 { margin-top: -1px; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .report-body { border: 1px solid #444; border-radius: 4px; overflow: hidden; }
  .activities-box { border: 1px solid #d9e1ea; padding: 6px 8px; font-size: 11px; min-height: 40px; white-space: pre-wrap; word-break: break-word; }
  .footer { background: #f8fafc; padding: 6px 10px; font-size: 9px; color: #4b5563; margin-top: 8px; border-top: 3px solid #185FA5; line-height: 1.4; display: flex; align-items: center; gap: 8px; }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

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
          <br />
          Powered by: Viplora Tech
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

                        {/* ── JOB DETAILS ── */}
                        <table className="report-table mt-n1">
                          <colgroup>
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "23%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "18%" }} />
                            <col style={{ width: "32%" }} />
                          </colgroup>
                          <tbody>
                            <tr>
                              <td colSpan={5} className="section-hdr">
                                JOB DETAILS
                              </td>
                            </tr>
                            <tr>
                              <td className="lbl">I.R No:</td>
                              <td className="val" style={{ fontWeight: 600 }}>{v(report.irNo)}</td>
                              <td className="val" style={{ fontWeight: 600, textAlign: 'center' }}><span style={{ fontSize: '10px', fontWeight: 600 }}>IR Rev.: </span>{v(report.irRev)}</td>
                              <td className="lbl">Dt. of Inspection</td>
                              <td className="val" style={{ fontWeight: 600 }}>{fmtDate(report.dtOfInspection)}</td>
                            </tr>
                          </tbody>
                        </table>

                        <table className="report-table mt-n1">
                          <colgroup>
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "35%" }} />
                            <col style={{ width: "18%" }} />
                            <col style={{ width: "32%" }} />
                          </colgroup>
                          <tbody>
                            <tr>
                              <td className="lbl">Client:-</td>
                              <td className="val">{v(report.client)}</td>
                              <td className="lbl">Inspection location</td>
                              <td className="val">{v(report.inspectionLocation)}</td>
                            </tr>
                            <tr>
                              <td className="lbl">Project</td>
                              <td className="val">{v(report.project)}</td>
                              <td className="lbl">Appd. QAP No</td>
                              <td className="val">{v(report.appdQapNo)}</td>
                            </tr>
                            <tr>
                              <td className="lbl">Client PO No</td>
                              <td className="val">{v(report.clientPoNo)}</td>
                              <td className="lbl">Appd. QAP Dt.</td>
                              <td className="val">{fmtDate(report.appdQapDt)}</td>
                            </tr>
                            <tr>
                              <td className="lbl">PO Amed. No</td>
                              <td className="val">{v(report.poAmedNo)}</td>
                              <td className="lbl">Part Name</td>
                              <td className="val">{v(report.partName)}</td>
                            </tr>
                            <tr>
                              <td className="lbl">PO Date</td>
                              <td className="val">{fmtDate(report.poDate)}</td>
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
                            <td className="col-hdr" style={{ width: "8%" }} rowSpan={2}>
                              PO Line No.
                            </td>
                            <td
                              className="col-hdr"
                              style={{ width: "24%", textAlign: "left" }}
                              rowSpan={2}
                            >
                              Description
                            </td>
                            <td
                              className="col-hdr"
                              style={{ width: "16%", textAlign: "left" }}
                              rowSpan={2}
                            >
                              Drg No. / Heat No.
                            </td>
                            <td className="col-hdr" colSpan={5} style={{ textAlign: "center" }}>
                              Quantity in Nos.
                            </td>
                            <td className="col-hdr" style={{ width: "14%" }} rowSpan={2}>
                              Insp. Type
                            </td>
                          </tr>
                          <tr>
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
                              FOR VENDOR{v(vd.vendor) ? `: ${v(vd.vendor)}` : ""}
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
                  <td style={{ padding: 0 }}>
                    <div
                      className="tfoot-content"
                      style={{ height: "15mm" }}
                    ></div>
                  </td>
                </tr>
              </tfoot>
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
