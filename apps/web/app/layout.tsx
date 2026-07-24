import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaRegister } from "./pwa-register";
import "./styles.css";

export const metadata: Metadata = {
  title: {
    default: "Apostolic IA",
    template: "%s · Apostolic IA"
  },
  description: "Plataforma de estudos bíblicos em desenvolvimento.",
  applicationName: "Apostolic IA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Apostolic IA"
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg"
  }
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#174EA6" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
