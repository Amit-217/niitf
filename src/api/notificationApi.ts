import api from './axios';

export const getMyNotifications = (params?: { unread?: boolean; limit?: number }) =>
    api.get('/notifications', { params });

export const markNotificationRead = (id: string) =>
    api.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
    api.patch('/notifications/read-all');
