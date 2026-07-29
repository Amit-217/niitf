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

  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
  .print-page-content { flex: 1 1 auto; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
  .print-page-foot {
  margin-top: auto;
  flex-shrink: 0;
}

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
  .bw .rpt-header { background: #fff !important; border-bottom: none !important; }
  .bw .hdr-center { color: #000 !important; }
  .bw .hdr-center .org { color: #000 !important; }
  .bw .hdr-center .sub { color: #333 !important; }
  .bw .hdr-center .iso { color: #000 !important; }
  .bw .logo-box { background: #fff !important; }
  .bw .section-hdr { background: #fff !important; color: #000 !important; border-bottom: 1.2px solid #000 !important; }
  .bw .col-hdr { background: #fff !important; color: #000 !important; }
  .bw .rpt-title { background: #fff !important; color: #000 !important; border: 1.2px solid #000 !important; border-top: none !important; border-bottom: none !important; border-radius: 0 !important; }
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
  .bw .report-body { color: #000 !important; border-top: 1.2px solid #000 !important; border-left: none !important; border-right: none !important; border-bottom: none !important; border-radius: 0 !important; }
  .bw .report-footer-wrap { border: 1.2px solid #000 !important; border-top: none !important; border-radius: 0 !important; }
  .bw .items-table td, .bw .items-table th { border-color: #000 !important; border-width: 1.2px !important; }
  .bw .activities-box { border-color: #000 !important; }
  .bw .nested-table td { border-color: #000 !important; border-width: 1.2px !important; }
  .rpt-title { background: #E6F1FB; text-align: center; padding: 7px; font-size: 15px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border: 1.2px solid #000; border-top: none; border-bottom: none; border-radius: 0; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 12px; font-weight: 700; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; text-align: left; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; border: 1.2px solid #000; }
  .report-table td, .report-table th { border: 1.2px solid #000; padding: 2px 4px; vertical-align: middle; word-break: break-word; font-size: 11px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 11px; text-align: left; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 11px; }
  .val { font-size: 11px; color: #000; }
  .items-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .items-table td, .items-table th { border: 1.2px solid #000; padding: 2px 4px; font-size: 10px; vertical-align: middle; word-break: break-word; text-align: left; }
  .items-table th { background: #E6F1FB; color: #0C447C; font-size: 9.5px; font-weight: 700; }
  .items-table td.text-left { text-align: left; }
  .items-table td.section-hdr { text-align: left; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .sign-table td { border: 1.2px solid #000; padding: 2px 4px; font-size: 12px; vertical-align: top; }
  .nested-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: none !important; }
  .nested-table td { border: 1.2px solid #000; }
  .nested-table tr:first-child td { border-top: none !important; }
  .nested-table tr:last-child td { border-bottom: none !important; }
  .nested-table td:first-child { border-left: none !important; }
  .nested-table td:last-child { border-right: none !important; }

  .mt-n1 { margin-top: -1px; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .report-body {
  border-top: 1.2px solid #000;
  border-left: none;
  border-right: none;
  border-bottom: none;
  border-radius: 0;
}
  
  .report-footer-wrap { border: 1.2px solid #000; border-radius: 0; overflow: hidden; margin-top: -1.2px; }
  .report-footer-wrap .sign-table.mt-n1 { margin-top: 0; }
  .report-footer-wrap .sign-table tr:first-child td { border-top: none; }
  .report-footer-wrap .sign-table td:first-child { border-left: none; }
  .report-footer-wrap .sign-table td:last-child { border-right: none; }
  .report-footer-wrap .sign-table tr:last-child td { border-bottom: none; }


 .activities-box {
    padding: 6px 8px;
    font-size: 11px;
    min-height: 40px;
    height: 100%;

    white-space: pre-wrap;
    word-break: break-word;
    overflow: hidden;

    display: flex;
    align-items: flex-start;
    justify-content: flex-start;

    width: 100%;
    box-sizing: border-box;

    border: none !important;
}
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

const splitTextIntoChunks = (
  text: string,
  charsPerChunk: number = 900
) => {
  if (!text) return [];

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += charsPerChunk) {
    chunks.push(text.slice(i, i + charsPerChunk));
  }
  return chunks;
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
      .then((res: any) => setReport(res.data?.data ?? res.data ?? res))
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

  const qrUrl = `${window.location.origin}/#/reports/public/tpi-ivr/${id}`;

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

  const renderHeader = () => (
    <div className="rpt-header">
      <div className="logo-box">
        <img src="/logo.jpeg" alt="NIIT Logo" />
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

  const renderSignatures = () => (
    <div className="report-footer-wrap">
      <table className="sign-table mt-n1">
        <colgroup>
          <col style={{ width: "50%" }} />
          <col style={{ width: "50%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>FOR VENDOR :</td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>
              FOR NIIT SURVEYOR, BARAMATI :
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>
              {v(vd.vendor) || "-"}
            </td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>
              National Industrial Inspection And Training
            </td>
          </tr>
          <tr>
            <td>Name: {v(sigs.vendor?.name) || "-"}</td>
            <td>Name: {v(sigs.niit?.name) || "-"}</td>
          </tr>
          <tr>
            <td style={{ height: "60px" }}>Signature:-</td>
            <td style={{ height: "60px" }}>Signature:-</td>
          </tr>
          <tr>
            <td>Date: {fmtDate(sigs.vendor?.date) || "-"}</td>
            <td>Date: {fmtDate(sigs.niit?.date) || "-"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const renderJobDetailsSection = () => (
    <>
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
            <td className="lbl">I.R No:</td>
            <td className="val" style={{ fontWeight: 600 }}>
              {v(report.irNo)}
            </td>
            <td
              className="val"
              style={{ fontWeight: 600, textAlign: "center" }}
            >
              <span style={{ fontSize: "10px", fontWeight: 600 }}>
                IR Rev.:{" "}
              </span>
              {v(report.irRev)}
            </td>
            <td className="lbl">Dt. of Inspection:</td>
            <td className="val" style={{ fontWeight: 600 }}>
              {fmtDate(report.dtOfInspection)}
            </td>
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
            <td className="lbl">Client:</td>
            <td className="val">{v(report.client)}</td>
            <td className="lbl">Inspection location:</td>
            <td className="val">{v(report.inspectionLocation)}</td>
          </tr>
          <tr>
            <td className="lbl">Project:</td>
            <td className="val">{v(report.project)}</td>
            <td className="lbl">Appd. QAP No.:</td>
            <td className="val">{v(report.appdQapNo)}</td>
          </tr>
          <tr>
            <td className="lbl">Client PO No.:</td>
            <td className="val">{v(report.clientPoNo)}</td>
            <td className="lbl">Appd. QAP Dt.:</td>
            <td className="val">{fmtDate(report.appdQapDt)}</td>
          </tr>
          <tr>
            <td className="lbl">PO Amed. No.:</td>
            <td className="val">{v(report.poAmedNo)}</td>
            <td className="lbl">Part Name:</td>
            <td className="val">{v(report.partName)}</td>
          </tr>
          <tr>
            <td className="lbl">PO Date:</td>
            <td className="val">{fmtDate(report.poDate)}</td>
            <td className="lbl">Inspection Stage:</td>
            <td className="val">{v(report.inspectionStage)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const renderClientVendorSection = () => (
    <table className="report-table mt-n1">
      <colgroup>
        <col style={{ width: "50%" }} />
        <col style={{ width: "50%" }} />
      </colgroup>
      <tbody>
        <tr>
          <td className="section-hdr">1. CLIENT DETAILS</td>
          <td className="section-hdr">2. VENDOR DETAILS</td>
        </tr>
        <tr>
          <td style={{ verticalAlign: "top", padding: 0 }}>
            <table className="nested-table">
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: "70%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="lbl">Ref:</td>
                  <td className="val">{v(cd.ref)}</td>
                </tr>
                <tr>
                  <td className="lbl">Contact Person:</td>
                  <td className="val">{v(cd.contact)}</td>
                </tr>
                <tr>
                  <td className="lbl">Call Date:</td>
                  <td className="val">{fmtDate(cd.callDate)}</td>
                </tr>
                <tr>
                  <td className="lbl">Inspection Att.</td>
                  <td className="val">{fmtDate(cd.inspectionAttDt)}</td>
                </tr>
              </tbody>
            </table>
          </td>
          <td
            style={{
              verticalAlign: "top",
              padding: 0,
              borderLeft: "1.2px solid #000",
            }}
          >
            <table className="nested-table">
              <colgroup>
                <col style={{ width: "36%" }} />
                <col style={{ width: "64%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="lbl">Vendor:</td>
                  <td className="val">{v(vd.vendor)}</td>
                </tr>
                <tr>
                  <td className="lbl">Sub Vendor:</td>
                  <td className="val">{v(vd.subVendor)}</td>
                </tr>
                <tr>
                  <td className="lbl">Contact Person:</td>
                  <td className="val">{v(vd.contact)}</td>
                </tr>
                <tr>
                  <td className="lbl">Phone:</td>
                  <td className="val">{v(vd.phone)}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td
            colSpan={2}
            className="lbl"
            style={{
              fontWeight: "normal",
              whiteSpace: "normal",
            }}
          >
            <strong>Extra Visit / Date:</strong> {v(ev.date)}
            &nbsp;&nbsp; <strong>Comment:</strong> {v(ev.comment)}
          </td>
        </tr>
      </tbody>
    </table>
  );

  const renderItemsTableSection = (pageItems: any[], isFirstChunk: boolean) => (
    <table className="items-table mt-n1">
      <thead>
        <tr>
          <td colSpan={9} className="section-hdr">
            {isFirstChunk ? "3. INSPECTION ITEMS" : "3. INSPECTION ITEMS (Contd.)"}
          </td>
        </tr>
        <tr>
          <td className="col-hdr" style={{ width: "8%",textAlign:"center" }} rowSpan={2}>
            PO Line No.
          </td>
          <td className="col-hdr" style={{ width: "24%", textAlign: "center" }} rowSpan={2}>
            Description
          </td>
          <td className="col-hdr" style={{ width: "16%", textAlign: "center" }} rowSpan={2}>
            Drg No. / Heat No.
          </td>
          <td className="col-hdr" colSpan={5} style={{ textAlign: "center" }}>
            Quantity in Nos.
          </td>
          <td className="col-hdr" style={{ width: "14%", textAlign: "center"}} rowSpan={2}>
            Insp. Type
          </td>
        </tr>
        <tr>
          <td className="col-hdr" style={{ width: "8%", textAlign: "center" }}>Offered</td>
          <td className="col-hdr" style={{ width: "8%", textAlign: "center" }}>Inspected</td>
          <td className="col-hdr" style={{ width: "8%", textAlign: "center" }}>Accepted</td>
          <td className="col-hdr" style={{ width: "7%", textAlign: "center" }}>Hold</td>
          <td className="col-hdr" style={{ width: "7%", textAlign: "center" }}>Reject</td>
        </tr>
      </thead>
      <tbody>
        {pageItems.length === 0 ? (
          <tr>
            <td colSpan={9}>&nbsp;</td>
          </tr>
        ) : (
          pageItems.map((item: any, i: number) => (
            <tr key={i} >
              <td style={{textAlign:"center"}}>{v(item.poLineNo)}</td>
              <td style={{ textAlign: "center" }}>{v(item.description)}</td>
              <td style={{ textAlign: "center" }}>{v(item.drgOrHeatNo)}</td>
              <td style={{textAlign:"center"}}>{v(item.qtyOffered)}</td>
              <td style={{textAlign:"center"}}>{v(item.qtyInspected)}</td>
              <td style={{textAlign:"center"}}>{v(item.qtyAccepted)}</td>
              <td style={{textAlign:"center"}}>{v(item.qtyHold)}</td>
              <td style={{textAlign:"center"}}>{v(item.qtyReject)}</td>
              <td style={{textAlign:"center"}}>{v(item.inspectionType)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  const renderActivitiesSection = (text: string, isFirstChunk: boolean) => (
    <table className="report-table mt-n1" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
      <thead>
        <tr>
          <td className="section-hdr">
            {isFirstChunk ? "4. INSPECTION ACTIVITIES" : "INSPECTION ACTIVITIES (Contd.)"}
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="activities-box">{v(text) || " "}</td>
        </tr>
      </tbody>
    </table>
  );

  const renderRefsSection = (pageRefs: any[], isFirstChunk: boolean) => (
    <table className="report-table mt-n1" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
      <colgroup>
        <col style={{ width: "30%" }} />
        <col style={{ width: "50%" }} />
        <col style={{ width: "20%" }} />
      </colgroup>
      <thead>
        <tr>
          <td colSpan={3} className="section-hdr">
            {isFirstChunk ? "5. REFERENCE DOCUMENTS FOR INSPECTION" : "REFERENCE DOCUMENTS FOR INSPECTION (Contd.)"}
          </td>
        </tr>
        <tr>
          <td className="col-hdr" style={{textAlign:"center"}}>Document</td>
          <td className="col-hdr"style={{textAlign:"center"}}>Reference Number</td>
          <td className="col-hdr"style={{textAlign:"center"}}>Rev. No.</td>
        </tr>
      </thead>
      <tbody>
        {pageRefs.map((doc: any, i: number) => (
          <tr key={i}>
            <td className="lbl" style={{ fontWeight: 500,textAlign:"center" }}>{v(doc.document)}</td>
            <td className="val" style={{textAlign:"center"}}>{v(doc.referenceNumber)}</td>
            <td className="val"style={{textAlign:"center"}}>{v(doc.revNo)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCalibSection = (pageCalib: any[], isFirstChunk: boolean) => (
    <table className="report-table mt-n1" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
      <colgroup>
        <col style={{ width: "28%" }} />
        <col style={{ width: "18%" }} />
        <col style={{ width: "18%" }} />
        <col style={{ width: "18%" }} />
        <col style={{ width: "18%" }} />
      </colgroup>
      <thead>
        <tr>
          <td colSpan={5} className="section-hdr" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
            {isFirstChunk ? "6. CALIBRATION STATUS OF INSTRUMENTS" : "6. CALIBRATION STATUS OF INSTRUMENTS (Contd.)"}
          </td>
        </tr>
        <tr>
          <td className="col-hdr" style={{textAlign:"center"}}>Equipment / Instrument</td>
          <td className="col-hdr" style={{textAlign:"center"}}>I.D. Number</td>
          <td className="col-hdr" style={{textAlign:"center"}}>Calibration Date</td>
          <td className="col-hdr" style={{textAlign:"center"}}>Due Date</td>
          <td className="col-hdr" style={{textAlign:"center"}}>NABL Certified</td>
        </tr>
      </thead>
      <tbody>
        {pageCalib.length === 0 ? (
          <tr>
            <td className="val" colSpan={5}>&nbsp;</td>
          </tr>
        ) : (
          pageCalib.map((c: any, i: number) => (
            <tr key={i}>
              <td className="val" style={{textAlign:"center"}}>{v(c.equipment)}</td>
              <td className="val" style={{textAlign:"center"}}>{v(c.idNumber)}</td>
              <td className="val" style={{textAlign:"center"}}>{fmtDate(c.calibrationDate)}</td>
              <td className="val" style={{textAlign:"center"}}>{fmtDate(c.dueDate)}</td>
              <td className="val" style={{textAlign:"center"}}>{v(c.nablCertified)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  const renderConclusionSection = (text: string, isFirstChunk: boolean) => (
    <table className="report-table mt-n1" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
      <tbody>
        <tr>
          <td className="section-hdr">
            {isFirstChunk ? "7. CONCLUSION" : "CONCLUSION (Contd.)"}
          </td>
        </tr>
        <tr>
          <td className="val" style={{ padding: "8px", minHeight: "40px" }}>
            {v(text) || "-"}
          </td>
        </tr>
      </tbody>
    </table>
  );

  // Dynamic pagination block layout engine
const PAGE_HEIGHT_LIMIT = 288;

const HEADER_HEIGHT = 28;
const FOOTER_HEIGHT = 20;
const SIGNATURES_HEIGHT = 48;

const FIXED_SECTIONS_HEIGHT = 40;


  const estimateItemRowHeight = (item: any) => {
    const baseHeight = 2; // mm
    const desc = item.description || "";
    const drg = item.drgOrHeatNo || "";
    const maxLen = Math.max(desc.length, drg.length);
    const lines = Math.max(1, Math.ceil(maxLen / 30));
    return baseHeight + (lines - 1) * 2.1;
  };

  const estimateTextHeight = (text: string, charsPerLine: number = 90) => {
    const baseHeight = 2; // mm
    const lines = Math.max(1, Math.ceil((text || "").length / charsPerLine));
    return baseHeight + (lines - 1) * 2.1; // Adjusted to account for baseHeight already including first line
  };

  const splitTextByRenderedHeight = (
    text: string,
    maxHeightMm: number
  ) => {
    if (!text) return [];

    const pxPerMm = 5.83;
    const maxHeightPx = maxHeightMm * pxPerMm;

    const container = document.createElement("div");

    container.style.position = "absolute";
    container.style.visibility = "hidden";
    container.style.width = "700px";
    container.style.fontSize = "11px";
    container.style.lineHeight = "1.4";
    container.style.whiteSpace = "pre-wrap";
    container.style.wordBreak = "break-word";
    container.style.padding = "6px 8px";

    document.body.appendChild(container);

    const chunks: string[] = [];

    let remaining = text;

    while (remaining.length > 0) {
      let low = 0;
      let high = remaining.length;
      let bestFit = "";

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        const testChunk = remaining.slice(0, mid);

        container.innerText = testChunk;

        if (container.scrollHeight <= maxHeightPx) {
          bestFit = testChunk;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      if (!bestFit) break;

      chunks.push(bestFit);

      remaining = remaining.slice(bestFit.length);
    }

    document.body.removeChild(container);

    return chunks;
  };

  type ContentBlock =
    | { type: "client-vendor"; height: number }
    | { type: "item-row"; item: any; height: number }
    | {
        type: "activities";
        text: string;
        height: number;
        isContinuation?: boolean;
      }
  | {
      type: "ref-row";
      item: any;
      height: number;
      isContinuation?: boolean;
    }
  | {
      type: "calib-row";
      item: any;
      height: number;
      isContinuation?: boolean;
    }
  | {
      type: "conclusion";
      text: string;
      height: number;
      isContinuation?: boolean;
    };

  const blocks: ContentBlock[] = [];
  blocks.push({
    type: "client-vendor",
    height: 33,
  });

  items.forEach((item: any) => {
    blocks.push({
      type: "item-row",
      item,
      height: estimateItemRowHeight(item),
    });
  });

 
const activityChunks = splitTextByRenderedHeight(
  report.inspectionActivities || "",
  20
);

activityChunks.forEach((chunk, index) => {
  blocks.push({
    type: "activities",
    text: chunk,
    height: 20,
    isContinuation: index > 0,
  });
});
  refs.forEach((doc: any) => {
    blocks.push({
      type: "ref-row",
      item: doc,
      height: 6.5,
    });
  });

  calib.forEach((c: any) => {
    blocks.push({
      type: "calib-row",
      item: c,
      height: 6.5,
    });
  });

  splitTextIntoChunks(report.conclusion, 700).forEach((chunk, index) => {
    blocks.push({
      type: "conclusion",
      text: chunk,
      height: estimateTextHeight(chunk),
      isContinuation: index > 0,
    });
  });

  type PageDescriptor = {
    isFirstPage: boolean;
    pageBlocks: ContentBlock[];
  };

  const pages: PageDescriptor[] = [];
  let currentBlockIndex = 0;

 // mm

  while (currentBlockIndex < blocks.length) {
    const isFirstPage = pages.length === 0;
    // Signatures are rendered on every page, so reduce available height by signature height on all pages
   let availableHeight =
  PAGE_HEIGHT_LIMIT -
  HEADER_HEIGHT -
  FOOTER_HEIGHT -
  SIGNATURES_HEIGHT -
  10;
    if (isFirstPage) {
      availableHeight -= FIXED_SECTIONS_HEIGHT;
    }

    const pageBlocks: ContentBlock[] = [];
    let accumulatedHeight = 0;
    let hasItemsHeader = false;
    let hasActivitiesHeader = false;
    let hasRefsHeader = false;
    let hasCalibHeader = false;
    let hasConclusionHeader = false;

    while (currentBlockIndex < blocks.length) {
      const block = blocks[currentBlockIndex];
      let blockHeight = block.height;

      if (block.type === "item-row" && !hasItemsHeader) {
        blockHeight += 18;
      }
      if (block.type === "activities" && !hasActivitiesHeader && !block.isContinuation) {
        blockHeight += 8;
      }
      if (block.type === "ref-row" && !hasRefsHeader && !block.isContinuation) {
        blockHeight += 12;
      }
      if (block.type === "calib-row" && !hasCalibHeader && !block.isContinuation) {
        blockHeight += 12;
      }
      if (block.type === "conclusion" && !hasConclusionHeader && !block.isContinuation) {
        blockHeight += 8;
      }

      if (accumulatedHeight + blockHeight <= availableHeight) {
        pageBlocks.push(block);
        accumulatedHeight += blockHeight;
        if (block.type === "item-row") hasItemsHeader = true;
        if (block.type === "activities") hasActivitiesHeader = true;
        if (block.type === "ref-row") hasRefsHeader = true;
        if (block.type === "calib-row") hasCalibHeader = true;
        if (block.type === "conclusion") hasConclusionHeader = true;
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

      {/* ── Report Content ── */}
      <div
        id="report-root"
        style={{ background: "#e9eef5", minHeight: "100vh", padding: "16px" }}
      >
        {pages.map(({ isFirstPage, pageBlocks }, i) => {
          const showClientVendor = pageBlocks.some((b) => b.type === "client-vendor");
          const pageItems = pageBlocks
            .filter((b): b is Extract<ContentBlock, { type: "item-row" }> => b.type === "item-row")
            .map((b) => b.item);
          const pageActivities = pageBlocks.filter(
            (
              b
            ): b is Extract<ContentBlock, { type: "activities" }> =>
              b.type === "activities"
          );
          const pageRefs = pageBlocks
            .filter((b): b is Extract<ContentBlock, { type: "ref-row" }> => b.type === "ref-row")
            .map((b) => b.item);
          const pageCalib = pageBlocks
            .filter((b): b is Extract<ContentBlock, { type: "calib-row" }> => b.type === "calib-row")
            .map((b) => b.item);
          const pageConclusion = pageBlocks.filter(
            (
              b
            ): b is Extract<ContentBlock, { type: "conclusion" }> =>
              b.type === "conclusion"
          );

          const isFirstItem = pageItems[0] === items[0];
          const isFirstRefs = pageRefs[0] === refs[0];
          const isFirstCalib = pageCalib[0] === calib[0];
          const shouldShowItems = pageItems.length > 0 || (isFirstPage && items.length === 0);
          const shouldShowActivities =
            pageActivities.length > 0 ||
            (isFirstPage && !report.inspectionActivities?.trim());
          const shouldShowCalib = pageCalib.length > 0 || (isFirstPage && calib.length === 0);
          const shouldShowConclusion =
            pageConclusion.length > 0 ||
            (isFirstPage && !report.conclusion?.trim());

          return (
            <div className={`print-page${bwMode ? " bw" : ""}`} key={i}>
              <div className="print-page-content">
                {renderHeader()}
                <div className="report-body">
                  {isFirstPage && renderJobDetailsSection()}
                  {showClientVendor && renderClientVendorSection()}
                  {shouldShowItems && renderItemsTableSection(pageItems, isFirstPage || isFirstItem)}
                  {shouldShowActivities && renderActivitiesSection(
                    pageActivities.map(a => a.text).join(""),
                    !pageActivities[0]?.isContinuation
                  )}
                  {pageRefs.length > 0 && renderRefsSection(pageRefs, isFirstRefs)}
                  {shouldShowCalib && renderCalibSection(pageCalib, isFirstPage || isFirstCalib)}
                  {shouldShowConclusion && renderConclusionSection(
                    pageConclusion.map(c => c.text).join(""),
                    !pageConclusion[0]?.isContinuation
                  )}
                </div>
                  {renderSignatures()}
                
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
