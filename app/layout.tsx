import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";
import { Rail } from "@/components/rail";
import { SyncNotice } from "@/components/sync-notice";
import { RegisterSW } from "@/components/register-sw";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Agente · Asistente personal",
  description: "Tareas, estudio, agenda, finanzas y salud en un solo lugar.",
  manifest: "/manifest.webmanifest",
  applicationName: "Agente",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Agente",
  },
  other: {
    // Next 16 emite sólo `mobile-web-app-capable`. iOS anterior a 16.4 mira
    // el meta viejo: sin él, "Agregar a inicio" abre con la barra de Safari
    // en vez de a pantalla completa.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f4f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} ${plexMono.variable}`}>
        <RegisterSW />
        <AuthProvider>
          <AuthGate>
            <DataProvider>
              <Rail />
              <SyncNotice />
              <main className="mx-auto min-h-screen w-full max-w-[1020px] pl-7 pr-5 pb-20 pt-7 sm:pl-10 sm:pr-8 sm:pt-10 lg:pl-[92px]">
                {children}
              </main>
            </DataProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
