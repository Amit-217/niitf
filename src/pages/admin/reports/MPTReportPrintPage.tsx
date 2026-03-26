import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { getMPTReportById, MPTReport } from "../../../api/customerApi";

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }
  @media screen { body.autoprint-mode { opacity: 0; } }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #report-root { background: #fff !important; padding: 0 !important; }
    #report-root > div {
      width: 210mm !important;
      min-height: 297mm !important;
      height: 297mm !important;
      margin: 0 auto !important;
      padding: 3mm !important;
      box-sizing: border-box !important;
      box-shadow: none !important;
      overflow: hidden !important;
    }
    .report {
      margin: 0 !important;
      box-shadow: none !important;
      width: calc(100% / 0.92) !important;
      transform: scale(0.92);
      transform-origin: top left;
    }
    .rpt-header { padding: 8px 10px !important; }
    .rpt-title { padding: 5px !important; font-size: 11px !important; }
    .section-hdr { padding: 4px 7px !important; font-size: 8.5px !important; }
    .field { padding: 3px 6px !important; min-height: 0 !important; }
    .fl { font-size: 7.5px !important; margin-bottom: 1px !important; }
    .fv { font-size: 9px !important; }
    .obs-table th, .obs-table td { padding: 3px 4px !important; font-size: 8px !important; }
    .sig-col { padding: 6px !important; }
    .sig-detail { min-height: 0 !important; font-size: 8px !important; line-height: 1.25 !important; }
    .sig-line { margin: 6px 0 2px !important; }
    .footer { padding: 4px 8px !important; font-size: 7px !important; line-height: 1.25 !important; }
    .std-tag,
    .accept-badge,
    .reject-badge,
    .neutral-badge {
      font-size: 7px !important;
      padding: 1px 5px !important;
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
    border: 1px solid #444;
    border-radius: 6px;
    overflow: hidden;
  }
  .rpt-header {
    background: #185FA5;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo-box {
    width: 50px;
    height: 50px;
    background: #fff;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: 700;
    color: #185FA5;
    text-align: center;
    line-height: 1.2;
    flex-shrink: 0;
  }
  .hdr-center {
    flex: 1;
    text-align: center;
    color: #fff;
  }
  .hdr-center .org {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.2px;
    text-transform: uppercase;
  }
  .hdr-center .sub {
    font-size: 8px;
    color: #d7e8fb;
    margin-top: 2px;
    line-height: 1.4;
  }
  .hdr-center .iso {
    font-size: 8px;
    color: #eef6ff;
    font-weight: 700;
    margin-top: 2px;
  }
  .hdr-right {
    text-align: left;
    font-size: 8px;
    color: #d7e8fb;
    line-height: 1.45;
    min-width: 128px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    padding: 5px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.1);
  }
  .hdr-right span { color: #fff; font-weight: 700; }

  .rpt-title {
    background: #E6F1FB;
    text-align: center;
    padding: 7px;
    font-size: 13px;
    font-weight: 700;
    color: #0C447C;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    border-bottom: 1px solid #b8cfe7;
  }

  .section-hdr {
    background: #185FA5;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 5px 8px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #d9e1ea;
  }
  .grid3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-bottom: 1px solid #d9e1ea;
  }
  .field {
    padding: 5px 8px;
    border-right: 1px solid #d9e1ea;
    border-bottom: 1px solid #d9e1ea;
    min-height: 34px;
  }
  .grid2 .field:nth-child(2n) { border-right: none; }
  .grid3 .field:nth-child(3n) { border-right: none; }
  .field.fullw { grid-column: 1 / -1; border-right: none !important; }

  .fl {
    font-size: 9px;
    color: #4b5563;
    margin-bottom: 2px;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    font-weight: 700;
  }
  .fv {
    font-size: 11px;
    color: #0f172a;
    font-weight: 600;
    word-break: break-word;
  }
  .fv.muted {
    color: #6b7280;
    font-style: italic;
    font-weight: 500;
  }

  .std-tag {
    display: inline-block;
    background: #e7f1fb;
    color: #0c447c;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 4px;
    margin-bottom: 2px;
    font-weight: 700;
  }

  .obs-wrap { overflow-x: auto; }
  .obs-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .obs-table th {
    background: #E6F1FB;
    color: #0C447C;
    font-size: 9px;
    font-weight: 700;
    padding: 5px 6px;
    border: 1px solid #b8cfe7;
    text-align: left;
  }
  .obs-table td {
    padding: 5px 6px;
    border: 1px solid #d9e1ea;
    font-size: 10px;
    vertical-align: middle;
    word-break: break-word;
  }

  .accept-badge,
  .reject-badge,
  .neutral-badge {
    display: inline-block;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    line-height: 1.2;
  }
  .accept-badge { background: #eaf4de; color: #27500a; }
  .reject-badge { background: #fcebeb; color: #7a1f1f; }
  .neutral-badge { background: #edf0f5; color: #334155; }

  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-top: 1px solid #d9e1ea;
  }
  .sig-col {
    padding: 8px;
    border-right: 1px solid #d9e1ea;
  }
  .sig-col:last-child { border-right: none; }
  .sig-label {
    font-size: 9px;
    color: #4b5563;
    margin-bottom: 4px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2px;
  }
  .sig-name {
    font-size: 11px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 2px;
  }
  .sig-detail {
    font-size: 10px;
    color: #374151;
    line-height: 1.45;
    min-height: 44px;
  }
  .sig-line {
    border-top: 1px solid #cbd5e1;
    margin: 8px 0 3px;
    width: 86%;
  }
  .sig-caption {
    font-size: 9px;
    color: #6b7280;
  }

  .footer {
    background: #f8fafc;
    padding: 6px 10px;
    text-align: center;
    font-size: 8px;
    color: #4b5563;
    border-top: 1px solid #d9e1ea;
    line-height: 1.4;
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
  if (t.includes("reject") || t.includes("repair") || t.includes("fail") || t.includes("not ok")) {
    return "reject-badge";
  }
  if (t.includes("accept") || t.includes("pass") || t.includes("ok") || t.includes("clear")) {
    return "accept-badge";
  }
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

  useEffect(() => {
    if (!id) return;
    getMPTReportById(id)
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
  }, [id]);

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
        <button onClick={goBack} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    );
  }

  const jd = report.jobDetails ?? {};
  const eq = report.equipmentDetails ?? {};
  const md = report.mediumDetails ?? {};
  const me = report.methodDescription ?? {};
  const fs = report.finalSection ?? {};
  const obs = report.observations ?? [];
  const inspectors = fs.inspector ?? [];

  const standards = splitTags(jd.referenceStd);
  const acceptance = splitTags(jd.acceptanceCriteria);
  const technique = v(me.magnetizingMethod || me.magnetizationType || me.method);

  const rejectedCount = obs.filter((o) =>
    /reject|repair|fail|not ok/i.test(v(o.result || o.remark || o.evaluation))
  ).length;
  const conclusionText =
    v((report as unknown as { conclusion?: string }).conclusion) ||
    v((fs as unknown as { conclusion?: string }).conclusion) ||
    (rejectedCount > 0
      ? `Examination completed. ${rejectedCount} rejectable indication(s) identified; repair and re-examination required before final acceptance.`
      : "Examination completed as per applicable standards. No rejectable indications observed in inspected items.");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div
        className="no-print"
        style={{
          padding: "10px 16px",
          background: "#1e293b",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          onClick={goBack}
          style={{
            padding: "6px 14px",
            background: "#334155",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Back
        </button>
        <button
          onClick={() => window.print()}
          style={{
            padding: "6px 14px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Download / Print
        </button>
        <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 12 }}>
          Report No: {v(report.reportNo)} &nbsp;|&nbsp; Status: {v(report.status).toUpperCase()}
        </span>
      </div>

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
            width: "210mm",
            minHeight: "297mm",
            margin: "0 auto",
            padding: "5mm",
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            boxSizing: "border-box",
          }}
        >
          <div className="report">
            <div className="rpt-header">
              <div className="logo-box">
                NIIT
                <br />
                LOGO
              </div>

              <div className="hdr-center">
                <div className="org">National Industrial Inspection &amp; Training</div>
                <div className="sub">
                  THIRD PARTY INSPECTION | NDT SERVICES &amp; TRAINING | NDT CONSULTANCY | PHYSICAL
                  CALIBRATION | FACTORY INSPECTION UNDER MAHARASHTRA FACTORY ACT | QUALITY MANAGEMENT
                  SYSTEM TRAINING
                </div>
                <div className="iso">(AN ISO 9001:2015 CERTIFIED ORGANIZATION)</div>
              </div>

              <div className="hdr-right">
                Format No: <span>FMT-NDT-01</span>
                <br />
                Rev. No: <span>00</span>
                <br />
                Report Date: <span>{fmtDate(jd.reportDate)}</span>
                <br />
                Page: <span>1 of 1</span>
              </div>
            </div>

            <div className="rpt-title">Magnetic Particle Examination Report</div>

            <div className="section-hdr">1. Scope &amp; Reference Standards</div>
            <div className="grid2">
              <div className="field">
                <div className="fl">Applicable standard</div>
                <div className="fv">
                  {standards.length > 0
                    ? standards.map((tag) => (
                        <span key={`std-${tag}`} className="std-tag">
                          {tag}
                        </span>
                      ))
                    : <span className="fv muted">Not specified</span>}
                </div>
              </div>
              <div className="field">
                <div className="fl">Acceptance criteria</div>
                <div className="fv">
                  {acceptance.length > 0
                    ? acceptance.map((tag) => (
                        <span key={`acc-${tag}`} className="std-tag">
                          {tag}
                        </span>
                      ))
                    : <span className="fv muted">Not specified</span>}
                </div>
              </div>
              <div className="field">
                <div className="fl">Procedure reference</div>
                <div className="fv">{v(report.reportNo) || "-"}</div>
              </div>
              <div className="field">
                <div className="fl">Technique</div>
                <div className="fv">{technique || "-"}</div>
              </div>
            </div>

            <div className="section-hdr">2. Job details</div>
            <div className="grid3">
              <div className="field"><div className="fl">Customer</div><div className="fv">{v(jd.customer) || "-"}</div></div>
              <div className="field"><div className="fl">Client / TPI</div><div className="fv">{v(jd.client) || "-"}</div></div>
              <div className="field"><div className="fl">Report no.</div><div className="fv">{v(report.reportNo) || "-"}</div></div>

              <div className="field"><div className="fl">Report date</div><div className="fv">{fmtDate(jd.reportDate) || "-"}</div></div>
              <div className="field"><div className="fl">Inspection date</div><div className="fv">{dateRange(jd.inspectionDate, jd.inspectionEndDate) || "-"}</div></div>
              <div className="field"><div className="fl">Inspection time</div><div className="fv">{v(jd.inspectionTime) || "-"}</div></div>

              <div className="field"><div className="fl">Stage of inspection</div><div className="fv">{v(jd.stageOfInspection) || "-"}</div></div>
              <div className="field"><div className="fl">Type of joint</div><div className="fv">{v(jd.typeOfJoint) || "-"}</div></div>
              <div className="field"><div className="fl">Welding process</div><div className="fv">{v(jd.weldingProcess) || "-"}</div></div>

              <div className="field"><div className="fl">Material</div><div className="fv">{v(jd.material) || "-"}</div></div>
              <div className="field"><div className="fl">Thickness</div><div className="fv">{v(jd.thickness) || "-"}</div></div>
              <div className="field"><div className="fl">Surface condition</div><div className="fv">{v(jd.surfaceCondition) || "-"}</div></div>
            </div>

            <div className="section-hdr">3. Equipment details</div>
            <div className="grid2">
              <div className="field"><div className="fl">Equipment type</div><div className="fv">{v(eq.equipmentType) || "-"}</div></div>
              <div className="field"><div className="fl">Make</div><div className="fv">{v(eq.make) || "-"}</div></div>
              <div className="field"><div className="fl">Serial no.</div><div className="fv">{v(eq.srNo) || "-"}</div></div>
              <div className="field"><div className="fl">Calibration due</div><div className="fv">{fmtDate(eq.calibrationDue) || "-"}</div></div>
              <div className="field"><div className="fl">Yoke spacing</div><div className="fv">{v(eq.yokeSpacing) || "-"}</div></div>
              <div className="field"><div className="fl">Pie gauge calibration</div><div className="fv">{v(eq.pieGaugeCalibration) || "-"}</div></div>
            </div>

            <div className="section-hdr">4. Medium details</div>
            <div className="grid3">
              <div className="field"><div className="fl">Material</div><div className="fv">Black ink</div></div>
              <div className="field"><div className="fl">Manufacturer / Batch no.</div><div className="fv">{`${v(md.blackInk?.manufacturer)}${md.blackInk?.manufacturer && md.blackInk?.batchNo ? " / " : ""}${v(md.blackInk?.batchNo)}` || "-"}</div></div>
              <div className="field"><div className="fl">Expiry date</div><div className="fv">{v(md.blackInk?.expiryDate) || "-"}</div></div>

              <div className="field"><div className="fl">Material</div><div className="fv">White contrast</div></div>
              <div className="field"><div className="fl">Manufacturer / Batch no.</div><div className="fv">{`${v(md.whiteContrast?.manufacturer)}${md.whiteContrast?.manufacturer && md.whiteContrast?.batchNo ? " / " : ""}${v(md.whiteContrast?.batchNo)}` || "-"}</div></div>
              <div className="field"><div className="fl">Expiry date</div><div className="fv">{v(md.whiteContrast?.expiryDate) || "-"}</div></div>
            </div>

            <div className="section-hdr">5. Method description</div>
            <div className="grid2">
              <div className="field"><div className="fl">Method</div><div className="fv">{v(me.method) || "-"}</div></div>
              <div className="field"><div className="fl">Light intensity</div><div className="fv">{v(me.lightIntensity) || "-"}</div></div>
              <div className="field"><div className="fl">Magnetization type</div><div className="fv">{v(me.magnetizationType) || "-"}</div></div>
              <div className="field"><div className="fl">Light equip. used</div><div className="fv">{v(me.lightEquipmentUsed) || "-"}</div></div>
              <div className="field"><div className="fl">Magnetizing method</div><div className="fv">{v(me.magnetizingMethod) || "-"}</div></div>
              <div className="field"><div className="fl">Bath concentration</div><div className="fv">{v(me.bathConcentration) || "-"}</div></div>
              <div className="field"><div className="fl">Demagnetization</div><div className="fv">{v(me.demagnetization) || "-"}</div></div>
              <div className="field"><div className="fl">Field direction verified by</div><div className="fv">{v(me.magneticFieldDirectionVerifiedBy) || "-"}</div></div>
              <div className="field"><div className="fl">Gauss meter reading</div><div className="fv">{v(me.gaussMeterReading) || "-"}</div></div>
              <div className="field"><div className="fl">Current</div><div className="fv">{v(me.current) || "-"}</div></div>
              <div className="field"><div className="fl">Current type</div><div className="fv">{v(me.currentType) || "-"}</div></div>
              <div className="field"><div className="fl">Post cleaning</div><div className="fv">{v(me.postCleaning) || "-"}</div></div>
            </div>

            <div className="section-hdr">6. Observations</div>
            <div className="obs-wrap">
              <table className="obs-table">
                <thead>
                  <tr>
                    <th style={{ width: "6%" }}>Sr.</th>
                    <th>Job description</th>
                    <th>Drg no. / Joint no.</th>
                    <th style={{ width: "10%" }}>Size</th>
                    <th style={{ width: "7%" }}>Qty</th>
                    <th>Evaluation</th>
                    <th style={{ width: "13%" }}>Result</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {obs.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "#6b7280" }}>
                        No observations recorded.
                      </td>
                    </tr>
                  ) : (
                    obs.map((o, index) => (
                      <tr key={`${o.srNo}-${index}`}>
                        <td>{o.srNo || index + 1}</td>
                        <td>{v(o.jobDescription) || "-"}</td>
                        <td>{v(o.drawingOrJointNo) || "-"}</td>
                        <td>{v(o.size) || "-"}</td>
                        <td>{o.quantity ?? "-"}</td>
                        <td>{v(o.evaluation) || "-"}</td>
                        <td>
                          <span className={resultClass(o.result || o.remark || o.evaluation)}>
                            {v(o.result) || "N/A"}
                          </span>
                        </td>
                        <td>{v(o.remark) || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="section-hdr">7. Conclusion</div>
            <div className="grid2">
              <div className="field fullw" style={{ padding: "8px" }}>
                <div className="fl">Overall result</div>
                <div className="fv" style={{ marginTop: 4, fontWeight: 600 }}>
                  {conclusionText}
                </div>
              </div>
            </div>

            <div className="section-hdr">8. Signatures &amp; certification</div>
            <div className="sig-grid">
              <div className="sig-col">
                <div className="sig-label">Customer representative</div>
                <div className="sig-name">{v(fs.customer?.name) || "-"}</div>
                <div className="sig-detail">
                  Qualification / Designation: -
                  <br />
                  I.D. No.: {v(fs.customer?.idNo) || "-"}
                  <br />
                  Date: {fmtDate(fs.customer?.date) || "-"}
                </div>
                <div className="sig-line" />
                <div className="sig-caption">Signature</div>
              </div>

              <div className="sig-col">
                <div className="sig-label">Client / TPI representative</div>
                <div className="sig-name">{v(fs.clientOrTPI?.name) || "-"}</div>
                <div className="sig-detail">
                  Designation: -
                  <br />
                  I.D. No.: {v(fs.clientOrTPI?.idNo) || "-"}
                  <br />
                  Date: {fmtDate(fs.clientOrTPI?.date) || "-"}
                </div>
                <div className="sig-line" />
                <div className="sig-caption">Signature</div>
              </div>

              <div className="sig-col">
                <div className="sig-label">NDT Inspector</div>
                <div className="sig-name">{v(inspectors[0]?.name) || "-"}</div>
                <div className="sig-detail">
                  Qualification: {v(inspectors[0]?.qualification) || "-"}
                  <br />
                  I.D. No.: {v(inspectors[0]?.idNo) || "-"}
                  <br />
                  Date: {fmtDate(inspectors[0]?.date) || "-"}
                </div>
                <div className="sig-line" />
                <div className="sig-caption">Signature</div>
              </div>
            </div>

            {inspectors.length > 1 && (
              <div className="grid2" style={{ borderTop: "1px solid #d9e1ea" }}>
                {inspectors.slice(1).map((inspector, index) => (
                  <div key={`${inspector.idNo}-${index}`} className="field fullw">
                    <div className="fl">Additional Inspector {index + 2}</div>
                    <div className="fv">
                      {v(inspector.name) || "-"} | {v(inspector.qualification) || "-"} | ID: {v(inspector.idNo) || "-"} | Date: {fmtDate(inspector.date) || "-"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="footer">
              Corp Office: 1st Floor, Plot No.PAP-3/28, Behind BSNL Office, MIDC, Baramati, Dist-Pune 413133 |
              Ph: +91 9860186056, +91 7875154431
              <br />
              Reg. Office: A/p - Kuthare, Tal - Patan, Dist-Satara 415112 | Website: www.niitindt.com | Email:
              niit04@gmail.com | info@niitindt.com
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
