import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  getTrainingQuotationById,
  getServiceQuotationById,
} from "../../../api/quotationApi";
import { getCustomerById } from "../../../api/customerApi";

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0 10mm; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }
  @media screen { 
    body.autoprint-mode { background: #fff !important; }
    body.autoprint-mode > #root > *:not(.print-footer-fixed):not(.print-fixed-footer) { opacity: 0 !important; visibility: hidden !important; }
  }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #quotation-root { background: #fff !important; padding: 0 !important; }
    #quotation-root > div {
      width: 190mm !important; min-height: 297mm !important;
      margin: 0 auto !important; padding: 0 !important;
      box-sizing: border-box !important; box-shadow: none !important;
    }
    .screen-footer { display: none !important; }
    .print-footer-fixed { 
      display: block !important; 
      position: fixed !important; 
      bottom: 0 !important; 
      left: 0 !important; 
      width: 190mm !important; 
      margin: 0 auto !important;
      right: 0 !important;
      background: #fff !important;
      z-index: 999999 !important;
      contain: layout !important;
      pointer-events: none !important;
      transform: translateZ(0);
      will-change: transform;
    }
    .print-footer-fixed-inner {
      padding: 0 5mm 5mm 5mm !important;
    }
    .tfoot-spacer { display: table-footer-group !important; }
  }
  @media screen {
    .print-footer-fixed { display: none !important; }
    .tfoot-spacer { display: none !important; }
    .screen-footer { display: block; }
  }
  body { font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  .rpt-header { padding: 6px 8px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
  .logo-box { width: 130px; height: 130px; background: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 2px; transform: translateY(-12px); }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #0C447C; }
  .hdr-center .org { font-size: 22px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 11px; color: #374151; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 11px; color: #0C447C; font-weight: 700; margin-top: 2px; }
  .q-foot { background: #f8fafc; padding: 6px 10px; font-size: 11px; color: #4b5563; margin-top: 8px; border-top: 3px solid #185FA5; line-height: 1.4; text-align: center; }
  .footer-text-block { flex: 1; text-align: center; }
  .footer-meta { background: #185FA5; color: #d7e8fb; font-size: 10px; text-align: center; padding: 3px 8px; }
  .footer-meta span { color: #fff; font-weight: 700; }
  .quotation-table th, .quotation-table td { border: 1px solid #000; padding: 5px 6px; font-size: 14px; }
  .quotation-table th { font-weight: bold; text-align: center; }
`;

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
        price: data.extraCharges.transportation,
        amount: data.extraCharges.transportation,
      });
    if (data.extraCharges.lodging)
      rows.push({
        srNo: rows.length + 1,
        description: "Lodging Charges",
        sacCode: "NA",
        quantity: 1,
        unit: "Lump Sum",
        price: data.extraCharges.lodging,
        amount: data.extraCharges.lodging,
      });
    if (data.extraCharges.boarding)
      rows.push({
        srNo: rows.length + 1,
        description: "Boarding Charges",
        sacCode: "NA",
        quantity: 1,
        unit: "Lump Sum",
        price: data.extraCharges.boarding,
        amount: data.extraCharges.boarding,
      });
  }

  let termsCounter = rows.length + 1;
  const getNum = () => {
    const s = termsCounter.toString().padStart(2, "0");
    termsCounter++;
    return s;
  };

  const QuotationHeader = () => (
    <div className="rpt-header">
      <div className="logo-box">
        <img src="/logo.png" alt="NIIT Logo" />
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
      <div className="q-foot">
        <div className="footer-text-block">
          Corp Office: 1st Floor, Plot No.PAP-3/28, Behind BSNL Office, MIDC,
          Baramati, Dist-Pune 413133 | Ph: +91 9860186056, +91 7875154431
          <br />
          Reg. Office: A/p - Kuthare, Tal - Patan, Dist-Satara 415112 | Website:
          www.niitindt.com | Email: niit04@gmail.com | info@niitindt.com
        </div>
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
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Print to PDF
        </button>
      </div>

      <div
        id="quotation-root"
        style={{ background: "#e9eef5", minHeight: "100vh", padding: "16px" }}
      >
        <div
          style={{
            position: "relative",
            width: "210mm",
            minHeight: "297mm",
            margin: "0 auto",
            padding: "5mm 5mm 35mm 5mm",
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            boxSizing: "border-box",
          }}
        >
          {/* ── Table: thead repeats header on every print page ── */}
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
                  <QuotationHeader />
                </td>
              </tr>
            </thead>

            <tbody style={{ display: "table-row-group" }}>
              <tr>
                <td style={{ padding: 0, verticalAlign: "top" }}>
                  <div
                    style={{
                      padding: "0 5mm",
                      fontFamily: "'Times New Roman', Times, serif",
                      fontSize: "15px",
                      lineHeight: "1.4",
                      color: "#000",
                    }}
                  >
                    {/* Customer + Quotation info */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      <div style={{ width: "50%" }}>
                        <h2
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            margin: "0 0 6px 0",
                            textDecoration: "underline",
                          }}
                        >
                          QUOTATION TO:
                        </h2>
                        <div>
                          <strong>Customer:</strong>{" "}
                          {customer?.companyName || "-"}
                        </div>
                        <div>
                          <strong>Address:</strong> {customer?.address || "-"}
                        </div>
                        <div>
                          <strong>GST No:</strong> {customer?.gstNo || "-"}
                        </div>
                        <div>
                          <strong>Contact Name:</strong>{" "}
                          {customer?.contactPerson || "-"}
                        </div>
                        <div>
                          <strong>Contact No.:</strong>{" "}
                          {customer?.mobile || "-"}
                        </div>
                      </div>
                      <div style={{ width: "45%" }}>
                        <div>
                          <strong>Quotation No.:</strong> {data.quotationNo}
                        </div>
                        <div>
                          <strong>Date:</strong>{" "}
                          {data.date
                            ? new Date(data.date).toLocaleDateString("en-GB")
                            : "-"}
                        </div>
                        <div style={{ marginTop: "8px" }}>
                          <strong>Enquiry Reference:</strong>{" "}
                          {data.enquiryReference || "By Call"}
                        </div>
                        <div>
                          <strong>Contact Person:</strong>{" "}
                          {data.contactPersons?.[0]?.name || ""}
                        </div>
                        <div>
                          <strong>Mail ID:</strong> niit004@gmail.com
                        </div>
                        <div>
                          <strong>Contact Number:</strong> +91 9860186056 /
                          7875154431
                        </div>
                      </div>
                    </div>

                    <p style={{ marginTop: "8px", marginBottom: "8px" }}>
                      <strong>Dear Sir,</strong>
                      <br />
                      This is reference to discussion with you; we are pleased
                      to quote our best competitive Price for Inspection.
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
                          <th style={{ width: "35%" }}>
                            Description of Services
                          </th>
                          {type === "training" && (
                            <th style={{ width: "10%" }}>Level</th>
                          )}
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
                              <td style={{ textAlign: "center" }}>
                                {r.level || "NA"}
                              </td>
                            )}
                            <td style={{ textAlign: "center" }}>
                              {r.sacCode || "NA"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {r.quantity || 1}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {r.unit || "Nos"}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {Number(r.price).toFixed(2)}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {Number(r.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td
                            colSpan={type === "training" ? 7 : 6}
                            style={{ textAlign: "right", fontWeight: "bold" }}
                          >
                            Subtotal
                          </td>
                          <td
                            style={{ textAlign: "right", fontWeight: "bold" }}
                          >
                            {Number(data.subtotal).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={type === "training" ? 7 : 6}
                            style={{ textAlign: "right", fontWeight: "bold" }}
                          >
                            GST ({data.gstPercentage}%)
                          </td>
                          <td
                            style={{ textAlign: "right", fontWeight: "bold" }}
                          >
                            {Number(data.gstAmount).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={type === "training" ? 7 : 6}
                            style={{ textAlign: "right", fontWeight: "bold" }}
                          >
                            Total Amount
                          </td>
                          <td
                            style={{ textAlign: "right", fontWeight: "bold" }}
                          >
                            {Number(data.totalAmount).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Terms and Conditions */}
                    <div style={{ marginTop: "8px", lineHeight: "1.5" }}>
                      {type === "training" ? (
                        <>
                          <div>
                            {getNum()}. Minimum Candidates required for campus
                            training :{" "}
                            {data.trainingDetails?.minCandidates || 5}{" "}
                          </div>
                          <div>
                            {getNum()}.{" "}
                            {data.trainingDetails?.trainingMode ||
                              "Training will be conducted as per yours written practice."}
                          </div>
                          <div>
                            {getNum()}. In addition to the course fee, as stated
                            above {data.gstPercentage}% GST will be applicable.
                          </div>
                          <div>
                            {getNum()}. Course fee includes study material, exam
                            fee, certificate fee.
                          </div>
                          <div>
                            {getNum()}. Payment terms:{" "}
                            {data.termsAndConditions?.paymentTerms}
                          </div>
                        </>
                      ) : (
                        <>
                          {data.extraCharges?.minimumVisit > 0 && (
                            <div>
                              {getNum()}. Minimum Visit Charges:{" "}
                              {data.extraCharges.minimumVisit}
                            </div>
                          )}
                          <div>
                            {getNum()}. GST: {data.gstPercentage}% on total
                            charge.
                          </div>
                          <div>
                            {getNum()}. Payment terms:{" "}
                            {data.termsAndConditions?.paymentTerms}
                          </div>
                          <div>
                            {getNum()}. Material handling{" "}
                            {data.termsAndConditions?.materialHandling}
                          </div>
                          <div>
                            {getNum()}. NDE Level II personnel{" "}
                            {data.termsAndConditions?.personnel}
                          </div>
                          <div>
                            {getNum()}. Machines{" "}
                            {data.termsAndConditions?.machines}
                          </div>
                          <div>
                            {getNum()}. Consumables{" "}
                            {data.termsAndConditions?.consumables}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Sign off */}
                    <div
                      style={{ marginTop: "16px", pageBreakInside: "avoid" }}
                    >
                      <p style={{ marginBottom: "6px" }}>
                        We trust the above notice is quite competitive
                        acceptable to you Looking forward to favorable reply
                        &amp; confirmed order on us.
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
                  </div>
                </td>
              </tr>
            </tbody>

            {/* tfoot: spacer to prevent content from overlapping the fixed footer */}
            <tfoot className="tfoot-spacer">
              <tr>
                <td style={{ padding: 0 }}>
                  <div style={{ height: "35mm", visibility: "hidden" }}>
                    spacer
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Screen-only footer — absolute at bottom of page card */}
          <div
            className="screen-footer"
            style={{
              position: "absolute",
              bottom: "5mm",
              left: "5mm",
              right: "5mm",
            }}
          >
            <QuotationFooter />
          </div>
        </div>
      </div>

      {/* Print-only fixed footer — pins to physical bottom of every page */}
      <div className="print-footer-fixed">
        <div className="print-footer-fixed-inner">
          <QuotationFooter />
        </div>
      </div>
    </>
  );
};
