import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  createTrainingQuotation, getTrainingQuotationById, updateTrainingQuotation,
  createServiceQuotation, getServiceQuotationById, updateServiceQuotation
} from '../../../api/quotationApi';
import { getCustomers } from '../../../api/customerApi';
import { Save, Ban, Plus, Trash2, ArrowLeft } from 'lucide-react';

export const QuotationFormPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { customerId?: string; from?: string } | null;
  const isEditing = Boolean(id);
  const qType = type === 'training' ? 'Training' : 'Service';

  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState<any>({
    quotationNo: '',
    customerId: '',
    enquiryReference: 'By Call',
    date: new Date().toISOString().split('T')[0],
    contactPersons: [{ name: '', mobile: '' }],
    services: [],
    // Service Specific
    extraCharges: { transportation: 0, lodging: 0, boarding: 0, minimumVisit: 0 },
    // Training Specific
    trainingDetails: { minCandidates: 5, trainingMode: 'As per yours written practice', includes: { studyMaterial: true, examFee: true, certificateFee: true } },
    
    gstPercentage: 18,
    termsAndConditions: {
      paymentTerms: qType === 'Training' ? 'Immediate after completion of training & submission of certificates.' : 'Immediate after completion of inspection & before submission of reports.',
      trainingNote: '',
      materialHandling: 'is in yours scope.',
      personnel: 'is in ours scope.',
      machines: 'is in our scope.',
      consumables: 'is in our scope.'
    },
    preparedBy: { name: 'Mr. Bajirao T. Kadam', designation: 'ASNT Level III (RT, UT, MT, PT, VT, ET, MFL)' }
  });

  const [totals, setTotals] = useState({ subtotal: 0, gstAmount: 0, totalAmount: 0 });

  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line
  }, [formData.services, formData.extraCharges, formData.gstPercentage]);

  const calculateTotals = () => {
    let subtotal = formData.services.reduce((acc: number, cur: any) => acc + (parseFloat(cur.amount) || 0), 0);
    if (type === 'service') {
      const extras = formData.extraCharges || {};
      subtotal += (parseFloat(extras.transportation) || 0);
      subtotal += (parseFloat(extras.lodging) || 0);
      subtotal += (parseFloat(extras.boarding) || 0);
      subtotal += (parseFloat(extras.minimumVisit) || 0);
    }
    const gstAmount = (subtotal * (parseFloat(formData.gstPercentage) || 0)) / 100;
    const totalAmount = subtotal + gstAmount;
    setTotals({ subtotal, gstAmount, totalAmount });
  };

  useEffect(() => {
    fetchInitData();
    // eslint-disable-next-line
  }, [id, type]);

  const fetchInitData = async () => {
    try {
      setIsLoading(true);
      const custRes = await getCustomers();
      setCustomers(custRes.data?.data || custRes.data || []);

      if (isEditing && id) {
        let res;
        if (type === 'training') res = await getTrainingQuotationById(id);
        else res = await getServiceQuotationById(id);
        
        const data = res.data?.data || res.data;
        if (data) {
          if (data.date) data.date = new Date(data.date).toISOString().split('T')[0];
          // Normalize customerId: API may return a populated object instead of a plain ID string
          if (data.customerId && typeof data.customerId === 'object') {
            data.customerId = data.customerId._id || '';
          }
          setFormData({ ...formData, ...data });
        }
      } else {
        // Auto gen quotation number roughly if required, but backend usually requires unique string
        setFormData((prev: any) => ({
          ...prev,
          quotationNo: '', // Backend will generate formal number if empty
          ...(locationState?.customerId ? { customerId: locationState.customerId } : {}),
        }));
      }
    } catch (err) {
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const getFinancialYear = () => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    // FY starts in April
    if (month >= 3) return `${year}-${year + 1}`;
    return `${year - 1}-${year}`;
  };

  const handleServiceChange = (index: number, field: string, value: any) => {
    const updated = [...formData.services];
    updated[index][field] = value;
    
    // Auto calculate amount
    if (field === 'quantity' || field === 'price') {
      const q = parseFloat(updated[index].quantity) || 0;
      const p = parseFloat(updated[index].price) || 0;
      updated[index].amount = q * p;
    }
    setFormData({ ...formData, services: updated });
  };

  const addServiceRow = () => {
    const row = {
      srNo: formData.services.length + 1,
      description: '',
      level: 'NA',
      sacCode: '988393',
      quantity: 1,
      unit: 'Per',
      price: 0,
      amount: 0
    };
    setFormData({ ...formData, services: [...formData.services, row] });
  };

  const removeServiceRow = (index: number) => {
    const updated = [...formData.services];
    updated.splice(index, 1);
    setFormData({ ...formData, services: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce customer selection
    if (!formData.customerId) {
      toast.error('Please select a customer before saving.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Calculate totals correctly
      let subtotal = formData.services.reduce((acc: number, cur: any) => acc + (parseFloat(cur.amount) || 0), 0);
      if (type === 'service') {
         const extras = formData.extraCharges || {};
         subtotal += (parseFloat(extras.transportation) || 0);
         subtotal += (parseFloat(extras.lodging) || 0);
         subtotal += (parseFloat(extras.boarding) || 0);
         subtotal += (parseFloat(extras.minimumVisit) || 0);
      }

      const gstAmount = (subtotal * formData.gstPercentage) / 100;
      const totalAmount = subtotal + gstAmount;

      const payload = {
          ...formData,
          subtotal,
          gstAmount,
          totalAmount
      };

      if (isEditing && id) {
        if (type === 'training') await updateTrainingQuotation(id, payload);
        else await updateServiceQuotation(id, payload);
        toast.success(`${qType} Quotation updated successfully`);
      } else {
        if (type === 'training') await createTrainingQuotation(payload);
        else await createServiceQuotation(payload);
        toast.success(`${qType} Quotation created successfully`);
      }

      // Navigate back to where the user came from
      if (locationState?.from === 'quotations-list') {
        navigate('/admin/quotations');
      } else {
        const customerId = formData.customerId || locationState?.customerId;
        if (customerId) {
          navigate(`/admin/customers/${customerId}`, { state: { activeTab: 'quotations' } });
        } else {
          navigate('/admin/quotations');
        }
      }
    } catch (err) {
      toast.error('Failed to save quotation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading form...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit' : 'Create'} {qType} Quotation</h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        
        {/* Core Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Core Info</h2>
              <span className="text-xs font-bold px-2 py-1 bg-violet-50 text-violet-700 rounded-lg animate-pulse">Auto-numbering Enabled</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quotation No <span className="text-gray-400 font-normal">{isEditing ? '' : '(Auto-generated)'}</span></label>
                <input 
                  required 
                  readOnly 
                  type="text" 
                  value={isEditing ? formData.quotationNo : `NIIT/${getFinancialYear()}/QTN/${new Date().getFullYear()}/... (Auto)`} 
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 font-mono font-bold text-violet-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer <span className="text-red-500">*</span></label>
                <select 
                  required 
                  value={formData.customerId} 
                  onChange={(e) => {
                    const custId = e.target.value;
                    const selectedCust = customers.find(c => c._id === custId);
                    setFormData({
                      ...formData, 
                      customerId: custId,
                      contactPersons: selectedCust ? [{ ...formData.contactPersons[0], name: selectedCust.contactPerson || '' }] : formData.contactPersons
                    });
                  }} 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                   <option value="">Select Customer</option>
                   {customers.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Enquiry Reference</label>
                <select value={formData.enquiryReference} onChange={(e) => setFormData({...formData, enquiryReference: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                   <option value="By Mail">By Mail</option>
                   <option value="By Call">By Call</option>
                </select>
              </div>
           </div>
           
           <div className="mt-4">
               <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person (Name)</label>
               <input type="text" value={formData.contactPersons[0]?.name || ''} onChange={(e) => setFormData({...formData, contactPersons: [{...formData.contactPersons[0], name: e.target.value}]})} className="w-full px-3 py-2 border rounded-lg" placeholder="Mr. Name / Mr. Other" />
           </div>
        </div>

        {/* Services Table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Services / Items</h2>
             <button type="button" onClick={addServiceRow} className="text-sm px-3 py-1.5 bg-primary-50 text-primary-700 font-bold rounded-lg flex items-center gap-1 hover:bg-primary-100"><Plus size={16}/> Add Row</button>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                 <thead className="bg-gray-50 border-b">
                    <tr>
                       <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Sr.</th>
                       <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-1/3">Description</th>
                       {type === 'training' && <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Level</th>}
                       <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-24">SAC Code</th>
                       <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-20">Qty</th>
                       <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-24">Unit</th>
                       <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-28">Price</th>
                       <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 w-32">Amount</th>
                       <th className="px-3 py-2 w-10"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {formData.services.map((row: any, i: number) => (
                       <tr key={i}>
                          <td className="px-2 py-2"><input type="number" value={row.srNo} onChange={e => handleServiceChange(i, 'srNo', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></td>
                          <td className="px-2 py-2"><input type="text" value={row.description} onChange={e => handleServiceChange(i, 'description', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" placeholder="Description of service..." /></td>
                          {type === 'training' && <td className="px-2 py-2">
                             <select value={row.level} onChange={e => handleServiceChange(i, 'level', e.target.value)} className="w-full px-2 py-1 border rounded text-xs">
                               <option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="NA">NA</option><option value="CUSTOM">CUSTOM</option>
                             </select>
                          </td>}
                          <td className="px-2 py-2"><input type="text" value={row.sacCode} onChange={e => handleServiceChange(i, 'sacCode', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></td>
                          <td className="px-2 py-2"><input type="number" value={row.quantity} onChange={e => handleServiceChange(i, 'quantity', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></td>
                          <td className="px-2 py-2"><input type="text" value={row.unit} onChange={e => handleServiceChange(i, 'unit', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></td>
                          <td className="px-2 py-2"><input type="number" value={row.price} onChange={e => handleServiceChange(i, 'price', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></td>
                          <td className="px-2 py-2"><input readOnly type="number" value={row.amount} className="w-full px-2 py-1 border rounded text-xs bg-gray-50 font-bold" /></td>
                          <td className="px-2 py-2 text-center">
                             <button type="button" onClick={() => removeServiceRow(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
              {formData.services.length === 0 && <p className="text-center text-gray-400 py-4 text-sm font-medium">No services added yet.</p>}
           </div>
        </div>

        {/* Extra Charges / Training Config */}
        {type === 'service' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Extra Charges (Flat Amounts)</h2>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Transportation</label>
                  <input type="number" value={formData.extraCharges.transportation} onChange={(e) => setFormData({...formData, extraCharges: {...formData.extraCharges, transportation: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lodging</label>
                  <input type="number" value={formData.extraCharges.lodging} onChange={(e) => setFormData({...formData, extraCharges: {...formData.extraCharges, lodging: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Boarding</label>
                  <input type="number" value={formData.extraCharges.boarding} onChange={(e) => setFormData({...formData, extraCharges: {...formData.extraCharges, boarding: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Minimum Visit</label>
                  <input type="number" value={formData.extraCharges.minimumVisit} onChange={(e) => setFormData({...formData, extraCharges: {...formData.extraCharges, minimumVisit: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
             </div>
          </div>
        )}

        {type === 'training' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Training Config</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Minimum Candidates required</label>
                  <input type="number" value={formData.trainingDetails.minCandidates} onChange={(e) => setFormData({...formData, trainingDetails: {...formData.trainingDetails, minCandidates: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Training Mode</label>
                  <input type="text" value={formData.trainingDetails.trainingMode} onChange={(e) => setFormData({...formData, trainingDetails: {...formData.trainingDetails, trainingMode: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
             </div>
          </div>
        )}

        {/* GST & Terms */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Terms & Settings</h2>
             <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">GST Percentage (%)</label>
                  <input type="number" value={formData.gstPercentage} onChange={(e) => setFormData({...formData, gstPercentage: e.target.value})} className="w-1/4 px-3 py-2 border rounded-lg" />
             </div>
             
             <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Terms</label>
             <input type="text" value={formData.termsAndConditions.paymentTerms} onChange={(e) => setFormData({...formData, termsAndConditions: {...formData.termsAndConditions, paymentTerms: e.target.value}})} className="w-full px-3 py-2 border rounded-lg mb-4" />

             {type === 'service' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Material Handling</label>
                    <input type="text" value={formData.termsAndConditions.materialHandling} onChange={(e) => setFormData({...formData, termsAndConditions: {...formData.termsAndConditions, materialHandling: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">NDE Level II personnel</label>
                    <input type="text" value={formData.termsAndConditions.personnel} onChange={(e) => setFormData({...formData, termsAndConditions: {...formData.termsAndConditions, personnel: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Machines</label>
                    <input type="text" value={formData.termsAndConditions.machines} onChange={(e) => setFormData({...formData, termsAndConditions: {...formData.termsAndConditions, machines: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Consumables</label>
                    <input type="text" value={formData.termsAndConditions.consumables} onChange={(e) => setFormData({...formData, termsAndConditions: {...formData.termsAndConditions, consumables: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
               </div>
             )}
        </div>

        {/* Signature Box */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Signature / Preparation Details</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Prepared By (Name)</label>
                <input type="text" value={formData.preparedBy.name} onChange={(e) => setFormData({...formData, preparedBy: {...formData.preparedBy, name: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
                <input type="text" value={formData.preparedBy.designation} onChange={(e) => setFormData({...formData, preparedBy: {...formData.preparedBy, designation: e.target.value}})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
           </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
           <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between items-center text-gray-600">
                 <span className="text-sm font-semibold">Subtotal</span>
                 <span className="font-bold">₹ {totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                 <span className="text-sm font-semibold">GST ({formData.gstPercentage}%)</span>
                 <span className="font-bold text-blue-600">₹ {totals.gstAmount.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t-2 border-gray-100 flex justify-between items-center text-gray-900">
                 <span className="text-lg font-bold">Total Amount</span>
                 <span className="text-2xl font-black text-primary-600 font-mono">₹ {totals.totalAmount.toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* Footer actions */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-white border-t border-gray-200 shadow-xl z-10 flex justify-end gap-3 rounded-none lg:rounded-bl-[2rem] transition-all">
          <button type="button" onClick={() => navigate('/admin/quotations')} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-2">
            <Ban size={18} /> Cancel
          </button>
          <button type="submit" disabled={isLoading} className="px-8 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50">
            <Save size={18} /> {isEditing ? 'Save Changes' : 'Create Quotation'}
          </button>
        </div>

      </form>
    </div>
  );
};
