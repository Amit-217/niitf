import axios from 'axios';

// Unauthenticated axios instance for public report endpoints
const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Unwrap response.data just like the main api instance
publicApi.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error.response?.data || error)
);

export default publicApi;
