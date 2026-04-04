import axios, { AxiosRequestConfig } from 'axios';

// ─── Create axios instance ────────────────────────────────────────────────────
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Token helpers ────────────────────────────────────────────────────────────
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
};

const clearSession = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
};

const redirectToLogin = () => {
    const loginRoute = window.location.pathname.startsWith('/student')
        ? '/student/login'
        : '/login';

    if (window.location.pathname !== loginRoute) {
        window.location.href = loginRoute;
    }
};

// ─── Refresh-token state ──────────────────────────────────────────────────────
// Queue of requests that failed while we were refreshing, so we can retry them.
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (reason: any) => void;
}> = [];

/**
 * Resolves or rejects all queued requests once a refresh attempt completes.
 */
const processQueue = (error: any, token: string | null) => {
    failedQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token!);
        }
    });
    failedQueue = [];
};

// ─── Request interceptor — attach access token ────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response interceptor — silent refresh on 401 ────────────────────────────
api.interceptors.response.use(
    // ✅  Happy path — unwrap .data so callers get the body directly
    (response) => response.data,

    // ❌  Error path
    async (error) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Only attempt refresh when:
        //  1. The server returned 401 (Unauthorized)
        //  2. We haven't already retried this request
        //  3. There IS a refresh token stored
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            getRefreshToken()
        ) {
            // If another refresh is already in progress, queue this request.
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(newToken => {
                        if (originalRequest.headers) {
                            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        } else {
                            originalRequest.headers = { Authorization: `Bearer ${newToken}` };
                        }
                        return api(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            // Mark this request as retried so we don't loop
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // ── Call the refresh endpoint ────────────────────────────────
                const refreshResponse = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/refresh`,
                    { refreshToken: getRefreshToken() },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                // Backend returns { success, data: { accessToken, refreshToken } }
                const { accessToken, refreshToken } = refreshResponse.data?.data ?? refreshResponse.data;

                // Persist new tokens
                saveTokens(accessToken, refreshToken);

                // Retry all queued requests with the new token
                processQueue(null, accessToken);

                // Retry the original request
                if (originalRequest.headers) {
                    originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                } else {
                    originalRequest.headers = { Authorization: `Bearer ${accessToken}` };
                }

                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed — session is dead, log the user out
                processQueue(refreshError, null);
                clearSession();
                redirectToLogin();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // For all other errors, reject with the response body
        return Promise.reject(error.response?.data || error);
    }
);

export default api;
