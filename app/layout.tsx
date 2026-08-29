import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/lib/store";
import { Rail } from "@/components/rail";

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
        <DataProvider>
          <Rail />
          <main className="mx-auto min-h-screen w-full max-w-[1020px] pl-7 pr-5 pb-20 pt-7 sm:pl-10 sm:pr-8 sm:pt-10 lg:pl-[92px]">
            {children}
          </main>
        </DataProvider>
      </body>
    </html>
  );
}
