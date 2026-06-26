import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthRestorer from "@/components/AuthRestorer";
import SiteHeader from "@/components/layout/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ecomm",
  description: "Ecomm website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* I am using GSI widget to sign in. It sometimes throws this error
      [GSI_LOGGER]: FedCM get() rejects with NetworkError: Error retrieving a token.
      Instead of having a small widget in our website, where user can login, we will
      move to redirecting the user to google's page for them to login and the google
      will redirect the user with token what we will use in our callback function that
      logins in the user. */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <body className="min-h-full flex flex-col">
        <AuthRestorer />
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
