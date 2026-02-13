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

export default api;
