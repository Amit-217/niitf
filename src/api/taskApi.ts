import api from './axios';

// --- Types ---

export interface TaskPayload {
    title: string;
    description: string;
    assignedTo: string[]; // Array of Employee IDs
    startDate: string; // YYYY-MM-DD
    dueDate?: string;  // YYYY-MM-DD
    status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface TaskUpdatePayload {
    date: string; // YYYY-MM-DD
    comment: string;
}

// --- Task Endpoints (Admin) ---

export const createTask = (data: TaskPayload) =>
    api.post('/admin/tasks', data);

export const updateTaskStatus = (id: string, status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED') =>
    api.put(`/admin/tasks/${id}`, { status });

// --- Task Endpoints (Shared) ---

export const getAllTasks = () =>
    api.get('/tasks');

export const getTaskById = (id: string) =>
    api.get(`/tasks/${id}`);

// --- Task Update Endpoints (Employee / Shared) ---

export const submitTaskUpdate = (taskId: string, data: TaskUpdatePayload) =>
    api.post(`/tasks/${taskId}/update`, data);

export const getTaskUpdates = (taskId: string) =>
    api.get(`/tasks/${taskId}/updates`);

export const getEmployeeTaskUpdates = (employeeId: string) =>
    api.get(`/tasks/employee/${employeeId}`);
