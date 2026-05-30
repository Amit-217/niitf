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
    body.autoprint-mode > #root > * { opacity: 0 !important; visibility: hidden !important; }
    .print-page {
      margin: 0 auto 16px auto;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    }
  }

  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #report-root { background: #fff !important; padding: 0 !important; }
    .print-page {
      height: 296mm;
      margin: 0 !important;
      box-shadow: none !important;
      break-after: page;
      page-break-after: always;
    }
    .print-page:last-child { break-after: auto; page-break-after: auto; }
    .report-body { overflow: visible !important; }
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  * { box-sizing: border-box; }

  /* Each page is a self-contained A4 block: header at the top, content in a
     flex region (flex:1), and the footer in NORMAL document flow at the bottom.
     No position:fixed, so the footer can never be dropped by the print
     compositor and always sits at the bottom of every page, including the
     last one. The same blocks are used on screen and in print. */
  .print-page {
    width: 210mm;
    height: 297mm;
    background: #fff;
    box-sizing: border-box;
    padding: 0 5mm 5mm 5mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .print-page-content { flex: 1 1 auto; }
  .print-page-foot { margin-top: auto; }

  .report-body { border-top: 1.2px solid #000; border-left: none; border-right: none; border-bottom: none; border-radius: 0; overflow: hidden; }
  .report-footer-wrap { border: 1.2px solid #000; border-top: none; border-radius: 0; overflow: hidden; margin-top: -1px; margin-bottom: 2px; }
  .report-footer-wrap .sign-table.mt-n1 { margin-top: 0; }
  .report-footer-wrap .sign-table tr:first-child td { border-top: none; }

  /* Unified Header & Footer Styles */
  .rpt-header { 
    font-family: Arial, Helvetica, sans-serif !important; 
    padding: 2px 8px; 
    margin-bottom: 0; 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    background: #fff !important;
  }
  .logo-box { 
    width: 160px; 
    height: 100px; 
    background: #fff; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    flex-shrink: 0; 
    overflow: hidden; 
    transform: translateY(-4px); 
    margin-top: 2px; 
  }
  .logo-box img { 
    width: 100%; 
    height: 100%; 
    object-fit: contain; 
  }
  .hdr-center { 
    flex: 1; 
    text-align: center; 
    color: #0C447C !important; 
  }
  .hdr-center .org { 
    font-family: Arial, Helvetica, sans-serif !important; 
    font-size: 22px !important; 
    font-weight: 700 !important; 
    letter-spacing: 0.2px; 
    text-transform: uppercase; 
    color: #0C447C !important;
  }
  .hdr-center .sub { 
    font-family: Arial, Helvetica, sans-serif !important; 
    font-size: 10px !important; 
    color: #374151 !important; 
    margin-top: 2px; 
    line-height: 1.4; 
  }
  .hdr-center .iso { 
    font-family: Arial, Helvetica, sans-serif !important; 
    font-size: 10px !important; 
    color: #0C447C !important; 
    font-weight: 700 !important; 
    margin-top: 2px; 
  }
  .inv-foot, .footer { 
    font-family: Arial, Helvetica, sans-serif !important; 
    background: #f8fafc !important; 
    padding: 6px 10px !important; 
    font-size: 10px !important; 
    color: #4b5563 !important; 
    margin-top: 8px; 
    border-top: 3px solid #185FA5 !important; 
    line-height: 1.4 !important; 
    text-align: center !important; 
  }
  .footer-meta { 
    font-family: Arial, Helvetica, sans-serif !important; 
    background: #185FA5 !important; 
    color: #d7e8fb !important; 
    font-size: 9px !important; 
    text-align: center !important; 
    padding: 3px 8px !important; 
    border: none !important;
  }
  .footer-meta span { 
    color: #fff !important; 
    font-weight: 700 !important; 
  }
  /* B&W mode */
  .bw .rpt-header { background: #fff !important; }
  .bw .hdr-center { color: #000 !important; }
  .bw .hdr-center .org { color: #000 !important; }
  .bw .hdr-center .sub { color: #333 !important; }
  .bw .hdr-center .iso { color: #000 !important; }
  .bw .logo-box { background: #fff !important; }
  .bw .section-hdr { background: #fff !important; color: #000 !important; }
  .bw .col-hdr { background: #fff !important; color: #000 !important; }
  .bw .rpt-title { background: #fff !important; color: #000 !important; border-color: #000 !important; }
  .bw .footer-meta { background: #fff !important; color: #000 !important; }
  .bw .footer-meta span { color: #000 !important; }
  .bw .std-tag { background: #fff !important; color: #000 !important; border: 1px solid #777 !important; }
  .bw .accept-badge { background: transparent !important; color: #000 !important; border: none !important; }
  .bw .reject-badge { background: transparent !important; color: #000 !important; border: none !important; }
  .bw .neutral-badge { background: transparent !important; color: #000 !important; border: none !important; }
  .bw .report-table td, .bw .report-table th { border-color: #000 !important; border-width: 1.2px !important; }
  .bw .obs-table td, .bw .obs-table th { border-color: #000 !important; border-width: 1.2px !important; }
  .bw .obs-table th { background: #fff !important; color: #000 !important; }
  .bw .sign-table td { border-color: #000 !important; border-width: 1.2px !important; }
  .bw .lbl { color: #000 !important; background: #fff !important; }
  .bw .footer { background: #fff !important; color: #000 !important; border-color: #000 !important; }
  .bw .report-body { color: #000 !important; border-color: #000 !important; }
  .rpt-title {
    background: #E6F1FB; text-align: center; padding: 5px;
    font-size: 16px; font-weight: 700; color: #0C447C;
    text-transform: uppercase; letter-spacing: 0.4px;
    border: 1.2px solid #000; border-top: none; border-bottom: none; border-radius: 0;
  }
  .section-hdr {
    background: #185FA5; color: #fff; font-size: 13px; font-weight: 700;
    padding: 3px 8px; letter-spacing: 0.5px; text-transform: uppercase; text-align: left !important;
  }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; border: 1.2px solid #000; }
    .report-table td, .report-table th {
      border: 1.2px solid #000; padding: 2px 5px;
      vertical-align: middle; word-break: break-word; font-size: 11.5px;
    }
    .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 12px; text-align: left; color: #0C447C; }
    .lbl { background: #f7fafc; font-weight: 600; font-size: 11.5px; }
    .val { font-size: 11.5px; color: #000; }
    .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.2px solid #000; }
    .obs-table td, .obs-table th { border: 1.2px solid #000; padding: 3px 6px; font-size: 11.5px; vertical-align: top; word-break: break-word; }
    .obs-table th { background: #E6F1FB; color: #0C447C; font-size: 11.5px; font-weight: 700; text-align: left; }
    .obs-table th:first-child, .obs-table td:first-child { width: 35px !important; min-width: 35px !important; max-width: 35px !important; text-align: center; }
    .obs-table tr { break-inside: avoid; page-break-inside: avoid; }
    .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
    .sign-table td { border: 1.2px solid #000; padding: 2px 6px; font-size: 11px; vertical-align: top; }
    .sign-table td:first-child { border-left: none; }
    .sign-table td:last-child { border-right: none; }
  .mt-n1 { margin-top: -1px; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .footer {
    background: #f8fafc; padding: 5px 10px; font-size: 11px; color: #4b5563;
    margin-top: 1px; border-top: 3px solid #185FA5; line-height: 1.4;
    display: flex; align-items: center; gap: 8px;
  }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
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

  const renderHeader = () => (
    <div className="rpt-header">
      <div className="logo-box">
        <img src="/logo.jpeg" alt="Logo" />
      </div>
      <div className="hdr-center">
        <div className="org">National Industrial Inspection And Training</div>
        <div className="sub">
          THIRD PARTY INSPECTION | NDT SERVICES & NDT TRAINING | NDT CONSULTANCY
          <br />
          FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT
        </div>
        <div className="iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
      </div>
    </div>
  );

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
            <td style={{ fontWeight: 600, fontSize: "11px" }}>EXAMINED BY :</td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>CUSTOMER :</td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>CLIENT :</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>
              National Industrial Inspection And Training
            </td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>
              {v(jd.customer)}
            </td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>{v(jd.client)}</td>
          </tr>
          <tr>
            <td>Name: {v(inspector.name) || "-"}</td>
            <td>Name: {v((jd as any).customerRepresentative) || "-"}</td>
            <td>Name: {v((jd as any).clientRepresentative) || "-"}</td>
          </tr>
          <tr>
            <td>{v(inspector.designation) || "PT NDE Level II"}</td>
            <td>Designation: {v((jd as any).customerDesignation) || "-"}</td>
            <td>Designation: {v((jd as any).clientDesignation) || "-"}</td>
          </tr>
          <tr>
            <td style={{ height: "60px" }}>Signature:-</td>
            <td>Signature:-</td>
            <td>Signature:-</td>
          </tr>
          <tr>
            <td>Date:- {fmtDate(jd.reportDate)}</td>
            <td>Date:- {fmtDate(jd.reportDate)}</td>
            <td>Date:- {fmtDate(jd.reportDate)}</td>
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
        <col style={{ width: "12%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "25%" }} />
        <col style={{ width: "11%" }} />
      </colgroup>
      <thead>
        <tr>
          <td colSpan={7} className="section-hdr">
            {title}
          </td>
        </tr>
        <tr>
          <td className="col-hdr" style={{ textAlign: "center" }}>
            Sr.
          </td>
          <td className="col-hdr" style={{ textAlign: "center" }}>
            Job Description</td>
          <td className="col-hdr" style={{ textAlign: "center" }}>
            Drg No. / Joint No.
          </td>
          <td className="col-hdr" style={{ textAlign: "center" }}>
            Size
          </td>
          <td className="col-hdr" style={{ textAlign: "center" }}>
            Qty(Nos)
          </td>
          <td className="col-hdr" style={{ textAlign: "center" }}>
            Interpretation
          </td>
          <td className="col-hdr">Evaluation</td>
        </tr>
      </thead>
      <tbody>
  {data.length === 0 ? (
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
    data.map((o, i) => (
      <tr key={i}>
        <td style={{ textAlign: "center" }}>
          {o.srNo}
        </td>

        <td>
          {v(o.jobDescription)}
        </td>

        <td style={{ textAlign: "center" }}>
          {v(o.drawingOrJointNo)}
        </td>

        <td style={{ textAlign: "center" }}>
          {v(o.size)}
        </td>

        <td style={{ textAlign: "center" }}>
          {o.quantity ?? ""}
        </td>

        <td style={{ textAlign: "center" }}>
          {v(o.interpretation)}
        </td>

        <td style={{ textAlign: "center" }}>
          {v(o.evaluation)}
        </td>
      </tr>
    ))
  )}
</tbody>
    </table>
  );

  const fixedSections = (
    <>
      <div className="rpt-title">LIQUID PENETRANT TESTING REPORT</div>

      {/* --- JOB DETAILS --- */}
      <table className="report-table">
        <tbody>
          <tr>
            <td colSpan={4} className="section-hdr">
              1. JOB DETAILS
            </td>
          </tr>
          <tr>
            <td className="lbl" style={{ width: "22%" }}>
              Customer:
            </td>
            <td className="val" style={{ width: "28%" }}>
              {v(jd.customer)}
            </td>
            <td className="lbl" style={{ width: "22%" }}>
              Report No.:
            </td>
            <td className="val" style={{ width: "28%" }}>
              {v(report.reportNo)}
            </td>
          </tr>
          <tr>
            <td className="lbl">Client:</td>
            <td className="val">{v(jd.client)}</td>
            <td className="lbl">Report Date:</td>
            <td className="val">{fmtDate(jd.reportDate) || "-"}</td>
          </tr>
          <tr>
            <td className="lbl">Project:</td>
            <td className="val">{v(jd.project) || "-"}</td>
            
            <td className="lbl">Inspection Date:</td>
            <td className="val">
              {dateRange(jd.inspectionDate, jd.inspectionEndDate) || "-"}
            </td>
          </tr>
          <tr>
            <td className="lbl">Reference standard:</td>
            <td className="val">
              {standards.length > 0 ? standards.join(", ") : "Not specified"}
            </td>
           
            <td className="lbl">Material:</td>
            <td className="val">{v(jd.material) || "-"}</td>
          </tr>
          <tr>
             <td className="lbl">Acceptance Criteria:</td>
            <td className="val">
              {acceptance.length > 0 ? acceptance.join(", ") : "Not specified"}
            </td>
           
            <td className="lbl">Thickness:</td>
            <td className="val">{v(jd.thickness) || "-"}</td>
          </tr>
          <tr>
             <td className="lbl">Stage of Inspection:</td>
            <td className="val">{v(jd.stageOfInspection) || "-"}</td>
            
            <td className="lbl">Surface condition:</td>
            <td className="val">{v(jd.surfaceCondition) || "-"}</td>
          </tr>
          <tr>
            <td className="lbl">Extent of Examination:</td>
            <td className="val">{v(jd.extentOfExamination) || "-"}</td>
            
            <td className="lbl">Welding Process:</td>
            <td className="val">{v(jd.weldingProcess) || "-"}</td>
          </tr>
          <tr>
            <td className="lbl">Type of Joint:</td>
            <td className="val">{v(jd.typeOfJoint) || "-"}</td>
            <td className="lbl">Surface Temperature:</td>
            <td className="val">{v(jd.surfaceTemperature) || "-"}</td>
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
            <td className="lbl" style={{ width: "22%" }}>
              Penetrant Method:
            </td>
            <td className="val" colSpan={3}>
              {v(md.penetrantMethod)}
            </td>
          </tr>
          <tr>
            <td className="lbl">
              Excess Penetrant <br />
              Removal method:
            </td>
            <td className="val" colSpan={3}>
              {v(md.excessPenetrantRemovalMethod)}
            </td>
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
            { label: "Penetrant:", data: cons.penetrant },
            { label: "Developer:", data: cons.developer },
            { label: "Cleaner:", data: cons.cleaner },
          ].map((row) => (
            <tr key={row.label}>
              <td className="lbl">{row.label}</td>
              <td className="val">{v(row.data?.manufacturer)}</td>
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
            <td className="lbl">Dwell Time:</td>
            <td className="val">{v(desc.dwellTime)}</td>
            <td className="lbl">Developing Time:</td>
            <td className="val">{v(desc.developingTime)}</td>
            <td className="lbl">Post Cleaning:</td>
            <td className="val">{v(desc.postCleaning)}</td>
          </tr>
          <tr>
            <td className="lbl">Light Intensity:</td>
            <td className="val">{v(desc.lightIntensity)}</td>
            <td className="lbl">Light Equip. Used:</td>
            <td className="val">{v(desc.lightEquipmentUsed)}</td>
            <td className="lbl">Drying Time:</td>
            <td className="val">{v(desc.dryingTime)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  // Dynamic pagination block layout engine
  const PAGE_HEIGHT_LIMIT = 288; // mm
  const HEADER_HEIGHT = 28; // mm
  const FOOTER_HEIGHT = 22; // mm
  const FIXED_SECTIONS_HEIGHT = 135; // mm (Title + job + method + consumables + description)
  const OBS_HEADER_HEIGHT = 12; // mm

  const estimateObsRowHeight = (o: any) => {
    const baseHeight = 6.5; // mm for single-line row
    const desc = o.jobDescription || "";
    const interp = o.interpretation || "";
    const evalText = o.evaluation || o.result || o.remark || "";
    const maxLen = Math.max(desc.length, interp.length, evalText.length);
    const lines = Math.max(1, Math.ceil(maxLen / 30));
    return baseHeight + (lines - 1) * 4.5;
  };

  type ContentBlock =
    | { type: "obs-row"; item: any; height: number };

  const blocks: ContentBlock[] = [];
  obs.forEach((o) => {
    blocks.push({
      type: "obs-row",
      item: o,
      height: estimateObsRowHeight(o),
    });
  });

  type PageDescriptor = {
    isFirstPage: boolean;
    pageBlocks: ContentBlock[];
  };

  const pages: PageDescriptor[] = [];
  let currentBlockIndex = 0;

  const SIGNATURES_HEIGHT = 48; // mm

  while (currentBlockIndex < blocks.length) {
    const isFirstPage = pages.length === 0;
    // Signatures are rendered on every page, so reduce available height by signature height on all pages
    let availableHeight = PAGE_HEIGHT_LIMIT - HEADER_HEIGHT - FOOTER_HEIGHT - SIGNATURES_HEIGHT;
    if (isFirstPage) {
      availableHeight -= FIXED_SECTIONS_HEIGHT;
    }

    const pageBlocks: ContentBlock[] = [];
    let accumulatedHeight = 0;
    let hasObsTable = false;

    while (currentBlockIndex < blocks.length) {
      const block = blocks[currentBlockIndex];
      let blockHeight = block.height;

      // Add table header height if starting observations table on this page
      if (block.type === "obs-row" && !hasObsTable) {
        blockHeight += OBS_HEADER_HEIGHT;
      }

      if (accumulatedHeight + blockHeight <= availableHeight) {
        pageBlocks.push(block);
        accumulatedHeight += blockHeight;
        if (block.type === "obs-row") {
          hasObsTable = true;
        }
        currentBlockIndex++;
      } else {
        break;
      }
    }

    if (pageBlocks.length === 0 && currentBlockIndex < blocks.length) {
      pageBlocks.push(blocks[currentBlockIndex]);
      currentBlockIndex++;
    }

    pages.push({
      isFirstPage,
      pageBlocks,
    });
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

      <div
        id="report-root"
        style={{
          background: "#e9eef5",
          minHeight: "100vh",
          padding: "16px",
        }}
      >
        {pages.map(({ isFirstPage, pageBlocks }, i) => {
          const pageObs = pageBlocks
            .filter((b): b is Extract<ContentBlock, { type: "obs-row" }> => b.type === "obs-row")
            .map((b) => b.item);
          const hasObsTable = pageObs.length > 0;

          return (
            <div className={`print-page${bwMode ? " bw" : ""}`} key={i}>
              <div className="print-page-content">
                {renderHeader()}
                <div className="report-body">
                  {isFirstPage && fixedSections}
                  {hasObsTable && renderObsTable(pageObs, isFirstPage ? "5. OBSERVATIONS" : "5. OBSERVATIONS (Contd.)")}
                  {renderSignatures()}
                </div>
              </div>
              <div className="print-page-foot">
                <ReportFooter />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
