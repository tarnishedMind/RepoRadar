import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./_components/providers";
import { SiteHeader } from "./_components/site-header";
import { siteUrl } from "@/shared/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Turns relative URLs in metadata (like generated OG images) into absolute ones.
  metadataBase: siteUrl,
  title: {
    default: "RepoRadar",
    template: "%s · RepoRadar",
  },
  description: "Explore GitHub repositories, developers and what's trending.",
  openGraph: { siteName: "RepoRadar", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions often add attributes to <html> before React hydrates.
    // This only silences mismatches on this element's own attributes, not its children.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
