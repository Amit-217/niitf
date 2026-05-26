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
    .quotation-page { min-height: 296mm; margin: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; }
    .quotation-page:last-child { break-after: auto; page-break-after: auto; }
    tr { page-break-inside: avoid; break-inside: avoid; }
  }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12.5px; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }

  .quotation-page {
    width: 210mm;
    min-height: 297mm;
    background: #fff;
    box-sizing: border-box;
    padding: 0 5mm 5mm 5mm;
    display: flex;
    flex-direction: column;
  }
  .quotation-page-content { flex: 1 1 auto; }
  .quotation-page-footer { margin-top: 4px; }

  table { border-collapse: collapse; width: 100%; }
  .title { font-size: 18px; font-weight: bold; text-align: center; letter-spacing: 4px; padding: 0px 0;}

  .rpt-header { padding: 2px 8px; margin-bottom: 0; display: flex; align-items: center; gap: 8px; }
  .logo-box { width: 160px; height: 100px; background: #fff; border-radius: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 0px; transform: translateY(-4px); margin-top: 2px; }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #0C447C; }
  .hdr-center .org { font-size: 21px; font-weight: 800; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 10px; color: #374151; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 10px; color: #0C447C; font-weight: 700; margin-top: 2px; }
  .inv-foot { background: #f8fafc; padding: 6px 10px; font-size: 10px; color: #4b5563; margin-top: 8px; border-top: 1px solid #185FA5; line-height: 1.4; text-align: center; }
  .footer-meta { background: #185FA5; color: #d7e8fb; font-size: 9px; text-align: center; padding: 3px 8px; }
  .footer-meta span { color: #fff; font-weight: 700; }
  .quotation-info { display: flex; justify-content: space-between; margin-top: 6px; margin-bottom: 8px; line-height: 1.35; }
  .quotation-info h2 { font-size: 14px; font-weight: bold; margin: 0 0 5px 0; text-decoration: underline; }
  .quotation-info strong { font-weight: 700; }
  .quotation-body { padding: 0 5mm; font-family: 'Times New Roman', Times, serif; font-size: 12.5px; line-height: 1.35; color: #000; }
  .quotation-body p { margin-top: 6px; margin-bottom: 7px; }
  .quotation-table th, .quotation-table td { border: 1px solid #000; padding: 3px 4px; font-size: 12.5px; line-height: 1.25; }
  .quotation-table th { font-weight: bold; text-align: center; }
  .quotation-terms { margin-top: 8px; line-height: 1.45; }
  .quotation-signoff { margin-top: 14px; line-height: 1.35; page-break-inside: avoid; break-inside: avoid; }
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
  };

  const rows: QuotationRow[] = [
    ...(Array.isArray(data.services) ? data.services : []),
  ];
  if (type === "service" && data.extraCharges) {
    const pCount = rows.length;
    if (data.extraCharges.transportation)
      rows.push({
        srNo: pCount + 1,
        description: "Transportation Charges",
        sacCode: "NA",
        quantity: 1,
        unit: "Lump Sum",
        price: toNumber(data.extraCharges.transportation),
        amount: toNumber(data.extraCharges.transportation),
      });
    if (data.extraCharges.lodging)
      rows.push({
        srNo: rows.length + 1,
        description: "Lodging Charges",
        sacCode: "NA",
        quantity: 1,
        unit: "Lump Sum",
        price: toNumber(data.extraCharges.lodging),
        amount: toNumber(data.extraCharges.lodging),
      });
    if (data.extraCharges.boarding)
      rows.push({
        srNo: rows.length + 1,
        description: "Boarding Charges",
        sacCode: "NA",
        quantity: 1,
        unit: "Lump Sum",
        price: toNumber(data.extraCharges.boarding),
        amount: toNumber(data.extraCharges.boarding),
      });
  }

  const computedSubtotal = rows.reduce((sum, row) => {
    const amount = toNumber(row.amount);
    if (amount > 0) return sum + amount;
    return sum + toNumber(row.quantity || 1) * toNumber(row.price);
  }, 0);
  const gstPercentage = toNumber(data.gstPercentage);
  const computedGstAmount = (computedSubtotal * gstPercentage) / 100;
  const computedTotalAmount = computedSubtotal + computedGstAmount;

  let termsCounter = rows.length + 1;
  const getNum = () => {
    const s = termsCounter.toString().padStart(2, "0");
    termsCounter++;
    return s;
  };

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

  const pages = [
    <div className="quotation-body">
      <div className="title" style={{ marginBottom: 0 }}>
        QUOTATION
      </div>

      {/* Customer + Quotation info */}
      <div className="quotation-info">
        <div style={{ width: "50%" }}>
          <h2>QUOTATION TO:</h2>
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
        </div>
        <div style={{ width: "45%" }}>
          <div>
            <strong>Quotation No.:</strong> {data.quotationNo}
          </div>
          <div>
            <strong>Date:</strong>{" "}
            {data.date ? new Date(data.date).toLocaleDateString("en-GB") : "-"}
          </div>
          <div style={{ marginTop: "8px" }}>
            <strong>Enquiry Reference:</strong> {data.enquiryReference || "By Call"}
          </div>
          <div>
            <strong>Prepared By:</strong>{" "}
            {data.preparedBy?.name || "Mr. Bajirao T. Kadam"}
          </div>
          <div>
            <strong>Mail ID:</strong> niit004@gmail.com
          </div>
          <div>
            <strong>Contact Number:</strong> +91 9860186056 / 7875154431
          </div>
        </div>
      </div>

      <p style={{ marginTop: "8px", marginBottom: "8px" }}>
        <strong>Dear Sir,</strong>
        <br />
        This is reference to discussion with you; we are pleased to quote our
        best competitive Price for Inspection.
      </p>

      {/* Services table */}
      <table
        className="quotation-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "10px",
        }}
      >
        <thead>
          <tr>
            <th style={{ width: "8%" }}>Sr. No.</th>
            <th style={{ width: "35%" }}>Description of Services</th>
            {type === "training" && <th style={{ width: "10%" }}>Level</th>}
            <th style={{ width: "12%" }}>SAC Code</th>
            <th style={{ width: "7%" }}>Qty</th>
            <th style={{ width: "8%" }}>Unit</th>
            <th style={{ width: "10%" }}>Price</th>
            <th style={{ width: "10%" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ textAlign: "center" }}>
                {(i + 1).toString().padStart(2, "0")}
              </td>
              <td>{r.description}</td>
              {type === "training" && (
                <td style={{ textAlign: "center" }}>{r.level || "NA"}</td>
              )}
              <td style={{ textAlign: "center" }}>{r.sacCode || "NA"}</td>
              <td style={{ textAlign: "center" }}>{r.quantity || 1}</td>
              <td style={{ textAlign: "center" }}>{r.unit || "Nos"}</td>
              <td style={{ textAlign: "right" }}>{fmtAmount(r.price)}</td>
              <td style={{ textAlign: "right" }}>{fmtAmount(r.amount)}</td>
            </tr>
          ))}
          <tr>
            <td
              colSpan={type === "training" ? 7 : 6}
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
              colSpan={type === "training" ? 7 : 6}
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
              colSpan={type === "training" ? 7 : 6}
              style={{ textAlign: "right", fontWeight: "bold" }}
            >
              Total Amount
            </td>
            <td style={{ textAlign: "right", fontWeight: "bold" }}>
              {fmtAmount(computedTotalAmount)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Terms and Conditions */}
      <div className="quotation-terms">
        {type === "training" ? (
          <>
            <div>
              {getNum()}. Minimum Candidates required for campus training :{" "}
              {data.trainingDetails?.minCandidates || 5}{" "}
            </div>
            <div>
              {getNum()}.{" "}
              {data.trainingDetails?.trainingMode ||
                "Training will be conducted as per yours written practice."}
            </div>
            <div>
              {getNum()}. In addition to the course fee, as stated above{" "}
              {data.gstPercentage}% GST will be applicable.
            </div>
            <div>
              {getNum()}. Course fee includes study material, exam fee,
              certificate fee.
            </div>
            <div>
              {getNum()}. Payment terms: {data.termsAndConditions?.paymentTerms}
            </div>
          </>
        ) : (
          <>
            {data.extraCharges?.minimumVisit > 0 && (
              <div>
                {getNum()}. Minimum Visit Charges: {data.extraCharges.minimumVisit}
              </div>
            )}
            <div>
              {getNum()}. GST: {data.gstPercentage}% on total charge.
            </div>
            <div>
              {getNum()}. Payment terms: {data.termsAndConditions?.paymentTerms}
            </div>
            <div>
              {getNum()}. Material handling {data.termsAndConditions?.materialHandling}
            </div>
            <div>
              {getNum()}. NDE Level II personnel {data.termsAndConditions?.personnel}
            </div>
            <div>
              {getNum()}. Machines {data.termsAndConditions?.machines}
            </div>
            <div>
              {getNum()}. Consumables {data.termsAndConditions?.consumables}
            </div>
          </>
        )}
      </div>

      {/* Sign off */}
      <div className="quotation-signoff">
        <p style={{ marginBottom: "6px" }}>
          We trust the above notice is quite competitive acceptable to you Looking
          forward to favorable reply &amp; confirmed order on us.
        </p>
        <div>Your faithfully,</div>
        <div style={{ marginTop: "28px", fontWeight: "bold" }}>
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
      </div>
    </div>,
  ];

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
        {pages.map((content, i) => (
          <div className="quotation-page" key={i}>
            <div className="quotation-page-content">
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
                    <td style={{ padding: "0" }}>
                      <QuotationHeader />
                    </td>
                  </tr>
                </thead>
                <tbody style={{ display: "table-row-group" }}>
                  <tr>
                    <td style={{ padding: 0, verticalAlign: "top" }}>
                      {content}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="quotation-page-footer">
              <QuotationFooter />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
