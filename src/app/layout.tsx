import "./globals.css";

import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

import { CleanupOldLeagueMarks } from "@/components/cleanup-old-league-marks";
import { DataTableStateProvider } from "@/components/data-table/data-table-state-context";
import { ErrorHandler } from "@/components/error-handler";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BASE_URL, DESCRIPTION, TITLE } from "@/lib/constants";
import {
  GITHUB_AUTHOR_NAME,
  GITHUB_AUTHOR_TWITTER,
  GITHUB_AUTHOR_URL,
} from "@/lib/github";
import { DEFAULT_LEAGUE } from "@/lib/leagues";

export const metadata: Metadata = {
  title: {
    template: `%s | ${TITLE}`,
    default: TITLE,
  },
  metadataBase: new URL(BASE_URL),
  applicationName: TITLE,
  keywords: [
    "Path of Exile",
    "PoE",
    "Kingsmarch",
    "Thaumaturgic Dust",
    "unique items",
    "trading",
    "disenchant calculator",
    "PoE 3.27",
    "PoE 3.28",
    DEFAULT_LEAGUE[0].toUpperCase() + DEFAULT_LEAGUE.slice(1), // Capitalized league name
  ],
  authors: [{ name: GITHUB_AUTHOR_NAME, url: GITHUB_AUTHOR_URL }],
  creator: GITHUB_AUTHOR_NAME,
  publisher: GITHUB_AUTHOR_NAME,
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
  },
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    images: "/og-image.jpg",
    locale: "en_US",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: "/og-image.jpg",
    creator: `@${GITHUB_AUTHOR_TWITTER}`,
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: "game utility",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <div className="flex min-h-screen flex-col">
          <TooltipProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ErrorHandler />
              <Toaster richColors closeButton={true} />
              <CleanupOldLeagueMarks />
              <DataTableStateProvider>
                <main className="flex min-h-0 flex-1 flex-col">{children}</main>
                <Footer />
              </DataTableStateProvider>
            </ThemeProvider>
          </TooltipProvider>
          <Analytics />
        </div>
      </body>
    </html>
  );
}
