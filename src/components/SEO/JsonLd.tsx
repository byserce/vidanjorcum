"use client";

import Script from "next/script";

interface JsonLdProps {
  type?: "LocalBusiness" | "Service" | "WebSite";
  data?: any;
}

export default function JsonLd({ type = "WebSite", data }: JsonLdProps) {
  let schema: any = {
    "@context": "https://schema.org",
  };

  if (type === "WebSite") {
    schema = {
      ...schema,
      "@type": "WebSite",
      "name": "Vidanjörcüm",
      "url": "https://vidanjorcum.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://vidanjorcum.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };
  } else if (type === "LocalBusiness") {
    schema = {
      ...schema,
      "@type": "Service",
      "name": data?.name || "Vidanjör ve Kanal Açma Hizmetleri",
      "description": `${data?.city} ${data?.district || ''} bölgesinde profesyonel vidanjör kiralama, foseptik çekimi ve kanal açma hizmetleri.`,
      "provider": {
        "@type": "LocalBusiness",
        "name": "Vidanjörcüm Türkiye",
        "image": "https://vidanjorcum.com/icon.png",
        "priceRange": "₺₺",
        "telephone": "+90",
        "url": "https://vidanjorcum.com",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": data?.district || data?.city,
          "addressRegion": data?.city,
          "addressCountry": "TR"
        }
      },
      "areaServed": {
        "@type": "State",
        "name": data?.city
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "128"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Altyapı Hizmetleri",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Kanal Açma"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Foseptik Tahliyesi"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Logar Temizleme"
            }
          }
        ]
      }
    };
  }

  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
