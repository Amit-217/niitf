import api from './axios';

// ── TRAINING QUOTATIONS ──

export const createTrainingQuotation = (data: any) => {
    return api.post('/quotations/training', data);
};

export const getAllTrainingQuotations = () => {
    return api.get('/quotations/training');
};

export const getTrainingQuotationById = (id: string) => {
    return api.get(`/quotations/training/${id}`);
};

export const updateTrainingQuotation = (id: string, data: any) => {
    return api.patch(`/quotations/training/${id}`, data);
};

export const deleteTrainingQuotation = (id: string) => {
    return api.delete(`/quotations/training/${id}`);
};

// ── SERVICE QUOTATIONS ──

export const createServiceQuotation = (data: any) => {
    return api.post('/quotations/service', data);
};

export const getAllServiceQuotations = () => {
    return api.get('/quotations/service');
};

export const getServiceQuotationById = (id: string) => {
    return api.get(`/quotations/service/${id}`);
};

export const updateServiceQuotation = (id: string, data: any) => {
    return api.patch(`/quotations/service/${id}`, data);
};

export const deleteServiceQuotation = (id: string) => {
    return api.delete(`/quotations/service/${id}`);
};
