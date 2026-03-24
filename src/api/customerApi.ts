import api from './axios';

// ─── Customer Types ───────────────────────────────────────────────────────────

export interface CustomerPayload {
  companyName: string;
  contactPerson: string;
  mobile: string;
  email?: string | null;
  city?: string | null;
  address?: string | null;
  gstNo?: string | null;
}

export interface Customer {
  _id: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  email?: string;
  city?: string;
  address?: string;
  gstNo?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Quotation / Invoice shared ───────────────────────────────────────────────

export interface LineItem {
  srNo?: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

// ─── Quotation Types ──────────────────────────────────────────────────────────

export interface QuotationPayload {
  customerId: string;
  date?: string;
  validTill?: string | null;
  subject?: string | null;
  items: LineItem[];
  subtotal: number;
  discount?: number;
  taxPercent?: number;
  taxAmount?: number;
  totalAmount: number;
  status?: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  notes?: string | null;
}

export interface Quotation {
  _id: string;
  quotationNo: string;
  customerId: Customer | string;
  date: string;
  validTill?: string;
  subject?: string;
  items: LineItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  notes?: string;
  createdAt: string;
}

// ─── Invoice Types ────────────────────────────────────────────────────────────

export interface InvoicePayload {
  customerId: string;
  quotationId?: string | null;
  date?: string;
  dueDate?: string | null;
  subject?: string | null;
  items: LineItem[];
  subtotal: number;
  discount?: number;
  taxPercent?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  status?: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Cancelled';
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | null;
  notes?: string | null;
}

export interface Invoice {
  _id: string;
  invoiceNo: string;
  customerId: Customer | string;
  quotationId?: { _id: string; quotationNo: string } | null;
  date: string;
  dueDate?: string;
  subject?: string;
  items: LineItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance?: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Cancelled';
  paymentMode?: string;
  notes?: string;
  createdAt: string;
}

// ─── Customer API Functions ───────────────────────────────────────────────────

export const getCustomers = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/customers', { params });

export const getCustomerById = (id: string) =>
  api.get(`/customers/${id}`);

export const createCustomer = (data: CustomerPayload) =>
  api.post('/customers', data);

export const updateCustomer = (id: string, data: Partial<CustomerPayload>) =>
  api.put(`/customers/${id}`, data);

export const deleteCustomer = (id: string) =>
  api.delete(`/customers/${id}`);

// ─── Quotation API Functions ──────────────────────────────────────────────────

export const getQuotations = (params?: { customerId?: string; page?: number; limit?: number; status?: string }) =>
  api.get('/quotations', { params });

export const createQuotation = (data: QuotationPayload) =>
  api.post('/quotations', data);

export const updateQuotation = (id: string, data: Partial<QuotationPayload>) =>
  api.put(`/quotations/${id}`, data);

export const deleteQuotation = (id: string) =>
  api.delete(`/quotations/${id}`);

// ─── Invoice API Functions ────────────────────────────────────────────────────

export const getInvoices = (params?: { customerId?: string; page?: number; limit?: number; status?: string }) =>
  api.get('/invoices', { params });

export const createInvoice = (data: InvoicePayload) =>
  api.post('/invoices', data);

export const updateInvoice = (id: string, data: Partial<InvoicePayload>) =>
  api.put(`/invoices/${id}`, data);

export const deleteInvoice = (id: string) =>
  api.delete(`/invoices/${id}`);

// ─── MPT Report Types ─────────────────────────────────────────────────────────

export interface MPTObservation {
  srNo: number;
  jobDescription: string;
  drawingOrJointNo: string;
  size: string;
  quantity: number;
  evaluation: string;
  result: string;
  remark: string;
}

export interface MPTInspector {
  name: string;
  qualification: string;
  designation: string;
  signature: string;
  idNo: string;
  date?: string;
}

export interface MPTReportPayload {
  customerId: string;
  reportNo: string;
  status?: 'draft' | 'final';
  jobDetails?: {
    customer?: string;
    client?: string;
    reportDate?: string;
    inspectionDate?: string;
    referenceStd?: string;
    acceptanceCriteria?: string;
    inspectionTime?: string;
    stageOfInspection?: string;
    material?: string;
    extentOfExamination?: string;
    thickness?: string;
    typeOfJoint?: string;
    surfaceCondition?: string;
    weldingProcess?: string;
  };
  equipmentDetails?: {
    equipmentType?: string;
    srNo?: string;
    make?: string;
    calibrationDue?: string;
    yokeSpacing?: string;
    pieGaugeCalibration?: string;
  };
  mediumDetails?: {
    blackInk?: { manufacturer?: string; batchNo?: string; expiryDate?: string };
    whiteContrast?: { manufacturer?: string; batchNo?: string; expiryDate?: string };
  };
  methodDescription?: {
    method?: string;
    lightIntensity?: string;
    magnetizationType?: string;
    lightEquipmentUsed?: string;
    magnetizingMethod?: string;
    bathConcentration?: string;
    demagnetization?: string;
    magneticFieldDirectionVerifiedBy?: string;
    gaussMeterReading?: string;
    current?: string;
    currentType?: string;
    postCleaning?: string;
  };
  observations?: MPTObservation[];
  finalSection?: {
    examinedBy?: string;
    customer?: { name?: string; signature?: string; idNo?: string; date?: string };
    clientOrTPI?: { name?: string; signature?: string; idNo?: string; date?: string };
    inspector?: MPTInspector[];
  };
}

export interface MPTReport extends MPTReportPayload {
  _id: string;
  reportType: string;
  createdAt: string;
}

// ─── Report API Functions ─────────────────────────────────────────────────────

export const getMPTReports = (params?: { customerId?: string; page?: number; limit?: number }) =>
  api.get('/reports/mpt', { params });

export const getMPTReportById = (id: string) =>
  api.get(`/reports/mpt/${id}`);

export const createMPTReport = (data: MPTReportPayload) =>
  api.post('/reports/mpt', data);

export const updateMPTReport = (id: string, data: Partial<MPTReportPayload>) =>
  api.put(`/reports/mpt/${id}`, data);

export const deleteMPTReport = (id: string) =>
  api.delete(`/reports/mpt/${id}`);

export const getPTReports = (params?: { customerId?: string; page?: number; limit?: number }) =>
  api.get('/reports/pt', { params });

export const getUTReports = (params?: { customerId?: string; page?: number; limit?: number }) =>
  api.get('/reports/ut', { params });

export const getVSSCUTReports = (params?: { customerId?: string; page?: number; limit?: number }) =>
  api.get('/reports/vssc-ut', { params });
