import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getUTGReportById, getPublicUTGReportById } from "../../../api/customerApi";

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
  .bw .section-hdr { background: #fff !important; color: #000 !important; border-left: 3px solid #000 !important; }
  .bw .col-hdr { background: #fff !important; color: #000 !important; }
  .bw .rpt-title { background: #fff !important; color: #000 !important; border-bottom: 2px solid #555 !important; }
  .bw .footer-meta { background: #fff !important; color: #000 !important; }
  .bw .footer-meta span { color: #000 !important; }
  .bw .std-tag { background: #fff !important; color: #000 !important; border: 1px solid #777 !important; }
  .bw .accept-badge { background: #fff !important; color: #000 !important; border: 1px solid #777 !important; }
  .bw .reject-badge { background: #fff !important; color: #000 !important; border: 1px solid #444 !important; border-left: 3px solid #000 !important; }
  .bw .neutral-badge { background: #fff !important; color: #000 !important; border: 1px solid #777 !important; }
  .bw .report-table td, .bw .report-table th { border-color: #888 !important; }
  .bw .obs-table td, .bw .obs-table th { border-color: #888 !important; }
  .bw .obs-table th { background: #fff !important; color: #000 !important; }
  .bw .sign-table td { border-color: #888 !important; }
  .bw .lbl { color: #000 !important; background: #fff !important; }
  .bw .footer { background: #fff !important; color: #000 !important; border-color: #000 !important; }
  .bw .report-body { color: #000 !important; border-color: #000 !important; }
  .rpt-title { background: #E6F1FB; text-align: center; padding: 7px; font-size: 14px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #b8cfe7; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 11px; font-weight: 700; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .report-table td, .report-table th { border: 1px solid #d9e1ea; padding: 4px 6px; vertical-align: middle; word-break: break-word; font-size: 11px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 10px; text-align: center; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 10px; white-space: nowrap; }
  .val { font-size: 11px; }
  .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .obs-table td, .obs-table th { border: 1px solid #d9e1ea; padding: 4px 5px; font-size: 11px; vertical-align: top; word-break: break-word; }
  .obs-table th { background: #E6F1FB; color: #0C447C; font-size: 10px; font-weight: 700; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .sign-table td { border: 1px solid #d9e1ea; padding: 4px 6px; font-size: 11px; vertical-align: top; }
  .mt-n1 { margin-top: -1px; }
  .report-body { border: 1px solid #444; border-radius: 4px; overflow: hidden; }
  .footer { background: #f8fafc; padding: 6px 10px; font-size: 9px; color: #4b5563; margin-top: 8px; border-top: 3px solid #185FA5; line-height: 1.4; display: flex; align-items: center; gap: 8px; }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

  @media print {
    .print-fixed-footer { position: fixed !important; bottom: 8mm !important; left: 0 !important; width: 100% !important; display: flex !important; justify-content: center !important; z-index: 99999 !important; background: transparent !important; }
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

export const UTGReportPrintPage: React.FC = () => {
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
          reportSubType: locState.reportSubType ?? "utg",
        },
      });
    } else {
      navigate(-1);
    }
  };

  const isPublic = location.pathname.startsWith("/reports/public/");

  useEffect(() => {
    if (!id) return;
    const fetcher = isPublic ? getPublicUTGReportById : getUTGReportById;
    fetcher(id)
      .then((res: any) => setReport((res as any).data ?? res))
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

  const qrUrl = `${window.location.origin}/reports/public/utg/${id}`;

  const jd = report.jobDetails ?? {};
  const eq = report.equipmentDetails ?? {};
  const sud = report.searchUnitDetails ?? [];
  const td = report.techniqueDetails ?? {};
  const techList = td.techniques ?? [];
  const obs = report.observations ?? [];
  const fs = report.finalSection ?? {};
  const inspector = fs.inspector?.[0] ?? {};

  const ReportFooter = () => (
    <>
      <div className="footer">
        <div className="footer-text-block">
          Corp Office: 1st Floor, Plot No.PAP 3/28, Behind BSNL Office,
          MIDC, Baramati, Dist-Pune 413133 | Ph: +91 9860186056, +91
          7875154431
          <br />
          Reg. Office: A/p - Kuthare, Tal - Patan, Dist-Satara 415112 |
          Website: www.niitindt.com | Email: niit04@gmail.com |
          info@niitindt.com
        </div>
        <div className="qr-wrap">
          <QRCodeSVG value={qrUrl} size={48} />
        </div>
      </div>
      <div className="footer-meta">
        Format No: <span>FMT-NDT-UTG-01</span>
        &nbsp;|&nbsp; Rev. No: <span>00</span>
        &nbsp;|&nbsp; Report Date: <span>{fmtDate(jd.reportDate)}</span>
        &nbsp;|&nbsp; Page: <span>1 of 1</span>
      </div>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div className="no-print" style={{ position: 'fixed', top: 12, right: 16, zIndex: 100, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setBwMode(b => !b)}
          style={{ padding: '7px 16px', background: bwMode ? '#374151' : '#185FA5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          {bwMode ? 'Color Mode' : 'B&W Mode'}
        </button>
        <button
          onClick={() => window.print()}
          style={{ padding: '7px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
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
          <div className={`report${bwMode ? ' bw' : ''}`}>
            <table style={{ width: "100%", borderCollapse: "collapse", borderSpacing: 0, margin: 0, padding: 0 }}>
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
                  THIRD PARTY INSPECTION | NDT SERVICES &amp; TRAINING | NDT
                  CONSULTANCY | PHYSICAL CALIBRATION | FACTORY INSPECTION UNDER
                  MAHARASHTRA FACTORY ACT | QUALITY MANAGEMENT SYSTEM TRAINING
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
            <div className="rpt-title">Ultrasonic Thickness Gauging Report</div>

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
                    {jd.inspectionEndDate ? ` To ${fmtDate(jd.inspectionEndDate)}` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="lbl">Reference Std.</td>
                  <td className="val">{v(jd.referenceStd)}</td>
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
                  <td className="lbl">Surface Condition</td>
                  <td className="val">{v(jd.surfaceCondition)}</td>
                </tr>
                <tr>
                  <td className="lbl">Extent of Examination</td>
                  <td className="val">{v(jd.extentOfExamination)}</td>
                  <td className="lbl">Surface Temperature</td>
                  <td className="val">{v(jd.surfaceTemperature)}</td>
                </tr>
              </tbody>
            </table>

            {/* ── EQUIPMENT DETAILS ── */}
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
                    EQUIPMENT DETAILS
                  </td>
                </tr>
                <tr>
                  <td className="lbl">Equip. Type</td>
                  <td className="val">{v(eq.equipmentType)}</td>
                  <td className="lbl">Sr. No.</td>
                  <td className="val">{v(eq.srNo)}</td>
                </tr>
                <tr>
                  <td className="lbl">Make</td>
                  <td className="val">{v(eq.make)}</td>
                  <td className="lbl">Calibration Due</td>
                  <td className="val">{fmtDate(eq.calibrationDue)}</td>
                </tr>
                <tr>
                  <td className="lbl">Couplant</td>
                  <td className="val">{v(eq.couplant)}</td>
                  <td className="lbl">Basic Calibration Block</td>
                  <td className="val">{v(eq.basicCalibrationBlock)}</td>
                </tr>
              </tbody>
            </table>

            {/* ── SEARCH UNIT DETAILS ── */}
            <table className="report-table mt-n1">
              <tbody>
                <tr>
                  <td colSpan={6} className="section-hdr">
                    SEARCH UNIT DETAILS
                  </td>
                </tr>
                <tr>
                  <td className="col-hdr" style={{ width: "22%" }}>
                    Search Unit / Model
                  </td>
                  <td className="col-hdr" style={{ width: "12%" }}>
                    Angle
                  </td>
                  <td className="col-hdr" style={{ width: "18%" }}>
                    Sr. No.
                  </td>
                  <td className="col-hdr" style={{ width: "18%" }}>
                    Crystal Size
                  </td>
                  <td className="col-hdr" style={{ width: "15%" }}>
                    Wave Mode
                  </td>
                  <td className="col-hdr" style={{ width: "15%" }}>
                    Frequency
                  </td>
                </tr>
                {sud.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "4px",
                        color: "#999",
                        fontSize: "11px",
                      }}
                    >
                      No search units recorded.
                    </td>
                  </tr>
                ) : (
                  sud.map((u: any, i: number) => (
                    <tr key={i}>
                      <td style={{ textAlign: "center" }}>
                        {v(u.searchUnit || u.model)}
                      </td>
                      <td style={{ textAlign: "center" }}>{v(u.angle)}</td>
                      <td style={{ textAlign: "center" }}>{v(u.srNo)}</td>
                      <td style={{ textAlign: "center" }}>
                        {v(u.crystalSize)}
                      </td>
                      <td style={{ textAlign: "center" }}>{v(u.waveMode)}</td>
                      <td style={{ textAlign: "center" }}>{v(u.frequency)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ── TECHNIQUE DETAILS ── */}
            <table className="report-table mt-n1">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "78%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <td colSpan={2} className="section-hdr">
                    TECHNIQUE DETAILS
                  </td>
                </tr>
                <tr>
                  <td className="lbl">UT Method</td>
                  <td className="val">{v(td.utMethod)}</td>
                </tr>
              </tbody>
            </table>

            {techList.length > 0 && (
              <table className="report-table mt-n1">
                <tbody>
                  <tr>
                    <td className="col-hdr" style={{ width: "22%" }}>
                      Search Unit
                    </td>
                    <td className="col-hdr" style={{ width: "12%" }}>
                      Angle
                    </td>
                    <td className="col-hdr" style={{ width: "18%" }}>
                      Sr. No.
                    </td>
                    <td className="col-hdr" style={{ width: "18%" }}>
                      Crystal Size
                    </td>
                    <td className="col-hdr" style={{ width: "15%" }}>
                      Wave Mode
                    </td>
                    <td className="col-hdr" style={{ width: "15%" }}>
                      Frequency
                    </td>
                  </tr>
                  {techList.map((t: any, i: number) => (
                    <tr key={i}>
                      <td style={{ textAlign: "center" }}>{v(t.searchUnit)}</td>
                      <td style={{ textAlign: "center" }}>{v(t.angle)}</td>
                      <td style={{ textAlign: "center" }}>{v(t.srNo)}</td>
                      <td style={{ textAlign: "center" }}>
                        {v(t.crystalSize)}
                      </td>
                      <td style={{ textAlign: "center" }}>{v(t.waveMode)}</td>
                      <td style={{ textAlign: "center" }}>{v(t.frequency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── OBSERVATIONS ── */}
            <table className="obs-table mt-n1">
              <tbody>
                <tr>
                  <td colSpan={3} className="section-hdr">
                    OBSERVATIONS
                  </td>
                </tr>
                <tr>
                  <td className="col-hdr" style={{ width: "8%" }}>
                    Sr. No.
                  </td>
                  <td className="col-hdr" style={{ width: "46%" }}>
                    Item Name
                  </td>
                  <td className="col-hdr" style={{ width: "24%" }}>
                    Measured Thickness (mm)
                  </td>
                </tr>
                {obs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
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
                  obs.map((o: any, i: number) => (
                    <tr key={i}>
                      <td style={{ textAlign: "center" }}>{v(o.srNo)}</td>
                      <td>{v(o.itemName)}</td>
                      <td style={{ textAlign: "center" }}>
                        {v(o.measuredThickness)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ── EXAMINED BY ── */}
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
                    CUSTOMER: <span>{v(fs.customer?.name)}</span>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: "11px" }}>
                    CLIENT / TPI: <span>{v(fs.clientOrTPI?.name)}</span>
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
                  <td>Name: {v(inspector.name)}</td>
                  <td>Name: {v(fs.customer?.name)}</td>
                  <td>Name: {v(fs.clientOrTPI?.name)}</td>
                </tr>
                <tr>
                  <td>
                    {v(inspector.qualification)}
                    {inspector.designation ? ` / ${inspector.designation}` : ""}
                  </td>
                  <td>Designation: {v(fs.customer?.designation)}</td>
                  <td>Designation: {v(fs.clientOrTPI?.designation)}</td>
                </tr>
                <tr>
                  <td style={{ height: 28 }}>Signature:</td>
                  <td>Signature:</td>
                  <td>Signature:</td>
                </tr>
                <tr>
                  <td style={{ height: 28 }}></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>I.D. No.: {v(inspector.idNo)}</td>
                  <td>I.D. No.: {v(fs.customer?.idNo)}</td>
                  <td>I.D. No.: {v(fs.clientOrTPI?.idNo)}</td>
                </tr>
                <tr>
                  <td>Date: {fmtDate(inspector.date)}</td>
                  <td>Date: {fmtDate(fs.customer?.date)}</td>
                  <td>Date: {fmtDate(fs.clientOrTPI?.date)}</td>
                </tr>
              </tbody>
            </table>

            </div>{/* ── end report-body ── */}
                  </td>
                </tr>
              </tbody>
              <tfoot style={{ display: "table-footer-group" }}>
                <tr>
                  <td style={{ padding: 0 }}>
                    <div className="tfoot-content" style={{ height: "15mm" }}></div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* ABSOLUTE BOTTOM FOOTER ON SCREEN */}
          <div className={`no-print ${bwMode ? 'bw' : ''}`} style={{ position: "absolute", bottom: "5mm", left: "5mm", right: "5mm" }}>
            <ReportFooter />
          </div>

        </div>
      </div>

      {/* The fixed footer that only appears in print on every page at the bottom */}
      <div className="print-fixed-footer">
        <div className={`print-fixed-footer-inner ${bwMode ? "bw" : ""}`} style={{ border: 'none', boxShadow: 'none' }}>
          <ReportFooter />
        </div>
      </div>
    </>
  );
};
