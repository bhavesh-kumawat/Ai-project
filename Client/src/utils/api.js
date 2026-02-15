import axios from 'axios';

const clientBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBaseUrl = clientBaseUrl.endsWith('/')
    ? `${clientBaseUrl}api`
    : `${clientBaseUrl}/api`;

const api = axios.create({
    baseURL: normalizedBaseUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let refreshPromise = null;

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        
        if(token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config || {};
        const message = error?.response?.data?.message || "";
        const status = error?.response?.status;
        const isAuthError = status === 401 && (
            message.includes("Invalid or expired token") ||
            message.includes("Token has expired") ||
            message.includes("Unauthorized")
        );

        if (!isAuthError || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = api.post("/auth/refresh");
            }

            const refreshRes = await refreshPromise;
            const newAccessToken = refreshRes?.data?.data?.accessToken;

            if (!newAccessToken) {
                throw new Error("No access token returned on refresh");
            }

            localStorage.setItem("token", newAccessToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    }
);

export default api;
