import { Helmet } from "react-helmet-async";
import { absoluteImageUrl, absoluteUrl, truncate } from "@/lib/seo";
import { siteConfig } from "@/utils/siteConfig";

const BRAND = siteConfig.brandName;
const SITE_NAME = `${BRAND} Fine Barware`;
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

const productJsonLd = (product, url, image) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  image: (product.images?.length ? product.images : [image]).map((src) =>
    absoluteImageUrl(src, 1200),
  ),
  description: product.description || product.shortDescription || undefined,
  sku: product.sku || undefined,
  brand: { "@type": "Brand", name: BRAND },
  category: product.category || undefined,
  url,
  offers: {
    "@type": "Offer",
    url,
    priceCurrency: "INR",
    price: Number(product.price),
    availability:
      product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization", name: BRAND },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: 79,
        currency: "INR",
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "IN",
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          "@type": "QuantitativeValue",
          minValue: 1,
          maxValue: 2,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: 3,
          maxValue: 7,
          unitCode: "DAY",
        },
      },
    },
  },
  ...(product.numReviews > 0 && product.rating > 0
    ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(product.rating).toFixed(1),
          reviewCount: product.numReviews,
          bestRating: 5,
          worstRating: 1,
        },
      }
    : {}),
});

const organizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND,
  legalName: siteConfig.company.legalName,
  url: siteConfig.url,
  logo: absoluteImageUrl("/logo.png", 512),
  email: siteConfig.contact.email,
  telephone: siteConfig.contact.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.contact.address,
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    areaServed: "IN",
    availableLanguage: ["en", "hi"],
  },
});

const breadcrumbJsonLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

const faqJsonLd = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
});

const SEOHead = ({
  title,
  description,
  path = "/",
  image,
  type = "website",
  product,
  category,
  faqs,
  breadcrumbs,
  noIndex = false,
}) => {
  let pageTitle = title;
  let pageDescription = description;
  let canonicalPath = path;
  let pageImage = image;
  let pageFaqs = faqs;

  if (product) {
    pageTitle =
      product.seo?.metaTitle ||
      product.metaTitle ||
      `${product.name} | ${SITE_NAME}`;
    pageDescription =
      product.seo?.metaDescription ||
      product.metaDescription ||
      product.shortDescription ||
      product.description;
    canonicalPath =
      path || `/products/${product.seo?.slug || product.slug}`;
    pageImage = image || product.images?.[0];
    pageFaqs = faqs ?? product.faqs;
  }

  if (category) {
    pageTitle =
      category.seo?.metaTitle ||
      category.metaTitle ||
      `${category.name} | ${SITE_NAME}`;
    pageDescription =
      category.seo?.metaDescription ||
      category.metaDescription ||
      category.description ||
      siteConfig.description;
    canonicalPath =
      path || `/category/${category.seo?.slug || category.slug}`;
    pageImage = image || category.image;
    pageFaqs = faqs ?? category.faqs;
  }

  const finalTitle = truncate(
    pageTitle || `${BRAND} | Online Barware Store — Elevate Every Pour`,
    65,
  );
  const finalDescription = truncate(
    pageDescription || siteConfig.description,
    160,
  );
  const canonical = absoluteUrl(canonicalPath);
  const imageUrl = absoluteImageUrl(pageImage || "/logo.png", 1200);
  const gscCode = import.meta.env.VITE_GSC_VERIFICATION_CODE;
  const structuredData = [organizationJsonLd()];

  if (breadcrumbs?.length) structuredData.push(breadcrumbJsonLd(breadcrumbs));
  if (product) structuredData.push(productJsonLd(product, canonical, imageUrl));
  if (pageFaqs?.length) structuredData.push(faqJsonLd(pageFaqs));

  return (
    <Helmet>
      <html lang="en" />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta
        name="robots"
        content={noIndex ? "noindex,nofollow" : "index,follow"}
      />
      {gscCode && <meta name="google-site-verification" content={gscCode} />}
      <meta name="theme-color" content="#0B0908" />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={finalTitle} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {product && (
        <>
          <meta property="product:price:amount" content={String(product.price)} />
          <meta property="product:price:currency" content="INR" />
        </>
      )}

      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {json(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
