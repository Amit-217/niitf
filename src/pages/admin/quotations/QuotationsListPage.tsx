import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Pencil, Eye, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAllTrainingQuotations, getAllServiceQuotations, deleteTrainingQuotation, deleteServiceQuotation } from '../../../api/quotationApi';
import { getCustomers } from '../../../api/customerApi';
import { Breadcrumbs } from '../../../components/Breadcrumbs';

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, TRAINING, SERVICE

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [trainRes, servRes, custRes] = await Promise.all([
        getAllTrainingQuotations(),
        getAllServiceQuotations(),
        getCustomers(),
      ]);

      const tData = (trainRes.data?.data || trainRes.data || []).map((q: any) => ({ ...q, _type: 'training' }));
      const sData = (servRes.data?.data || servRes.data || []).map((q: any) => ({ ...q, _type: 'service' }));
      
      const combined = [...tData, ...sData].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setQuotations(combined);
      setCustomers(custRes.data?.data || custRes.data || []);
    } catch (err) {
      toast.error('Failed to fetch quotations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCustomerName = (id: string) => {
    const cust = customers.find(c => c._id === id);
    return cust ? cust.companyName : 'Unknown Customer';
  };

  const handleDelete = async (id: string, type: string) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      if (type === 'training') await deleteTrainingQuotation(id);
      else await deleteServiceQuotation(id);
      
      toast.success('Quotation deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete quotation');
    }
  };

  const filteredData = quotations
    .filter(q => filterType === 'ALL' || q._type.toUpperCase() === filterType)
    .filter(q => 
        (q.quotationNo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        getCustomerName(q.customerId).toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-6">
      <Breadcrumbs />
      
      <div className="mt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/admin/quotations/service/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
          >
            <Plus size={18} /> New Service Quote
          </button>
          <button 
            onClick={() => navigate('/admin/quotations/training/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium shadow-sm"
          >
            <Plus size={18} /> New Training Quote
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by quote no or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
             <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${filterType === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >All</button>
             <button
                onClick={() => setFilterType('SERVICE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${filterType === 'SERVICE' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >Service</button>
             <button
                onClick={() => setFilterType('TRAINING')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${filterType === 'TRAINING' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >Training</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 pl-12 text-center text-gray-500 font-medium">Loading Quotations...</div>
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <FileText className="text-gray-400" size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Quotations Found</h3>
              <p className="text-gray-500 text-sm mt-1">Get started by creating a new quotation.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Quote No.</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredData.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {q.quotationNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {q.date ? new Date(q.date).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center px-2 py-1 space-x-1 rounded-md text-xs font-bold ${q._type === 'training' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                          <span>{q._type === 'training' ? 'Training' : 'Service'}</span>
                       </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {getCustomerName(q.customerId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ₹{(q.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/reports/quotations/${q._type}/${q._id}/print`)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/quotations/${q._type}/${q._id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(q._id, q._type)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
