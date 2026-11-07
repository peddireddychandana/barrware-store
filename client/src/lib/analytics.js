let initialized = false;
const CONSENT_KEY = "barware-cookie-consent";

export const hasAnalyticsConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
};

export const setAnalyticsConsent = (accepted) => {
  try {
    localStorage.setItem(CONSENT_KEY, accepted ? "accepted" : "declined");
  } catch {
    /* storage unavailable */
  }
  if (accepted) initAnalytics();
};

export const hasConsentChoice = () => {
  try {
    return Boolean(localStorage.getItem(CONSENT_KEY));
  } catch {
    return true;
  }
};

export const initAnalytics = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId || initialized || typeof document === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  initialized = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
};

export const trackEvent = (name, params = {}) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
};

export const trackPageView = (path) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
};
