import React, { useEffect, useState } from "react";
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
  @page { size: A4 landscape; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }

  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #report-root { background: #fff !important; padding: 0 !important; }
    .print-page { min-height: 210mm; height: 210mm; margin: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; }
    .print-page:last-child { break-after: auto; page-break-after: auto; }
    .report-body { overflow: visible !important; }
  }

  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }

  .print-page {
    width: 297mm;
    height: 210mm;
    background: #fff;
    box-sizing: border-box;
    padding: 3mm 5mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: 0 auto 20px auto;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  .print-page-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .report-body {
    display: flex;
    flex-direction: column;
  }
  .obs-wrapper {
    flex: 1;
  }
  .obs-table {
    width: 100%;
    table-layout: fixed;
  }
  .obs-table td,
  .obs-table th {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .print-page-foot { margin-top: auto; flex-shrink: 0; }

  .rpt-header {
    font-family: Arial, Helvetica, sans-serif !important;
    padding: 0px 160px 2px 170px;
    min-height: 90px;
    margin-top: -15px;
    margin-bottom: -2px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff !important;
    height: 80px;
    flex-shrink: 0;
  }
  .logo-box {
    width: 140px;
    height: 80px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
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
    margin-top: 0px;
    line-height: 1.2;
  }
  .hdr-center .iso {
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 10px !important;
    color: #0C447C !important;
    font-weight: 700 !important;
    margin-top: 2px;
  }
  .footer {
    font-family: Arial, Helvetica, sans-serif !important;
    background: #f8fafc !important;
    padding: 4px 10px !important;
    font-size: 12px !important;
    color: #4b5563 !important;
    margin-top: 8px;
    border-top: 3px solid #185FA5 !important;
    line-height: 1.4 !important;
    text-align: center !important;
    display: flex; align-items: center; gap: 8px;
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
  .bw .rpt-title { background: #fff !important; color: #000 !important; border-color: #000 !important; }
  .bw .footer-meta { background: #fff !important; color: #000 !important; }
  .bw .footer-meta span { color: #000 !important; }
  .bw .grid-table td { border-color: #000 !important; }
  .bw .obs-table td, .bw .obs-table th { border-color: #000 !important; }
  .bw .obs-table th { background: #fff !important; color: #000 !important; }
  .bw .sign-table td { border-color: #000 !important; }
  .bw .lbl { color: #000 !important; background: #fff !important; }
  .bw .footer { background: #fff !important; color: #000 !important; border-color: #000 !important; }

  .vertical-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    display: inline-block;
    white-space: nowrap;
    text-align: center;
    line-height: 1;
    padding: 0px;
  }

  .rpt-title { background: #E6F1FB; text-align: center; padding: 4px; font-size: 14px; font-weight: 700; color: #0C447C; text-transform: uppercase; border: 1px solid #000; }

  .grid-table { width: 100%; border-collapse: collapse; border: 1px solid #000; border-top: none; font-size: 10.5px; }
  .grid-table td { border: 1px solid #000; padding: 1.5px 5px; vertical-align: middle; }
  .grid-table .lbl { font-weight: 600; width: 13%; background: #f7fafc; }
  .grid-table .val { width: 20%; }

  .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #000; border-top: none; border-spacing: 0; }
  .obs-table td, .obs-table th { border: 1px solid #000; padding: 2px; font-size: 10px; vertical-align: middle; text-align: center; word-break: break-word; }
  .obs-table th { background: #E6F1FB; color: #0C447C; font-size: 10px; font-weight: 700; border-collapse: collapse; }

  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .sign-table td { border: 1.2px solid #000; padding: 1px 5px; font-size: 10.5px; vertical-align: top; }
  .sign-table td:first-child { border-left: none; }
  .sign-table td:last-child { border-right: none; }
  .mt-n1 { margin-top: -1px; }
  .report-footer-wrap { border: 1.2px solid #000; border-top: none; border-radius: 0; overflow: hidden; margin-top: -1px; margin-bottom: 0; }
  .report-footer-wrap .sign-table tr:first-child td { border-top: none; }
  .report-footer-wrap .sign-table tr:last-child td { border-bottom: none; }
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
          gap: 12,
        }}
      >
        <p>Report not found.</p>
        <button onClick={goBack} style={{ padding: "8px 16px" }}>
          Go Back
        </button>
      </div>
    );

  const qrUrl = `${window.location.origin}/reports/public/awsd/${id}`;
  const obs = report.observations ?? [];
  const cert = report.certification ?? {};

  // Pagination for Landscape A4 (height is 210mm)
  const PAGE_HEIGHT_LIMIT = 200; // mm
  const HEADER_HEIGHT = 28; // mm
  const FOOTER_HEIGHT = 18; // mm
  const FIXED_SECTIONS_HEIGHT = 52; // mm
  const OBS_HEADER_HEIGHT = 18; // mm
  const SIGNATURES_HEIGHT = 25; // mm

  type ContentBlock = { type: "obs-row"; item: any; height: number };

  const blocks: ContentBlock[] = [];
  obs.forEach((o: any) => {
    blocks.push({ type: "obs-row", item: o, height: 6 });
  });

  type PageDescriptor = {
    isFirstPage: boolean;
    pageBlocks: ContentBlock[];
  };

  const pages: PageDescriptor[] = [];
  let currentBlockIndex = 0;

  while (currentBlockIndex < blocks.length) {
    const isFirstPage = pages.length === 0;
    let availableHeight =
      PAGE_HEIGHT_LIMIT - HEADER_HEIGHT - FOOTER_HEIGHT - SIGNATURES_HEIGHT;
    if (isFirstPage) {
      availableHeight -= FIXED_SECTIONS_HEIGHT;
    }

    const pageBlocks: ContentBlock[] = [];
    let accumulatedHeight = 0;
    let hasObsTable = false;

    while (currentBlockIndex < blocks.length) {
      const block = blocks[currentBlockIndex];
      let blockHeight = block.height;

      if (block.type === "obs-row" && !hasObsTable) {
        blockHeight += OBS_HEADER_HEIGHT;
      }

      if (accumulatedHeight + blockHeight <= availableHeight) {
        pageBlocks.push(block);
        accumulatedHeight += blockHeight;
        if (block.type === "obs-row") hasObsTable = true;
        currentBlockIndex++;
      } else {
        break;
      }
    }

    if (pageBlocks.length === 0 && currentBlockIndex < blocks.length) {
      pageBlocks.push(blocks[currentBlockIndex]);
      currentBlockIndex++;
    }

    pages.push({ isFirstPage, pageBlocks });
  }

  // ── Sub-components ──────────────────────────────────────────────────────────

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

  const fixedSections = (
    <>
      <div className="rpt-title">ULTRASONIC INSPECTION REPORT (AWS D1.1)</div>
      <table className="grid-table">
        <tbody>
          <tr>
            <td className="lbl">Customer</td>
            <td className="val">{v(report.customerId?.companyName)}</td>
            <td className="lbl">Report No.</td>
            <td className="val">{v(report.reportNo || report.id)}</td>
            <td className="lbl">Project</td>
            <td className="val">{v(report.project)}</td>
          </tr>
          <tr>
            <td className="lbl">Date of Inspection</td>
            <td className="val">{fmtDate(report.dateOfInspection)}</td>
            <td className="lbl">Job Description</td>
            <td className="val">{v(report.jobDescription)}</td>
            <td className="lbl">Drawing.no</td>
            <td className="val">{v(report.drawingNo)}</td>
          </tr>
          <tr>
            <td className="lbl">Calibration. Block</td>
            <td className="val">{v(report.calibrationBlock)}</td>
            <td className="lbl">QTY of Jts.</td>
            <td className="val">{v(report.qtyOfJts)}</td>
            <td className="lbl">Flaw Detector/Sr. No.</td>
            <td className="val">{v(report.flawDetectorSrNo)}</td>
          </tr>
          <tr>
            <td className="lbl">Welding Process</td>
            <td className="val">{v(report.weldingProcess)}</td>
            <td className="lbl">Machine Calibration</td>
            <td className="val">{v(report.machineCalibration)}</td>
            <td className="lbl">Surface Condition</td>
            <td className="val">{v(report.surfaceCondition)}</td>
          </tr>
          <tr>
            <td className="lbl">P.O. No.</td>
            <td className="val">{v(report.poNo)}</td>
            <td className="lbl">Couplant</td>
            <td className="val">{v(report.couplant)}</td>
            <td className="lbl">Stage of inspection</td>
            <td className="val">{v(report.stageOfInspection)}</td>
          </tr>
          <tr>
            <td className="lbl">Material</td>
            <td className="val">{v(report.material)}</td>
            <td className="lbl">QAP NO.</td>
            <td className="val">{v(report.qapNo)}</td>
            <td className="lbl">Acc. Standard</td>
            <td className="val">{v(report.accStandard)}</td>
          </tr>
        </tbody>
      </table>
      <table className="obs-table" style={{ marginTop: "-1px" }}>
        <thead>
          <tr>
            <th>Probe</th>
            <th>Probe Angle</th>
            <th>Frequency</th>
            <th>Range</th>
            <th>Scanning Sensitivity</th>
            <th>Reference dB</th>
            <th>Scanning dB</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{v(report.probe)}</td>
            <td>{v(report.probeAngle)}</td>
            <td>{v(report.frequency)}</td>
            <td>{v(report.range)}</td>
            <td>{v(report.scanningSensitivity)}</td>
            <td>{v(report.referenceDb)}</td>
            <td>{v(report.scanningDb)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const renderObsTable = (chunk: any[], chunkIdx: number) => (
    <table
      className="obs-table"
      style={{ marginTop: chunkIdx === 0 ? "-1px" : "0" }}
    >
      <thead>
        <tr>
          <th rowSpan={3} style={{ width: "3%" }}>
            Sr.
            <br />
            No.
          </th>
          <th rowSpan={3} style={{ width: "9%" }}>
            Joint Details
          </th>
          <th rowSpan={3} style={{ width: "9%" }}>
            Drawing No. /<br />
            Part No.
          </th>
          <th rowSpan={3} style={{ width: "7%" }}>
            Job Thickness
            <br />
            (mm)
          </th>
          <th rowSpan={3} style={{ width: "8%" }}>
            Part Number
          </th>
          <th rowSpan={3} style={{ width: "6%" }}>
            Transducer
            <br />
            Angle
          </th>
          <th rowSpan={3} style={{ width: "8%" }}>
            Joint No
          </th>
          <th colSpan={4}>Decibels</th>
          <th colSpan={5}>Discontinuity</th>
          <th rowSpan={3} style={{ width: "8%" }}>
            Discontinuity
            <br />
            Evaluation
          </th>
          <th rowSpan={3} style={{ width: "7%" }}>
            Remarks
          </th>
        </tr>
        <tr>
          <th style={{ width: "4.5%", padding: "4px" }}>
            <div className="vertical-text">
              Indication <br />
              Level
            </div>
          </th>
          <th style={{ width: "4.5%", padding: "4px" }}>
            <div className="vertical-text">
              Reference <br />
              Level
            </div>
          </th>
          <th style={{ width: "4.5%", padding: "4px" }}>
            <div className="vertical-text">
              Attenuation <br />
              Factor
            </div>
          </th>
          <th style={{ width: "4.5%", padding: "4px" }}>
            <div className="vertical-text">
              Indication <br />
              Rating
            </div>
          </th>
          <th style={{ width: "4.5%", padding: "4px" }} rowSpan={2}>
            <div className="vertical-text">Length (mm)</div>
          </th>
          <th style={{ width: "4.5%", padding: "4px" }} rowSpan={2}>
            <div className="vertical-text">
              Angular
              <br /> Distance
            </div>
          </th>
          <th style={{ width: "4.5%", padding: "4px" }} rowSpan={2}>
            <div className="vertical-text">
              Depth from <br /> "A" Surface
            </div>
          </th>
          <th style={{ width: "4.5%", padding: 0 }} colSpan={2} rowSpan={2}>
            <div style={{ fontWeight: 700 }}>Distance MM</div>
            <div
              style={{
                display: "flex",
                borderTop: "1.2px solid #000",
                marginTop: "2px",
              }}
            >
              <div
                className="vertical-text"
                style={{
                  width: "50%",
                  height: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingLeft: "6px",
                  paddingRight: "6px",
                  borderLeft: "1.2px solid #000",
                }}
              >
                From X
              </div>
              <div
                className="vertical-text"
                style={{
                  width: "50%",
                  height: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingLeft: "6px",
                  paddingRight: "6px",
                }}
              >
                From Y
              </div>
            </div>
          </th>
        </tr>
        <tr>
          <th style={{ width: "4.5%" }}>a</th>
          <th style={{ width: "4.5%" }}>b</th>
          <th style={{ width: "4.5%" }}>c</th>
          <th style={{ width: "4.5%" }}>d</th>
        </tr>
      </thead>
      <tbody>
        {chunk.map((o: any, i: number) => (
          <tr key={i} style={{ height: "20px" }}>
            <td>{v(o.serialNo)}</td>
            <td>{v(o.jointDetails)}</td>
            <td>{v(o.drawingNoPartNo)}</td>
            <td>{v(o.jobThickness)}</td>
            <td>{v(o.partNo)}</td>
            <td>{v(o.transducerAngle)}</td>
            <td>{v(o.jointNo)}</td>
            <td>{v(o.decibels?.indicationLevelA)}</td>
            <td>{v(o.decibels?.referenceLevelB)}</td>
            <td>{v(o.decibels?.attenuationFactorC)}</td>
            <td>{v(o.decibels?.indicationRatingD)}</td>
            <td>{v(o.discontinuity?.length)}</td>
            <td>{v(o.discontinuity?.angularDistance)}</td>
            <td>{v(o.discontinuity?.depthFromASurface)}</td>
            <td>{v(o.discontinuity?.distanceX)}</td>
            <td>{v(o.discontinuity?.distanceY)}</td>
            <td>{v(o.discontinuityEvaluation)}</td>
            <td>{v(o.remarks)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const ReportSignatures = () => (
    <div className="report-footer-wrap mt-n1">
      <table className="sign-table mt-n1">
        <colgroup>
          <col style={{ width: "33.3%" }} />
          <col style={{ width: "33.3%" }} />
          <col style={{ width: "33.4%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>For :</td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>For :</td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>For :</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>
              National Industrial Inspection And Training
            </td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>
              {v(cert.manufacturerOrContractor)}
            </td>
            <td style={{ fontWeight: 600, fontSize: "11px" }}>
              {v(cert.verifiedBy)}
            </td>
          </tr>
          <tr>
            <td>Inspected By : {v(cert.inspectedBy) || "-"}</td>
            <td>Verified By : {v(cert.authorizedBy) || "-"}</td>
            <td>Reviewed By : {v(cert.reviewedBy) || "-"}</td>
          </tr>
          <tr>
            <td>
              ASNT NDT Level-II - UT
              {cert.year ? ` (${v(cert.year)})` : ""}
            </td>
            <td>-</td>
            <td>-</td>
          </tr>
          <tr>
            <td style={{ height: "32px" }}>Signature:-</td>
            <td>Signature :</td>
            <td>Signature :</td>
          </tr>
          <tr>
            <td>Date : {fmtDate(cert.testDate)}</td>
            <td>Date : {fmtDate(cert.date)}</td>
            <td>Date : {fmtDate(cert.reviewedByDate)}</td>
          </tr>
          {/* <tr>
            <td
              colSpan={3}
              style={{ fontSize: "9px", fontStyle: "italic", padding: "2px 5px" }}
            >
              <strong>Note :</strong> Welds that are unacceptable by the above
              criteria shall be repaired or replaced. The repaired welds shall be
              retested by UT and their re-inspection results also be recorded.
            </td>
          </tr> */}
        </tbody>
      </table>
    </div>
  );

  const ReportFooter = () => (
    <>
      <div className="footer">
        <div className="footer-text-block" style={{ flex: 1 }}>
          Corp Office: 1st Floor, Plot No.PAP-3/28, Behind BSNL Office, MIDC,
          Baramati, Dist-Pune 413133 | Ph: +91 9860186056, +91 7875154431
          <br />
          Reg. Office: A/p - Kuthare, Tal - Patan, Dist-Satara 415112 | Website:
          www.niitindt.com | Email: niit04@gmail.com | info@niitindt.com
        </div>
        <div className="qr-wrap" style={{ flexShrink: 0 }}>
          <QRCodeSVG value={qrUrl} size={42} />
        </div>
      </div>
      <div className="footer-meta">
        Format No: <span>FMT-NDT-AWSD-01</span>
        &nbsp;|&nbsp; Rev. No: <span>00</span>
        &nbsp;|&nbsp; Report Date: <span>{fmtDate(cert.date)}</span>
      </div>
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

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
        {pages.map(({ isFirstPage, pageBlocks }, i) => {
          const pageObs = pageBlocks
            .filter(
              (b): b is Extract<ContentBlock, { type: "obs-row" }> =>
                b.type === "obs-row",
            )
            .map((b) => b.item);
          const hasObsTable = pageObs.length > 0;

          return (
            <div className={`print-page${bwMode ? " bw" : ""}`} key={i}>
              <div className="print-page-content">
                {renderHeader()}
                <div className="report-body">
                  {isFirstPage && fixedSections}
                  <div className="obs-wrapper">
                    {hasObsTable && renderObsTable(pageObs, i)}
                  </div>
                  <ReportSignatures />
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
