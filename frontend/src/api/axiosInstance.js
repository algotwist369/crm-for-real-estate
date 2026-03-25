import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle global errors (like 401)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error is 401 (Unauthorized), we might want to trigger a logout
    // this will be handled in conjunction with AuthContext/React Query
    if (error.response?.status === 401) {
      console.warn('Unauthorized access detected, redirecting or logging out...');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
