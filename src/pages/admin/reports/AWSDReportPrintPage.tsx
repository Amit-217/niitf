import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { getAWSDReportById } from "../../../api/customerApi";
import niitLogo from "../../../assets/logo.png";

// â"€â"€â"€ Print Styles â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }
  @media screen { body.autoprint-mode { opacity: 0; } }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; min-height: 210mm !important; }
    #report-root { background: #fff !important; padding: 0 !important; display: block !important; min-height: 210mm !important; }
    #report-root > div {
      width: 297mm !important; min-height: 200mm !important;
      margin: 0 !important; padding: 5mm 5mm 45mm 5mm !important;
      box-sizing: border-box !important; position: relative !important;
      break-inside: avoid !important;
      page-break-after: auto !important;
    }
    .report { 
      margin: 0 !important; box-shadow: none !important; 
      width: 100% !important; 
    }
    .print-fixed-footer {
      position: fixed !important;
      bottom: 5mm !important;
      left: 5mm !important;
      right: 5mm !important;
      background: #fff !important;
    }
    .screen-sign-table { display: none !important; }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  .report { background: #fff; border: none; border-radius: 4px; overflow: hidden; }
  .rpt-header { padding: 6px 8px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
  .logo-box { width: 96px; height: 96px; background: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 0px; }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #0C447C; }
  .hdr-center .org { font-size: 18px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 11px; color: #374151; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 11px; color: #0C447C; font-weight: 700; margin-top: 2px; }
  .rpt-title { background: #E6F1FB; text-align: center; padding: 6px; font-size: 16px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #b8cfe7; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 13px; font-weight: 700; padding: 4px 8px; letter-spacing: 0.5px; text-transform: uppercase; text-align: center; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .report-table td, .report-table th { border: 1px solid #d9e1ea; padding: 2px 4px; vertical-align: middle; word-break: break-word; font-size: 12px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 12px; text-align: center; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 12px; white-space: nowrap; }
  .val { font-size: 12px; color: #000; }
  .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .obs-table td, .obs-table th { border: 1px solid #d9e1ea; padding: 2px 4px; font-size: 11px; vertical-align: middle; text-align: center; word-break: break-word; }
  .obs-table th { background: #E6F1FB; color: #0C447C; font-size: 10px; font-weight: 700; }
  .cert-para { font-size: 11px; font-style: italic; color: #333; padding: 4px 6px; border: 1px solid #d9e1ea; margin-top: -1px; line-height: 1.4; break-inside: avoid; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .sign-table td { border: 1px solid #d9e1ea; padding: 2px 4px; font-size: 13px; vertical-align: top; }
  .mt-n1 { margin-top: -1px; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10.5px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .footer { background: #f8fafc; padding: 6px 10px; font-size: 10px; color: #4b5563; margin-top: 8px; border-top: 3px solid #185FA5; line-height: 1.4; text-align: center; }
  
  /* B&W mode */
  .bw .rpt-header { background: #fff !important; border-bottom: 2px solid #000 !important; }
  .bw .hdr-center { color: #000 !important; }
  .bw .section-hdr { background: #fff !important; color: #000 !important; border: 1px solid #000 !important; }
  .bw .col-hdr, .bw th { background: #fff !important; color: #000 !important; border-color: #000 !important; }
  .bw .report-table td, .bw .obs-table td { border-color: #000 !important; }
  .bw .lbl { background: #fff !important; color: #000 !important; }
  .bw .rpt-title { background: #fff !important; color: #000 !important; border-bottom: 1.5px solid #000 !important; }

`;

// â"€â"€â"€ Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const v = (s?: string | number | null) =>
  s !== undefined && s !== null ? String(s) : "";

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

// â"€â"€â"€ Component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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
  const [bwMode] = useState(false);

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

  const ReportFooter = () => (
    <div className="footer">
      Corp Office: 1st Floor, Plot No.PAP 3/28, Behind BSNL Office, MIDC,
      Baramati, Dist-Pune 413133 | Ph. +91 9860186056, +91
      7875154431
      <br />
      Reg. Office: A/p - Kuthare, Tal - Patan,
      Dist-Satara 415112 | Website: www.niitindt.com |
      Email: niit04@gmail.com
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* â"€â"€ Report Content â"€â"€ */}
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
            width: "297mm",
            minHeight: "210mm",
            background: "#fff",
            margin: "0 auto",
            padding: "5mm 5mm 35mm 5mm",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            boxSizing: "border-box",
          }}
        >
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
                  {/* â"€â"€ HEADER â"€â"€ */}
                  <div className="rpt-header">
                    <div className="logo-box">
                      <img src={niitLogo} alt="NIIT Logo" />
                    </div>
                    <div className="hdr-center">
                      <div className="org">National Industrial Inspection &amp; Training</div>
                      <div className="sub">THIRD PARTY INSPECTION | NDT SERVICES &amp; TRAINING | NDT CONSULTANCY | PHYSICAL CALIBRATION | FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT | QUALITY MANAGEMENT SYSTEM TRAINING</div>
                      <div className="iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
                    </div>
                    <div style={{ width: '180px', color: '#0C447C', fontSize: '10px', lineHeight: 1.8, paddingLeft: 10, borderLeft: '1px solid #b8cfe7' }}>
                      <div><strong>Report No:</strong> {v(report.reportNo)}</div>
                      <div><strong>Format No:</strong> FMT-NDT-AWSD-01</div>
                      <div><strong>Rev. No:</strong> 00</div>
                      <div><strong>Page No:</strong> 1/1</div>
                    </div>
                  </div>
                  <div className="rpt-title">Report of UT of Welds (AWS D1.1)</div>
                </td>
              </tr>
            </thead>

            <tbody style={{ display: "table-row-group" }}>
              <tr>
                <td style={{ padding: 0, verticalAlign: "top" }}>
                  {/* â"€â"€ JOB INFORMATION â"€â"€ */}
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
                        <td className="lbl">
                          Quality Requirements â€" Section
                        </td>
                        <td className="val" colSpan={3}>
                          {v(report.qualityRequirementsSection)}
                        </td>
                        <td className="lbl">Evaluation</td>
                        <td className="val">
                          {v(report.evaluation || report.remarks)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* â"€â"€ OBSERVATIONS â"€â"€ */}
                  <table className="obs-table mt-n1" style={{ pageBreakBefore: "always", breakBefore: "page" }}>
                    <tbody>
                      <tr>
                        <td colSpan={16} className="section-hdr">
                          OBSERVATIONS
                        </td>
                      </tr>
                      {/* Header row 1 */}
                      <tr>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "3.5%" }}
                        >
                          Line
                          <br />
                          No.
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "6%" }}
                        >
                          Indication
                          <br />
                          No.
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "7%" }}
                        >
                          Transducer
                          <br />
                          Angle
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "4.5%" }}
                        >
                          From
                          <br />
                          Face
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "3.5%" }}
                        >
                          Leg
                        </td>
                        <td className="col-hdr" colSpan={4}>DECIBELS</td>
                        <td className="col-hdr" colSpan={5}>DISCONTINUITY</td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "6%" }}
                        >
                          Interpretation
                        </td>
                      </tr>
                      {/* Header row 2 */}
                      <tr>
                        <td className="col-hdr" style={{ width: "5.5%" }}>a.<br />Ind. Level</td>
                        <td className="col-hdr" style={{ width: "5.5%" }}>b.<br />Ref. Level</td>
                        <td className="col-hdr" style={{ width: "6%" }}>c.<br />Atten. Factor</td>
                        <td className="col-hdr" style={{ width: "5.5%" }}>d.<br />Ind. Rating</td>
                        <td className="col-hdr" style={{ width: "5%" }}>Length</td>
                        <td className="col-hdr" style={{ width: "5.5%" }}>Angular<br />Dist.</td>
                        <td className="col-hdr" style={{ width: "6%" }}>Depth<br />from A</td>
                        <td className="col-hdr" style={{ width: "4.5%" }}>From<br />X</td>
                        <td className="col-hdr" style={{ width: "4.5%" }}>From<br />Y</td>
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
                              <td style={{}}>
                                {v(o.decibels?.indicationLevel)}
                              </td>
                              <td style={{}}>
                                {v(o.decibels?.referenceLevel)}
                              </td>
                              <td style={{}}>
                                {v(o.decibels?.attenuationFactor)}
                              </td>
                              <td style={{}}>
                                {v(o.decibels?.indicationRating)}
                              </td>
                              <td style={{}}>
                                {v(o.discontinuity?.length)}
                              </td>
                              <td style={{}}>
                                {v(o.discontinuity?.angularDistance)}
                              </td>
                              <td style={{}}>
                                {v(o.discontinuity?.depthFromA)}
                              </td>
                              <td style={{}}>
                                {v(o.discontinuity?.distanceFromX)}
                              </td>
                              <td style={{}}>
                                {v(o.discontinuity?.distanceFromY)}
                              </td>
                              <td
                                className={
                                  o.interpretation === "Reject"
                                    ? "reject-cell"
                                    : ""
                                }
                              >
                                {v(o.interpretation)}
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>

                  {/* -- CERTIFICATION TEXT + SIGNATURES -- */}
                  <div className="cert-para">
                    We, the undersigned, certify that the statements in this
                    record are correct and that the welds were prepared and
                    tested in conformance with the requirements of Clause 8,
                    Part F of AWS D1.1/D1.1M,&nbsp;
                    <strong>({v(cert.year) || "____"})</strong> Structural
                    Welding Codeâ€"Steel.
                  </div>

                  {/* -- CERTIFICATION / SIGNATURES -- */}
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
                        <td className="val">
                          {v(cert.manufacturerOrContractor)}
                        </td>
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
          className="print-fixed-footer-inner"
          style={{ border: "none", boxShadow: "none" }}
        >
          <ReportFooter />
        </div>
      </div>
    </>
  );
};
