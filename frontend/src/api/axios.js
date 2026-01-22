import axios from "axios";

const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://127.0.0.1:8000/api/"
    : "https://sign-lang-ai.up.railway.app/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export default api;
