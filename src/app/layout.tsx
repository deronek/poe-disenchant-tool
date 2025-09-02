import { CleanupOldLeagueMarks } from "@/components/cleanup-old-league-marks";
import { DataTableStateProvider } from "@/components/data-table-state-context";
import { Footer } from "@/components/footer";
import { ErrorHandler } from "@/components/error-handler";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PoE Unique Disenchanting Tool",
  description:
    "Calculate the efficiency of disenchanting unique items for Thaumaturgic Dust",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
