import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  getTrainingQuotationById,
  getServiceQuotationById,
} from "../../../api/quotationApi";
import { getCustomerById } from "../../../api/customerApi";

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }

  @media screen {
    body.autoprint-mode { background: #fff !important; }
    body.autoprint-mode > #root > * { opacity: 0 !important; visibility: hidden !important; }
    .quotation-page { margin: 0 auto 16px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
  }

  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #quotation-root { background: #fff !important; padding: 0 !important; }
    .quotation-page {
      height: 296mm;
      margin: 0 !important;
      box-shadow: none !important;
      break-after: page;
      page-break-after: always;
    }
    .quotation-page:last-child { break-after: auto; page-break-after: auto; }
    .quotation-page-content { overflow: visible !important; }
  }

  body { font-family: 'Times New Roman', Times, serif; font-size: 12.5px; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }

.quotation-page {
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  box-sizing: border-box;
  padding: 0 5mm 38mm 5mm;
  overflow: hidden;
  position: relative;
}
  .quotation-page-footer{
  position: absolute;
  left: 5mm;
  right: 5mm;
  bottom: 5mm;
}
  .quotation-page-content { flex: 1 1 auto; }

  table { border-collapse: collapse; width: 100%; }
  .title { font-size: 18px; font-weight: bold; text-align: center; letter-spacing: 2px; padding: 0px 0;}

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
  
  .quotation-info { display: flex; justify-content: space-between; margin-top: 6px; margin-bottom: 8px; line-height: 1.35;font-size: 15.5px; }
  .quotation-info h2 { font-size: 14px; font-weight: bold; margin: 0 0 5px 0; text-decoration: underline; }
  .quotation-info strong { font-weight: 700; }
  .quotation-body { padding: 0 5mm; font-family: 'Times New Roman', Times, serif; font-size: 14.5px; line-height: 1.35; color: #000; }
  .quotation-body p { margin-top: 6px; margin-bottom: 7px; }
  .quotation-table th, .quotation-table td { border: 1px solid #000; padding: 3px 4px; font-size: 14.5px; line-height: 1.25; }
  .quotation-table th { font-weight: bold; text-align: center; }
  .quotation-terms { margin-top: 8px; line-height: 1.45; }
  .quotation-signoff { margin-top: 14px; line-height: 1.35; page-break-inside: avoid; break-inside: avoid; }

  /* Prevent bad splits on print */
  .quotation-table, .quotation-terms, .quotation-signoff, .inv-foot, .footer-meta, tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .quotation-terms {
  margin-top: 6px;
  line-height: 1.25;
}

.quotation-signoff {
  margin-top: 8px;
  line-height: 1.2;
}
  .info-label {
  border: 1px solid #000;
  padding: 6px;
  font-weight: bold;
  width: 42%;
}

.info-value {
  border: 1px solid #000;
  padding: 6px;
}
  .terms-box {
  border: 1px solid #000;
  padding: 8px 10px;
  margin-top: -10px;
}
  .final-section,
.quotation-terms,
.quotation-signoff {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}
`;

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const fmtAmount = (value: unknown) =>
  toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const QuotationPrintPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [data, setData] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isAutoPrint = searchParams.get("autoprint") === "true";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (!id) return;
        let qRes;
        if (type === "training") {
          qRes = await getTrainingQuotationById(id);
        } else {
          qRes = await getServiceQuotationById(id);
        }
        const qData = qRes.data?.data || qRes.data;
        setData(qData);
        // Ensure we always have full customer details (address, GST, mobile, etc.)
        const custId =
          typeof qData?.customerId === "object"
            ? qData.customerId._id
            : qData?.customerId;
        if (custId) {
          try {
            const custRes = await getCustomerById(custId);
            setCustomer(custRes.data?.data || custRes.data);
          } catch (e) {
            console.error("Failed to fetch full customer details", e);
            // fallback to shallow data if already exists
            if (typeof qData.customerId === "object")
              setCustomer(qData.customerId);
          }
        }
      } catch (err) {
        console.error("Error fetching quotation print data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, type]);

  useEffect(() => {
    if (!isLoading && data && isAutoPrint) {
      document.body.classList.add("autoprint-mode");
      const t = setTimeout(() => {
        // Trigger multiple reflows to "wake up" the rendering engine
        window.scrollTo(0, 10);
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);

        // Force a tiny delay after scrolling before printing
        requestAnimationFrame(() => {
          window.print();
          document.body.classList.remove("autoprint-mode");
        });
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [isLoading, data, isAutoPrint]);

  if (isLoading || !data) {
    return (
      <div className="p-12 text-center text-gray-500">Loading document...</div>
    );
  }

  type QuotationRow = {
    srNo?: number;
    description: string;
    level?: string;
    sacCode?: string;
    quantity?: number;
    unit?: string;
    price: number;
    amount: number;
    _isFixed?: boolean;
  };

  const FIXED_CHARGE_DESCS = [
    "Transportation Charges",
    "Lodging Charges",
    "Boarding Charges",
  ];

  const isChargeRow = (row: QuotationRow) =>
    row._isFixed || FIXED_CHARGE_DESCS.includes(row.description);

  const rows: QuotationRow[] = [
    ...(Array.isArray(data.services) ? data.services : []),
  ];

  const computedSubtotal = rows.reduce((sum, row) => {
    const amount = toNumber(row.amount);
    if (amount > 0) return sum + amount;
    return sum + toNumber(row.quantity || 1) * toNumber(row.price);
  }, 0);
  const gstPercentage = toNumber(data.gstPercentage);
  const computedGstAmount = (computedSubtotal * gstPercentage) / 100;
  const computedTotalAmount = computedSubtotal + computedGstAmount;

  // --- Build term lines as strings for pagination ---
  let tc = rows.length + 1;
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const termLines: string[] = [];

  if (type === "training") {
    termLines.push(
      `${pad2(tc++)}. Minimum Candidates required for campus training: ${data.trainingDetails?.minCandidates || 5} Nos`,
    );
    termLines.push(
      `${pad2(tc++)}. ${data.trainingDetails?.trainingMode || "Training will be conducted as per yours written practice."}`,
    );
    termLines.push(
      `${pad2(tc++)}. In addition to the course fee, as stated above ${data.gstPercentage}% GST will be applicable.`,
    );
    termLines.push(
      `${pad2(tc++)}. Course fee includes study material, exam fee, certificate fee.`,
    );
    termLines.push(
      `${pad2(tc++)}. Payment terms: ${data.termsAndConditions?.paymentTerms}`,
    );
  } else {
    if (data.extraCharges?.minimumVisit > 0)
      termLines.push(
        `${pad2(tc++)}. Minimum Visit Charges: ${data.extraCharges.minimumVisit}`,
      );
    termLines.push(
      `${pad2(tc++)}. GST: ${data.gstPercentage}% on total charge.`,
    );
    termLines.push(
      `${pad2(tc++)}. Payment terms: ${data.termsAndConditions?.paymentTerms}`,
    );
    termLines.push(
      `${pad2(tc++)}. Material handling ${data.termsAndConditions?.materialHandling}`,
    );
    termLines.push(
      `${pad2(tc++)}. NDE Level II personnel ${data.termsAndConditions?.personnel}`,
    );
    termLines.push(
      `${pad2(tc++)}. Machines ${data.termsAndConditions?.machines}`,
    );
    termLines.push(
      `${pad2(tc++)}. Consumables ${data.termsAndConditions?.consumables}`,
    );
  }

  // --- Pagination block engine ---
  // const PAGE_H = 297;
  // const HDR_H = 28;
  // const FTR_H = 22;
  const AVAIL_H = 247; // ~247mm

  type Block =
    | { type: "intro"; height: number }
    | { type: "table-header"; height: number }
    | { type: "service-row"; row: QuotationRow; idx: number; height: number }
    | { type: "table-totals"; height: number }
    | { type: "term"; text: string; height: number }
    | { type: "signoff"; height: number };

  const allBlocks: Block[] = [
    { type: "intro", height: 62 },
    { type: "table-header", height: 10 },
    ...rows.map((row, idx) => ({
      type: "service-row" as const,
      row,
      idx,
      height: 8 + Math.max(0, Math.ceil(row.description.length / 45) - 1) * 4,
    })),
    { type: "table-totals", height: 20 },
    ...termLines.map((text) => ({ type: "term" as const, text, height: 5 })),
    { type: "signoff", height: 38 },
  ];

  const pageList: Block[][] = [];
  let bi = 0;
  while (bi < allBlocks.length) {
    const pb: Block[] = [];
    let used = 0;
    while (bi < allBlocks.length) {
      const h = allBlocks[bi].height;
      if (used + h <= AVAIL_H) {
        pb.push(allBlocks[bi]);
        used += h;
        bi++;
      } else {
        break;
      }
    }
    if (pb.length === 0) {
      pb.push(allBlocks[bi]);
      bi++;
    }
    pageList.push(pb);
  }

  // --- Render helpers ---
  const QuotationHeader = () => (
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

  const QuotationFooter = () => (
    <>
      <div className="inv-foot">
        Corp Office: 1st Floor, Plot No.PAP-3/28, Behind BSNL Office, MIDC,
        Baramati, Dist-Pune 413133 | Ph: +91 9860186056, +91 7875154431
        <br />
        Reg. Office: A/p - Kuthare, Tal - Patan, Dist-Satara 415112 | Website:
        www.niitindt.com | Email: niit04@gmail.com | info@niitindt.com
        <br />
        Powered by: Viplora Tech
      </div>
      <div className="footer-meta">
        Quotation No: <span>{data.quotationNo}</span>
        &nbsp;|&nbsp; Date:{" "}
        <span>
          {data.date ? new Date(data.date).toLocaleDateString("en-GB") : "-"}
        </span>
        &nbsp;|&nbsp; Type:{" "}
        <span>{type === "training" ? "Training" : "Service"}</span>
      </div>
    </>
  );

  const renderIntro = () => (
    <>
      <div className="title" style={{ marginBottom: "8px" }}>
        QUOTATION
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
          borderTop: "1px solid #000",
          borderBottom: "0px",
        }}
      >
        <tbody>
          <tr>
            {/* LEFT SIDE */}
            <td
              style={{
                width: "50%",
                borderTop: "0px",
                borderLeft: "1px solid #000",
                borderBottom: "1px solid #000",
                borderRight: "0px",
                verticalAlign: "top",
                padding: "8px",
                lineHeight: "1.5",
              }}
            >
              <div>
                <strong>TO,</strong>
              </div>

              <div>
                <strong>Customer:</strong> {customer?.companyName || "-"}
              </div>

              <div>
                <strong>Address:</strong> {customer?.address || "-"}
              </div>

              <div>
                <strong>GST No:</strong> {customer?.gstNo || "-"}
              </div>

              <div>
                <strong>Contact Name:</strong> {customer?.contactPerson || "-"}
              </div>

              <div>
                <strong>Contact No.:</strong> {customer?.mobile || "-"}
              </div>
            </td>

            {/* RIGHT SIDE */}
            <td
              style={{
                width: "50%",
                borderTop: "0px",
                borderRight: "0px",
                borderBottom: "0px",
                borderLeft: "0px",
                padding: 0,
                verticalAlign: "top",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <tbody>
                  <tr>
                    <td className="info-label" style={{ borderTop: "0px" }}>
                      Quotation No.:
                    </td>
                    <td className="info-value" style={{ borderTop: "0px" }}>
                      {data.quotationNo}
                    </td>
                  </tr>

                  <tr>
                    <td className="info-label">Date:</td>
                    <td className="info-value">
                      {data.date
                        ? new Date(data.date).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                  </tr>

                  <tr>
                    <td className="info-label">Enquiry Reference:</td>
                    <td className="info-value">
                      {data.enquiryReference || "By Call"}
                    </td>
                  </tr>

                  <tr>
                    <td className="info-label">Contact Person:</td>
                    <td className="info-value">
                      {data.preparedBy?.name || "Mr. B. T. Kadam"}
                    </td>
                  </tr>

                  <tr>
                    <td className="info-label">Mail ID:</td>
                    <td className="info-value">niit004@gmail.com</td>
                  </tr>

                  <tr>
                    <td className="info-label" style={{ borderBottom: "0px" }}>
                      Contact Numbers:
                    </td>
                    <td className="info-value" style={{ borderBottom: "0px" }}>
                      +91 9860186056 / 7875154431
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* DEAR SIR ROW */}
          <tr>
            <td
              colSpan={2}
              style={{
                border: "1px solid #000",
                padding: "8px",
                lineHeight: "1.5",
                borderBottom: "0px",
              }}
            >
              <strong>Dear Sir,</strong>
              <br />
              <p>
                {type === "training"
                  ? "This is in reference to our discussion with you; we are pleased to quote our best competitive price for Training and Certification."
                  : "This is in reference to our discussion with you; we are pleased to quote our best competitive price for services."}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const renderTableSection = (pageBlocks: Block[]) => {
    const hasTableHeader = pageBlocks.some((b) => b.type === "table-header");
    const svcRows = pageBlocks.filter(
      (b): b is Extract<Block, { type: "service-row" }> =>
        b.type === "service-row",
    );
    const hasTotals = pageBlocks.some((b) => b.type === "table-totals");
    if (!hasTableHeader && !svcRows.length && !hasTotals) return null;
    const colSpan = type === "training" ? 7 : 6;
    return (
      <table
        className="quotation-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "10px",
          marginTop: "-10px",
        }}
      >
        {hasTableHeader && (
          <thead>
            <tr>
              <th style={{ width: "8%" }}>Sr. No.</th>
              <th style={{ width: type === "training" ? "27%" : "35%" }}>
                {type === "training"
                  ? "Description of Training"
                  : "Description of Services"}
              </th>
              {type === "training" && <th style={{ width: "10%" }}>Level</th>}
              <th style={{ width: "12%" }}>SAC Code</th>
              <th style={{ width: "7%" }}>Qty</th>
              <th style={{ width: "8%" }}>Unit</th>
              <th style={{ width: "10%" }}>Price</th>
              <th style={{ width: "10%" }}>Amount</th>
            </tr>
          </thead>
        )}
        <tbody>
          {svcRows.map((b) => (
            <tr key={b.idx}>
              {/* Sr No */}
              <td style={{ textAlign: "center" }}>
                {(b.idx + 1).toString().padStart(2, "0")}
              </td>

              {/* FIXED TRAINING ROW */}
              {type === "training" && isChargeRow(b.row) ? (
                <>
                  {/* Description spans Description + Level + SAC */}
                  <td colSpan={3}>{b.row.description}</td>
                </>
              ) : (
                <>
                  {/* Description */}
                  <td>{b.row.description}</td>

                  {/* Level */}
                  {type === "training" && (
                    <td style={{ textAlign: "center" }}>{b.row.level || ""}</td>
                  )}

                  {/* SAC Code */}
                  <td style={{ textAlign: "center" }}>{b.row.sacCode || ""}</td>
                </>
              )}

              {/* Qty */}
              <td style={{ textAlign: "center" }}>{b.row.quantity || 1}</td>

              {/* Unit */}
              <td style={{ textAlign: "center" }}>{b.row.unit || "Nos"}</td>

              {/* Price */}
              <td style={{ textAlign: "right" }}>{fmtAmount(b.row.price)}</td>

              {/* Amount */}
              <td style={{ textAlign: "right" }}>{fmtAmount(b.row.amount)}</td>
            </tr>
          ))}

          {hasTotals && (
            <>
              <tr>
                <td
                  colSpan={colSpan}
                  style={{ textAlign: "right", fontWeight: "bold" }}
                >
                  Subtotal
                </td>

                <td style={{ textAlign: "right", fontWeight: "bold" }}>
                  {fmtAmount(computedSubtotal)}
                </td>
              </tr>

              <tr>
                <td
                  colSpan={colSpan}
                  style={{ textAlign: "right", fontWeight: "bold" }}
                >
                  GST ({data.gstPercentage}%)
                </td>

                <td style={{ textAlign: "right", fontWeight: "bold" }}>
                  {fmtAmount(computedGstAmount)}
                </td>
              </tr>

              <tr>
                <td
                  colSpan={colSpan}
                  style={{ textAlign: "right", fontWeight: "bold" }}
                >
                  Total Amount
                </td>

                <td style={{ textAlign: "right", fontWeight: "bold marginB" }}>
                  {fmtAmount(computedTotalAmount)}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    );
  };

  const renderSignoff = () => (
    <div className="quotation-signoff">
      <p style={{ marginBottom: "5px", fontSize: "16px", marginTop: "5px" }}>
        We trust the above notice is quite competitive acceptable to you Looking
        forward to favorable reply &amp; confirmed order on us.
      </p>
      <div style={{ marginTop: "15px", fontWeight: "bold" }}>
        Your faithfully,
      </div>
      <div style={{ marginTop: "5px", fontWeight: "bold" }}>
        {data.preparedBy?.name || "Mr. Bajirao T. Kadam"}
      </div>
      <div>
        {data.preparedBy?.designation ||
          "ASNT Level III (RT, UT, MT, PT, VT, ET, MFL)"}
      </div>
      <div>Competent Person under Factory Act 1948</div>
      <div style={{ fontWeight: "bold" }}>
        National Industrial Inspection &amp; Training Baramati
      </div>
      <div>+91 7875154431, 9860186056</div>
      <div
        style={{
          marginTop: "5px",
          textAlign: "center",
          fontSize: "11px",
          color: "#555",
        }}
      >
        This is a computer generated quotation.
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* Screen toolbar */}
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
          Print / Save PDF
        </button>
      </div>

      <div
        id="quotation-root"
        style={{ background: "#e9eef5", minHeight: "100vh", padding: "16px" }}
      >
        {pageList.map((pageBlocks, i) => {
          const hasIntro = pageBlocks.some((b) => b.type === "intro");
          const termBlocks = pageBlocks.filter(
            (b): b is Extract<Block, { type: "term" }> => b.type === "term",
          );
          const hasSignoff = pageBlocks.some((b) => b.type === "signoff");

          return (
            <div className="quotation-page" key={i}>
              <div className="quotation-page-content">
                <QuotationHeader />
                <div className="quotation-body">
                  {hasIntro && renderIntro()}
                  {renderTableSection(pageBlocks)}
                  <div className="final-section">
                    {termBlocks.length > 0 && (
                      <div className="quotation-terms terms-box">
                        {termBlocks.map((b, idx) => (
                          <div key={idx}>{b.text}</div>
                        ))}
                      </div>
                    )}

                    {hasSignoff && renderSignoff()}
                  </div>
                </div>
              </div>
              <div className="quotation-page-footer">
                <QuotationFooter />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
