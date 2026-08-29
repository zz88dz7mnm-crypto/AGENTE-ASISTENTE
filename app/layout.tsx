import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/lib/store";
import { Rail } from "@/components/rail";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agente · Asistente personal",
  description: "Tareas, estudio, agenda, finanzas y salud en un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <DataProvider>
          <Rail />
          <main className="mx-auto min-h-screen max-w-[720px] px-4 pb-16 pt-8 sm:px-8">
            {children}
          </main>
        </DataProvider>
      </body>
    </html>
  );
}
