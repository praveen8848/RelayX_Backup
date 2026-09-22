import axios from "axios";

// In production, this uses your .env variable. Locally, it defaults to the Spring Boot port (8080).
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  // 10 second timeout so the UI doesn't hang indefinitely if the backend is down
  timeout: 10000, 
});

// Intercept requests to dynamically attach the active tenant's API key (Phase 11: Projects)
apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem("relayx_active_project_key");
  if (apiKey && config.headers) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});