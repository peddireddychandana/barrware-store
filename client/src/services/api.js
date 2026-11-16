import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

const TOKEN_KEY = "barware-auth-token";

/** Bearer fallback for mobile browsers that block the cross-site auth cookie. */
export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      String(error.config?.url || "").includes("/auth/me")
    )
      setStoredToken(null);
    return Promise.reject(error);
  },
);

/**
 * Reads the server's `{ success: false, message }` envelope into a plain Error message.
 * Network-level failures (server down, blocked request) get a clearer message.
 *
 * @param {unknown} error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (!error?.response && error?.message)
    return "Cannot reach the store server. Please check your connection and try again.";
  return error?.message || "Something went wrong";
};

export default api;
