import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";
import JsonLd from "@/components/SEO/JsonLd";
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vidanjorcum.com"),
  title: {
    default: "Vidanjörcüm - Türkiye'nin En Büyük Vidanjör ve Kanal Açma Platformu",
    template: "%s | Vidanjörcüm"
  },
  description: "Türkiye'nin her yerinde vidanjör, kanal açma, logar temizleme ve foseptik çekimi için en yakın operatörlere anında ulaşın. 7/24 kesintisiz hizmet.",
  keywords: ["vidanjör", "kanal açma", "logar temizleme", "foseptik çekimi", "vidanjör kiralama", "belediye vidanjör", "acil vidanjör", "istanbul vidanjör", "ankara vidanjör", "izmir vidanjör"],
  authors: [{ name: "Vidanjörcüm" }],
  creator: "Vidanjörcüm",
  publisher: "Vidanjörcüm",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Vidanjörcüm - Vidanjör ve Kanal Açma Hizmetleri",
    description: "Tüm Türkiye'de en yakın vidanjör operatörlerine ulaşın.",
    url: "https://vidanjorcum.com",
    siteName: "Vidanjörcüm",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vidanjörcüm - Vidanjör ve Kanal Açma",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vidanjörcüm - Vidanjör ve Kanal Açma Hizmetleri",
    description: "Tüm Türkiye'de en yakın vidanjör operatörlerine ulaşın.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "https://vidanjorcum.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <JsonLd />
          {children}
        </Providers>
      </body>
    </html>
  );
}
