import api from './axios';

export const getEnquiries = (params?: any) => api.get('/enquiries', { params });
