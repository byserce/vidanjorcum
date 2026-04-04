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
      "serviceType": "Vidanjör ve Kanal Açma Hizmetleri",
      "provider": {
        "@type": "LocalBusiness",
        "name": data?.name || "Vidanjörcüm",
        "image": "https://vidanjorcum.com/icon.png",
        "@id": `https://vidanjorcum.com/#${data?.city || 'turkiye'}`,
        "url": "https://vidanjorcum.com",
        "telephone": "+90",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Merkez",
          "addressLocality": data?.district || "Merkez",
          "addressRegion": data?.city || "Türkiye",
          "postalCode": "34000",
          "addressCountry": "TR"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": data?.lat || 39.9334,
          "longitude": data?.lng || 32.8597
        }
      },
      "areaServed": {
        "@type": "City",
        "name": data?.city || "Türkiye"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Vidanjör Hizmetleri",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Foseptik Temizliği"
            }
          },
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
