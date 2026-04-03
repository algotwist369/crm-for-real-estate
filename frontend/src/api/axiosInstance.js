import axios from 'axios';

const pendingRequests = new Map();

const getRequestKey = (config) => {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&');
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to prevent duplicate calls
axiosInstance.interceptors.request.use(
  (config) => {
    const requestKey = getRequestKey(config);
    
    if (pendingRequests.has(requestKey)) {
      const source = axios.CancelToken.source();
      config.cancelToken = source.token;
      source.cancel(`Duplicate request detected: ${requestKey}`);
    } else {
      pendingRequests.set(requestKey, true);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    const requestKey = getRequestKey(response.config);
    pendingRequests.delete(requestKey);
    return response;
  },
  (error) => {
    if (error.config) {
      const requestKey = getRequestKey(error.config);
      pendingRequests.delete(requestKey);
    }

    if (axios.isCancel(error)) {
      console.warn(error.message);
      return new Promise(() => {}); // Return a pending promise to stop further execution
    }

    if (error.response?.status === 401) {
      console.warn('Unauthorized access detected, redirecting or logging out...');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
