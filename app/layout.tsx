import type { Metadata } from "next";
import { AppVersionFooter } from "@/components/app-version-footer";
import { Providers } from "@/components/providers";
import { assertProductionEnv } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://payonarc.xyz"),
  title: "Pay On Arc",
  description: "AI-powered stablecoin payment dashboard for the Arc blockchain.",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Pay On Arc",
    description: "AI-powered stablecoin payment dashboard for the Arc blockchain.",
    images: ["/brand/pay-on-arc-logo.png"],
  },
  twitter: {
    card: "summary",
    title: "Pay On Arc",
    description: "AI-powered stablecoin payment dashboard for the Arc blockchain.",
    images: ["/brand/pay-on-arc-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  assertProductionEnv();

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F19] text-starlight antialiased">
        <Providers>
          {children}
          <AppVersionFooter />
        </Providers>
      </body>
    </html>
  );
}
