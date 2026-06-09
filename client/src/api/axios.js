import axios from "axios";

const normalizeApiBaseUrl = (rawBaseUrl) => {
  const fallbackBaseUrl = "http://localhost:5000/api";
  const trimmedBaseUrl = (rawBaseUrl || fallbackBaseUrl).trim().replace(/\/+$/, "");

  if (!trimmedBaseUrl) {
    return fallbackBaseUrl;
  }

  if (/\/api$/i.test(trimmedBaseUrl)) {
    return trimmedBaseUrl;
  }

  return `${trimmedBaseUrl}/api`;
};

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const authData = localStorage.getItem("eduvantaAuth");

  if (authData) {
    const { token } = JSON.parse(authData);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  const activeInstituteId = localStorage.getItem("activeInstituteId");
  if (activeInstituteId) {
    config.headers["x-institute-id"] = activeInstituteId;
  }

  return config;
});

export default api;
