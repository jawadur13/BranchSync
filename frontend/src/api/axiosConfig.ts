import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: Attach JWT token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('Unauthorized access. Clearing local storage and redirecting to login.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login'; // Force redirect to login page
        }
        return Promise.reject(error);
    }
);

export default api;
