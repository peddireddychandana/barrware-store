import { siteConfig } from "@/utils/siteConfig";

export const truncate = (value = "", max = 160) => {
  const text = String(value).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
};

export const absoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
};

export const optimizedImage = (url, width = 800) => {
  if (!url || url.startsWith("data:")) return url;
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    return url.replace(
      "/image/upload/",
      `/image/upload/f_auto,q_auto,w_${width}/`,
    );
  }
  return url;
};

export const absoluteImageUrl = (url, width = 1200) =>
  absoluteUrl(optimizedImage(url, width));
