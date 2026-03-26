import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { getAWSDReportById } from "../../../api/customerApi";

// ─── Print Styles ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 0; }
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
      width: 297mm !important;
      min-height: 210mm !important;
      padding: 5mm !important;
      box-sizing: border-box !important;
    }
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 7pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  * { box-sizing: border-box; }

  /* ── Main border table ── */
  .outer-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; }
  .outer-table td, .outer-table th { border: 1px solid #555; padding: 2px 4px; vertical-align: middle; word-break: break-word; }

  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .report-table td, .report-table th { border: 1px solid #555; padding: 2px 3px; vertical-align: middle; word-break: break-word; }

  .section-hdr { background: #185FA5; color: #fff; font-weight: bold; font-size: 7pt; text-align: center; letter-spacing: 0.5px; padding: 2px 3px; }
  .col-hdr { background: #e8ecf0; font-weight: bold; font-size: 6.5pt; text-align: center; vertical-align: middle; }
  .col-hdr-db { background: #dbeafe; font-weight: bold; font-size: 6.5pt; text-align: center; vertical-align: middle; }
  .col-hdr-disc { background: #fef3c7; font-weight: bold; font-size: 6.5pt; text-align: center; vertical-align: middle; }

  .lbl { background: #f5f7fa; font-weight: 600; font-size: 7pt; }
  .val { font-size: 7pt; }

  .title-cell { text-align: center; font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; text-decoration: underline; padding: 4px 0; }
  .company-name { font-size: 9pt; font-weight: bold; text-transform: uppercase; text-align: center; color: #1a3c8f; }
  .company-sub { font-size: 5.5pt; text-align: center; color: #333; line-height: 1.4; }
  .company-iso { font-size: 5.5pt; text-align: center; font-weight: bold; color: #333; }

  .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .obs-table td, .obs-table th { border: 1px solid #555; padding: 1px 2px; font-size: 6.5pt; vertical-align: middle; text-align: center; word-break: break-word; }
  .obs-table td.tl { text-align: left; }

  .cert-para { font-size: 6.5pt; font-style: italic; color: #333; padding: 3px 4px; border: 1px solid #555; margin-top: -1px; line-height: 1.4; }

  .sign-table { width: 100%; border-collapse: collapse; }
  .sign-table td { border: 1px solid #555; padding: 3px 5px; font-size: 7pt; vertical-align: top; }

  .mt-n1 { margin-top: -1px; }
  .footer-text { font-size: 5.5pt; text-align: center; color: #555; margin-top: 3px; }
  .reject-cell { font-weight: bold; color: #b91c1c; }
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

export const AWSDReportPrintPage: React.FC = () => {
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

  const goBack = () => {
    if (locState?.customerId) {
      navigate(`/admin/customers/${locState.customerId}`, {
        state: {
          activeTab: "reports",
          reportSubType: locState.reportSubType ?? "awsd",
        },
      });
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (!id) return;
    getAWSDReportById(id)
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

  const obs = report.observations ?? [];
  const cert = report.certification ?? {};

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* ── No-Print Action Bar ── */}
      <div
        className="no-print"
        style={{
          padding: "10px 16px",
          background: "#1e293b",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          onClick={goBack}
          style={{
            padding: "6px 14px",
            background: "#334155",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
        >Back</button>
        <button
          onClick={() => window.print()}
          style={{
            padding: "6px 14px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
        >Download / Print</button>
        <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 12 }}>
          Report No: {v(report.reportNo)} &nbsp;|&nbsp; Status:{" "}
          {v(report.status)?.toUpperCase()}
        </span>
      </div>

      {/* ── Report Content ── */}
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
            width: "297mm",
            minHeight: "210mm",
            background: "#fff",
            margin: "0 auto",
            padding: "5mm",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            boxSizing: "border-box",
          }}
        >
          {/* ── HEADER ── */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1.5px solid #444",
              marginBottom: -1,
            }}
          >
            <tbody>
              <tr>
                {/* Logo */}
                <td
                  rowSpan={2}
                  style={{
                    width: "10%",
                    textAlign: "center",
                    verticalAlign: "middle",
                    border: "1px solid #444",
                    padding: 4,
                  }}
                >
                  <div
                    style={{
                      border: "2px solid #1a3c8f",
                      borderRadius: 4,
                      width: 48,
                      height: 48,
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 7,
                      color: "#1a3c8f",
                      fontWeight: "bold",
                    }}
                  >NIIT<br />LOGO</div>
                </td>
                {/* Company info */}
                <td
                  style={{
                    textAlign: "center",
                    verticalAlign: "middle",
                    border: "1px solid #444",
                    padding: "2px 6px",
                  }}
                >
                  <div className="company-name">
                    National Industrial Inspection &amp; Training
                  </div>
                  <div className="company-sub">
                    THIRD PARTY INSPECTION | NDT SERVICES &amp; TRAINING | NDT
                    CONSULTANCY | PHYSICAL CALIBRATION | FACTORY INSPECTION
                    UNDER MAHARASHTRA FACTORY ACT | QUALITY MANAGEMENT SYSTEM
                    TRAINING
                  </div>
                  <div className="company-iso">
                    (AN ISO 9001:2015 CERTIFIED ORGANIZATION)
                  </div>
                </td>
                {/* Format info */}
                <td
                  rowSpan={2}
                  style={{
                    width: "20%",
                    verticalAlign: "middle",
                    border: "1px solid #444",
                    padding: "3px 6px",
                    fontSize: "7pt",
                    lineHeight: 1.9,
                  }}
                >
                  <div>
                    <strong>Report No:</strong> {v(report.reportNo)}
                  </div>
                  <div>
                    <strong>Format No:</strong> FMT-NDT-AWSD-01
                  </div>
                  <div>
                    <strong>Rev. No:</strong> 00
                  </div>
                  <div>
                    <strong>Page No:</strong> 1/1
                  </div>
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    textAlign: "center",
                    border: "1px solid #444",
                    padding: "3px 6px",
                  }}
                >
                  <div className="title-cell">
                    Report of UT of Welds (AWS D1.1)
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── JOB INFORMATION ── */}
          <table className="report-table mt-n1">
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td colSpan={6} className="section-hdr">
                  JOB INFORMATION
                </td>
              </tr>
              <tr>
                <td className="lbl">Project</td>
                <td className="val" colSpan={3}>
                  {v(report.project)}
                </td>
                <td className="lbl">Weld Identification</td>
                <td className="val">{v(report.weldIdentification)}</td>
              </tr>
              <tr>
                <td className="lbl">Material Thickness</td>
                <td className="val">{v(report.materialThickness)}</td>
                <td className="lbl">Weld Joint (AWS)</td>
                <td className="val">{v(report.weldJointAWS)}</td>
                <td className="lbl">Welding Process</td>
                <td className="val">{v(report.weldingProcess)}</td>
              </tr>
              <tr>
                <td className="lbl">Quality Requirements — Section</td>
                <td className="val" colSpan={3}>
                  {v(report.qualityRequirementsSection)}
                </td>
                <td className="lbl">Remarks</td>
                <td className="val">{v(report.remarks)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── OBSERVATIONS ── */}
          <table className="obs-table mt-n1">
            <tbody>
              <tr>
                <td colSpan={16} className="section-hdr">
                  OBSERVATIONS
                </td>
              </tr>
              {/* Header row 1 */}
              <tr>
                <td className="col-hdr" rowSpan={2} style={{ width: "3.5%" }}>
                  Line
                  <br />
                  No.
                </td>
                <td className="col-hdr" rowSpan={2} style={{ width: "6%" }}>
                  Indication
                  <br />
                  No.
                </td>
                <td className="col-hdr" rowSpan={2} style={{ width: "7%" }}>
                  Transducer
                  <br />
                  Angle
                </td>
                <td className="col-hdr" rowSpan={2} style={{ width: "4.5%" }}>
                  From
                  <br />
                  Face
                </td>
                <td className="col-hdr" rowSpan={2} style={{ width: "3.5%" }}>
                  Leg
                </td>
                <td
                  className="col-hdr-db"
                  colSpan={4}
                  style={{ background: "#dbeafe" }}
                >
                  DECIBELS
                </td>
                <td
                  className="col-hdr-disc"
                  colSpan={5}
                  style={{ background: "#fef3c7" }}
                >
                  DISCONTINUITY
                </td>
                <td className="col-hdr" rowSpan={2} style={{ width: "6%" }}>
                  Evaluation
                </td>
                <td className="col-hdr" rowSpan={2} style={{ width: "8%" }}>
                  Remarks
                </td>
              </tr>
              {/* Header row 2 */}
              <tr>
                <td
                  className="col-hdr-db"
                  style={{ width: "5.5%", background: "#dbeafe" }}
                >
                  a.
                  <br />
                  Ind. Level
                </td>
                <td
                  className="col-hdr-db"
                  style={{ width: "5.5%", background: "#dbeafe" }}
                >
                  b.
                  <br />
                  Ref. Level
                </td>
                <td
                  className="col-hdr-db"
                  style={{ width: "6%", background: "#dbeafe" }}
                >
                  c.
                  <br />
                  Atten. Factor
                </td>
                <td
                  className="col-hdr-db"
                  style={{ width: "5.5%", background: "#dbeafe" }}
                >
                  d.
                  <br />
                  Ind. Rating
                </td>
                <td
                  className="col-hdr-disc"
                  style={{ width: "5%", background: "#fef3c7" }}
                >
                  Length
                </td>
                <td
                  className="col-hdr-disc"
                  style={{ width: "5.5%", background: "#fef3c7" }}
                >
                  Angular
                  <br />
                  Dist.
                </td>
                <td
                  className="col-hdr-disc"
                  style={{ width: "6%", background: "#fef3c7" }}
                >
                  Depth
                  <br />
                  from A
                </td>
                <td
                  className="col-hdr-disc"
                  style={{ width: "4.5%", background: "#fef3c7" }}
                >
                  From
                  <br />X
                </td>
                <td
                  className="col-hdr-disc"
                  style={{ width: "4.5%", background: "#fef3c7" }}
                >
                  From
                  <br />Y
                </td>
              </tr>

              {/* Empty rows if no data */}
              {obs.length === 0
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ height: 16 }}>
                      <td>{i + 1}</td>
                      {Array.from({ length: 15 }).map((__, j) => (
                        <td key={j}></td>
                      ))}
                    </tr>
                  ))
                : obs.map((o: any, i: number) => (
                    <tr key={i} style={{ height: 16 }}>
                      <td>{v(o.lineNo)}</td>
                      <td>{v(o.indicationNo)}</td>
                      <td>{v(o.transducerAngle)}</td>
                      <td>{v(o.fromFace)}</td>
                      <td>{v(o.leg)}</td>
                      <td style={{ background: "#f0f7ff" }}>
                        {v(o.decibels?.indicationLevel)}
                      </td>
                      <td style={{ background: "#f0f7ff" }}>
                        {v(o.decibels?.referenceLevel)}
                      </td>
                      <td style={{ background: "#f0f7ff" }}>
                        {v(o.decibels?.attenuationFactor)}
                      </td>
                      <td style={{ background: "#f0f7ff" }}>
                        {v(o.decibels?.indicationRating)}
                      </td>
                      <td style={{ background: "#fffbeb" }}>
                        {v(o.discontinuity?.length)}
                      </td>
                      <td style={{ background: "#fffbeb" }}>
                        {v(o.discontinuity?.angularDistance)}
                      </td>
                      <td style={{ background: "#fffbeb" }}>
                        {v(o.discontinuity?.depthFromA)}
                      </td>
                      <td style={{ background: "#fffbeb" }}>
                        {v(o.discontinuity?.distanceFromX)}
                      </td>
                      <td style={{ background: "#fffbeb" }}>
                        {v(o.discontinuity?.distanceFromY)}
                      </td>
                      <td
                        className={
                          o.evaluation === "Reject" ? "reject-cell" : ""
                        }
                      >
                        {v(o.evaluation)}
                      </td>
                      <td className="tl">{v(o.remarks)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {/* ── CERTIFICATION TEXT ── */}
          <div className="cert-para">
            We, the undersigned, certify that the statements in this record are
            correct and that the welds were prepared and tested in conformance
            with the requirements of Clause 8, Part F of AWS D1.1/D1.1M,&nbsp;
            <strong>({v(cert.year) || "____"})</strong> Structural Welding
            Code—Steel.
          </div>

          {/* ── CERTIFICATION / SIGNATURES ── */}
          <table className="sign-table mt-n1">
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "4%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "4%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="lbl">Test Date</td>
                <td className="val">{fmtDate(cert.testDate)}</td>
                <td style={{ border: "none", padding: 0 }}></td>
                <td className="lbl">Manufacturer or Contractor</td>
                <td className="val">{v(cert.manufacturerOrContractor)}</td>
                <td style={{ border: "none", padding: 0 }}></td>
                <td className="lbl">Date</td>
                <td className="val">{fmtDate(cert.date)}</td>
              </tr>
              <tr>
                <td className="lbl">Inspected By</td>
                <td className="val">{v(cert.inspectedBy)}</td>
                <td style={{ border: "none", padding: 0 }}></td>
                <td className="lbl">Authorized By</td>
                <td className="val">{v(cert.authorizedBy)}</td>
                <td style={{ border: "none", padding: 0 }}></td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td style={{ height: 22 }}>Signature:</td>
                <td></td>
                <td style={{ border: "none", padding: 0 }}></td>
                <td>Signature:</td>
                <td></td>
                <td style={{ border: "none", padding: 0 }}></td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>

          {/* ── Footer ── */}
          <div className="footer-text">
            Corp Office: 1st Floor, Plot No.PAP 3/28, Behind BSNL Office, MIDC,
            Baramati, Dist-Pune 413133 &nbsp;|&nbsp; Ph. +91 9860186056, +91
            7875154431 &nbsp;|&nbsp; Reg. Office: A/p - Kuthare, Tal - Patan,
            Dist-Satara 415112 &nbsp;|&nbsp; Website: www.niitindt.com
            &nbsp;|&nbsp; Email: niit04@gmail.com
          </div>
        </div>
      </div>
    </>
  );
};







