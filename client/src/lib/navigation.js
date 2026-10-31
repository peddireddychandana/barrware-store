import { useNavigate as useRouterNavigate } from "react-router-dom";

/**
 * Router-agnostic navigate: accepts a path string or `{ to }`.
 */
export const useNavigate = () => {
  const navigate = useRouterNavigate();
  return (target) => navigate(typeof target === "string" ? target : target.to);
};
