import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/+$/, "");

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
