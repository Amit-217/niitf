import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getInvoiceById } from "../../../api/invoiceApi";
import { getCustomerById } from "../../../api/customerApi";

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  #root { padding: 0 !important; max-width: none !important; }
  @media screen { body.autoprint-mode { opacity: 0; } }
  @media print {
    body.autoprint-mode { opacity: 1; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    #invoice-root { background: #fff !important; padding: 0 !important; }
  }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  table { border-collapse: collapse; width: 100%; }
  .outer-border { border: 1.5px solid #000; }
  .cell { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
  .cell-center { border: 1px solid #000; padding: 3px 5px; vertical-align: middle; text-align: center; }
  .cell-right { border: 1px solid #000; padding: 3px 5px; vertical-align: top; text-align: right; }
  .bold { font-weight: bold; }
  .red { color: #cc0000; }
  .blue { color: #0000cc; }
  .title { font-size: 18px; font-weight: bold; text-align: center; letter-spacing: 4px; padding: 4px 0; }
  .company-name { font-weight: bold; font-size: 13px; }
  .field-label { font-size: 10px; color: #555; }
  .field-value { font-size: 11px; }
  .items-th { background: #e8e8e8; font-weight: bold; text-align: center; border: 1px solid #000; padding: 3px 4px; font-size: 11px; }
  .items-td { border: 1px solid #000; padding: 3px 4px; font-size: 11px; }
  .items-td-center { border: 1px solid #000; padding: 3px 4px; font-size: 11px; text-align: center; }
  .items-td-right { border: 1px solid #000; padding: 3px 4px; font-size: 11px; text-align: right; }
  .gst-label { text-align: right; border: 1px solid #000; padding: 2px 5px; font-size: 11px; }
  .gst-value { border: 1px solid #000; padding: 2px 5px; font-size: 11px; text-align: right; }
  .summary-row { display: flex; border-bottom: 1px solid #000; }
  .summary-label { flex: 1; text-align: right; padding: 2px 6px; font-size: 11px; border-right: 1px solid #000; }
  .summary-value { width: 100px; text-align: right; padding: 2px 6px; font-size: 11px; }
  .amount-words { color: #cc0000; font-weight: bold; font-size: 11px; }
  .sig-cell { border: 1px solid #000; padding: 5px; height: 60px; vertical-align: top; }
  .footer-note { text-align: center; font-size: 10px; color: #555; padding: 3px; border-top: 1px solid #000; }
`;

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

function fmtNum(n?: number | null) {
  if (n === undefined || n === null || isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const InvoicePrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const isAutoPrint = new URLSearchParams(location.search).get("autoprint") === "true";

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const invRes: any = await getInvoiceById(id);
        const inv = invRes?.data?.data || invRes?.data || invRes;
        setData(inv);
        const custId = typeof inv?.customerId === "object" ? inv.customerId?._id : inv?.customerId;
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
      setTimeout(() => { window.print(); document.body.classList.remove("autoprint-mode"); }, 800);
    }
  }, [isLoading, data, isAutoPrint]);

  if (isLoading || !data) {
    return <div style={{ padding: 32, textAlign: "center" }}>Loading invoice...</div>;
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* Screen toolbar */}
      <div
        className="no-print"
        style={{ position: "fixed", top: 12, right: 16, zIndex: 100, display: "flex", gap: 8 }}
      >
        <button
          onClick={() => window.print()}
          style={{ padding: "7px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.history.back()}
          style={{ padding: "7px 16px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
      </div>

      <div id="invoice-root" style={{ background: "#e9eef5", minHeight: "100vh", padding: "16px" }}>
        <div
          style={{
            width: "210mm",
            minHeight: "297mm",
            margin: "0 auto",
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            padding: "6mm 6mm 6mm 6mm",
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            color: "#000",
          }}
        >
          {/* INVOICE TITLE */}
          <div className="title" style={{ borderBottom: "2px solid #000", marginBottom: 0 }}>INVOICE</div>

          {/* ── TOP SECTION: Company Info (left) + Invoice Fields (right) ── */}
          <table className="outer-border" style={{ tableLayout: "fixed" }}>
            <tbody>
              <tr>
                {/* Left: Company Info */}
                <td className="cell" style={{ width: "50%", padding: "5px 7px", verticalAlign: "top" }}>
                  <div className="company-name">National Industrial Inspection And Training</div>
                  <div style={{ fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>
                    Plot NO-PAP-3/28 Behind BSNL Office<br />
                    MIDC, Baramati Pin -413133<br />
                    State Name=Maharashtra&nbsp; Code =27<br />
                    CONTACT= 9850923725, 9421606761<br />
                    E-Mail = niit004@gmail.com
                  </div>
                  {data.subject && (
                    <div style={{ marginTop: 4, fontStyle: "italic", fontSize: 11 }}>{data.subject}</div>
                  )}
                </td>

                {/* Right: Invoice reference table */}
                <td style={{ width: "50%", padding: 0, verticalAlign: "top" }}>
                  <table style={{ width: "100%", height: "100%" }}>
                    <tbody>
                      <tr>
                        <td className="cell" style={{ width: "50%" }}>
                          <span className="field-label">Invoice No: </span>
                          <span className="bold">{data.invoiceNo}</span>
                        </td>
                        <td className="cell">
                          <span className="field-label">Dated: </span>
                          <span className="bold red">{fmtDate(data.date)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="cell" colSpan={2}>
                          <span className="field-label">Delivery Note: </span>{data.deliveryNote || ""}
                        </td>
                      </tr>
                      <tr>
                        <td className="cell" colSpan={2}>
                          <span className="field-label">Mode/Terms of Payment: </span>
                          <span className="bold">{paymentTermsLabel}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="cell">
                          <span className="field-label">Supplier's Ref: </span>{data.supplierRef || ""}
                        </td>
                        <td className="cell">
                          <span className="field-label">Other Reference(s): </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="cell">
                          <span className="field-label">Buyer's Order No: </span>{data.buyerOrderNo || ""}
                        </td>
                        <td className="cell">
                          <span className="field-label">Dated: </span>{data.dueDate ? fmtDate(data.dueDate) : ""}
                        </td>
                      </tr>
                      <tr>
                        <td className="cell">
                          <span className="field-label">Document No: </span>{data.documentNo || ""}
                        </td>
                        <td className="cell">
                          <span className="field-label">Delivery Note Date: </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="cell">
                          <span className="field-label">Dispatched Through: </span>{data.dispatchedThrough || ""}
                        </td>
                        <td className="cell">
                          <span className="field-label">Destination: </span>
                          <span className="bold red">{data.destination || ""}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="cell" colSpan={2}>
                          <span className="field-label">Terms Of Delivery: </span>{data.termsOfDelivery || ""}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── BUYER SECTION ── */}
          <table className="outer-border" style={{ borderTop: "none" }}>
            <tbody>
              <tr>
                <td className="cell" style={{ width: "100%", padding: "5px 7px" }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>Buyer</div>
                  <div className="bold red" style={{ fontSize: 13 }}>
                    {customer?.companyName || "—"}
                  </div>
                  {customer?.address && (
                    <div className="red" style={{ fontSize: 12 }}>{customer.address}</div>
                  )}
                  {customer?.city && (
                    <div className="red" style={{ fontSize: 12 }}>Dist-{customer.city}</div>
                  )}
                  <div className="red" style={{ fontSize: 12 }}>
                    State Name=Maharashtra Code =27
                  </div>
                  <div className="red" style={{ fontSize: 12 }}>
                    GST No={customer?.gstNo || ""}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── LINE ITEMS TABLE ── */}
          <table className="outer-border" style={{ borderTop: "none", marginTop: 0 }}>
            <thead>
              <tr>
                <th className="items-th" style={{ width: "6%" }}>SR<br />NO</th>
                <th className="items-th" style={{ width: "42%" }}>Description of work</th>
                <th className="items-th" style={{ width: "12%" }}>HSN/SAC</th>
                <th className="items-th" style={{ width: "10%" }}>Quantity</th>
                <th className="items-th" style={{ width: "15%" }}>Rate</th>
                <th className="items-th" style={{ width: "15%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, idx: number) => (
                <tr key={idx}>
                  <td className="items-td-center">{idx + 1}</td>
                  <td className="items-td red">{it.description}</td>
                  <td className="items-td-center">{it.hsnSac || "—"}</td>
                  <td className="items-td-center">{it.quantity} {it.unit || "Nos"}.</td>
                  <td className="items-td-right">{fmtNum(it.unitPrice)}</td>
                  <td className="items-td-right">{fmtNum(it.amount)}</td>
                </tr>
              ))}
              {/* Blank rows to fill space */}
              {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
                <tr key={`blank-${i}`} style={{ height: 22 }}>
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
                <td className="items-td-right bold" colSpan={5} style={{ textAlign: "right" }}>Total=</td>
                <td className="items-td-right bold">{fmtNum(data.subtotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── GST SUMMARY + TOTALS ── */}
          <table className="outer-border" style={{ borderTop: "none" }}>
            <tbody>
              <tr>
                {/* Left: blank */}
                <td style={{ width: "55%", borderRight: "1px solid #000", padding: "3px 0", verticalAlign: "top" }}></td>
                {/* Right: GST rows */}
                <td style={{ width: "45%", padding: 0, verticalAlign: "top" }}>
                  <table style={{ width: "100%" }}>
                    <tbody>
                      {cgstRate > 0 && (
                        <tr>
                          <td className="gst-label">SALES SGST {sgstRate}%</td>
                          <td className="gst-value">{sgstAmt > 0 ? fmtNum(sgstAmt) : "XXXXX"}</td>
                        </tr>
                      )}
                      {sgstRate > 0 && (
                        <tr>
                          <td className="gst-label">SALES CGST {cgstRate}%</td>
                          <td className="gst-value">{cgstAmt > 0 ? fmtNum(cgstAmt) : "XXXXX"}</td>
                        </tr>
                      )}
                      {igstRate > 0 && (
                        <tr>
                          <td className="gst-label">SALES IGST {igstRate}%</td>
                          <td className="gst-value">{igstAmt > 0 ? fmtNum(igstAmt) : "XXXXX"}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="gst-label">Round Off / Up</td>
                        <td className="gst-value">{data.roundedOff >= 0 ? "+" : ""}{fmtNum(data.roundedOff)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              {/* Total Amount row — shown only when showTotalAmounts is true */}
              {data.showTotalAmounts !== false && (
                <tr style={{ borderTop: "1px solid #000" }}>
                  <td style={{ padding: "3px 7px", borderRight: "1px solid #000", verticalAlign: "middle" }}>
                    <span style={{ fontSize: 11 }}>Total Amount</span>
                  </td>
                  <td>
                    <table style={{ width: "100%" }}>
                      <tbody>
                        <tr>
                          <td className="gst-label bold">Total Amounts</td>
                          <td className="gst-value bold red">{fmtNum(data.subtotal ?? data.totalAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
              {/* Transportation */}
              {data.transportationCharges > 0 && (
                <tr style={{ borderTop: "1px solid #000" }}>
                  <td style={{ padding: "3px 7px", borderRight: "1px solid #000" }}></td>
                  <td>
                    <table style={{ width: "100%" }}>
                      <tbody>
                        <tr>
                          <td className="gst-label">Transportation Charges</td>
                          <td className="gst-value red">{fmtNum(data.transportationCharges)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
              {/* Grand Total */}
              <tr style={{ borderTop: "1px solid #000" }}>
                <td style={{ padding: "3px 7px", borderRight: "1px solid #000" }}></td>
                <td>
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td className="gst-label bold">Grand Total</td>
                        <td className="gst-value bold red">{fmtNum(data.grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── AMOUNT IN WORDS ── */}
          <table className="outer-border" style={{ borderTop: "none" }}>
            <tbody>
              <tr>
                <td className="cell" style={{ fontSize: 11 }}>
                  <span style={{ fontStyle: "italic" }}>Total Amounts Chargeable (In word) – </span>
                  <span className="amount-words">{data.amountInWords || "—"}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── HSN/SAC TAX TABLE ── */}
          <table className="outer-border" style={{ borderTop: "none" }}>
            <thead>
              <tr>
                <th className="items-th" rowSpan={2}>HSN /SAC</th>
                <th className="items-th" rowSpan={2}>Taxable<br />Value</th>
                <th className="items-th" colSpan={2}>CGST</th>
                <th className="items-th" colSpan={2}>SGST</th>
                <th className="items-th" colSpan={2}>IGST</th>
                <th className="items-th" rowSpan={2}>Total<br />Tax Amount</th>
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
                const cAmt = Number(((taxable * cgstRate) / 100).toFixed(2));
                const sAmt = Number(((taxable * sgstRate) / 100).toFixed(2));
                const iAmt = Number(((taxable * igstRate) / 100).toFixed(2));
                return (
                  <tr key={code}>
                    <td className="items-td-center">{code}</td>
                    <td className="items-td-right">{fmtNum(taxable)}</td>
                    <td className="items-td-center">{cgstRate > 0 ? `${cgstRate}%` : ""}</td>
                    <td className="items-td-right">{cgstRate > 0 ? fmtNum(cAmt) : ""}</td>
                    <td className="items-td-center">{sgstRate > 0 ? `${sgstRate}%` : ""}</td>
                    <td className="items-td-right">{sgstRate > 0 ? fmtNum(sAmt) : ""}</td>
                    <td className="items-td-center">{igstRate > 0 ? `${igstRate}%` : ""}</td>
                    <td className="items-td-right">{igstRate > 0 ? fmtNum(iAmt) : ""}</td>
                    <td className="items-td-right">{fmtNum(cAmt + sAmt + iAmt)}</td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="bold">
                <td className="items-td-center">Total</td>
                <td className="items-td-right">{fmtNum(totalTaxable)}</td>
                <td className="items-td-center">{cgstRate > 0 ? `${cgstRate}%` : ""}</td>
                <td className="items-td-right">{cgstRate > 0 ? fmtNum(cgstAmt) : ""}</td>
                <td className="items-td-center">{sgstRate > 0 ? `${sgstRate}%` : ""}</td>
                <td className="items-td-right">{sgstRate > 0 ? fmtNum(sgstAmt) : ""}</td>
                <td className="items-td-center">{igstRate > 0 ? `${igstRate}%` : ""}</td>
                <td className="items-td-right">{igstRate > 0 ? fmtNum(igstAmt) : ""}</td>
                <td className="items-td-right">{fmtNum(totalTaxAmt)}</td>
              </tr>
            </tbody>
          </table>

          {/* Tax Amount in Words */}
          <table className="outer-border" style={{ borderTop: "none" }}>
            <tbody>
              <tr>
                <td className="cell" style={{ fontSize: 11 }}>
                  <span style={{ fontStyle: "italic" }}>Tax Amount (In Words): </span>
                  <span className="bold red">{data.taxAmountInWords || "Indian Rupees"}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── DECLARATION + BANK DETAILS + SIGNATURES ── */}
          <table className="outer-border" style={{ borderTop: "none" }}>
            <tbody>
              <tr>
                {/* Declaration */}
                <td className="cell" style={{ width: "50%", fontSize: 11, verticalAlign: "top" }}>
                  <div className="bold" style={{ marginBottom: 3 }}>Declaration</div>
                  <div>
                    {data.notes ||
                      "We declare that this invoice shows the actual price of the testing work described and that all particulars are true and correct"}
                  </div>
                </td>
                {/* Bank Details */}
                <td className="cell" style={{ width: "50%", fontSize: 11, verticalAlign: "top" }}>
                  <div className="bold" style={{ marginBottom: 3 }}>Company Bank Details</div>
                  <div>Bank Name: {data.bankDetails?.bankName || "State Bank of India"}</div>
                  <div>A/c No.: {data.bankDetails?.accountNumber || "35005963456"}</div>
                  <div>Branch &amp; IFS Code: {data.bankDetails?.branch || "Baramati MIDC"}</div>
                  {data.bankDetails?.ifscCode && (
                    <div>IFSC: {data.bankDetails.ifscCode}</div>
                  )}
                </td>
              </tr>
              {/* Signatures */}
              <tr>
                <td className="sig-cell" style={{ fontSize: 11, verticalAlign: "bottom" }}>
                  Customer's Seal And Signature
                </td>
                <td className="sig-cell" style={{ fontSize: 11, verticalAlign: "top", textAlign: "center" }}>
                  <div>National Industrial Inspection And Training</div>
                  <div style={{ marginTop: 28, fontSize: 11 }}>Authorized Signatory</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer note */}
          <div className="footer-note">This is a Computer generated invoice.</div>
        </div>
      </div>
    </>
  );
};
