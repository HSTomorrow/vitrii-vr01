import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     process.env.EXPO_PUBLIC_API_URL || 
                     'http://localhost:8080/api';

let authToken: string | null = null;
let userId: number | null = null;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  (config) => {
    if (userId) {
      config.headers['X-User-Id'] = userId.toString();
    }
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      setAuth(null, null);
    }
    
    // Log error details
    console.error('[API Error]', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    
    return Promise.reject(error);
  }
);

/**
 * Set authentication token and user ID for API calls
 */
export const setAuth = (token: string | null, id: number | null) => {
  authToken = token;
  userId = id;
};

/**
 * Get current auth state
 */
export const getAuth = () => ({ token: authToken, userId });

/**
 * Clear authentication
 */
export const clearAuth = () => {
  setAuth(null, null);
};

export default apiClient;
