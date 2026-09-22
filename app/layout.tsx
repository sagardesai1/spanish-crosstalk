import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const siteTitle = "Spanish Crosstalk";
const siteDescription =
  "Practice Spanish through daily Crosstalk conversation. Speak English, hear natural Spanish back from a local AI partner — built for beginners.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:43123"),
  title: {
    default: `${siteTitle} — Practice Spanish by Talking`,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  keywords: [
    "practice Spanish",
    "Crosstalk Spanish",
    "Spanish conversation practice",
    "learn Spanish by speaking",
    "A1 Spanish",
    "AI Spanish tutor",
  ],
  openGraph: {
    title: `${siteTitle} — Practice Spanish by Talking`,
    description: siteDescription,
    type: "website",
    locale: "en_US",
    siteName: siteTitle,
    images: [
      {
        url: "/images/valencia-hero.jpg",
        width: 1280,
        height: 960,
        alt: "Plaza de la Virgen in Valencia, Spain",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteTitle} — Practice Spanish by Talking`,
    description: siteDescription,
    images: ["/images/valencia-hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
