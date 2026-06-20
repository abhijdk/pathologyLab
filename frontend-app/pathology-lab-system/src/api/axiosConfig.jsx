import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Adjust to your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 👇 ADDED: Don't trigger the automatic logout if the user is ALREADY trying to log in
    const isLoginRequest = error.config.url.includes('/auth/login');
    
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;