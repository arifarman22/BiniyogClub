import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { QueryProvider } from "@/components/shared/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "Biniyog Club — Agricultural Investment Platform",
    template: "%s | Biniyog Club",
  },
  description:
    "Invest in verified agricultural projects. Connect with farmers, track farm performance, and earn returns from Bangladesh's growing agri-economy.",
  keywords: [
    "agricultural investment",
    "farm investment Bangladesh",
    "agritech fintech",
    "crop investment",
    "biniyog club",
    "কৃষি বিনিয়োগ",
  ],
  authors: [{ name: "Biniyog Club", url: APP_URL }],
  creator: "Biniyog Club Ltd.",
  publisher: "Biniyog Club Ltd.",
  metadataBase: new URL(APP_URL),
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/Biniyog Club Logo Icon PNG.png",
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "Biniyog Club",
    url: APP_URL,
    title: "Biniyog Club — Agricultural Investment Platform",
    description:
      "Invest in verified agricultural projects. Connect with farmers, track farm performance, and earn returns from Bangladesh's growing agri-economy.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Biniyog Club — Agricultural Investment Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Biniyog Club — Agricultural Investment Platform",
    description: "Invest in verified agricultural projects across Bangladesh.",
    images: ["/og-default.png"],
    creator: "@biniyogclub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0d1117" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nunitoSans.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <QueryProvider>
          <TooltipProvider delay={300}>
            <Toaster>
              {children}
            </Toaster>
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
