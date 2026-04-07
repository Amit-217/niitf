import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getAWSDReportById } from "../../../api/customerApi";

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
    .report { overflow: visible !important; }
    .report-body { overflow: visible !important; }
    tfoot { display: table-footer-group !important; }
    .report-footer-wrap {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  .report { background: #fff; border: none; border-radius: 4px; overflow: hidden; }
  .rpt-header { padding: 6px 8px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
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
  .rpt-title { background: #E6F1FB; text-align: center; padding: 7px; font-size: 15px; font-weight: 700; color: #0C447C; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #b8cfe7; }
  .section-hdr { background: #185FA5; color: #fff; font-size: 12px; font-weight: 700; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; }
  .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .report-table td, .report-table th { border: 1px solid #d9e1ea; padding: 2px 4px; vertical-align: middle; word-break: break-word; font-size: 11px; }
  .col-hdr { background: #E6F1FB; font-weight: 700; font-size: 11px; text-align: center; color: #0C447C; }
  .lbl { background: #f7fafc; font-weight: 600; font-size: 11px; width: 22%; }
  .val { font-size: 11px; color: #000; }
  .obs-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .obs-table td, .obs-table th { border: 1px solid #d9e1ea; padding: 2px 3px; font-size: 9px; vertical-align: middle; text-align: center; word-break: break-word; }
  .obs-table th { background: #E6F1FB; color: #0C447C; font-size: 8.5px; font-weight: 700; }
  .obs-table tr { break-inside: avoid; page-break-inside: avoid; }
  .form-block { border: 1px solid #888; padding: 5px 8px; margin-top: -1px; font-size: 10px; }
  .form-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
  .form-row:last-child { margin-bottom: 0; }
  .form-label { white-space: nowrap; font-size: 10px; font-weight: 600; }
  .form-val { flex: 1; border-bottom: 1px solid #555; min-width: 30px; font-size: 10px; padding-bottom: 1px; min-height: 13px; }
  .cert-para { font-size: 11px; font-style: italic; color: #333; padding: 4px 6px; border: 1px solid #d9e1ea; margin-top: -1px; line-height: 1.4; break-inside: avoid; }
  .sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .sign-table td { border: 1px solid #d9e1ea; padding: 2px 4px; font-size: 12px; vertical-align: top; }
  .mt-n1 { margin-top: -1px; }
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

// â"€â"€â"€ Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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

  const qrUrl = `${window.location.origin}/reports/public/awsd/${id}`;
  const obs = report.observations ?? [];
  const cert = report.certification ?? {};

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
            width: "210mm",
            minHeight: "297mm",
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
                <td style={{ padding: "2mm 0 0 0" }}>
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
                        THIRD PARTY INSPECTION | NDT SERVICES &amp; NDT TRAINING
                        | NDT CONSULTANCY
                        <br />
                        FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT
                      </div>
                      <div className="iso">
                        (AN ISO 9001:2015 CERTIFIED ORGANIZATION)
                      </div>
                    </div>
                  </div>
                  <div className="rpt-title">
                    Report of UT of Welds (AWS D1.1)
                  </div>
                </td>
              </tr>
            </thead>

            <tbody style={{ display: "table-row-group" }}>
              <tr>
                <td style={{ padding: 0, verticalAlign: "top" }}>
                  {/* â"€â"€ JOB INFORMATION (form-line style) â"€â"€ */}
                  <div className="form-block">
                    {/* Row 1: Project + Report No */}
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        className="form-row"
                        style={{ flex: 2, marginBottom: 0 }}
                      >
                        <span className="form-label">Project</span>
                        <span className="form-val">{v(report.project)}</span>
                      </div>
                      <div
                        className="form-row"
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <span className="form-label">Report no.</span>
                        <span className="form-val">
                          {v(report.reportNo || report.id)}
                        </span>
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
                      {/* Weld reference diagram - matches original AWS D1.1 sketch */}
                      <div
                        style={{
                          width: "108px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          paddingTop: "4px",
                        }}
                      >
                        <svg
                          width="108"
                          height="72"
                          viewBox="0 0 108 72"
                          style={{ overflow: "visible" }}
                        >
                          {/* Plate: parallelogram shape (slight perspective tilt) */}
                          <polygon
                            points="24,8 92,8 96,46 20,46"
                            fill="white"
                            stroke="#333"
                            strokeWidth="1.2"
                          />

                          {/* Cross "+" mark inside plate (left area - weld reference point) */}
                          <line
                            x1="33"
                            y1="16"
                            x2="33"
                            y2="30"
                            stroke="#333"
                            strokeWidth="1"
                          />
                          <line
                            x1="26"
                            y1="23"
                            x2="40"
                            y2="23"
                            stroke="#333"
                            strokeWidth="1"
                          />

                          {/* X label — outside shape on the LEFT with horizontal arrow line → */}
                          <text
                            x="1"
                            y="28"
                            style={{
                              fontSize: "10px",
                              fontWeight: "bold",
                              fontFamily: "Arial",
                            }}
                          >
                            X
                          </text>
                          <line
                            x1="9"
                            y1="23"
                            x2="19"
                            y2="23"
                            stroke="#333"
                            strokeWidth="0.9"
                          />
                          {/* arrowhead pointing right into shape */}
                          <polygon points="20,21 20,25 24,23" fill="#333" />

                          {/* X label — inside shape on the RIGHT */}
                          <text
                            x="74"
                            y="22"
                            style={{
                              fontSize: "10px",
                              fontWeight: "bold",
                              fontFamily: "Arial",
                            }}
                          >
                            X
                          </text>

                          {/* Y label — below the shape, center */}
                          <text
                            x="50"
                            y="64"
                            style={{
                              fontSize: "10px",
                              fontWeight: "bold",
                              fontFamily: "Arial",
                            }}
                          >
                            Y
                          </text>
                        </svg>
                      </div>
                      {/* Right: Form fields */}
                      <div style={{ flex: 1 }}>
                        <div className="form-row">
                          <span className="form-label">
                            Weld identification
                          </span>
                          <span className="form-val">
                            {v(report.weldIdentification)}
                          </span>
                        </div>
                        <div className="form-row">
                          <span className="form-label">Material thickness</span>
                          <span className="form-val">
                            {v(report.materialThickness)}
                          </span>
                        </div>
                        <div className="form-row">
                          <span className="form-label">Weld joint AWS</span>
                          <span className="form-val">
                            {v(report.weldJointAWS)}
                          </span>
                        </div>
                        <div className="form-row">
                          <span className="form-label">Welding process</span>
                          <span className="form-val">
                            {v(report.weldingProcess)}
                          </span>
                        </div>
                        <div className="form-row">
                          <span className="form-label">
                            Quality requirements—section no.
                          </span>
                          <span className="form-val">
                            {v(report.qualityRequirementsSection)}
                          </span>
                        </div>
                        <div className="form-row">
                          <span className="form-label">Remarks</span>
                          <span className="form-val">
                            {v(report.evaluation || report.remarks)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <table className="obs-table mt-n1">
                    <thead style={{ display: "table-header-group" }}>
                      <tr>
                        <td colSpan={15} className="section-hdr">
                          OBSERVATIONS
                        </td>
                      </tr>
                      {/* Header row 1: Main group labels */}
                      <tr>
                        <td
                          className="col-hdr"
                          rowSpan={3}
                          style={{ width: "3.5%" }}
                        >
                          Line
                          <br />
                          number
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={3}
                          style={{ width: "5.5%" }}
                        >
                          Indication
                          <br />
                          No.
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={3}
                          style={{ width: "7%" }}
                        >
                          Transducer
                          <br />
                          angle
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={3}
                          style={{ width: "4.5%" }}
                        >
                          From
                          <br />
                          face
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={3}
                          style={{ width: "3.5%" }}
                        >
                          Leg
                        </td>
                        <td className="col-hdr" colSpan={4}>
                          Decibels
                        </td>
                        <td className="col-hdr" colSpan={5}>
                          Discontinuity
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={3}
                          style={{ width: "6%" }}
                        >
                          Remarks
                        </td>
                      </tr>
                      {/* Header row 2: Decibels sub-cols + Discontinuity sub-cols */}
                      <tr>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "5.5%" }}
                        >
                          a.
                          <br />
                          Indication
                          <br />
                          level
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "5.5%" }}
                        >
                          b.
                          <br />
                          Reference
                          <br />
                          level
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "6%" }}
                        >
                          c.
                          <br />
                          Attenuation
                          <br />
                          factor
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "5.5%" }}
                        >
                          d.
                          <br />
                          Indication
                          <br />
                          rating
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "5%" }}
                        >
                          Length
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "5.5%" }}
                        >
                          Angular
                          <br />
                          distance
                        </td>
                        <td
                          className="col-hdr"
                          rowSpan={2}
                          style={{ width: "6%" }}
                        >
                          Depth
                          <br />
                          from A
                        </td>
                        <td className="col-hdr" colSpan={2}>
                          Distance
                        </td>
                      </tr>
                      {/* Header row 3: Distance sub-cols */}
                      <tr>
                        <td className="col-hdr" style={{ width: "4.5%" }}>
                          From X
                        </td>
                        <td className="col-hdr" style={{ width: "4.5%" }}>
                          From Y
                        </td>
                      </tr>
                    </thead>
                    <tbody>
                      {obs.map((o: any, i: number) => (
                        <tr key={i} style={{ height: "24px" }}>
                          <td>{v(o.lineNo)}</td>
                          <td>{v(o.indicationNo)}</td>
                          <td>{v(o.transducerAngle)}</td>
                          <td>{v(o.fromFace)}</td>
                          <td>{v(o.leg)}</td>
                          <td style={{}}>{v(o.decibels?.indicationLevel)}</td>
                          <td style={{}}>{v(o.decibels?.referenceLevel)}</td>
                          <td style={{}}>{v(o.decibels?.attenuationFactor)}</td>
                          <td style={{}}>{v(o.decibels?.indicationRating)}</td>
                          <td>{v(o.discontinuity?.length)}</td>
                          <td>{v(o.discontinuity?.angularDist)}</td>
                          <td>{v(o.discontinuity?.depthFromA)}</td>
                          <td>{v(o.discontinuity?.fromX)}</td>
                          <td>{v(o.discontinuity?.fromY)}</td>
                          <td>{v(o.interpretation)}</td>
                        </tr>
                      ))}
                      {Array.from({ length: Math.max(4, 26 - obs.length) }).map(
                        (_, i) => (
                          <tr key={`empty-obs-${i}`} style={{ height: "24px" }}>
                            <td>{obs.length + i + 1}</td>
                            {Array.from({ length: 14 }).map((__, j) => (
                              <td key={j}></td>
                            ))}
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>

                  {/* -- CERTIFICATION TEXT -- */}
                  <div className="cert-para">
                    We, the undersigned, certify that the statements in this
                    record are correct and that the welds were prepared and
                    tested in conformance with the requirements of Clause 8,
                    Part F of AWS D1.1/D1.1M,&nbsp;
                    <strong>({v(cert.year) || "____"})</strong>,&nbsp;
                    Structural Welding Code—Steel.
                  </div>
                </td>
              </tr>
            </tbody>

            <tfoot style={{ display: "table-footer-group" }}>
              <tr>
                <td style={{ padding: 0 }}>
                  <div className="report-footer-wrap">
                    <table className="sign-table mt-n1">
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
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div
                      style={{
                        fontSize: "9px",
                        padding: "4px 6px",
                        border: "1px solid #d9e1ea",
                        marginTop: "-1px",
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>Note:</strong> This form is applicable to Clause
                      8, Parts B or C (Statically and Cyclically Loaded
                      Nontubular Structures). Do <strong>NOT</strong> use this
                      form for Tubular Structures (Clause 10, Part A).
                    </div>
                    <div
                      className="tfoot-spacer"
                      style={{ height: "28mm" }}
                    ></div>
                  </div>
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
