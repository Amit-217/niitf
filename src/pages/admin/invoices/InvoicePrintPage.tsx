import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getInvoiceById } from "../../../api/invoiceApi";
import { getCustomerById } from "../../../api/customerApi";

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; text-align: left !important; }
  
  @media screen { 
    body.autoprint-mode { background: #fff !important; }
    body.autoprint-mode > #root > * { opacity: 0 !important; visibility: hidden !important; }
    .invoice-page { margin: 0 auto 16px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
  }
  
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #invoice-root { background: #fff !important; padding: 0 !important; }
    .invoice-page { 
      height: 296mm; 
      margin: 0 !important; 
      box-shadow: none !important; 
      break-after: page; 
      page-break-after: always; 
    }
    .invoice-page:last-child { break-after: auto; page-break-after: auto; }
    .invoice-page-content { overflow: visible !important; }
  }
  
  body { font-family: 'Times New Roman', Times, serif; font-size: 13px; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }

  .invoice-page {
    width: 210mm;
    height: 297mm;
    background: #fff;
    box-sizing: border-box;
    padding: 0 5mm 5mm 5mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .invoice-page-content { flex: 1 1 auto; }
  .invoice-page-footer { margin-top: auto; }

  table { border-collapse: collapse; width: 100%; }
  .outer-border { border: none; }
  .cell { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
  .cell-center { border: 1px solid #000; padding: 3px 5px; vertical-align: middle; text-align: center; }
  .cell-right { border: 1px solid #000; padding: 3px 5px; vertical-align: top; text-align: right; }
  .bold { font-weight: bold; }
  .red { color: #000; }
  .blue { color: #0000cc; }
  .title { font-size: 18px; font-weight: bold; text-align: center; letter-spacing: 4px; padding: 0px 0;}
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
  .hsn-table.outer-border, .hsn-table.outer-border thead tr:first-child th { border-top: 1px solid #000 !important; }

  /* Prevent bad splits on print */
  .outer-border, .hsn-table, .sig-cell, .gst-inner-table, .footer-note, .inv-foot, .footer-meta, tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
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

type InvoiceItem = {
  description?: string;
  hsnSac?: string;
  quantity?: number | string;
  unit?: string;
  unitPrice?: number | null;
  amount?: number | null;
};

// Height estimation utilities in millimeters
function estimateItemRowHeight(item: InvoiceItem): number {
  const baseHeight = 8; // mm for single-line row
  const desc = item.description || "";
  const lines = Math.max(1, Math.ceil(desc.length / 40));
  return baseHeight + (lines - 1) * 4.5;
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
        window.scrollTo(0, 10);
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);

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

  const items: InvoiceItem[] = Array.isArray(data.items) ? data.items : [];

  const hsnMap: Record<string, { taxable: number }> = {};
  items.forEach((it) => {
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

  const renderInvoiceDetails = () => (
    <>
      <div className="title" style={{ marginBottom: 0 }}>
        INVOICE
      </div>
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
            <td
              style={{
                width: "40%",
                padding: 0,
                verticalAlign: "top",
                height: "1px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  height: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <tbody>
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
                        National Industrial Inspection And Training
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.2 }}>
                        Plot NO-PAP-3/28 Behind BSNL Office
                        <br />
                        MIDC, Baramati Pin -413133
                        <br />
                        GST No.: 27ABJPK8603R1ZY
                        <br />
                        State: Maharashtra Code: 27
                        <br />
                        CONTACT: 8600508524, 7875154431
                        <br />
                        E-Mail: niit004@gmail.com
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="cell"
                      style={{
                        padding: "0px 5px",
                        borderRight: "none",
                        border: "1px solid #444",
                        borderBottom: "none",
                        marginTop: "-2px",
                        height: "100%",
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
                        style={{ fontSize: 14, marginBottom: 1 }}
                      >
                        {" "}
                        {customer?.companyName || "—"}
                      </span>
                      {customer?.address && (
                        <div
                          className="red"
                          style={{ fontSize: 13, lineHeight: 1.2 }}
                        >
                          {customer.address}
                        </div>
                      )}
                      {customer?.city && (
                        <div
                          className="red"
                          style={{ fontSize: 13, lineHeight: 1.2 }}
                        >
                          City-{customer.city}
                        </div>
                      )}
                      {(customer?.state || customer?.stateCode) && (
                        <div
                          className="red"
                          style={{ fontSize: 13, lineHeight: 1.2 }}
                        >
                          {customer?.state && `State: ${customer.state}`} |{" "}
                          {customer?.stateCode && `Code: ${customer.stateCode}`}
                        </div>
                      )}
                      <div
                        className="red"
                        style={{ fontSize: 13, lineHeight: 1.2 }}
                      >
                        GST No: {customer?.gstNo || ""}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td
              style={{
                width: "60%",
                padding: 0,
                verticalAlign: "top",
                height: "1px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  height: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <tbody>
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
                      <span className="field-label">Invoice No:</span>{" "}
                      <span className="bold">{data.invoiceNo}</span>
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
                      <span className="bold red">{fmtDate(data.date)}</span>
                    </td>
                  </tr>
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
                      <span className="field-label">Delivery Note:</span>{" "}
                      <span className="bold">{data.deliveryNote || ""}</span>
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
                      <span className="field-label">Terms Of Delivery:</span>{" "}
                      <span className="bold">{data.termsOfDelivery || ""}</span>
                    </td>
                  </tr>
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
                      <span className="field-label">Supplier's Ref:</span>{" "}
                      <span className="bold">{data.supplierRef || ""}</span>
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
                      <span className="field-label">Other Reference(s):</span>
                      <span className="bold">{data.otherReferences || ""}</span>
                    </td>
                  </tr>
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
                      <span className="field-label">Buyer's Order No:</span>{" "}
                      <span className="bold">{data.buyerOrderNo || ""}</span>
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
                      <span className="bold">
                        {data.buyerOrderDate
                          ? fmtDate(data.buyerOrderDate)
                          : ""}
                      </span>
                    </td>
                  </tr>
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
                      <span className="field-label">Document No:</span>{" "}
                      <span className="bold">{data.documentNo || ""}</span>
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
                      <span className="field-label">Delivery Note Date:</span>{" "}
                      <span className="bold">
                        {data.deliveryNoteDate
                          ? fmtDate(data.deliveryNoteDate)
                          : ""}
                      </span>
                    </td>
                  </tr>
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
                      <span className="field-label">Dispatched Through:</span>{" "}
                      <span className="bold">
                        {data.dispatchedThrough || ""}
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
                      <span className="field-label">Destination:</span>{" "}
                      <span className="bold red">{data.destination || ""}</span>
                    </td>
                  </tr>
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
                        borderBottom: "none",
                      }}
                    >
                      <span
                        className="field-label"
                        style={{ color: "#555", fontWeight: 500 }}
                      >
                        Mode/Terms of Payment:
                      </span>{" "}
                      <span className="bold">{paymentTermsLabel}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const renderItemsTable = (
    pageItems: InvoiceItem[],
    startIndex: number,
    showTotal: boolean,
  ) => (
    <table className="outer-border" style={{ marginTop: "-1px" }}>
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
        {pageItems.map((it, idx: number) => (
          <tr key={`${startIndex}-${idx}`}>
            <td className="items-td-center">{startIndex + idx + 1}</td>
            <td className="items-td red">{it.description}</td>
            <td className="items-td-center">{it.hsnSac || "—"}</td>
            <td className="items-td-center">
              {it.quantity} {it.unit || "Nos"}.
            </td>
            <td className="items-td-right">{fmtNum(it.unitPrice)}</td>
            <td className="items-td-right">{fmtNum(it.amount)}</td>
          </tr>
        ))}
        {pageItems.length === 0 &&
          showTotal &&
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
        {showTotal && (
          <tr>
            <td
              className="items-td-right bold"
              colSpan={5}
              style={{ textAlign: "right" }}
            >
              Total
            </td>
            <td className="items-td-right bold">
              &#8377; {fmtNum(data.subtotal)}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderTaxSection = () => (
    <table className="outer-border" style={{ marginTop: "-1px" }}>
      <tbody>
        <tr>
          <td
            style={{
              width: "60%",
              verticalAlign: "top",
              borderLeft: "1px solid #000",
              borderBottom: "1px solid #000",
            }}
          ></td>
          <td
            style={{
              width: "40%",
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
                      style={{ borderRight: "1px solid #000" }}
                    >
                      SALES SGST {sgstRate}%
                    </td>
                    <td className="gst-value" style={{ width: "112px" }}>
                      {sgstAmt > 0 ? fmtNum(sgstAmt) : "XXXXX"}
                    </td>
                  </tr>
                )}
                {sgstRate > 0 && (
                  <tr>
                    <td
                      className="gst-label"
                      style={{ borderRight: "1px solid #000" }}
                    >
                      SALES CGST {cgstRate}%
                    </td>
                    <td className="gst-value" style={{ width: "112px" }}>
                      {cgstAmt > 0 ? fmtNum(cgstAmt) : "XXXXX"}
                    </td>
                  </tr>
                )}
                {igstRate > 0 && (
                  <tr>
                    <td
                      className="gst-label"
                      style={{ borderRight: "1px solid #000" }}
                    >
                      SALES IGST {igstRate}%
                    </td>
                    <td className="gst-value" style={{ width: "112px" }}>
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
                      Total Amount
                    </td>
                    <td
                      className="gst-value bold red"
                      style={{ borderTop: "1px solid #000", width: "112px" }}
                    >
                      {fmtNum((data.subtotal ?? data.totalAmount ?? 0) + totalTaxAmt)}
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
                      style={{ borderTop: "1px solid #000", width: "112px" }}
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
                    style={{ borderTop: "1px solid #000", width: "112px" }}
                  >
                    &#8377; {fmtNum(data.grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const renderAmountWords = () => (
    <table className="outer-border" style={{ marginTop: "-1px" }}>
      <tbody>
        <tr>
          <td className="cell" style={{ fontSize: 13 }}>
            <span style={{ fontStyle: "italic" }}>
              Total Amounts Chargeable (In word) –{" "}
            </span>
            <span className="amount-words">{data.amountInWords || "—"}</span>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const renderHsnTable = (
    pageHsnRows: Array<[string, { taxable: number }]>,
    showHsnTotal: boolean,
  ) => (
    <table className="outer-border hsn-table" style={{ marginTop: "-1px" }}>
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
        {pageHsnRows.map(([code, { taxable }]) => {
          const cAmt = Number(((taxable * cgstRate) / 100).toFixed(2));
          const sAmt = Number(((taxable * sgstRate) / 100).toFixed(2));
          const iAmt = Number(((taxable * igstRate) / 100).toFixed(2));
          return (
            <tr key={code}>
              <td className="items-td-center">{code}</td>
              <td className="items-td-right">{fmtNum(taxable)}</td>
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
              <td className="items-td-right">{fmtNum(cAmt + sAmt + iAmt)}</td>
            </tr>
          );
        })}
        {showHsnTotal && (
          <tr className="bold">
            <td className="items-td-center">Total</td>
            <td className="items-td-right">{fmtNum(totalTaxable)}</td>
            <td className="items-td-center"></td>
            <td className="items-td-right">
              {cgstRate > 0 ? fmtNum(cgstAmt) : ""}
            </td>
            <td className="items-td-center"></td>
            <td className="items-td-right">
              {sgstRate > 0 ? fmtNum(sgstAmt) : ""}
            </td>
            <td className="items-td-center"></td>
            <td className="items-td-right">
              {igstRate > 0 ? fmtNum(igstAmt) : ""}
            </td>
            <td className="items-td-right">{fmtNum(totalTaxAmt)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderHsnTaxWords = () => (
    <table className="outer-border" style={{ marginTop: "-1px" }}>
      <tbody>
        <tr>
          <td className="cell" style={{ fontSize: 13 }}>
            <span style={{ fontStyle: "italic" }}>Tax Amount (In Words): </span>
            <span className="bold red">
              {data.taxAmountInWords || "Indian Rupees"}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const renderDeclarationSection = () => (
    <table className="outer-border" style={{ marginTop: "-1px" }}>
      <tbody>
        <tr>
          <td
            className="cell"
            style={{ width: "50%", fontSize: 13, verticalAlign: "top" }}
          >
            <div className="bold" style={{ marginBottom: 3 }}>
              Declaration
            </div>
            <div>
              {data.notes ||
                "We declare that this invoice shows the actual price of the testing work described and that all particulars are true and correct"}
            </div>
          </td>
          <td
            className="cell"
            style={{ width: "50%", fontSize: 13, verticalAlign: "top" }}
          >
            <div className="bold" style={{ marginBottom: 3 }}>
              Company Bank Details
            </div>
            <div>
              <span>
                Bank : {data.bankDetails?.bankName || "State Bank of India"}
              </span>
              <span style={{ marginLeft: "20px" }}>
                A/c No.: {data.bankDetails?.accountNumber || "35005963456"}
              </span>
            </div>
            <div>
              <span>Branch: {data.bankDetails?.branch || "Baramati MIDC"}</span>
              <span style={{ marginLeft: "20px" }}>
                IFSC: {data.bankDetails?.ifscCode || "SBIN0014727"}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const renderSignatureSection = () => (
    <>
      <table className="outer-border" style={{ marginTop: "-1px" }}>
        <tbody>
          <tr>
            <td
              className="sig-cell"
              style={{ fontSize: 13, verticalAlign: "bottom", width: "50%" }}
            >
              Customer's Seal And Signature
            </td>
            <td
              className="sig-cell"
              style={{
                fontSize: 13,
                verticalAlign: "top",
                textAlign: "center",
                width: "50%",
              }}
            >
              <div>National Industrial Inspection And Training</div>
              <div style={{ marginTop: 28, fontSize: 13 }}>
                Authorized Signatory
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="footer-note">This is a Computer generated invoice.</div>
    </>
  );

  // Dynamic pagination block layout engine
  const PAGE_HEIGHT_LIMIT = 288; // mm
  const HEADER_HEIGHT = 28; // mm
  const FOOTER_HEIGHT = 22; // mm
  const DETAILS_HEIGHT = 60; // mm
  const TABLE_HEADER_HEIGHT = 8; // mm
  const HSN_HEADER_HEIGHT = 10; // mm

  type ContentBlock =
    | { type: "item"; item: InvoiceItem; height: number }
    | { type: "table-total"; height: number }
    | { type: "tax"; height: number }
    | { type: "amount-words"; height: number }
    | { type: "hsn-row"; code: string; taxable: number; height: number }
    | { type: "hsn-total"; height: number }
    | { type: "final-section"; height: number };

  const blocks: ContentBlock[] = [];

  // 1. Pack items
  items.forEach((item) => {
    blocks.push({
      type: "item",
      item,
      height: estimateItemRowHeight(item),
    });
  });

  // 2. Pack items table total
  blocks.push({
    type: "table-total",
    height: 8,
  });

  // 3. Pack Tax / GST summary
  let gstRows = 0;
  if (sgstRate > 0) gstRows++;
  if (cgstRate > 0) gstRows++;
  if (igstRate > 0) gstRows++;
  if (data.showTotalAmounts !== false) gstRows++;
  if ((data.transportationCharges || 0) > 0) gstRows++;
  gstRows++; // Grand Total row
  const taxHeight = 8 + gstRows * 5.2;
  blocks.push({
    type: "tax",
    height: taxHeight,
  });

  // 4. Pack Amount Words
  blocks.push({
    type: "amount-words",
    height: 8,
  });

  // 5. Pack HSN rows individually
  hsnRows.forEach(([code, { taxable }]) => {
    blocks.push({
      type: "hsn-row",
      code,
      taxable,
      height: 6,
    });
  });

  // 5b. Pack HSN total row + HSN tax words block
  blocks.push({
    type: "hsn-total",
    height: 14,
  });

  // 6. Pack Declaration
  blocks.push({
    type: "final-section",
    height: 50,
  });

  type PageDescriptor = {
    isFirstPage: boolean;
    pageBlocks: ContentBlock[];
  };

  const pages: PageDescriptor[] = [];
  let currentBlockIndex = 0;

  while (currentBlockIndex < blocks.length) {
    const isFirstPage = pages.length === 0;

    // Available height budget for this page
    let availableHeight = PAGE_HEIGHT_LIMIT - HEADER_HEIGHT - FOOTER_HEIGHT;
    if (isFirstPage) {
      availableHeight -= DETAILS_HEIGHT;
    }

    const pageBlocks: ContentBlock[] = [];
    let accumulatedHeight = 0;
    let hasItemsTable = false;
    let hasHsnTable = false;

    while (currentBlockIndex < blocks.length) {
      const block = blocks[currentBlockIndex];
      let blockHeight = block.height;

      // Account for the table header height if starting a new items table on this page
      if (
        (block.type === "item" || block.type === "table-total") &&
        !hasItemsTable
      ) {
        blockHeight += TABLE_HEADER_HEIGHT;
      }

      // Account for HSN header height if starting HSN table on this page
      if (
        (block.type === "hsn-row" || block.type === "hsn-total") &&
        !hasHsnTable
      ) {
        blockHeight += HSN_HEADER_HEIGHT;
      }

      if (accumulatedHeight + blockHeight <= availableHeight) {
        pageBlocks.push(block);
        accumulatedHeight += blockHeight;
        if (block.type === "item" || block.type === "table-total") {
          hasItemsTable = true;
        }
        if (block.type === "hsn-row" || block.type === "hsn-total") {
          hasHsnTable = true;
        }
        currentBlockIndex++;
      } else {
        break;
      }
    }

    // Fallback: If not even a single block fits, force push the first block to avoid infinite loop
    if (pageBlocks.length === 0 && currentBlockIndex < blocks.length) {
      const block = blocks[currentBlockIndex];
      pageBlocks.push(block);
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
        {pages.map(({ isFirstPage, pageBlocks }, i) => {
          const pageItems = pageBlocks
            .filter(
              (b): b is Extract<ContentBlock, { type: "item" }> =>
                b.type === "item",
            )
            .map((b) => b.item);
          const showTotal = pageBlocks.some((b) => b.type === "table-total");
          const hasTable = pageItems.length > 0 || showTotal;
          const firstItem = pageItems[0];
          const startIndex = firstItem ? items.indexOf(firstItem) : 0;

          const pageHsnRows = pageBlocks
            .filter(
              (b): b is Extract<ContentBlock, { type: "hsn-row" }> =>
                b.type === "hsn-row",
            )
            .map(
              (b) =>
                [b.code, { taxable: b.taxable }] as [
                  string,
                  { taxable: number },
                ],
            );
          const showHsnTotal = pageBlocks.some((b) => b.type === "hsn-total");
          const hasHsnTable = pageHsnRows.length > 0 || showHsnTotal;

          return (
            <div className="invoice-page" key={i}>
              <div className="invoice-page-content">
                <InvoiceHeader />
                <div style={{ padding: "0 1mm" }}>
                  {isFirstPage && renderInvoiceDetails()}
                  {hasTable &&
                    renderItemsTable(pageItems, startIndex, showTotal)}
                  {pageBlocks.map((block, idx) => {
                    if (block.type === "tax")
                      return (
                        <React.Fragment key={idx}>
                          {renderTaxSection()}
                        </React.Fragment>
                      );
                    if (block.type === "amount-words")
                      return (
                        <React.Fragment key={idx}>
                          {renderAmountWords()}
                        </React.Fragment>
                      );
                    return null;
                  })}
                  {hasHsnTable && renderHsnTable(pageHsnRows, showHsnTotal)}
                  {showHsnTotal && renderHsnTaxWords()}
                  {pageBlocks.map((block, idx) => {
                    if (block.type === "final-section")
                      return (
                        <React.Fragment key={idx}>
                          {renderDeclarationSection()}
                          {renderSignatureSection()}
                        </React.Fragment>
                      );

                    return null;
                  })}
                </div>
              </div>
              <div className="invoice-page-footer">
                <InvoiceFooter />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
