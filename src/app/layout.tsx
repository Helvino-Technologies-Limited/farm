import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { CookieConsentBanner } from "@/components/marketing/cookie-consent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "Avepo Smart Farm";
const DESCRIPTION =
  "Order poultry, seedlings, crops, dairy and farm services online from Avepo Smart Farm in Kenya — book, pay by M-Pesa, and get your receipt. Full farm operations, sales and finance management for staff.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Order Farm Products & Services Online`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "Avepo Smart Farm", "farm products Kenya", "buy chicken online Kenya", "poultry Kenya",
    "seedlings Kenya", "farm management system", "drip irrigation Kenya", "M-Pesa farm produce",
    "Kienyeji chicken", "farm booking online",
  ],
  authors: [{ name: "Helvino Technologies LTD" }],
  manifest: "/manifest.json",
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, statusBarStyle: "default", title: SITE_NAME },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Order Farm Products & Services Online`,
    description: DESCRIPTION,
    url: "/",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Order Farm Products & Services Online`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f5a300",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
          <ServiceWorkerRegister />
          <CookieConsentBanner />
        </TooltipProvider>
      </body>
    </html>
  );
}
