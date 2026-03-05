import axios from 'axios';

// Configure baseURL para seu backend
const API_BASE_URL = 'https://app.vitrii.com.br/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    // Token será adicionado dinamicamente pelo AuthContext
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido - fazer logout
      console.log('Token inválido ou expirado');
      // Será tratado por um interceptor global se necessário
    }
    return Promise.reject(error);
  }
);

export default api;
