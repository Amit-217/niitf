import React, { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  getUTGReportById,
  getPublicUTGReportById,
} from "../../../api/customerApi";

// ─── Print Styles ─────────────────────────────────────────────────────────────

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
    .print-page { min-height: 296mm; margin: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; }
    .print-page:last-child { break-after: auto; page-break-after: auto; }
    .report-body { overflow: visible !important; }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }

  /* Each page is a self-contained A4 block: header at the top, content in a
     flex region (flex:1), and the footer in NORMAL document flow at the bottom.
     No position:fixed, so the footer can never be dropped by the print
     compositor and always sits at the bottom of every page, including the
     last one. The same blocks are used on screen and in print. */
  .print-page {
    width: 210mm;
    min-height: 297mm;
    background: #fff;
    box-sizing: border-box;
    padding: 0 5mm 5mm 5mm;
    display: flex;
    flex-direction: column;
  }
  .print-page-content { flex: 1 1 auto; }
  .print-page-foot { margin-top: 4px; }
  .rpt-header { padding: 2px 8px; margin-bottom: 0; display: flex; align-items: center; gap: 8px; }
  .logo-box { width: 160px; height: 110px; background: #fff; border-radius: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 2px; transform: translateY(-12px); }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #0C447C; }
  .hdr-center .org { font-size: 22px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 10px; color: #374151; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 10px; color: #0C447C; font-weight: 700; margin-top: 2px; }
  .footer-meta { background: #185FA5; color: #d7e8fb; font-size: 9px; text-align: center; padding: 3px 8px; }
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
  .bw .rpt-title { background: #fff !important; color: #000 !important; border: 1px solid #000 !important; border-top: none !important; border-radius: 6px 6px 0 0 !important; }
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
  .bw .report-body { color: #000 !important; border-top: 1px solid #000 !important; border-left: none !important; border-right: none !important; border-bottom: none !important; border-radius: 6px 6px 0 0 !important; }
  .bw .report-footer-wrap { border: 1px solid #000 !important; border-top: none !important; border-radius: 0 0 6px 6px !important; }
  .rpt-title { background: #E6F1FB; text-align: center; padding: 7px; font-size: 15px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border: 1px solid #000; border-top: none; border-radius: 6px 6px 0 0; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 12px; font-weight: 700; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; text-align: left !important; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; border: 1px solid #000; }
  .report-table td, .report-table th { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; word-break: break-word; font-size: 11px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 11px; text-align: left; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 11px; white-space: nowrap; width: 22%; }
  .val { font-size: 11px; color: #000; }
  .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #000; }
  .obs-table td, .obs-table th { border: 1px solid #000; padding: 3px 5px; font-size: 10px; vertical-align: top; word-break: break-word; }
  .obs-table th { background: #E6F1FB; color: #0C447C; font-size: 9.5px; font-weight: 700; text-align: left; }
  .obs-table th:first-child, .obs-table td:first-child { width: 28px; min-width: 28px; max-width: 28px; }
  .obs-table tr { break-inside: avoid; page-break-inside: avoid; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .sign-table td { border: 1px solid #000; padding: 2px 4px; font-size: 11px; vertical-align: top; }
  .sign-table td:first-child { border-left: none; }
  .sign-table td:last-child { border-right: none; }
  .mt-n1 { margin-top: -1px; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .report-body { border-top: 1px solid #000; border-left: none; border-right: none; border-bottom: none; border-radius: 6px 6px 0 0; overflow: hidden; }
  .report-footer-wrap { border: 1px solid #000; border-top: 1px solid #000; border-radius: 0 0 6px 6px; overflow: hidden; }
  .report-footer-wrap .sign-table.mt-n1 { margin-top: 0; }
  .report-footer-wrap .sign-table tr:first-child td { border-top: none; }


  .footer { background: #f8fafc; padding: 6px 10px; font-size: 10px; color: #4b5563; margin-top: 8px; border-top: 3px solid #185FA5; line-height: 1.4; display: flex; align-items: center; gap: 8px; }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
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
        // Trigger multiple reflows to "wake up" the rendering engine
        window.scrollTo(0, 10);
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);

        // Force a tiny delay after scrolling before printing
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

  const qrUrl = `${window.location.origin}/reports/public/utg/${id}`;

  const jd = report.jobDetails ?? {};
  const eq = report.equipmentDetails ?? {};
  const sud = report.searchUnitDetails ?? [];
  const td = report.techniqueDetails ?? {};

  const obs = report.observations ?? [];
  const fs = report.finalSection ?? {};
  const inspector = fs.inspector?.[0] ?? {};
  // Pagination Logic: Max 14 visible rows total for (SUD + Obs) on Page 1.
  // Capacity is 13 because the obs table column-header row counts as 1 visible row.
  const firstPageCapacity = 13;
  const sudCount = sud.length;
  const obsLimit = Math.max(0, firstPageCapacity - sudCount);
  const obsPage1 = obs.slice(0, obsLimit);
  const obsPage2 = obs.slice(obsLimit);

  const renderHeader = () => (
    <div className="rpt-header">
      <div className="logo-box">
        <img src="/logo.png" alt="NIIT Logo" />
      </div>
      <div className="hdr-center">
        <div className="org">
          National Industrial Inspection and Training
        </div>
        <div className="sub">
          THIRD PARTY INSPECTION | NDT SERVICES &amp; NDT TRAINING | NDT
          CONSULTANCY
          <br />
          FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT{" "}
        </div>
        <div className="iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
      </div>
    </div>
  );

  const renderObsTable = (data: any[], title: string) => (
    <table className="obs-table mt-n1">
      <colgroup>
        <col style={{ width: "5%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "60%" }} />
        <col style={{ width: "10%" }} />
      </colgroup>
      <thead>
        <tr>
          <td colSpan={4} className="section-hdr">
            {title}
          </td>
        </tr>
        <tr>
          <th>Sr. No.</th>
          <th>Item Name</th>
          <th>Measured Thickness</th>
          <th>Evaluation</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 && sudCount === 0 ? (
          <tr>
            <td
              colSpan={4}
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
          data.map((o: any, i: number) => (
            <tr key={i}>
              <td>{v(o.srNo) || i + 1}</td>
              <td>{v(o.itemName) || "-"}</td>
              <td>{v(o.measuredThickness) || "-"}</td>
              <td>{v(o.evaluation || o.remark || o.result) || "-"}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

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
        Format No: <span>FMT-NDT-UTG-01</span>
        &nbsp;|&nbsp; Rev. No: <span>00</span>
        &nbsp;|&nbsp; Report Date: <span>{fmtDate(jd.reportDate)}</span>
      </div>
    </>
  );

  const Signatures = () => (
    <div className="report-footer-wrap">
      <table className="sign-table mt-n1">
        <colgroup>
          <col style={{ width: "33.3%" }} />
          <col style={{ width: "33.3%" }} />
          <col style={{ width: "33.4%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>EXAMINED BY :</td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>CUSTOMER : </td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>CLIENT :</td>
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
              {v(inspector.qualification) || "UT NDE Level II"}
              {inspector.designation ? ` / ${inspector.designation}` : ""}
            </td>
            <td>Designation: {v(fs.customer?.designation) || "-"}</td>
            <td>Designation: {v(fs.clientOrTPI?.designation) || "-"}</td>
          </tr>
          <tr>
            <td style={{ height: 60 }}>Signature:</td>
            <td style={{ height: 60 }}>Signature:</td>
            <td style={{ height: 60 }}>Signature:</td>
          </tr>
          <tr>
            <td>Date: {fmtDate(inspector.date) || "-"}</td>
            <td>Date: {fmtDate(fs.customer?.date) || "-"}</td>
            <td>Date: {fmtDate(fs.clientOrTPI?.date) || "-"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const fixedSections = (
    <>
      <div className="rpt-title">Ultrasonic Thickness Gauging Report</div>

      {/* ── 1. JOB DETAILS ── */}
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
              1. JOB DETAILS
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
            <td className="val">{fmtDate(jd.reportDate) || "-"}</td>
          </tr>
          <tr>
            <td className="lbl">Project</td>
            <td className="val">{v(jd.project) || "-"}</td>
            <td className="lbl">Inspection Date</td>
            <td className="val">
              {fmtDate(jd.inspectionDate)}
              {jd.inspectionEndDate
                ? ` To ${fmtDate(jd.inspectionEndDate)}`
                : ""}
              {!jd.inspectionDate && "-"}
            </td>
          </tr>
          <tr>
            <td className="lbl">Reference Std.</td>
            <td className="val" colSpan={3}>
              {v(jd.referenceStd) || "-"}
            </td>
          </tr>
          <tr>
            <td className="lbl">Acceptance Criteria</td>
            <td className="val">{v(jd.acceptanceCriteria) || "-"}</td>
            <td className="lbl">Material</td>
            <td className="val">{v(jd.material) || "-"}</td>
          </tr>
          <tr>
            <td className="lbl">Stage of Inspection</td>
            <td className="val">{v(jd.stageOfInspection) || "-"}</td>
            <td className="lbl">Surface Condition</td>
            <td className="val">{v(jd.surfaceCondition) || "-"}</td>
          </tr>
          <tr>
            <td className="lbl">Extent of Examination</td>
            <td className="val">{v(jd.extentOfExamination) || "-"}</td>
            <td className="lbl">Surface Temperature</td>
            <td className="val">{v(jd.surfaceTemperature) || "-"}</td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. EQUIPMENT DETAILS ── */}
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
              2. EQUIPMENT DETAILS
            </td>
          </tr>
          <tr>
            <td className="lbl">Equip. Type</td>
            <td className="val">{v(eq.equipmentType) || "-"}</td>
            <td className="lbl">Sr. No.</td>
            <td className="val">{v(eq.srNo) || "-"}</td>
          </tr>
          <tr>
            <td className="lbl">Make</td>
            <td className="val">{v(eq.make) || "-"}</td>
            <td className="lbl">Calibration Due</td>
            <td className="val">{fmtDate(eq.calibrationDue) || "-"}</td>
          </tr>
          <tr>
            <td className="lbl">Couplant</td>
            <td className="val">{v(eq.couplant) || "-"}</td>
            <td className="lbl">Basic Calibration Block</td>
            <td className="val">{v(eq.basicCalibrationBlock) || "-"}</td>
          </tr>
        </tbody>
      </table>

      {/* ── 3. SEARCH UNIT DETAILS ── */}
      <table className="report-table mt-n1">
        <tbody>
          <tr>
            <td colSpan={6} className="section-hdr">
              3. SEARCH UNIT DETAILS
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
                <td>{v(u.searchUnit || u.model)}</td>
                <td>{v(u.angle)}</td>
                <td>{v(u.srNo)}</td>
                <td>{v(u.crystalSize)}</td>
                <td>{v(u.waveMode)}</td>
                <td>{v(u.frequency)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ── 4. TECHNIQUE DETAILS ── */}
      <table className="report-table mt-n1">
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "78%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={2} className="section-hdr">
              4. TECHNIQUE DETAILS
            </td>
          </tr>
          <tr>
            <td className="lbl">UT Method</td>
            <td className="val">{v(td.utMethod) || "-"}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  // ── Paginate: fixed sections + first observation chunk on page 1; the rest
  //    (with the signatures) flow onto the next page. The page-1 capacity is
  //    shared between the Search Unit rows and the observation rows. Each page
  //    is a self-contained A4 block with the footer pinned at its bottom. ──
  const pages = [
    <>
      {fixedSections}
      {(obsPage1.length > 0 || obs.length === 0) &&
        renderObsTable(obsPage1, "5. OBSERVATIONS")}
      <Signatures />
    </>,
  ];
  if (obsPage2.length > 0) {
    pages.push(
      <>
        {renderObsTable(
          obsPage2,
          obsPage1.length > 0 ? "5. OBSERVATIONS (Contd.)" : "5. OBSERVATIONS",
        )}
        <Signatures />
      </>,
    );
  }

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
