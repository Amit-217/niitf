import api from './axios';

export const createInvoice = (data: any) => {
    return api.post('/invoices', data);
};

export const getAllInvoices = (params?: { customerId?: string; status?: string; limit?: number; page?: number; search?: string }) => {
    return api.get('/invoices', { params });
};

export const getInvoiceById = (id: string) => {
    return api.get(`/invoices/${id}`);
};

export const updateInvoice = (id: string, data: any) => {
    return api.put(`/invoices/${id}`, data);
};

export const deleteInvoice = (id: string) => {
    return api.delete(`/invoices/${id}`);
};
