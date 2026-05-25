import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getInvoiceById } from "../../../api/invoiceApi";
import { getCustomerById } from "../../../api/customerApi";

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 2mm 8mm; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }
  @media screen { 
    body.autoprint-mode { background: #fff !important; }
    body.autoprint-mode > #root > *:not(.print-footer-fixed):not(.print-fixed-footer) { opacity: 0 !important; visibility: hidden !important; }
  }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #invoice-root { background: #fff !important; padding: 0 !important; }
    #invoice-root > div {
      width: 100% !important; min-height: auto !important;
      margin: 0 !important; padding: 0 !important;
      box-sizing: border-box !important; box-shadow: none !important;
    }
    .screen-footer { display: none !important; }
    .print-footer-fixed {
      display: block !important;
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      right: 0 !important;
      background: #fff !important;
      z-index: 999999 !important;
      contain: layout !important;
      pointer-events: none !important;
      transform: translateZ(0);
      will-change: transform;
    }
    .print-footer-fixed-inner {
      padding: 0 !important;
    }
    .tfoot-spacer { display: table-footer-group !important; }
  }
  @media screen {
    .print-footer-fixed { display: none !important; }
    .tfoot-spacer { display: none !important; }
    .screen-footer { display: block; }
  }
  body { font-family: 'Times New Roman', Times, serif; font-size: 13px; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  table { border-collapse: collapse; width: calc(100% - 1px); }
  .outer-border { border: none; }
  .cell { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
  .cell-center { border: 1px solid #000; padding: 3px 5px; vertical-align: middle; text-align: center; }
  .cell-right { border: 1px solid #000; padding: 3px 5px; vertical-align: top; text-align: right; }
  .bold { font-weight: bold; }
  .red { color: #000; }
  .blue { color: #0000cc; }
  .title { font-size: 18px; font-weight: bold; text-align: center; letter-spacing: 4px; padding: 4px 0; }
  .company-name { font-weight: bold; font-size: 14px; }
  .field-label { font-size: 13px; color: #555; }
  .field-value { font-size: 14px; }
  .items-th { background: #e8e8e8; font-weight: bold; text-align: center; border: 1px solid #000; padding: 3px 4px; font-size: 13px; }
  .items-td { border: 1px solid #000; padding: 3px 4px; font-size: 13px; }
  .items-td-center { border: 1px solid #000; padding: 3px 4px; font-size: 13px; text-align: center; }
  .items-td-right { border: 1px solid #000; padding: 3px 4px; font-size: 13px; text-align: right; }
  .gst-label { text-align: right; border: 1px solid #000; padding: 2px 5px; font-size: 13px; }
  .gst-value { border: 1px solid #000; padding: 2px 5px; font-size: 13px; text-align: right; }
  .summary-row { display: flex; border-bottom: 1px solid #000; }
  .summary-label { flex: 1; text-align: right; padding: 2px 6px; font-size: 13px; border-right: 1px solid #000; }
  .summary-value { width: 100px; text-align: right; padding: 2px 6px; font-size: 13px; }
  .amount-words { color: #000; font-weight: bold; font-size: 13px; }
  .sig-cell { border: 1px solid #000; padding: 5px; height: 60px; vertical-align: top; }
  .footer-note { text-align: center; font-size: 11px; color: #555; padding: 3px; border-top: 1px solid #000; }
  .rpt-header { padding: 6px 8px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
  .logo-box { width: 140px; height: 90px; background: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 2px; }
  .logo-box img { width: 130px; height: 80px; object-fit: contain; }
  .hdr-center { flex: 1; text-align: center; color: #0C447C; }
  .hdr-center .org { font-size: 20px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; }
  .hdr-center .sub { font-size: 10px; color: #374151; margin-top: 2px; line-height: 1.4; }
  .hdr-center .iso { font-size: 10px; color: #0C447C; font-weight: 700; margin-top: 2px; }
  .inv-foot { background: #f8fafc; padding: 6px 10px; font-size: 10px; color: #4b5563; margin-top: 8px; border-top: 1px solid #185FA5; line-height: 1.4; text-align: center; }
  .footer-meta { background: #185FA5; color: #d7e8fb; font-size: 9px; text-align: center; padding: 3px 8px; }
  .footer-meta span { color: #fff; font-weight: 700; }
  .hsn-table.outer-border, .hsn-table.outer-border thead tr:first-child th { border-top: 1px solid #000 !important; }
`;

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

function fmtNum(n?: number | null) {
  if (n === undefined || n === null || isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const InvoicePrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const isAutoPrint =
    new URLSearchParams(location.search).get("autoprint") === "true";

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const invRes: any = await getInvoiceById(id);
        const inv = invRes?.data?.data || invRes?.data || invRes;
        setData(inv);
        const custId =
          typeof inv?.customerId === "object"
            ? inv.customerId?._id
            : inv?.customerId;
        if (custId) {
          try {
            const custRes: any = await getCustomerById(custId);
            setCustomer(custRes?.data?.data || custRes?.data || custRes);
          } catch {
            if (typeof inv.customerId === "object") setCustomer(inv.customerId);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

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
      <div style={{ padding: 32, textAlign: "center" }}>Loading invoice...</div>
    );
  }

  const items: any[] = Array.isArray(data.items) ? data.items : [];

  // Build HSN/SAC tax summary rows (group by hsnSac)
  const hsnMap: Record<string, { taxable: number }> = {};
  items.forEach((it: any) => {
    const code = it.hsnSac || "—";
    if (!hsnMap[code]) hsnMap[code] = { taxable: 0 };
    hsnMap[code].taxable += it.amount || 0;
  });
  const hsnRows = Object.entries(hsnMap);
  const totalTaxable = hsnRows.reduce((s, [, v]) => s + v.taxable, 0);
  const cgstRate = data.cgst?.rate ?? 9;
  const sgstRate = data.sgst?.rate ?? 9;
  const igstRate = data.igst?.rate ?? 0;
  const cgstAmt = data.cgst?.amount ?? 0;
  const sgstAmt = data.sgst?.amount ?? 0;
  const igstAmt = data.igst?.amount ?? 0;
  const totalTaxAmt = cgstAmt + sgstAmt + igstAmt;

  const paymentTermsLabel =
    data.paymentMode === "Immediate"
      ? "Immediate after submission bill"
      : data.paymentMode === "30 Days"
        ? "30 Days"
        : data.paymentMode === "45 Days"
          ? "45 Days"
          : data.paymentMode || "—";

  const InvoiceHeader = () => (
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

  const InvoiceFooter = () => (
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
        Invoice No: <span>{data.invoiceNo}</span>
        &nbsp;|&nbsp; Date: <span>{fmtDate(data.date)}</span>
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
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Print / Save PDF
        </button>
      </div>

      <div
        id="invoice-root"
        style={{ background: "#e9eef5", minHeight: "100vh", padding: "16px" }}
      >
        <div
          style={{
            position: "relative",
            width: "210mm",
            minHeight: "297mm",
            margin: "0 auto",
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            padding: "0 5mm 35mm 5mm",
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            color: "#000",
            boxSizing: "border-box",
          }}
        >
          {/* Outer table: thead repeats header on every print page */}
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
                  <InvoiceHeader />
                </td>
              </tr>
            </thead>
            <tbody style={{ display: "table-row-group" }}>
              <tr>
                <td style={{ padding: 0, verticalAlign: "top" }}>
                  <div style={{ padding: "0 1mm" }}>
                    {/* INVOICE TITLE */}
                    <div
                      className="title"
                      style={{
                        marginBottom: 0,
                      }}
                    >
                      INVOICE
                    </div>

                    {/* ── HEADER SECTION: Left=Company+Buyer stacked, Right=All fields ── */}
                    <table
                      className="outer-border"
                      style={{
                        tableLayout: "fixed",
                        width: "100%",
                        borderCollapse: "collapse",
                      }}
                    >
                      <tbody>
                        <tr>
                          {/* LEFT COLUMN */}
                          <td
                            style={{
                              width: "40%",
                              padding: 0,
                              verticalAlign: "top",
                            }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                tableLayout: "fixed",
                              }}
                            >
                              <tbody>
                                {/* COMPANY INFO */}
                                <tr>
                                  <td
                                    className="cell"
                                    style={{
                                      padding: "6px 5px",
                                      verticalAlign: "top",
                                      borderRight: "none",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <div
                                      className="company-name"
                                      style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        lineHeight: 1.35,
                                        marginBottom: 2,
                                      }}
                                    >
                                      National Industrial Inspection And
                                      Training
                                    </div>

                                    <div
                                      style={{
                                        fontSize: 13,
                                        lineHeight: 1,
                                      }}
                                    >
                                      Plot NO-PAP-3/28 Behind BSNL Office
                                      <br />
                                      MIDC, Baramati Pin -413133
                                      <br />
                                      GST No.: 27ABJPK8603R1ZY
                                      <br />
                                      State: Maharashtra Code: 27
                                      <br />
                                      CONTACT: 8600508524, 9421606761
                                      <br />
                                      E-Mail: niit004@gmail.com
                                    </div>
                                  </td>
                                </tr>

                                {/* BUYER INFO */}
                                <tr>
                                  <td
                                    className="cell"
                                    style={{
                                      padding: "0px 5px",
                                      borderRight: "none",
                                      border: "1px solid #444",
                                      marginTop: "-2px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        textDecoration: "underline",
                                        marginBottom: 1,
                                      }}
                                    >
                                      Buyer:
                                    </span>
                                    <span> </span>
                                    <span
                                      className="bold red"
                                      style={{
                                        fontSize: 14,
                                        marginBottom: 1,
                                      }}
                                    >
                                      {" "}
                                      {customer?.companyName || "—"}
                                    </span>

                                    {customer?.address && (
                                      <div
                                        className="red"
                                        style={{
                                          fontSize: 13,
                                          lineHeight: 1,
                                        }}
                                      >
                                        {customer.address}
                                      </div>
                                    )}

                                    {customer?.city && (
                                      <div
                                        className="red"
                                        style={{
                                          fontSize: 13,
                                          lineHeight: 1,
                                        }}
                                      >
                                        City-{customer.city}
                                      </div>
                                    )}

                                    {(customer?.state ||
                                      customer?.stateCode) && (
                                      <div
                                        className="red"
                                        style={{
                                          fontSize: 13,
                                          lineHeight: 1,
                                        }}
                                      >
                                        {customer?.state &&
                                          `State: ${customer.state}`}{" "}
                                        |
                                        {customer?.state &&
                                          customer?.stateCode &&
                                          " "}{" "}
                                        {customer?.stateCode &&
                                          `Code: ${customer.stateCode}`}
                                      </div>
                                    )}

                                    <div
                                      className="red"
                                      style={{
                                        fontSize: 13,
                                        lineHeight: 1,
                                      }}
                                    >
                                      GST No: {customer?.gstNo || ""}
                                    </div>
                                    <div
                                      className="red"
                                      style={{
                                        fontSize: 13,
                                        lineHeight: 1,
                                      }}
                                    >
                                      Contact Person:{" "}
                                      {customer?.contactPerson || ""}
                                    </div>
                                    <div
                                      className="red"
                                      style={{
                                        fontSize: 13,
                                        lineHeight: 1,
                                      }}
                                    >
                                      Contact: {customer?.mobile || ""}
                                    </div>
                                    <div
                                      className="red"
                                      style={{
                                        fontSize: 13,
                                        lineHeight: 1,
                                      }}
                                    >
                                      Email: {customer?.email || ""}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>

                          {/* RIGHT COLUMN */}
                          <td
                            style={{
                              width: "60%",
                              padding: 0,
                              verticalAlign: "top",
                            }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                tableLayout: "fixed",
                              }}
                            >
                              <tbody>
                                {/* ROW 1 */}
                                <tr>
                                  <td
                                    className="cell"
                                    style={{
                                      width: "50%",
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span
                                      className="field-label"
                                      style={{ color: "#555" }}
                                    >
                                      Invoice No:
                                    </span>{" "}
                                    <span className="bold">
                                      {data.invoiceNo}
                                    </span>
                                  </td>

                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span
                                      className="field-label"
                                      style={{ color: "#555" }}
                                    >
                                      Dated:
                                    </span>{" "}
                                    <span className="bold red">
                                      {fmtDate(data.date)}
                                    </span>
                                  </td>
                                </tr>

                                {/* ROW 2 */}
                                <tr>
                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span
                                      className="field-label"
                                      style={{ color: "#555" }}
                                    >
                                      Delivery Note:
                                    </span>{" "}
                                    {data.deliveryNote || ""}
                                  </td>

                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span
                                      className="field-label"
                                      style={{ color: "#555" }}
                                    >
                                      Terms Of Delivery:
                                    </span>{" "}
                                    {data.termsOfDelivery || ""}
                                  </td>
                                </tr>

                                {/* ROW 3 */}
                                <tr>
                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span className="field-label">
                                      Supplier's Ref:
                                    </span>{" "}
                                    {data.supplierRef || ""}
                                  </td>

                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span className="field-label">
                                      Other Reference(s):
                                    </span>
                                  </td>
                                </tr>

                                {/* ROW 4 */}
                                <tr>
                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span className="field-label">
                                      Buyer's Order No:
                                    </span>{" "}
                                    {data.buyerOrderNo || ""}
                                  </td>

                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span className="field-label">Dated:</span>{" "}
                                    {data.dueDate ? fmtDate(data.dueDate) : ""}
                                  </td>
                                </tr>

                                {/* ROW 5 */}
                                <tr>
                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span className="field-label">
                                      Document No:
                                    </span>{" "}
                                    {data.documentNo || ""}
                                  </td>

                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span className="field-label">
                                      Delivery Note Date:
                                    </span>
                                  </td>
                                </tr>

                                {/* ROW 6 */}
                                <tr>
                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span className="field-label">
                                      Dispatched Through:
                                    </span>{" "}
                                    {data.dispatchedThrough || ""}
                                  </td>

                                  <td
                                    className="cell"
                                    style={{
                                      padding: "5px 7px",
                                      fontSize: 13,
                                      height: "34px",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span className="field-label">
                                      Destination:
                                    </span>{" "}
                                    <span className="bold red">
                                      {data.destination || ""}
                                    </span>
                                  </td>
                                </tr>

                                {/* ROW 7 */}
                                {/* ROW 7 */}
                                <tr style={{ height: "100%" }}>
                                  <td
                                    className="cell"
                                    colSpan={2}
                                    style={{
                                      padding: "8px 10px",
                                      fontSize: 13,
                                      height: "100%",
                                      minHeight: "90px",
                                      verticalAlign: "top",
                                      border: "1px solid #444",
                                    }}
                                  >
                                    <span
                                      className="field-label"
                                      style={{
                                        color: "#555",
                                        fontWeight: 500,
                                      }}
                                    >
                                      Mode/Terms of Payment:
                                    </span>{" "}
                                    <span className="bold">
                                      {paymentTermsLabel}
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    {/* ── LINE ITEMS TABLE ── */}
                    <table
                      className="outer-border"
                      style={{ borderTop: "none", marginTop: "-1px" }}
                    >
                      <thead>
                        <tr>
                          <th className="items-th" style={{ width: "6%" }}>
                            SR
                          </th>
                          <th className="items-th" style={{ width: "42%" }}>
                            Description of work
                          </th>
                          <th className="items-th" style={{ width: "12%" }}>
                            HSN/SAC
                          </th>
                          <th className="items-th" style={{ width: "10%" }}>
                            Quantity
                          </th>
                          <th className="items-th" style={{ width: "15%" }}>
                            Rate
                          </th>
                          <th className="items-th" style={{ width: "15%" }}>
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it: any, idx: number) => (
                          <tr key={idx}>
                            <td className="items-td-center">{idx + 1}</td>
                            <td className="items-td red">{it.description}</td>
                            <td className="items-td-center">
                              {it.hsnSac || "—"}
                            </td>
                            <td className="items-td-center">
                              {it.quantity} {it.unit || "Nos"}.
                            </td>
                            <td className="items-td-right">
                              {fmtNum(it.unitPrice)}
                            </td>
                            <td className="items-td-right">
                              {fmtNum(it.amount)}
                            </td>
                          </tr>
                        ))}
                        {/* Blank rows — only when there are no items */}
                        {items.length === 0 &&
                          Array.from({ length: 4 }).map((_, i) => (
                            <tr key={`blank-${i}`} style={{ height: 26 }}>
                              <td className="items-td-center"></td>
                              <td className="items-td"></td>
                              <td className="items-td-center"></td>
                              <td className="items-td-center"></td>
                              <td className="items-td-right"></td>
                              <td className="items-td-right"></td>
                            </tr>
                          ))}
                        {/* Total row */}
                        <tr>
                          <td
                            className="items-td-right bold"
                            colSpan={5}
                            style={{ textAlign: "right" }}
                          >
                            Total
                          </td>
                          <td className="items-td-right bold">
                            ₹ {fmtNum(data.subtotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* ── GST SUMMARY + TOTALS ── */}
                    <table
                      className="outer-border"
                      style={{ marginTop: "-1px" }}
                    >
                      <tbody>
                        <tr>
                          {/* Left blank section */}
                          <td
                            style={{
                              width: "55%",
                              verticalAlign: "top",
                              borderLeft: "1px solid #000",
                              borderBottom: "1px solid #000",
                            }}
                          ></td>

                          {/* Right GST section */}
                          <td
                            style={{
                              width: "45%",
                              padding: 0,
                              verticalAlign: "top",
                              borderBottom: "1px solid #000",
                            }}
                          >
                            <table
                              className="gst-inner-table"
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                tableLayout: "fixed",
                              }}
                            >
                              <tbody>
                                {cgstRate > 0 && (
                                  <tr>
                                    <td
                                      className="gst-label"
                                      style={{
                                        borderRight: "1px solid #000",
                                      }}
                                    >
                                      SALES SGST {sgstRate}%
                                    </td>

                                    <td
                                      className="gst-value"
                                      style={{
                                        width: "140px",
                                      }}
                                    >
                                      {sgstAmt > 0 ? fmtNum(sgstAmt) : "XXXXX"}
                                    </td>
                                  </tr>
                                )}

                                {sgstRate > 0 && (
                                  <tr>
                                    <td
                                      className="gst-label"
                                      style={{
                                        borderRight: "1px solid #000",
                                      }}
                                    >
                                      SALES CGST {cgstRate}%
                                    </td>

                                    <td
                                      className="gst-value"
                                      style={{
                                        width: "140px",
                                      }}
                                    >
                                      {cgstAmt > 0 ? fmtNum(cgstAmt) : "XXXXX"}
                                    </td>
                                  </tr>
                                )}

                                {igstRate > 0 && (
                                  <tr>
                                    <td
                                      className="gst-label"
                                      style={{
                                        borderRight: "1px solid #000",
                                      }}
                                    >
                                      SALES IGST {igstRate}%
                                    </td>

                                    <td
                                      className="gst-value"
                                      style={{
                                        width: "140px",
                                      }}
                                    >
                                      {igstAmt > 0 ? fmtNum(igstAmt) : "XXXXX"}
                                    </td>
                                  </tr>
                                )}

                                {data.showTotalAmounts !== false && (
                                  <tr>
                                    <td
                                      className="gst-label bold"
                                      style={{
                                        borderTop: "1px solid #000",
                                        borderRight: "1px solid #000",
                                      }}
                                    >
                                      Total Amounts
                                    </td>

                                    <td
                                      className="gst-value bold red"
                                      style={{
                                        borderTop: "1px solid #000",
                                        width: "140px",
                                      }}
                                    >
                                      {fmtNum(
                                        data.subtotal ?? data.totalAmount,
                                      )}
                                    </td>
                                  </tr>
                                )}

                                {data.transportationCharges > 0 && (
                                  <tr>
                                    <td
                                      className="gst-label"
                                      style={{
                                        borderTop: "1px solid #000",
                                        borderRight: "1px solid #000",
                                      }}
                                    >
                                      Transportation Charges
                                    </td>

                                    <td
                                      className="gst-value red"
                                      style={{
                                        borderTop: "1px solid #000",
                                        width: "140px",
                                      }}
                                    >
                                      {fmtNum(data.transportationCharges)}
                                    </td>
                                  </tr>
                                )}

                                <tr>
                                  <td
                                    className="gst-label bold"
                                    style={{
                                      borderTop: "1px solid #000",
                                      borderRight: "1px solid #000",
                                    }}
                                  >
                                    Grand Total
                                  </td>

                                  <td
                                    className="gst-value bold red"
                                    style={{
                                      borderTop: "1px solid #000",
                                      width: "140px",
                                    }}
                                  >
                                    ₹ {fmtNum(data.grandTotal)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* ── AMOUNT IN WORDS ── */}
                    <table
                      className="outer-border"
                      style={{ marginTop: "-1px" }}
                    >
                      <tbody>
                        <tr>
                          <td className="cell" style={{ fontSize: 13 }}>
                            <span style={{ fontStyle: "italic" }}>
                              Total Amounts Chargeable (In word) –{" "}
                            </span>
                            <span className="amount-words">
                              {data.amountInWords || "—"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* ── HSN/SAC TAX TABLE ── */}
                    <table
                      className="outer-border hsn-table"
                      style={{ marginTop: "-1px" }}
                    >
                      <thead>
                        <tr>
                          <th className="items-th" rowSpan={2}>
                            HSN /SAC
                          </th>
                          <th className="items-th" rowSpan={2}>
                            Taxable
                            <br />
                            Value
                          </th>
                          <th className="items-th" colSpan={2}>
                            CGST
                          </th>
                          <th className="items-th" colSpan={2}>
                            SGST
                          </th>
                          <th className="items-th" colSpan={2}>
                            IGST
                          </th>
                          <th className="items-th" rowSpan={2}>
                            Total
                            <br />
                            Tax Amount
                          </th>
                        </tr>
                        <tr>
                          <th className="items-th">Rate</th>
                          <th className="items-th">Amount</th>
                          <th className="items-th">Rate</th>
                          <th className="items-th">Amount</th>
                          <th className="items-th">Rate</th>
                          <th className="items-th">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hsnRows.map(([code, { taxable }]) => {
                          const cAmt = Number(
                            ((taxable * cgstRate) / 100).toFixed(2),
                          );
                          const sAmt = Number(
                            ((taxable * sgstRate) / 100).toFixed(2),
                          );
                          const iAmt = Number(
                            ((taxable * igstRate) / 100).toFixed(2),
                          );
                          return (
                            <tr key={code}>
                              <td className="items-td-center">{code}</td>
                              <td className="items-td-right">
                                {fmtNum(taxable)}
                              </td>
                              <td className="items-td-center">
                                {cgstRate > 0 ? `${cgstRate}%` : ""}
                              </td>
                              <td className="items-td-right">
                                {cgstRate > 0 ? fmtNum(cAmt) : ""}
                              </td>
                              <td className="items-td-center">
                                {sgstRate > 0 ? `${sgstRate}%` : ""}
                              </td>
                              <td className="items-td-right">
                                {sgstRate > 0 ? fmtNum(sAmt) : ""}
                              </td>
                              <td className="items-td-center">
                                {igstRate > 0 ? `${igstRate}%` : ""}
                              </td>
                              <td className="items-td-right">
                                {igstRate > 0 ? fmtNum(iAmt) : ""}
                              </td>
                              <td className="items-td-right">
                                {fmtNum(cAmt + sAmt + iAmt)}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Totals row */}
                        <tr className="bold">
                          <td className="items-td-center">Total</td>
                          <td className="items-td-right">
                            {fmtNum(totalTaxable)}
                          </td>
                          <td className="items-td-center">
                            {cgstRate > 0 ? `${cgstRate}%` : ""}
                          </td>
                          <td className="items-td-right">
                            {cgstRate > 0 ? fmtNum(cgstAmt) : ""}
                          </td>
                          <td className="items-td-center">
                            {sgstRate > 0 ? `${sgstRate}%` : ""}
                          </td>
                          <td className="items-td-right">
                            {sgstRate > 0 ? fmtNum(sgstAmt) : ""}
                          </td>
                          <td className="items-td-center">
                            {igstRate > 0 ? `${igstRate}%` : ""}
                          </td>
                          <td className="items-td-right">
                            {igstRate > 0 ? fmtNum(igstAmt) : ""}
                          </td>
                          <td className="items-td-right">
                            {fmtNum(totalTaxAmt)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Tax Amount in Words */}
                    <table
                      className="outer-border"
                      style={{ marginTop: "-1px" }}
                    >
                      <tbody>
                        <tr>
                          <td className="cell" style={{ fontSize: 13 }}>
                            <span style={{ fontStyle: "italic" }}>
                              Tax Amount (In Words):{" "}
                            </span>
                            <span className="bold red">
                              {data.taxAmountInWords || "Indian Rupees"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* ── DECLARATION + BANK DETAILS + SIGNATURES ── */}
                    <table
                      className="outer-border"
                      style={{ marginTop: "-1px" }}
                    >
                      <tbody>
                        <tr>
                          {/* Declaration */}
                          <td
                            className="cell"
                            style={{
                              width: "50%",
                              fontSize: 13,
                              verticalAlign: "top",
                            }}
                          >
                            <div className="bold" style={{ marginBottom: 3 }}>
                              Declaration
                            </div>
                            <div>
                              {data.notes ||
                                "We declare that this invoice shows the actual price of the testing work described and that all particulars are true and correct"}
                            </div>
                          </td>
                          {/* Bank Details */}
                          <td
                            className="cell"
                            style={{
                              width: "50%",
                              fontSize: 13,
                              verticalAlign: "top",
                            }}
                          >
                            <div className="bold" style={{ marginBottom: 3 }}>
                              Company Bank Details
                            </div>
                            <div>
                              <span>
                                Bank :{" "}
                                {data.bankDetails?.bankName ||
                                  "State Bank of India"}
                              </span>

                              <span style={{ marginLeft: "20px" }}>
                                A/c No.:{" "}
                                {data.bankDetails?.accountNumber ||
                                  "35005963456"}
                              </span>
                            </div>

                            <div>
                              <span>
                                Branch:{" "}
                                {data.bankDetails?.branch || "Baramati MIDC"}
                              </span>

                              <span style={{ marginLeft: "20px" }}>
                                IFSC:{" "}
                                {data.bankDetails?.ifscCode || "SBIN0014727"}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {/* Signatures */}
                        <tr>
                          <td
                            className="sig-cell"
                            style={{ fontSize: 13, verticalAlign: "bottom" }}
                          >
                            Customer's Seal And Signature
                          </td>
                          <td
                            className="sig-cell"
                            style={{
                              fontSize: 13,
                              verticalAlign: "top",
                              textAlign: "center",
                            }}
                          >
                            <div>
                              National Industrial Inspection And Training
                            </div>
                            <div style={{ marginTop: 28, fontSize: 13 }}>
                              Authorized Signatory
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Footer note */}
                    <div className="footer-note">
                      This is a Computer generated invoice.
                    </div>
                  </div>
                  {/* end padding div */}
                </td>
              </tr>
            </tbody>

            {/* tfoot spacer — prevents content overlapping fixed footer on print */}
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
            <InvoiceFooter />
          </div>
        </div>
      </div>

      {/* Print-only fixed footer — pins to physical bottom of every page */}
      <div className="print-footer-fixed">
        <div className="print-footer-fixed-inner">
          <InvoiceFooter />
        </div>
      </div>
    </>
  );
};
