import type { Metadata, Viewport } from "next";
import { CookieBanner } from "@/components/auth/cookie-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Palpiteiro — Análises da Loteca",
    template: "%s | Palpiteiro",
  },
  description:
    "Análises estatísticas da Loteca com IA e dados históricos. Probabilidades por jogo, secas, duplos e triplos recomendados.",
  manifest: "/manifest.json",
  icons: {
    // favicon.ico é servido automaticamente via convenção do App Router
    // (src/app/favicon.ico) — não precisa ser declarado aqui.
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#101412",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
