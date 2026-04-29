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
        // Only redirect if not already on login page or attempting to login
        const isLoginRequest = error.config && error.config.url && error.config.url.endsWith('/auth/login');
        const isLoginPage = window.location.pathname === '/login';

        if (error.response && error.response.status === 401 && !isLoginRequest && !isLoginPage) {
            console.error('Unauthorized access. Redirecting to login.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
