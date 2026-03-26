import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { getTPIIVRReportById } from "../../../api/customerApi";

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
  .lbl { background: #f7fafc; font-weight: 600; font-size: 7.5pt; white-space: nowrap; }
  .val { font-size: 7.5pt; }
  .report-title-table { width: 100%; border-collapse: collapse; }
  .report-title-table td { border: 1px solid #444; padding: 2px 6px; }
  .company-name { font-size: 9.5pt; font-weight: bold; text-transform: uppercase; text-align: center; color: #1a3c8f; }
  .company-sub { font-size: 6.5pt; text-align: center; color: #333; line-height: 1.5; }
  .company-iso { font-size: 6.5pt; text-align: center; font-weight: bold; color: #333; }
  .report-title { font-size: 10pt; font-weight: bold; text-align: center; letter-spacing: 1px; text-transform: uppercase; text-decoration: underline; margin: 4px 0; }
  .items-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .items-table td, .items-table th { border: 1px solid #444; padding: 2px 3px; font-size: 7pt; vertical-align: middle; word-break: break-word; text-align: center; }
  .items-table td.text-left { text-align: left; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: -1px; }
  .sign-table td { border: 1px solid #444; padding: 3px 5px; font-size: 7.5pt; vertical-align: top; }
  .mt-n1 { margin-top: -1px; }
  .footer-text { font-size: 6pt; text-align: center; color: #555; margin-top: 4px; }
  .activities-box { border: 1px solid #444; padding: 4px 6px; font-size: 7.5pt; min-height: 40px; white-space: pre-wrap; word-break: break-word; margin-top: -1px; }
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
  const locState = location.state as { customerId?: string; reportSubType?: string } | null;
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("autoprint") === "true";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const goBack = () => {
    if (locState?.customerId) {
      navigate(`/admin/customers/${locState.customerId}`, {
        state: { activeTab: "reports", reportSubType: locState.reportSubType ?? "tpi-ivr" },
      });
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (!id) return;
    getTPIIVRReportById(id)
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

  const cd   = report.clientDetails  ?? {};
  const vd   = report.vendorDetails  ?? {};
  const ev   = report.extraVisit     ?? {};
  const items = report.inspectionItems ?? [];
  const refs  = report.referenceDocuments ?? [];
  const calib = report.calibrationStatus ?? [];
  const sigs  = report.signatures    ?? {};

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
        >
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          style={{ padding: "6px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
        >
          🖨 Print
        </button>
        <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 12 }}>
          I.R. No: {v(report.irNo)} &nbsp;|&nbsp; Status: {v(report.status)?.toUpperCase()}
        </span>
      </div>

      {/* ── Report Content ── */}
      <div id="report-root" style={{ background: "#f1f5f9", minHeight: "100vh", padding: "24px 16px" }}>
        <div style={{ width: "210mm", minHeight: "297mm", background: "#fff", margin: "0 auto", padding: "5mm", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>

          {/* ── HEADER ── */}
          <table className="report-title-table" style={{ marginBottom: -1 }}>
            <tbody>
              <tr>
                <td rowSpan={3} style={{ width: "14%", textAlign: "center", verticalAlign: "middle", padding: 4 }}>
                  <div style={{ border: "2px solid #1a3c8f", borderRadius: 4, width: 56, height: 56, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#1a3c8f", fontWeight: "bold" }}>
                    niit
                  </div>
                </td>
                <td style={{ textAlign: "center", verticalAlign: "middle", padding: "2px 6px" }}>
                  <div className="company-name">National Industrial Inspection &amp; Training</div>
                  <div className="company-sub">
                    THIRD PARTY INSPECTION | NDT SERVICES &amp; TRAINING | NDT CONSULTANCY | PHYSICAL CALIBRATION |<br />
                    FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT | QUALITY MANAGEMENT SYSTEM TRAINING
                  </div>
                  <div className="company-iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
                </td>
                <td rowSpan={3} style={{ width: "22%", verticalAlign: "middle", fontSize: "7.5pt", lineHeight: 1.8, padding: "2px 6px" }}>
                  <div><strong>I.R. No:</strong> {v(report.irNo)}</div>
                  <div><strong>IR Rev.:</strong> {v(report.irRev)}</div>
                  <div><strong>Format No:</strong> NIIT-16 Rev.01</div>
                  <div><strong>Date:</strong> {fmtDate(report.dtOfInspection)}</div>
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: "center", padding: "3px 6px" }}>
                  <div className="report-title">Inspection Visit Report</div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "2px 6px", fontSize: "7.5pt" }}>
                  <strong>Client:</strong> {v(report.client)} &nbsp;&nbsp; <strong>Inspection Location:</strong> {v(report.inspectionLocation)}
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
                <td style={{ verticalAlign: "top", padding: "3px 5px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr><td style={{ fontSize: "7.5pt", paddingBottom: 2 }}><strong>Ref:</strong> {v(cd.ref)}</td></tr>
                      <tr><td style={{ fontSize: "7.5pt", paddingBottom: 2 }}><strong>Contact:</strong> {v(cd.contact)}</td></tr>
                      <tr><td style={{ fontSize: "7.5pt", paddingBottom: 2 }}><strong>Call Date:</strong> {fmtDate(cd.callDate)}</td></tr>
                      <tr><td style={{ fontSize: "7.5pt" }}><strong>Inspection Att. Date:</strong> {fmtDate(cd.inspectionAttDt)}</td></tr>
                    </tbody>
                  </table>
                </td>
                <td style={{ verticalAlign: "top", padding: "3px 5px", borderLeft: "1px solid #444" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr><td style={{ fontSize: "7.5pt", paddingBottom: 2 }}><strong>Vendor:</strong> {v(vd.vendor)}</td></tr>
                      <tr><td style={{ fontSize: "7.5pt", paddingBottom: 2 }}><strong>Sub Vendor:</strong> {v(vd.subVendor)}</td></tr>
                      <tr><td style={{ fontSize: "7.5pt", paddingBottom: 2 }}><strong>Contact:</strong> {v(vd.contact)}</td></tr>
                      <tr><td style={{ fontSize: "7.5pt" }}><strong>Phone:</strong> {v(vd.phone)}</td></tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ fontSize: "7.5pt", padding: "2px 5px" }}>
                  <strong>Extra Visit / Date:</strong> {v(ev.date)} &nbsp;&nbsp; <strong>Comment:</strong> {v(ev.comment)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── INSPECTION ITEMS ── */}
          <table className="items-table mt-n1">
            <tbody>
              <tr><td colSpan={9} className="section-hdr">INSPECTION ITEMS</td></tr>
              <tr>
                <td className="col-hdr" style={{ width: "8%" }}>PO Line No.</td>
                <td className="col-hdr" style={{ width: "24%", textAlign: "left" }}>Description</td>
                <td className="col-hdr" style={{ width: "16%", textAlign: "left" }}>Drg No. / Heat No.</td>
                <td className="col-hdr" style={{ width: "8%" }}>Offered</td>
                <td className="col-hdr" style={{ width: "8%" }}>Inspected</td>
                <td className="col-hdr" style={{ width: "8%" }}>Accepted</td>
                <td className="col-hdr" style={{ width: "7%" }}>Hold</td>
                <td className="col-hdr" style={{ width: "7%" }}>Reject</td>
                <td className="col-hdr" style={{ width: "14%" }}>Insp. Type</td>
              </tr>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "5px", color: "#999", fontSize: "7.5pt" }}>No items recorded.</td>
                </tr>
              ) : (
                items.map((item: any, i: number) => (
                  <tr key={i}>
                    <td>{v(item.poLineNo)}</td>
                    <td className="text-left" style={{ textAlign: "left" }}>{v(item.description)}</td>
                    <td className="text-left" style={{ textAlign: "left" }}>{v(item.drgOrHeatNo)}</td>
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
              <tr><td className="section-hdr">INSPECTION ACTIVITIES</td></tr>
            </tbody>
          </table>
          <div className="activities-box">{v(report.inspectionActivities) || " "}</div>

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
              <tr><td colSpan={3} className="section-hdr">REFERENCE DOCUMENTS FOR INSPECTION</td></tr>
              <tr>
                <td className="col-hdr">Document</td>
                <td className="col-hdr">Reference Number</td>
                <td className="col-hdr">Rev. No.</td>
              </tr>
              {refs.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "4px", color: "#999", fontSize: "7.5pt" }}>No reference documents recorded.</td>
                </tr>
              ) : (
                refs.map((doc: any, i: number) => (
                  <tr key={i}>
                    <td className="lbl" style={{ fontWeight: 500 }}>{v(doc.document)}</td>
                    <td className="val">{v(doc.referenceNumber)}</td>
                    <td className="val" style={{ textAlign: "center" }}>{v(doc.revNo)}</td>
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
              <tr><td colSpan={5} className="section-hdr">CALIBRATION STATUS OF INSTRUMENTS</td></tr>
              <tr>
                <td className="col-hdr">Equipment / Instrument</td>
                <td className="col-hdr">I.D. Number</td>
                <td className="col-hdr">Calibration Date</td>
                <td className="col-hdr">Due Date</td>
                <td className="col-hdr">NABL Certified</td>
              </tr>
              {calib.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "4px", color: "#999", fontSize: "7.5pt" }}>No calibration records.</td>
                </tr>
              ) : (
                calib.map((c: any, i: number) => (
                  <tr key={i}>
                    <td className="val">{v(c.equipment)}</td>
                    <td style={{ textAlign: "center", fontSize: "7.5pt" }}>{v(c.idNumber)}</td>
                    <td style={{ textAlign: "center", fontSize: "7.5pt" }}>{fmtDate(c.calibrationDate)}</td>
                    <td style={{ textAlign: "center", fontSize: "7.5pt" }}>{fmtDate(c.dueDate)}</td>
                    <td style={{ textAlign: "center", fontSize: "7.5pt" }}>{v(c.nablCertified)}</td>
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
                <td style={{ fontWeight: 600, fontSize: "7pt", textAlign: "center" }}>FOR VENDOR</td>
                <td style={{ fontWeight: 600, fontSize: "7pt", textAlign: "center" }}>FOR NIIT SURVEYOR, BARAMATI</td>
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
