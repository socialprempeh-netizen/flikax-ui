import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import { JsonLd } from "@/components/seo/json-ld";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { MessagesModalProvider } from "@/components/messages/messages-modal-provider";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const baloo2 = Baloo_2({
  variable: "--font-baloo-2",
  subsets: ["latin"],
});

const SITE_URL = getSiteUrl();

const DEFAULT_TITLE = "Flikax";
const DEFAULT_DESCRIPTION = "Buy and sell anything in Ghana — free classifieds.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    siteName: "Flikax",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

// Explicit (rather than relying on Next.js's own default, which is the same
// values anyway) so pinch-to-zoom staying enabled is a deliberate,
// grep-able decision here -- no maximumScale/userScalable, both of which
// would defeat zoom for low-vision users on the mobile-first majority of
// this site's traffic.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Flikax",
  url: SITE_URL,
  logo: `${SITE_URL}/flikax-logo.svg`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${baloo2.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <JsonLd data={organizationJsonLd} />
          <AuthModalProvider>
            <MessagesModalProvider>{children}</MessagesModalProvider>
          </AuthModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
