import { useLocation, useNavigate, useParams, useSearchParams as useRouterSearchParams } from "react-router-dom";

/** Imperative navigation: push, replace and back. */
export const useRouter = () => {
  const navigate = useNavigate();
  return {
    push: (path) => navigate(path),
    replace: (path) => navigate(path, { replace: true }),
    back: () => navigate(-1),
  };
};

export const usePathname = () => useLocation().pathname;

/** Read-only URLSearchParams for the current URL. */
export const useSearchParams = () => useRouterSearchParams()[0];

export { useParams };
