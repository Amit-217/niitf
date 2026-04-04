import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  getMPTReportById,
  getPublicMPTReportById,
  MPTReport,
} from "../../../api/customerApi";

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
      margin: 0 !important; padding: 5mm 5mm 15mm 5mm !important;
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
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  .report { background: #fff; border: none; border-radius: 4px; overflow: hidden; }
  .rpt-header { padding: 6px 8px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
  .logo-box { width: 120px; height: 120px; background: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 2px; transform: translateY(-8px); }
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
  .rpt-title { background: #E6F1FB; text-align: center; padding: 7px; font-size: 15px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #b8cfe7; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 12px; font-weight: 700; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .report-table td, .report-table th { border: 1px solid #d9e1ea; padding: 2px 4px; vertical-align: middle; word-break: break-word; font-size: 11px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 11px; text-align: center; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 11px; width: 22%; }
  .val { font-size: 11px; color: #000; }
  .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .obs-table td, .obs-table th { border: 1px solid #d9e1ea; padding: 3px 5px; font-size: 10px; vertical-align: top; word-break: break-word; }
  .obs-table th { background: #E6F1FB; color: #0C447C; font-size: 9.5px; font-weight: 700; }
  .obs-table tr { break-inside: avoid; page-break-inside: avoid; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .sign-table td { border: 1px solid #d9e1ea; padding: 2px 4px; font-size: 12px; vertical-align: top; }
  .mt-n1 { margin-top: -1px; }
  .std-tag { display: inline-block; background: #e7f1fb; color: #0c447c; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-right: 4px; margin-bottom: 2px; font-weight: 700; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .report-body { border: 1px solid #444; border-radius: 4px; overflow: hidden; }
  .footer { background: #f8fafc; padding: 6px 10px; font-size: 10px; color: #4b5563; margin-top: 8px; border-top: 3px solid #185FA5; line-height: 1.4; display: flex; align-items: center; gap: 8px; }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

  @media screen {
    .print-blank-row { display: none; }
    .print-fixed-footer { display: none; }
    .print-sign-table { display: none; }
  }
`;

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

const v = (val?: string | null) => val || "";

const dateRange = (start?: string | null, end?: string | null) => {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (s && e && s !== e) return `${s} to ${e}`;
  return s || e;
};

const splitTags = (text?: string | null) =>
  v(text)
    .split(/[,|;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const resultClass = (value?: string | null) => {
  const t = v(value).toLowerCase();
  if (
    t.includes("reject") ||
    t.includes("repair") ||
    t.includes("fail") ||
    t.includes("not ok")
  )
    return "reject-badge";
  if (
    t.includes("accept") ||
    t.includes("pass") ||
    t.includes("ok") ||
    t.includes("clear")
  )
    return "accept-badge";
  return "neutral-badge";
};

export const MPTReportPrintPage = () => {
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
          reportSubType: locState.reportSubType ?? "mpt",
        },
      });
    } else {
      navigate(-1);
    }
  };

  const [report, setReport] = useState<MPTReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [bwMode, setBwMode] = useState(false);

  const isPublic = location.pathname.startsWith("/reports/public/");

  useEffect(() => {
    if (!id) return;
    const fetcher = isPublic ? getPublicMPTReportById : getMPTReportById;
    fetcher(id)
      .then((res) => {
        const data =
          (res as { report?: MPTReport; data?: { data?: MPTReport } }).report ||
          (res as { data?: { data?: MPTReport } }).data?.data ||
          (res as { data?: MPTReport }).data ||
          (res as unknown as MPTReport);
        setReport(data);
      })
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

  if (loading) {
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
        Loading report...
      </div>
    );
  }

  if (!report) {
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
  }

  const qrUrl = `${window.location.origin}/reports/public/mpt/${id}`;

  const jd = report.jobDetails ?? {};
  const eq = report.equipmentDetails ?? {};
  const md = report.mediumDetails ?? {};
  const me = report.methodDescription ?? {};
  const fs = report.finalSection ?? {};
  const obs = report.observations ?? [];
  const inspectors = fs.inspector ?? [];

  const standards = splitTags(jd.referenceStd);
  const acceptance = splitTags(jd.acceptanceCriteria);
  const getEvaluation = (o: (typeof obs)[number]) => {
    const legacy = o as (typeof obs)[number] & {
      result?: string;
      remark?: string;
    };
    return legacy.evaluation || legacy.result || legacy.remark || "";
  };

  const rejectedCount = obs.filter((o) =>
    /reject|repair|fail|not ok/i.test(v(getEvaluation(o) || o.interpretation)),
  ).length;
  const conclusionText =
    v((report as unknown as { conclusion?: string }).conclusion) ||
    v((fs as unknown as { conclusion?: string }).conclusion) ||
    (rejectedCount > 0
      ? `Examination completed. ${rejectedCount} rejectable indication(s) identified; repair and re-examination required before final acceptance.`
      : "Examination completed as per applicable standards. No rejectable indications observed in inspected items.");

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
        Format No: <span>FMT-NDT-01</span>
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
                    {/* â"€â"€ HEADER â"€â"€ */}
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
                              {v(jd.customer)}
                            </td>
                            <td style={{ fontWeight: 600, fontSize: "11px" }}>
                              {v(jd.client)}
                            </td>
                          </tr>
                          <tr>
                            <td>Name: {v(inspectors[0]?.name) || "-"}</td>
                            <td>Name: {v(fs.customer?.name) || "-"}</td>
                            <td>Name: {v(fs.clientOrTPI?.name) || "-"}</td>
                          </tr>
                          <tr>
                            <td>MT NDE Level II:</td>
                            <td>
                              Designation:{" "}
                              {v(
                                (
                                  fs.customer as unknown as {
                                    designation?: string;
                                  }
                                )?.designation,
                              )}
                            </td>
                            <td>
                              Designation:{" "}
                              {v(
                                (
                                  fs.clientOrTPI as unknown as {
                                    designation?: string;
                                  }
                                )?.designation,
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ height: 28 }}>Signature:</td>
                            <td style={{ height: 28 }}>Signature:</td>
                            <td style={{ height: 28 }}>Signature:</td>
                          </tr>
                          <tr>
                            <td>I.D. No.: {v(inspectors[0]?.idNo) || "-"}</td>
                            <td>I.D. No.: {v(fs.customer?.idNo) || "-"}</td>
                            <td>I.D. No.: {v(fs.clientOrTPI?.idNo) || "-"}</td>
                          </tr>
                          <tr>
                            <td>Date: {fmtDate(inspectors[0]?.date) || "-"}</td>
                            <td>Date: {fmtDate(fs.customer?.date) || "-"}</td>
                            <td>
                              Date: {fmtDate(fs.clientOrTPI?.date) || "-"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div
                        className="tfoot-spacer"
                        style={{ height: "25mm" }}
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
                        Magnetic Particle Testing Report
                      </div>

                      {/* â"€â"€ 1. Scope & Reference Standards â"€â"€ */}
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
                              1. Job Details
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Customer</td>
                            <td className="val">{v(jd.customer) || "-"}</td>
                            <td className="lbl">Report No.</td>
                            <td className="val">{v(report.reportNo) || "-"}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Client</td>
                            <td className="val">{v(jd.client) || "-"}</td>
                            <td className="lbl">Report Date</td>
                            <td className="val">
                              {fmtDate(jd.reportDate) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Reference Std.</td>
                            <td className="val">
                              {standards.length > 0 ? (
                                standards.join(", ")
                              ) : (
                                <span
                                  style={{
                                    color: "#6b7280",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Not specified
                                </span>
                              )}
                            </td>
                            <td className="lbl">Inspection Date</td>
                            <td className="val">
                              {dateRange(
                                jd.inspectionDate,
                                jd.inspectionEndDate,
                              ) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Acceptance Criteria</td>
                            <td className="val">
                              {acceptance.length > 0 ? (
                                acceptance.join(", ")
                              ) : (
                                <span
                                  style={{
                                    color: "#6b7280",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Not specified
                                </span>
                              )}
                            </td>
                            <td className="lbl">Inspection Time</td>
                            <td className="val">
                              {v(jd.inspectionTime) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Stage of Inspection</td>
                            <td className="val">
                              {v(jd.stageOfInspection) || "-"}
                            </td>
                            <td className="lbl">Material</td>
                            <td className="val">{v(jd.material) || "-"}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Extent of Examination</td>
                            <td className="val">
                              {v(jd.extentOfExamination) || "-"}
                            </td>
                            <td className="lbl">Thickness</td>
                            <td className="val">{v(jd.thickness) || "-"}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Type of Joint</td>
                            <td className="val">{v(jd.typeOfJoint) || "-"}</td>
                            <td className="lbl">Surface condition</td>
                            <td className="val">
                              {v(jd.surfaceCondition) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl"></td>
                            <td className="val"></td>
                            <td className="lbl">Welding Process</td>
                            <td className="val">
                              {v(jd.weldingProcess) || "-"}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* â"€â"€ 2. Equipment Details â"€â"€ */}
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
                              3. Equipment Details
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Equip. Type</td>
                            <td className="val">
                              {v(eq.equipmentType) || "-"}
                            </td>
                            <td className="lbl">Sr. no.</td>
                            <td className="val">{v(eq.srNo) || "-"}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Make</td>
                            <td className="val">{v(eq.make) || "-"}</td>
                            <td className="lbl">Calibration due</td>
                            <td className="val">
                              {fmtDate(eq.calibrationDue) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Yoke Spacing</td>
                            <td className="val">{v(eq.yokeSpacing) || "-"}</td>
                            <td className="lbl">Pie Gauge Calibration</td>
                            <td className="val">
                              {v(eq.pieGaugeCalibration) || "-"}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* â"€â"€ 4. Medium Details â"€â"€ */}
                      <table className="report-table mt-n1">
                        <colgroup>
                          <col style={{ width: "20%" }} />
                          <col style={{ width: "40%" }} />
                          <col style={{ width: "20%" }} />
                          <col style={{ width: "20%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={4} className="section-hdr">
                              4. Medium Details
                            </td>
                          </tr>
                          <tr>
                            <td className="col-hdr">Material</td>
                            <td className="col-hdr">Manufacture</td>
                            <td className="col-hdr">Batch No</td>
                            <td className="col-hdr">Expiry Date</td>
                          </tr>
                          <tr>
                            <td className="lbl">Black Ink</td>
                            <td className="val">
                              {v(md.blackInk?.manufacturer) || "-"}
                            </td>
                            <td className="val">
                              {v(md.blackInk?.batchNo) || "-"}
                            </td>
                            <td className="val">
                              {v(md.blackInk?.expiryDate) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">White Contrast</td>
                            <td className="val">
                              {v(md.whiteContrast?.manufacturer) || "-"}
                            </td>
                            <td className="val">
                              {v(md.whiteContrast?.batchNo) || "-"}
                            </td>
                            <td className="val">
                              {v(md.whiteContrast?.expiryDate) || "-"}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* â"€â"€ 5. Method Description â"€â"€ */}
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
                              Method Discription
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Method</td>
                            <td className="val">{v(me.method) || "-"}</td>
                            <td className="lbl">Light Intensity</td>
                            <td className="val">
                              {v(me.lightIntensity) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Magnetization Type</td>
                            <td className="val">
                              {v(me.magnetizationType) || "-"}
                            </td>
                            <td className="lbl">Light Equip. Used</td>
                            <td className="val">
                              {v(me.lightEquipmentUsed) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Magnetizing Method</td>
                            <td className="val">
                              {v(me.magnetizingMethod) || "-"}
                            </td>
                            <td className="lbl">Bath Concentration</td>
                            <td className="val">
                              {v(me.bathConcentration) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Demagnetization</td>
                            <td className="val">
                              {v(me.demagnetization) || "-"}
                            </td>
                            <td className="lbl">
                              Magnetic Field Direction Verified by
                            </td>
                            <td className="val">
                              {v(me.magneticFieldDirectionVerifiedBy) || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="lbl">Gauss Meter Reading</td>
                            <td className="val">
                              {v(me.gaussMeterReading) || "-"}
                            </td>
                            <td className="lbl">Current</td>
                            <td className="val">{v(me.current) || "-"}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Current Type</td>
                            <td className="val">{v(me.currentType) || "-"}</td>
                            <td className="lbl">Post Cleaning</td>
                            <td className="val">{v(me.postCleaning) || "-"}</td>
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
                            <th style={{ width: "6%" }}>Sr. No.</th>
                            <th>Job Description</th>
                            <th>Drg No. / Joint No.</th>
                            <th style={{ width: "10%" }}>Size</th>
                            <th style={{ width: "10%" }}>Quantity in Nos.</th>
                            <th>Interpretation</th>
                            <th style={{ width: "13%" }}>Evaluation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {obs.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                style={{
                                  textAlign: "center",
                                  color: "#6b7280",
                                  padding: "6px",
                                }}
                              >
                                No observations recorded.
                              </td>
                            </tr>
                          ) : (
                            obs.map((o, index) => (
                              <tr key={`${o.srNo}-${index}`}>
                                <td style={{ textAlign: "center" }}>
                                  {o.srNo || index + 1}
                                </td>
                                <td>{v(o.jobDescription) || "-"}</td>
                                <td>{v(o.drawingOrJointNo) || "-"}</td>
                                <td>{v(o.size) || "-"}</td>
                                <td style={{ textAlign: "center" }}>
                                  {o.quantity ?? "-"}
                                </td>
                                <td>
                                  <span
                                    className={resultClass(o.interpretation)}
                                  >
                                    {v(o.interpretation) || "N/A"}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={resultClass(getEvaluation(o))}
                                  >
                                    {v(getEvaluation(o)) || "Accepted"}
                                  </span>
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

                      {/* -- 7. Conclusion -- */}
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
                                7. Conclusion
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

                      {inspectors.length > 1 && (
                        <table className="sign-table mt-n1 screen-sign-table">
                          <tbody>
                            {inspectors.slice(1).map((inspector, index) => (
                              <tr key={`${inspector.idNo}-${index}`}>
                                <td colSpan={3}>
                                  Additional Inspector {index + 2}:{" "}
                                  {v(inspector.name) || "-"} |{" "}
                                  {v(inspector.qualification) || "-"} | ID:{" "}
                                  {v(inspector.idNo) || "-"} | Date:{" "}
                                  {fmtDate(inspector.date) || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    {/* -- end report-body -- */}
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
