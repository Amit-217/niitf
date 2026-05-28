import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getAWSDReportById } from "../../../api/customerApi";

// ───────── Print Styles ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }

  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #report-root { background: #fff !important; padding: 0 !important; }
    .print-page { min-height: 296mm; height: 296mm; margin: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; }
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
  .rpt-title { background: #E6F1FB; text-align: center; padding: 5px; font-size: 16px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border: 1.2px solid #000; border-top: none; border-bottom: none; border-radius: 6px 6px 0 0; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 14px; font-weight: 700; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; text-align: center !important; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; border: 1.2px solid #000; }
  .report-table td, .report-table th { border: 1.2px solid #000; padding: 2px 4px; vertical-align: middle; word-break: break-word; font-size: 11px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 11px; text-align: center !important; color: #0C447C; overflow: hidden; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 11px; width: 22%; }
  .val { font-size: 11px; color: #000; }
  .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.2px solid #000; }
  .obs-table td, .obs-table th { border: 1.2px solid #000; padding: 2px 3px; font-size: 10px; vertical-align: middle; text-align: center !important; word-break: break-word; }
  .obs-table th { background: #E6F1FB; color: #0C447C; font-size: 11px; font-weight: 700; }
  .obs-table tr { break-inside: avoid; page-break-inside: avoid; }
  .obs-table .vcell {
    height: 92px;
    padding: 0;
    overflow: hidden;
    text-align: center !important;
    vertical-align: middle !important;
  }
  .obs-table .vtext {
    display: inline-block;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    white-space: nowrap;
    line-height: 1.1;
    font-size: 11px;
    text-align: center;
  }
  .vcell-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
  }
  .form-block { border: 1px solid #000; border-bottom: none; padding: 5px 8px; font-size: 10px; }
  .form-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
  .form-row:last-child { margin-bottom: 0; }
  .form-label { white-space: nowrap; font-size: 10px; font-weight: 600; }
  .form-val { flex: 1; border-bottom: 1px solid #555; min-width: 30px; font-size: 10px; padding-bottom: 1px; min-height: 13px; }
  .cert-para { font-size: 11px; font-style: italic; color: #333; padding: 4px 6px; border: 1.2px solid #000; border-top: none; line-height: 1.4; break-inside: avoid; margin-bottom: -1px; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .sign-table td { border: 1.2px solid #000; padding: 2px 4px; font-size: 12px; vertical-align: top; }
  .sign-table tr:first-child td { border-top: none; }
  .accept-badge, .reject-badge, .neutral-badge { display: inline-block; font-size: 10px; padding: 0; border-radius: 0; font-weight: 700; background: transparent; border: none; }
  .accept-badge { color: #000; }
  .reject-badge { color: #000; }
  .neutral-badge { color: #000; }
  .report-body { border-top: 1.2px solid #000; border-left: none; border-right: none; border-bottom: none; border-radius: 6px 6px 0 0; overflow: hidden; }
  .report-footer-wrap { border: 1.2px solid #000; border-top: none; border-radius: 0 0 6px 6px; overflow: hidden; margin-top: -1px; }
  .sign-table tr td:first-child { border-left: none; }
  .sign-table tr td:last-child { border-right: none; }
  .sign-table tr:last-child td { border-bottom: none; }
  .footer { background: #f8fafc; padding: 6px 10px; font-size: 10px; color: #4b5563; border-top: 3px solid #185FA5; line-height: 1.4; display: flex; align-items: center; gap: 8px; }
  .footer-text-block { flex: 1; text-align: center; }
  .qr-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
`;

// ───────── Helpers ─────────────────────────────────────────────────────────────

const v = (s?: string | number | null) =>
  s !== undefined && s !== null ? String(s) : "";

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

// ───────── Component ───────────────────────────────────────────────────────────

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
  const [bwMode, setBwMode] = useState(false);

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
      const trigger = async () => {
        try {
          await document.fonts.ready;
        } catch (_) {}
        requestAnimationFrame(() => {
          setTimeout(() => {
            window.print();
            document.body.classList.remove("autoprint-mode");
          }, 300);
        });
      };
      trigger();
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

  const qrUrl = `${window.location.origin}/reports/public/awsd/${id}`;
  const obs = report.observations ?? [];
  const cert = report.certification ?? {};

  // Dynamic pagination block layout engine
  const PAGE_HEIGHT_LIMIT = 288; // mm
  const HEADER_HEIGHT = 28; // mm
  const FOOTER_HEIGHT = 22; // mm
  const FIXED_SECTIONS_HEIGHT = 125; // mm (Title + Job info form block + Sketch)
  const OBS_HEADER_HEIGHT = 40; // mm (vertical text three-level header)

  type ContentBlock =
    | { type: "obs-row"; item: any; height: number }
    | { type: "signatures"; height: number };

  const blocks: ContentBlock[] = [];
  obs.forEach((o) => {
    blocks.push({
      type: "obs-row",
      item: o,
      height: 8.2, // mm per observation row (including borders)
    });
  });
  blocks.push({
    type: "signatures",
    height: 48,
  });

  type PageDescriptor = {
    isFirstPage: boolean;
    pageBlocks: ContentBlock[];
  };

  const pages: PageDescriptor[] = [];
  let currentBlockIndex = 0;

  while (currentBlockIndex < blocks.length) {
    const isFirstPage = pages.length === 0;
    let availableHeight = PAGE_HEIGHT_LIMIT - HEADER_HEIGHT - FOOTER_HEIGHT;
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

  const ObsTableHeader = () => (
    <thead>
      <tr>
        <td
          colSpan={16}
          className="section-hdr"
          style={{ textAlign: "center" }}
        >
          OBSERVATIONS
        </td>
      </tr>
      {/* Header row 1: Group labels */}
      <tr>
        <td className="col-hdr vcell" rowSpan={3} style={{ width: "3.5%" }}>
          <div className="vcell-wrap">
            <span className="vtext">Line number</span>
          </div>
        </td>
        <td className="col-hdr vcell" rowSpan={3} style={{ width: "5.5%" }}>
          <div className="vcell-wrap">
            <span className="vtext">Indication number</span>
          </div>
        </td>
        <td className="col-hdr vcell" rowSpan={3} style={{ width: "7%" }}>
          <div className="vcell-wrap">
            <span className="vtext">Transducer angle</span>
          </div>
        </td>
        <td className="col-hdr vcell" rowSpan={3} style={{ width: "4.5%" }}>
          <div className="vcell-wrap">
            <span className="vtext">From Face</span>
          </div>
        </td>
        <td className="col-hdr vcell" rowSpan={3} style={{ width: "3.5%" }}>
          <div className="vcell-wrap">
            <span className="vtext">Leg*</span>
          </div>
        </td>
        <td className="col-hdr" colSpan={4}>
          Decibels
        </td>
        <td className="col-hdr" colSpan={5}>
          Discontinuity
        </td>
        <td className="col-hdr vcell" rowSpan={3} style={{ width: "6.5%" }}>
          <div className="vcell-wrap">
            <span className="vtext text-center">
              Discontinuity <br />
              evaluation
            </span>
          </div>
        </td>
        <td className="col-hdr vcell" rowSpan={3} style={{ width: "6.5%" }}>
          <div className="vcell-wrap">
            <span className="vtext">Remarks</span>
          </div>
        </td>
      </tr>
      {/* Header row 2: Sub-column names (vertical) */}
      <tr>
        <td className="col-hdr vcell" style={{ width: "5.5%" }}>
          <div className="vcell-wrap">
            <span className="vtext text-center">
              Indication <br />
              level
            </span>
          </div>
        </td>
        <td className="col-hdr vcell" style={{ width: "5.5%" }}>
          <div className="vcell-wrap">
            <span className="vtext text-center">
              Reference <br />
              level
            </span>
          </div>
        </td>
        <td className="col-hdr vcell" style={{ width: "6%" }}>
          <div className="vcell-wrap">
            <span className="vtext text-center">
              Attenuation <br />
              factor
            </span>
          </div>
        </td>
        <td className="col-hdr vcell" style={{ width: "5.5%" }}>
          <div className="vcell-wrap">
            <span className="vtext text-center">
              Indication <br />
              rating
            </span>
          </div>
        </td>
        <td className="col-hdr vcell" rowSpan={2} style={{ width: "5%" }}>
          <div className="vcell-wrap">
            <span className="vtext">Length</span>
          </div>
        </td>
        <td className="col-hdr vcell" rowSpan={2} style={{ width: "5.5%" }}>
          <div className="vcell-wrap">
            <span className="vtext">Angular distance</span>
          </div>
        </td>
        <td className="col-hdr vcell" rowSpan={2} style={{ width: "6%" }}>
          <div className="vcell-wrap">
            <span className="vtext">
              Depth from <br />
              'A' surface
            </span>
          </div>
        </td>
        <td className="col-hdr" colSpan={2}>
          Distance
        </td>
      </tr>
      {/* Header row 3: Letter labels + From X/Y */}
      <tr>
        <td className="col-hdr" style={{ fontWeight: 700 }}>
          a
        </td>
        <td className="col-hdr" style={{ fontWeight: 700 }}>
          b
        </td>
        <td className="col-hdr" style={{ fontWeight: 700 }}>
          c
        </td>
        <td className="col-hdr" style={{ fontWeight: 700 }}>
          d
        </td>
        <td className="col-hdr" style={{ width: "4.5%" }}>
          From X
        </td>
        <td className="col-hdr" style={{ width: "4.5%" }}>
          From Y
        </td>
      </tr>
    </thead>
  );

  const ReportSignatures = () => (
    <>
      {/* Certification text */}
      <div className="cert-para">
        We, the undersigned, certify that the statements in this record are
        correct and that the welds were prepared and tested in conformance with
        the requirements of Clause 8, Part F of AWS D1.1/D1.1M,&nbsp;
        <strong>({v(cert.year) || "____"})</strong>,&nbsp; Structural Welding
        Code—Steel.
      </div>
      {/* Signature block */}
      <div className="report-footer-wrap">
        <table className="sign-table">
          <colgroup>
            <col style={{ width: "50%" }} />
            <col style={{ width: "50%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ fontSize: "11px", padding: "4px 6px" }}>
                Test date&nbsp;
                <span
                  style={{
                    display: "inline-block",
                    minWidth: "140px",
                    borderBottom: "1px solid #555",
                    verticalAlign: "bottom",
                  }}
                >
                  {fmtDate(cert.testDate)}
                </span>
              </td>
              <td style={{ fontSize: "11px", padding: "4px 6px" }}>
                Manufacturer or Contractor&nbsp;
                <span
                  style={{
                    display: "inline-block",
                    minWidth: "100px",
                    borderBottom: "1px solid #555",
                    verticalAlign: "bottom",
                  }}
                >
                  {v(cert.manufacturerOrContractor)}
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ fontSize: "11px", padding: "4px 6px" }}>
                Inspected by&nbsp;
                <span
                  style={{
                    display: "inline-block",
                    minWidth: "150px",
                    borderBottom: "1px solid #555",
                    verticalAlign: "bottom",
                  }}
                >
                  {v(cert.inspectedBy)}
                </span>
              </td>
              <td
                style={{
                  fontSize: "11px",
                  padding: "4px 6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <span>
                    Authorized by&nbsp;
                    <span
                      style={{
                        display: "inline-block",
                        minWidth: "80px",
                        borderBottom: "1px solid #555",
                        verticalAlign: "bottom",
                      }}
                    >
                      {v(cert.authorizedBy)}
                    </span>
                  </span>
                  <span>
                    Date&nbsp;
                    <span
                      style={{
                        display: "inline-block",
                        minWidth: "60px",
                        borderBottom: "1px solid #555",
                        verticalAlign: "bottom",
                      }}
                    >
                      {fmtDate(cert.date)}
                    </span>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          style={{
            fontSize: "9px",
            padding: "4px 6px",
            borderTop: "1px solid #d9e1ea",
            lineHeight: 1.4,
          }}
        >
          <strong>Note:</strong> This form is applicable to Clause 8, Parts B or
          C (Statically and Cyclically Loaded Nontubular Structures). Do{" "}
          <strong>NOT</strong> use this form for Tubular Structures (Clause 10,
          Part A).
        </div>
      </div>
    </>
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
        Format No: <span>FMT-NDT-AWSD-01</span>
        &nbsp;|&nbsp; Rev. No: <span>00</span>
        &nbsp;|&nbsp; Report Date: <span>{fmtDate(cert.date)}</span>
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
          FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT
        </div>
        <div className="iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
      </div>
    </div>
  );

  // ───── AWSD fixed content: title + job-information form block ─────
  const fixedSections = (
    <>
      <div className="rpt-title">Report of UT of Welds (AWS D1.1)</div>
      {/* ───── JOB INFORMATION (form-line style) ───── */}
      <div className="form-block">
        {/* Row 1: Project + Report No */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "4px",
          }}
        >
          <div className="form-row" style={{ flex: 2, marginBottom: 0 }}>
            <span className="form-label">Project</span>
            <span className="form-val">{v(report.project)}</span>
          </div>
          <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
            <span className="form-label">Report no.</span>
            <span className="form-val">{v(report.reportNo || report.id)}</span>
          </div>
        </div>
        {/* Row 2: Diagram + Fields */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          {/* Weld reference diagram */}
          <div
            style={{
              width: "200px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "4px",
            }}
          >
            <img
              src="/image.png"
              alt="Weld reference sketch"
              style={{
                width: "200px",
                height: "auto",
                display: "block",
              }}
            />
          </div>
          {/* Right: Form fields */}
          <div style={{ flex: 1 }}>
            <div className="form-row">
              <span className="form-label">Weld identification :</span>
              <span className="form-val">{v(report.weldIdentification)}</span>
            </div>
            <div className="form-row">
              <span className="form-label">Material thickness :</span>
              <span className="form-val">{v(report.materialThickness)}</span>
            </div>
            <div className="form-row">
              <span className="form-label">Weld joint AWS :</span>
              <span className="form-val">{v(report.weldJointAWS)}</span>
            </div>
            <div className="form-row">
              <span className="form-label">Welding process :</span>
              <span className="form-val">{v(report.weldingProcess)}</span>
            </div>
            <div className="form-row">
              <span className="form-label">
                Quality requirements—section no. :
              </span>
              <span className="form-val">
                {v(report.qualityRequirementsSection)}
              </span>
            </div>
            <div className="form-row">
              <span className="form-label">Remarks :</span>
              <span className="form-val">
                {v(report.evaluation || report.remarks)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // ───── Observation table for a single chunk (page) ─────
  const renderObsTable = (
    chunk: any[],
    chunkIdx: number,
    isLastChunk: boolean,
  ) => (
    <table
      className="obs-table"
      style={{
        borderTop: chunkIdx > 0 ? "1.2px solid #000" : "none",
      }}
    >
      <ObsTableHeader />
      <tbody>
        {chunk.map((o: any, i: number) => {
          const globalIdx =
            chunkIdx === 0
              ? i
              : FIRST_PAGE_SIZE + (chunkIdx - 1) * SUBSEQUENT_PAGE_SIZE + i;
          return (
            <tr key={i} style={{ height: "24px" }}>
              <td>{v(o.lineNo || globalIdx + 1)}</td>
              <td>{v(o.indicationNo)}</td>
              <td>{v(o.transducerAngle)}</td>
              <td>{v(o.fromFace)}</td>
              <td>{v(o.leg)}</td>
              <td>{v(o.decibels?.indicationLevel)}</td>
              <td>{v(o.decibels?.referenceLevel)}</td>
              <td>{v(o.decibels?.attenuationFactor)}</td>
              <td>{v(o.decibels?.indicationRating)}</td>
              <td>{v(o.discontinuity?.length)}</td>
              <td>{v(o.discontinuity?.angularDistance)}</td>
              <td>{v(o.discontinuity?.depthFromA)}</td>
              <td>{v(o.discontinuity?.distanceFromX)}</td>
              <td>{v(o.discontinuity?.distanceFromY)}</td>
              <td>{v(o.interpretation)}</td>
              <td>{v(o.evaluation)}</td>
            </tr>
          );
        })}
        {/* Empty rows: fill first page to full size */}
        {chunkIdx === 0 &&
          chunk.length < FIRST_PAGE_SIZE &&
          Array.from({
            length: FIRST_PAGE_SIZE - chunk.length,
          }).map((_, i) => (
            <tr key={`empty-p1-${i}`} style={{ height: "24px" }}>
              <td>{chunk.length + i + 1}</td>
              {Array.from({ length: 15 }).map((__, j) => (
                <td key={j}></td>
              ))}
            </tr>
          ))}
        {/* Empty rows: pad short last (continuation) page to min 3 rows */}
        {chunkIdx > 0 &&
          isLastChunk &&
          chunk.length < 3 &&
          Array.from({
            length: Math.max(0, 3 - chunk.length),
          }).map((_, i) => (
            <tr key={`empty-last-${i}`} style={{ height: "24px" }}>
              <td>
                {FIRST_PAGE_SIZE +
                  (chunkIdx - 1) * SUBSEQUENT_PAGE_SIZE +
                  chunk.length +
                  i +
                  1}
              </td>
              {Array.from({ length: 15 }).map((__, j) => (
                <td key={j}></td>
              ))}
            </tr>
          ))}
      </tbody>
    </table>
  );

  // Pages are now built dynamically by the layout engine

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

      {/* ───── Report Content ───── */}
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
          const hasSignatures = pageBlocks.some((b) => b.type === "signatures");
          
          return (
            <div className={`print-page${bwMode ? " bw" : ""}`} key={i}>
              <div className="print-page-content">
                {renderHeader()}
                <div className="report-body">
                  {isFirstPage ? (
                    fixedSections
                  ) : (
                    <div className="rpt-title" style={{ borderTop: "none" }}>
                      Report of UT of Welds (AWS D1.1) - Continued
                    </div>
                  )}
                  {hasObsTable && renderObsTable(pageObs, i, pages.length - 1 === i)}
                  {hasSignatures && <ReportSignatures />}
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
