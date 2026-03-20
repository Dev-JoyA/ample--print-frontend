import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { carlito, inter } from "../app/ui/fonts";
import { ToastProvider } from "../components/providers/ToastProvider";
import { NotificationProvider } from "../components/providers/NotificationProvider";
import SEOHead from "@/components/common/SEOHead";
import { OrganizationSchema, WebsiteSchema } from "@/components/common/StructuredData";
import { SITE_CONFIG } from "@/lib/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.title,
    template: `%s | ${SITE_CONFIG.name}`
  },
  description: SITE_CONFIG.description,
  keywords: SITE_CONFIG.keywords,
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: SITE_CONFIG.favicon,
    shortcut: SITE_CONFIG.favicon,
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: '/images/og/default-og.jpg',
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: ['/images/og/default-og.jpg'],
    site: SITE_CONFIG.social.twitter,
    creator: SITE_CONFIG.social.twitter,
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
  alternates: {
    canonical: SITE_CONFIG.url,
  },
};

export default function RootLayout({ children }) {
  const structuredData = [OrganizationSchema(), WebsiteSchema()];

  return (
    <html lang="en">
      <head>
        <SEOHead structuredData={structuredData} />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ToastProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}