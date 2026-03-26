import axiosInstance from './axiosInstance';

/**
 * Authentication Service
 * Handles all auth-related API calls
 */
const authService = {
  /**
   * Login user
   * @param {Object} credentials { email, password }
   */
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/admin/login', credentials);
    return response.data;
  },

  /**
   * Register user
   * @param {Object} userData { name, email, password }
   */
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/admin/register', userData);
    return response.data;
  },

  /**
   * Logout user
   * Clears the HttpOnly cookie on the backend
   */
  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  /**
   * Update admin profile
   * @param {Object} userData { user_name, email, phone_number, profile_pic }
   */
  updateProfile: async (userData) => {
    const response = await axiosInstance.patch('/auth/admin/profile', userData);
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async () => {
    // Assuming there's a /me or /profile endpoint or the login returns the user
    // The requirement mentions 'useAuthUser' hook.
    // If the backend doesn't have a /me, we might need to adjust.
    // Let's assume /auth/me exists or backend returns user data on session check.
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
};

export default authService;
