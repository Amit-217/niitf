import api from './axios';

export interface NewInvoiceTaxDetail {
  rate: number;
  amount: number;
}

export interface NewInvoiceBankDetails {
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
}

export interface NewInvoiceLineItem {
  srNo?: number;
  description: string;
  hsnSac?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface NewInvoicePayload {
  customerId: string;
  quotationId?: string | null;
  date?: string;
  dueDate?: string | null;
  subject?: string | null;
  deliveryNote?: string | null;
  deliveryNoteDate?: string | null;
  supplierRef?: string | null;
  otherReferences?: string | null;
  buyerOrderNo?: string | null;
  buyerOrderDate?: string | null;
  documentNo?: string | null;
  dispatchedThrough?: string | null;
  destination?: string | null;
  termsOfDelivery?: string | null;
  items: NewInvoiceLineItem[];
  subtotal: number;
  discount?: number;
  cgst?: NewInvoiceTaxDetail;
  sgst?: NewInvoiceTaxDetail;
  igst?: NewInvoiceTaxDetail;
  transportationCharges?: number;
  roundedOff?: number;
  totalAmount: number;
  grandTotal?: number;
  paidAmount?: number;
  status?: 'Draft' | 'Final';
  paymentMode?: string | null;
  bankDetails?: NewInvoiceBankDetails;
  notes?: string | null;
  amountInWords?: string;
  taxAmountInWords?: string;
  showTotalAmounts?: boolean;
}

export interface NewInvoice {
  _id: string;
  invoiceNo: string;
  customerId: string | { _id: string; companyName: string; contactPerson: string; mobile: string; email?: string; address?: string; city?: string; state?: string; stateCode?: string; gstNo?: string };
  quotationId?: { _id: string; quotationNo: string } | null;
  date: string;
  dueDate?: string;
  subject?: string;
  deliveryNote?: string;
  deliveryNoteDate?: string;
  supplierRef?: string;
  otherReferences?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
  documentNo?: string;
  dispatchedThrough?: string;
  destination?: string;
  termsOfDelivery?: string;
  items: NewInvoiceLineItem[];
  subtotal: number;
  discount: number;
  cgst: NewInvoiceTaxDetail;
  sgst: NewInvoiceTaxDetail;
  igst: NewInvoiceTaxDetail;
  transportationCharges: number;
  roundedOff: number;
  totalAmount: number;
  grandTotal: number;
  paidAmount: number;
  balance?: number;
  status: 'Draft' | 'Final';
  paymentMode?: string;
  bankDetails?: NewInvoiceBankDetails;
  notes?: string;
  amountInWords?: string;
  taxAmountInWords?: string;
  showTotalAmounts?: boolean;
  createdAt: string;
}

export interface NewInvoicesListResponse {
  success: boolean;
  message: string;
  data: NewInvoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NewInvoiceResponse {
  success: boolean;
  message: string;
  data: NewInvoice;
}

export const createNewInvoice = (data: NewInvoicePayload) => {
    return api.post('/new-invoices', data);
};

export const getAllNewInvoices = (params?: { customerId?: string; status?: string; limit?: number; page?: number; search?: string; financialYear?: string }) => {
    return api.get('/new-invoices', { params });
};

export const getNewInvoiceById = (id: string) => {
    return api.get(`/new-invoices/${id}`);
};

export const updateNewInvoice = (id: string, data: Partial<NewInvoicePayload>) => {
    return api.put(`/new-invoices/${id}`, data);
};

export const deleteNewInvoice = (id: string) => {
    return api.delete(`/new-invoices/${id}`);
};
