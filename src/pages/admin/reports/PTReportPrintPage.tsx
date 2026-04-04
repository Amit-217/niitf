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

// â"€â"€â"€ Print Styles â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  * { box-sizing: border-box; }

  .report {
    background: #fff;
    border: none;
    border-radius: 6px;
    overflow: hidden;
  }
  .report-body { border: 1px solid #444; border-radius: 4px; overflow: hidden; }
  .rpt-header {
    padding: 8px 10px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
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
  .rpt-title {
    background: #E6F1FB; text-align: center; padding: 7px;
    font-size: 16px; font-weight: 700; color: #0C447C;
    text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #b8cfe7;
  }
  .section-hdr {
    background: #185FA5; color: #fff; font-size: 13px; font-weight: 700;
    padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase;
  }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
    .report-table td, .report-table th {
      border: 1px solid #d9e1ea; padding: 2px 4px;
      vertical-align: middle; word-break: break-word; font-size: 12px;
    }
    .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 12px; text-align: center; color: #0C447C; }
    .lbl { background: #f7fafc; font-weight: 600; font-size: 12px; }
    .val { font-size: 12px; color: #000; }
    .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .obs-table td, .obs-table th { border: 1px solid #d9e1ea; padding: 2px 4px; font-size: 11px; vertical-align: top; word-break: break-word; }
    .obs-table th { background: #E6F1FB; color: #0C447C; font-size: 10px; font-weight: 700; }
    .obs-table tr { break-inside: avoid; page-break-inside: avoid; }
    .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
    .sign-table td { border: 1px solid #d9e1ea; padding: 2px 4px; font-size: 13px; vertical-align: top; }
  .mt-n1 { margin-top: -1px; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .report-body { border: 1px solid #444; border-radius: 4px; overflow: hidden; }
  .footer {
    background: #f8fafc; padding: 6px 10px; font-size: 10px; color: #4b5563;
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

// â"€â"€â"€ Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const v = (s?: string) => s || "";
const fmtDate = (d?: string) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

// â"€â"€â"€ Component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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
        window.print();
        window.close();
      }, 300);
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
                          FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT{" "}
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
                              {v(jd.customer)}
                            </td>
                            <td style={{ fontWeight: 600, fontSize: "11px" }}>
                              {v(jd.client)}
                            </td>
                          </tr>
                          <tr>
                            <td>Name: {v(inspector.name) || "-"}</td>
                            <td>Name: {v(fs.customer?.name) || "-"}</td>
                            <td>Name: {v(fs.clientOrTPI?.name) || "-"}</td>
                          </tr>
                          <tr>
                            <td>
                              {v(inspector.qualification) || "PT NDE Level II"}
                              {inspector.designation
                                ? ` / ${inspector.designation}`
                                : ""}
                            </td>
                            <td>
                              Designation: {v(fs.customer?.designation) || "-"}
                            </td>
                            <td>
                              Designation:{" "}
                              {v(fs.clientOrTPI?.designation) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ height: 28 }}>Signature:</td>
                            <td style={{ height: 28 }}>Signature:</td>
                            <td style={{ height: 28 }}>Signature:</td>
                          </tr>
                          <tr>
                            <td>I.D. No.: {v(inspector.idNo) || "-"}</td>
                            <td>I.D. No.: {v(fs.customer?.idNo) || "-"}</td>
                            <td>I.D. No.: {v(fs.clientOrTPI?.idNo) || "-"}</td>
                          </tr>
                          <tr>
                            <td>Date: {fmtDate(inspector.date) || "-"}</td>
                            <td>Date: {fmtDate(fs.customer?.date) || "-"}</td>
                            <td>
                              Date: {fmtDate(fs.clientOrTPI?.date) || "-"}
                            </td>
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
                      <div className="rpt-title">
                        Liquid Penetrant Testing Report
                      </div>

                      {/* â"€â"€ JOB DETAILS â"€â"€ */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "22%" }} />
                          <col style={{ width: "28%" }} />
                          <col style={{ width: "22%" }} />
                          <col style={{ width: "28%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={4} className="section-hdr">
                              JOB DETAILS
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Customer</td>
                            <td className="val">{v(jd.customer)}</td>
                            <td className="lbl">Report No.</td>
                            <td className="val">{v(report.reportNo)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Client</td>
                            <td className="val">{v(jd.client)}</td>
                            <td className="lbl">Report Date</td>
                            <td className="val">{fmtDate(jd.reportDate)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Project</td>
                            <td className="val">{v(jd.project)}</td>
                            <td className="lbl">Inspection Date</td>
                            <td className="val">
                              {fmtDate(jd.inspectionDate)}
                              {jd.inspectionEndDate
                                ? ` to ${fmtDate(jd.inspectionEndDate)}`
                                : ""}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Reference Standard</td>
                            <td className="val">{v(jd.referenceStandard)}</td>
                            <td className="lbl">Inspection Time</td>
                            <td className="val">{v(jd.inspectionTime)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Acceptance Criteria</td>
                            <td className="val">{v(jd.acceptanceCriteria)}</td>
                            <td className="lbl">Material</td>
                            <td className="val">{v(jd.material)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Stage of Inspection</td>
                            <td className="val">{v(jd.stageOfInspection)}</td>
                            <td className="lbl">Thickness</td>
                            <td className="val">{v(jd.thickness)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Extent of Examination</td>
                            <td className="val">{v(jd.extentOfExamination)}</td>
                            <td className="lbl">Surface Condition</td>
                            <td className="val">{v(jd.surfaceCondition)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Type of Joint</td>
                            <td className="val">{v(jd.typeOfJoint)}</td>
                            <td className="lbl">Surface Temperature</td>
                            <td className="val">{v(jd.surfaceTemperature)}</td>
                          </tr>
                          <tr>
                            <td className="lbl"></td>
                            <td className="val"></td>
                            <td className="lbl">Welding Process</td>
                            <td className="val">{v(jd.weldingProcess)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* â"€â"€ METHOD DETAILS â"€â"€ */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "22%" }} />
                          <col style={{ width: "28%" }} />
                          <col style={{ width: "22%" }} />
                          <col style={{ width: "28%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={4} className="section-hdr">
                              METHOD DETAILS
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Penetrant Method</td>
                            <td className="val" colSpan={3}>
                              {v(md.penetrantMethod)}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">
                              Excess Penetrant Removal method
                            </td>
                            <td className="val" colSpan={3}>
                              {v(md.excessPenetrantRemovalMethod)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* â"€â"€ CONSUMABLES DETAILS â"€â"€ */}
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
                              CONSUMABLES DETAILS
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

                      {/* â"€â"€ METHOD DESCRIPTION â"€â"€ */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "22%" }} />
                          <col style={{ width: "28%" }} />
                          <col style={{ width: "22%" }} />
                          <col style={{ width: "28%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={4} className="section-hdr">
                              METHOD DESCRIPTION
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Dwell Time</td>
                            <td className="val">{v(desc.dwellTime)}</td>
                            <td className="lbl">Light Intensity</td>
                            <td className="val">{v(desc.lightIntensity)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Developing Time</td>
                            <td className="val">{v(desc.developingTime)}</td>
                            <td className="lbl">Light Equip. Used</td>
                            <td className="val">
                              {v(desc.lightEquipmentUsed)}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Post Cleaning</td>
                            <td className="val">{v(desc.postCleaning)}</td>
                            <td className="lbl">Drying Time</td>
                            <td className="val">{v(desc.dryingTime)}</td>
                          </tr>
                        </tbody>
                      </table>

                      <table className="obs-table mt-n1">
                        <thead style={{ display: "table-header-group" }}>
                          <tr>
                            <td colSpan={7} className="section-hdr">
                              6. OBSERVATIONS
                            </td>
                          </tr>
                          <tr>
                            <td className="col-hdr" style={{ width: "6%" }}>
                              Sr. No.
                            </td>
                            <td className="col-hdr" style={{ width: "18%" }}>
                              Job Description
                            </td>
                            <td className="col-hdr" style={{ width: "16%" }}>
                              Drg No. / Joint No.
                            </td>
                            <td className="col-hdr" style={{ width: "14%" }}>
                              Size
                            </td>
                            <td className="col-hdr" style={{ width: "10%" }}>
                              Quantity in Nos.
                            </td>
                            <td className="col-hdr" style={{ width: "20%" }}>
                              Interpretation
                            </td>
                            <td className="col-hdr" style={{ width: "16%" }}>
                              Evaluation
                            </td>
                          </tr>
                        </thead>
                        <tbody>
                          {obs.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                style={{
                                  textAlign: "center",
                                  padding: "6px",
                                  fontSize: "11px",
                                  color: "#999",
                                }}
                              >
                                No observations recorded.
                              </td>
                            </tr>
                          ) : (
                            obs.map((o, i) => (
                              <tr key={i}>
                                <td style={{ textAlign: "center" }}>
                                  {o.srNo}
                                </td>
                                <td style={{}}>{v(o.jobDescription)}</td>
                                <td style={{}}>{v(o.drawingOrJointNo)}</td>
                                <td style={{}}>{v(o.size)}</td>
                                <td
                                  style={{
                                    textAlign: "center",
                                  }}
                                >
                                  {o.quantity ?? ""}
                                </td>
                                <td>{v(o.interpretation)}</td>
                                <td>
                                  {v(o.evaluation || o.remark || o.result)}
                                </td>
                              </tr>
                            ))
                          )}
                          {[...Array(4)].map((_, i) => (
                            <tr key={`empty-obs-${i}`}>
                              <td style={{ height: "24px" }}></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* â"€â"€ end report-body â"€â"€ */}
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
