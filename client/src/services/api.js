import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

/**
 * Reads the server's `{ success: false, message }` envelope into a plain Error message.
 *
 * @param {unknown} error
 * @returns {string}
 */
export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

export default api;
