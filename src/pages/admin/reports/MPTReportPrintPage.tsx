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

  @media screen and (max-width: 768px) {
    #report-root {
      padding: 0 !important;
      background: #fff !important;
    }
    .print-page {
      margin: 0 !important;
      box-shadow: none !important;
    }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
    font-size: 11px !important; 
    color: #374151 !important; 
    margin-top: 2px; 
    line-height: 1.4; 
  }
  .hdr-center .iso { 
    font-family: Arial, Helvetica, sans-serif !important; 
    font-size: 11px !important; 
    color: #0C447C !important; 
    font-weight: 700 !important; 
    margin-top: 2px; 
  }
  .inv-foot, .footer { 
    font-family: Arial, Helvetica, sans-serif !important; 
    background: #f8fafc !important; 
    padding: 6px 10px !important; 
    font-size: 11px !important; 
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
    font-size: 10px !important; 
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
  .bw .rpt-title { background: #fff !important; color: #000 !important; }
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
  .bw .footer { background: #fff !important; color: #000 !important; }
  .bw .report-body { color: #000 !important; }
  .bw .report-footer-wrap {
    border: 1.2px solid #000 !important;
    border-top: none !important;
    border-radius: 0  !important;
    overflow: hidden !important;
  }

  .rpt-title { background: #E6F1FB; text-align: center; padding: 5px; font-size: 16px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border: 1.2px solid #000; border-top: none; border-radius: 0; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 13px; font-weight: 700; padding: 3px 8px; letter-spacing: 0.5px; text-transform: uppercase; text-align: left !important; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; border: 1.2px solid #000; }
  .report-table td, .report-table th { border: 1.2px solid #000; padding: 2px 5px; vertical-align: middle; word-break: break-word; font-size: 11.5px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 12px; text-align: left; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 11.5px; width: 22%; }
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
  .std-tag { display: inline-block; background: #e7f1fb; color: #0c447c; font-size: 10px; padding: 2px 6px; border-radius: 0; margin-right: 4px; margin-bottom: 2px; font-weight: 700; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .report-body { border-top: 1.2px solid #000; border-left: none; border-right: none; border-bottom: none; border-radius: 0; overflow: hidden; }
  .report-footer-wrap {
    border: 1.2px solid #000;
    border-top: none;
    border-radius: 0;
    overflow: hidden;
    margin-top: -1px;
    margin-bottom: 0;
  }
  .report-footer-wrap .sign-table tr:first-child td { border-top: none; }
  .report-footer-wrap .sign-table tr:last-child td { border-bottom: none; }

  .footer { background: #f8fafc; padding: 5px 10px; font-size: 11px; color: #4b5563; margin-top: 1px; border-top: 3px solid #185FA5; line-height: 1.4; display: flex; align-items: center; gap: 8px; }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
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

  const qrUrl = `${window.location.origin}/#/reports/public/mpt/${id}`;

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

  const ReportFooter = () => (
    <>
      <div className="footer">
        <div className="footer-text-block">
          Corp Off.: Royal Corner, Off. No. 106, 1st Floor, Near Monika Lawan's
          Jalochi Road, Baramati 413102 | Ph: 9860186056 / 7875154431
          <br />
          Reg. Off.: A/p - Kuthare, Tal - Patan, Dist-Satara 415112 | Website:
          www.niitndt.com | Email: niit004@gmail.com | info@niitndt.com
          <br />
          Powered by: Viplora Tech
        </div>
        <div className="qr-wrap">
          <QRCodeSVG value={qrUrl} size={48} />
        </div>
      </div>
      <div className="footer-meta">
        Format No: <span>FMT-NDT-MPT-01</span>
        &nbsp;|&nbsp; Rev. No: <span>00</span>
        &nbsp;|&nbsp; Report Date: <span>{fmtDate(jd.reportDate)}</span>
      </div>
    </>
  );

  const renderHeader = () => (
    <div className="rpt-header">
      <div className="logo-box">
        <img src="/logo.jpeg" alt="NIIT Logo" />
      </div>
      <div className="hdr-center">
        <div className="org">National Industrial Inspection and Training</div>
        <div className="sub">
          THIRD PARTY INSPECTION | NDT SERVICES &amp; NDT TRAINING | NDT
          CONSULTANCY
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
            <td style={{ fontWeight: 600, fontSize: "11px" }}>
              {v(jd.client)}
            </td>
          </tr>
          <tr>
            <td>Name: {v(inspectors[0]?.name)}</td>
            <td>Name: {v(fs.customer?.name)}</td>
            <td>Name: {v(fs.clientOrTPI?.name)}</td>
          </tr>
          <tr>
            <td>{v(inspectors[0]?.qualification) || "MT NDE Level II"}</td>
            <td>Designation: {v((fs.customer as any)?.designation)}</td>
            <td>Designation: {v((fs.clientOrTPI as any)?.designation)}</td>
          </tr>
          <tr>
            <td style={{ height: "60px" }}>Signature:-</td>
            <td>Signature:-</td>
            <td>Signature:-</td>
          </tr>
          <tr>
            <td>Date: {fmtDate(inspectors[0]?.date)}</td>
            <td>Date: {fmtDate(fs.customer?.date)}</td>
            <td>Date: {fmtDate(fs.clientOrTPI?.date)}</td>
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
        <col style={{ width: "10%" }} />
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
            Job Description
          </td>
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
          <td className="col-hdr" style={{ textAlign: "center" }}>
            Evaluation
          </td>
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
              No data available
            </td>
          </tr>
        ) : (
          data.map((o, i) => (
            <tr key={i}>
              <td style={{ textAlign: "center" }}>{o.srNo}</td>

              <td>{v(o.jobDescription)}</td>

              <td style={{ textAlign: "center" }}>{v(o.drawingOrJointNo)}</td>

              <td style={{ textAlign: "center" }}>{v(o.size)}</td>

              <td style={{ textAlign: "center" }}>{o.quantity ?? ""}</td>

              <td style={{ textAlign: "center" }}>{v(o.interpretation)}</td>

              <td style={{ textAlign: "center" }}>{v(getEvaluation(o))}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  const fixedSections = (
    <>
      <div className="rpt-title">Magnetic Particle Testing Report</div>

      {/* --- 1. Scope & Reference Standards --- */}
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
            <td className="lbl">Customer:</td>
            <td className="val">{v(jd.customer)}</td>
            <td className="lbl">Report No.:</td>
            <td className="val">{v(report.reportNo)}</td>
          </tr>
          <tr>
            <td className="lbl">Client:</td>
            <td className="val">{v(jd.client)}</td>
            <td className="lbl">Report Date:</td>
            <td className="val">{fmtDate(jd.reportDate)}</td>
          </tr>
          <tr>
            <td className="lbl">Project:</td>
            <td className="val">{v(jd.project)}</td>
            <td className="lbl">Inspection Date:</td>
            <td className="val">
              {dateRange(jd.inspectionDate, jd.inspectionEndDate)}
            </td>
          </tr>
          <tr>
            <td className="lbl">Reference Std.:</td>
            <td className="val">{standards.join(", ")}</td>

            <td className="lbl">Material:</td>
            <td className="val">{v(jd.material)}</td>
          </tr>
          <tr>
            <td className="lbl">Acceptance Criteria:</td>
            <td className="val">{acceptance.join(", ")}</td>

            <td className="lbl">Thickness:</td>
            <td className="val">{v(jd.thickness)}</td>
          </tr>
          <tr>
            <td className="lbl">Stage of Inspection:</td>
            <td className="val">{v(jd.stageOfInspection)}</td>

            <td className="lbl">Surface condition:</td>
            <td className="val">{v(jd.surfaceCondition)}</td>
          </tr>
          <tr>
            <td className="lbl">Extent of Examination:</td>
            <td className="val">{v(jd.extentOfExamination)}</td>

            <td className="lbl">Welding Process:</td>
            <td className="val">{v(jd.weldingProcess)}</td>
          </tr>
          <tr>
            <td className="lbl">Type of Joint:</td>
            <td className="val">{v(jd.typeOfJoint)}</td>
          </tr>
        </tbody>
      </table>

      {/* --- 2. Equipment Details --- */}
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
            <td className="lbl">Equipment Type:</td>
            <td className="val">{v(eq.equipmentType)}</td>
            <td className="lbl">Sr. No.:</td>
            <td className="val">{v(eq.srNo)}</td>
          </tr>
          <tr>
            <td className="lbl">Make:</td>
            <td className="val">{v(eq.make)}</td>
            <td className="lbl">Calibration due:</td>
            <td className="val">{fmtDate(eq.calibrationDue)}</td>
          </tr>
          <tr>
            <td className="lbl">Spacing:</td>
            <td className="val">{v(eq.yokeSpacing)}</td>
            <td className="lbl">Pie Gauge Calibration:</td>
            <td className="val">{v(eq.pieGaugeCalibration)}</td>
          </tr>
        </tbody>
      </table>

      {/* --- 3. Medium Details --- */}
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
              3. MEDIUM DETAILS
            </td>
          </tr>
          <tr>
            <td className="col-hdr">Material</td>
            <td className="col-hdr">Manufacture</td>
            <td className="col-hdr">Batch No</td>
            <td className="col-hdr">Expiry Date</td>
          </tr>
          <tr>
            <td className="lbl">Black Ink:</td>
            <td className="val">{v(md.blackInk?.manufacturer)}</td>
            <td className="val">{v(md.blackInk?.batchNo)}</td>
            <td className="val">{v(md.blackInk?.expiryDate)}</td>
          </tr>
          <tr>
            <td className="lbl">White Contrast:</td>
            <td className="val">{v(md.whiteContrast?.manufacturer)}</td>
            <td className="val">{v(md.whiteContrast?.batchNo)}</td>
            <td className="val">{v(md.whiteContrast?.expiryDate)}</td>
          </tr>
        </tbody>
      </table>

      {/* --- 4. Method Description --- */}
      <table className="report-table mt-n1">
        <colgroup>
          <col style={{ width: "15%" }} />
          <col style={{ width: "18.33%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "18.33%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "18.34%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={6} className="section-hdr">
              4. METHOD DESCRIPTION
            </td>
          </tr>
          <tr>
            <td className="lbl">Method:</td>
            <td className="val">{v(me.method)}</td>
            <td className="lbl">Light Intensity:</td>
            <td className="val">{v(me.lightIntensity)}</td>
            <td className="lbl">Magnetization Type:</td>
            <td className="val">{v(me.magnetizationType)}</td>
          </tr>
          <tr>
            <td className="lbl">Magnetizing Method:</td>
            <td className="val">{v(me.magnetizingMethod)}</td>
            <td className="lbl">Light Equip. Used:</td>
            <td className="val">{v(me.lightEquipmentUsed)}</td>
            <td className="lbl">Bath Concentration:</td>
            <td className="val">{v(me.bathConcentration)}</td>
          </tr>
          <tr>
            <td className="lbl">Demagnetization:</td>
            <td className="val">{v(me.demagnetization)}</td>
            <td className="lbl">Post Cleaning:</td>
            <td className="val">{v(me.postCleaning)}</td>
            <td className="lbl">Gauss Meter Reading:</td>
            <td className="val">{v(me.gaussMeterReading)}</td>
          </tr>
          <tr>
            <td className="lbl">Current:</td>
            <td className="val">{v(me.current)}</td>
            <td className="lbl">Current Type:</td>
            <td className="val">{v(me.currentType)}</td>
            <td className="lbl">Verified by:</td>
            <td className="val">{v(me.magneticFieldDirectionVerifiedBy)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  // Dynamic pagination block layout engine
  const PAGE_HEIGHT_LIMIT = 286; // mm
  const HEADER_HEIGHT = 28; // mm
  const FOOTER_HEIGHT = 22; // mm
  const FIXED_SECTIONS_HEIGHT = 135; // mm
  const OBS_HEADER_HEIGHT = 12; // mm
  const SIGNATURES_HEIGHT = 38; // mm

  // visually around 5 normal rows on first page
  const FIRST_PAGE_OBS_HEIGHT_LIMIT = 38;

  // hard safety cap
  const MAX_FIRST_PAGE_OBS = 5;

  const estimateObsRowHeight = (o: any) => {
    const baseHeight = 6.5;

    const desc = o.jobDescription || "";
    const interp = o.interpretation || "";
    const evalText = o.evaluation || o.result || o.remark || "";

    // estimate by longest column
    const maxLen = Math.max(desc.length, interp.length, evalText.length);

    // approximate wrapped lines
    const lines = Math.max(1, Math.ceil(maxLen / 30));

    return baseHeight + (lines - 1) * 4.5;
  };

  type ContentBlock = {
    type: "obs-row";
    item: any;
    height: number;
  };

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

  while (currentBlockIndex < blocks.length) {
    const isFirstPage = pages.length === 0;

    // base available area
    let availableHeight =
      PAGE_HEIGHT_LIMIT - HEADER_HEIGHT - FOOTER_HEIGHT - SIGNATURES_HEIGHT;

    // first page fixed sections
    if (isFirstPage) {
      availableHeight -= FIXED_SECTIONS_HEIGHT;

      // keep footer breathing space
      availableHeight -= 8;

      // visually max around 5 normal rows
      availableHeight = Math.min(availableHeight, FIRST_PAGE_OBS_HEIGHT_LIMIT);
    }

    const pageBlocks: ContentBlock[] = [];

    let accumulatedHeight = 0;
    let hasObsTable = false;

    while (currentBlockIndex < blocks.length) {
      // hard row limit for first page
      if (isFirstPage && pageBlocks.length >= MAX_FIRST_PAGE_OBS) {
        break;
      }

      const block = blocks[currentBlockIndex];

      let blockHeight = block.height;

      // add table header once
      if (block.type === "obs-row" && !hasObsTable) {
        blockHeight += OBS_HEADER_HEIGHT;
      }

      // move to next page if height exceeds
      if (accumulatedHeight + blockHeight > availableHeight) {
        break;
      }

      pageBlocks.push(block);

      accumulatedHeight += blockHeight;

      if (block.type === "obs-row") {
        hasObsTable = true;
      }

      currentBlockIndex++;
    }

    // safety fallback for giant row
    if (pageBlocks.length === 0 && currentBlockIndex < blocks.length) {
      pageBlocks.push(blocks[currentBlockIndex]);
      currentBlockIndex++;
    }

    pages.push({
      isFirstPage,
      pageBlocks,
    });
  }

  if (pages.length === 0) {
    pages.push({ isFirstPage: true, pageBlocks: [] });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {!isPublic && (
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
      )}

      <div
        id="report-root"
        style={{ background: "#62676e", minHeight: "100vh", padding: "16px" }}
      >
        {pages.map(({ isFirstPage, pageBlocks }, i) => {
          const pageObs = pageBlocks
            .filter(
              (b): b is Extract<ContentBlock, { type: "obs-row" }> =>
                b.type === "obs-row",
            )
            .map((b) => b.item);
          const hasObsTable = pageObs.length > 0 || isFirstPage;

          return (
            <div className={`print-page${bwMode ? " bw" : ""}`} key={i}>
              <div className="print-page-content">
                {renderHeader()}
                <div className="report-body">
                  {isFirstPage && fixedSections}
                  {hasObsTable &&
                    renderObsTable(
                      pageObs,
                      isFirstPage
                        ? "5. OBSERVATIONS"
                        : "5. OBSERVATIONS (Contd.)",
                    )}
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
