import type { Metadata } from "next";

import "./globals.css";

import ErrorReporter from "@/components/ErrorReporter";

import { Toaster } from "@/components/ui/sonner";

import CustomAutumnProvider from "@/lib/autumn-provider";

export const metadata: Metadata = {
  title: "P!VOT - Smart Mobile Data Management",
  description:
    "Seamless mobile data transfer and customizable recharge plans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />

        <CustomAutumnProvider>
          {children}
        </CustomAutumnProvider>

        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

