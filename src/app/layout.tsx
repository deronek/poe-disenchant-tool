import "./globals.css";
import { CleanupOldLeagueMarks } from "@/components/cleanup-old-league-marks";
import { DataTableStateProvider } from "@/components/data-table-state-context";
import { Footer } from "@/components/footer";
import { ErrorHandler } from "@/components/error-handler";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { BASE_URL, DESCRIPTION, TITLE } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    template: `%s | ${TITLE}`,
    default: TITLE,
  },
  description: DESCRIPTION,
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
    "PoE 3.26",
  ],
  authors: [{ name: "deronek", url: "https://github.com/deronek" }],
  creator: "deronek",
  publisher: "deronek",
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
    creator: "@deronek",
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
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorHandler />
            <Toaster richColors />
            <CleanupOldLeagueMarks />
            <DataTableStateProvider>
              {children}
              <Footer />
            </DataTableStateProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
