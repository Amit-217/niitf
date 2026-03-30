import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getTrainingQuotationById, getServiceQuotationById } from '../../../api/quotationApi';
import { getCustomerById } from '../../../api/customerApi';

export const QuotationPrintPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [data, setData] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Helper to extract autoprint
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isAutoPrint = searchParams.get('autoprint') === 'true';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (!id) return;
        
        let qRes;
        if (type === 'training') {
            qRes = await getTrainingQuotationById(id);
        } else {
            qRes = await getServiceQuotationById(id);
        }
        
        const qData = qRes.data?.data || qRes.data;
        setData(qData);
        
        if (qData?.customerId) {
            const custRes = await getCustomerById(qData.customerId);
            setCustomer(custRes.data?.data || custRes.data);
        }

      } catch (err) {
        console.error('Error fetching quotation print data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, type]);

  useEffect(() => {
    if (!isLoading && data && isAutoPrint) {
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [isLoading, data, isAutoPrint]);

  if (isLoading || !data) {
      return <div className="p-12 text-center text-gray-500">Loading document...</div>;
  }

  // Combine services and extra charges for service type into unified rows
  let rows: any[] = [...(data.services || [])];
  
  if (type === 'service' && data.extraCharges) {
      const pCount = rows.length;
      if (data.extraCharges.transportation) {
          rows.push({ srNo: pCount + 1, description: 'Transportation Charges', sacCode: 'NA', quantity: 1, unit: 'Lump Sum', price: data.extraCharges.transportation, amount: data.extraCharges.transportation });
      }
      if (data.extraCharges.lodging) {
          rows.push({ srNo: rows.length + 1, description: 'Lodging Charges', sacCode: 'NA', quantity: 1, unit: 'Lump Sum', price: data.extraCharges.lodging, amount: data.extraCharges.lodging });
      }
      if (data.extraCharges.boarding) {
          rows.push({ srNo: rows.length + 1, description: 'Boarding Charges', sacCode: 'NA', quantity: 1, unit: 'Lump Sum', price: data.extraCharges.boarding, amount: data.extraCharges.boarding });
      }
  }

  let termsCounter = rows.length + 1; // starts counting after table items

  // Format terms to always be 2 digits like 05, 06
  const getNum = () => {
     const str = termsCounter.toString().padStart(2, '0');
     termsCounter++;
     return str;
  };

  return (
    <>
      <style>{`
        body { background: #e9eef5; margin: 0; padding: 0; }
        @media print {
            body { background: white !important; margin: 0 !important; padding: 0 !important; }
            .no-print { display: none !important; }
        }
        .quotation-text { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.4; color: #000; }
        .quotation-table th, .quotation-table td { border: 1px solid #000; padding: 6px; }
        .quotation-table th { font-weight: bold; text-align: center; }
      `}</style>
      
      <div className="no-print p-4 flex justify-between items-center bg-white shadow-sm mb-4">
         <h1 className="text-xl font-bold">Print Quotation</h1>
         <div className="space-x-2">
            <button onClick={() => window.close()} className="px-4 py-2 border rounded hover:bg-gray-50">Close</button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Print to PDF</button>
         </div>
      </div>

      <div style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          padding: "15mm 15mm",
          background: "#fff",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          boxSizing: "border-box",
      }}>
         {/* Fake letterhead spacer for pre-printed letterheads, or we can insert an image */}
         <div style={{ height: '35mm' }}></div>

         <div className="quotation-text" style={{ padding: '0 5mm' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                 <div style={{ width: '50%' }}>
                     <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0', textDecoration: 'underline' }}>QUOTATION TO:</h2>
                     <div><strong>Customer:</strong> {customer?.companyName || '-'}</div>
                     <div><strong>Address:</strong> {customer?.address || '-'}</div>
                     <div><strong>GST No:</strong> {customer?.gstNo || '-'}</div>
                     <div><strong>Contact Name:</strong> {customer?.contactPerson || '-'}</div>
                     <div><strong>Contact No.:</strong> {customer?.mobile || '-'}</div>
                 </div>
                 <div style={{ width: '45%' }}>
                     <div><strong>Quotation No.:</strong> {data.quotationNo}</div>
                     <div><strong>Date:</strong> {data.date ? new Date(data.date).toLocaleDateString('en-GB') : '-'}</div>
                     <div style={{ marginTop: '15px' }}><strong>Enquiry Reference:</strong> {data.enquiryReference || 'By Call'}</div>
                     <div><strong>Contact Person:</strong> {data.contactPersons?.[0]?.name || ''}</div>
                     <div><strong>Mail ID:</strong> niit004@gmail.com</div>
                     <div><strong>Contact Number:</strong> +91 9860186056 / 7875154431</div>
                 </div>
             </div>

             <p style={{ marginTop: '20px', marginBottom: '15px' }}>
                 <strong>Dear Sir,</strong><br/>
                 This is reference to discussion with you; we are pleased to quote our best competitive Price for Inspection.
             </p>

             <table className="quotation-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                 <thead>
                    <tr>
                       <th style={{ width: '8%' }}>Sr. No.</th>
                       <th style={{ width: '35%' }}>Description of Services</th>
                       {type === 'training' && <th style={{ width: '10%' }}>Level</th>}
                       <th style={{ width: '12%' }}>SAC Code</th>
                       <th style={{ width: '7%' }}>Qty</th>
                       <th style={{ width: '8%' }}>Unit</th>
                       <th style={{ width: '10%' }}>Price</th>
                       <th style={{ width: '10%' }}>Amount</th>
                    </tr>
                 </thead>
                 <tbody>
                    {rows.map((r, i) => (
                        <tr key={i}>
                           <td style={{ textAlign: 'center' }}>{(i + 1).toString().padStart(2, '0')}</td>
                           <td>{r.description}</td>
                           {type === 'training' && <td style={{ textAlign: 'center' }}>{r.level || 'NA'}</td>}
                           <td style={{ textAlign: 'center' }}>{r.sacCode || 'NA'}</td>
                           <td style={{ textAlign: 'center' }}>{r.quantity || 1}</td>
                           <td style={{ textAlign: 'center' }}>{r.unit || 'Nos'}</td>
                           <td style={{ textAlign: 'right' }}>{Number(r.price).toFixed(2)}</td>
                           <td style={{ textAlign: 'right' }}>{Number(r.amount).toFixed(2)}</td>
                        </tr>
                    ))}
                    
                    {/* Subtotal & Taxes */}
                    <tr>
                       <td colSpan={type === 'training' ? 7 : 6} style={{ textAlign: 'right', fontWeight: 'bold' }}>Subtotal</td>
                       <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{Number(data.subtotal).toFixed(2)}</td>
                    </tr>
                    <tr>
                       <td colSpan={type === 'training' ? 7 : 6} style={{ textAlign: 'right', fontWeight: 'bold' }}>GST ({data.gstPercentage}%)</td>
                       <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{Number(data.gstAmount).toFixed(2)}</td>
                    </tr>
                    <tr>
                       <td colSpan={type === 'training' ? 7 : 6} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Amount</td>
                       <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{Number(data.totalAmount).toFixed(2)}</td>
                    </tr>
                 </tbody>
             </table>

             {/* Terms and Conditions */}
             <div style={{ marginTop: '20px', lineHeight: '1.6' }}>
                 {type === 'training' ? (
                     <>
                        <div>{getNum()}. Minimum Candidates required for campus training : {data.trainingDetails?.minCandidates || 5} / custom</div>
                        <div>{getNum()}. {data.trainingDetails?.trainingMode || 'Training will be conducted as per yours written practice.'}</div>
                        <div>{getNum()}. In addition to the course fee, as stated above {data.gstPercentage}% GST will be applicable.</div>
                        <div>{getNum()}. Course fee includes study material, exam fee, certificate fee.</div>
                        <div>{getNum()}. Payment terms: {data.termsAndConditions?.paymentTerms}</div>
                     </>
                 ) : (
                     <>
                        {data.extraCharges?.minimumVisit > 0 && <div>{getNum()}. Minimum Visit Charges: {data.extraCharges.minimumVisit}</div>}
                        <div>{getNum()}. GST: {data.gstPercentage}% on total charge.</div>
                        <div>{getNum()}. Payment terms: {data.termsAndConditions?.paymentTerms}</div>
                        <div>{getNum()}. Material handling {data.termsAndConditions?.materialHandling}</div>
                        <div>{getNum()}. NDE Level II personnel {data.termsAndConditions?.personnel}</div>
                        <div>{getNum()}. Machines {data.termsAndConditions?.machines}</div>
                        <div>{getNum()}. Consumables {data.termsAndConditions?.consumables}</div>
                     </>
                 )}
             </div>

             {/* Sign off */}
             <div style={{ marginTop: '40px' }}>
                 <p>
                     We trust the above notice is quite competitive acceptable to you Looking forward to favorable reply &amp; confirmed order on us.
                 </p>
                 <br />
                 <div>Your faithfully,</div>
                 <div style={{ marginTop: '50px', fontWeight: 'bold' }}>{data.preparedBy?.name || 'Mr. Bajirao T. Kadam'}</div>
                 <div>{data.preparedBy?.designation || 'ASNT Level III (RT, UT, MT, PT, VT, ET, MFL)'}</div>
                 <div>Competent Person under Factory Act 1948</div>
                 <div style={{ fontWeight: 'bold' }}>National Industrial Inspection &amp; Training Baramati</div>
                 <div>+91 7875154431, 9860186056</div>
             </div>
         </div>
      </div>
    </>
  );
};
