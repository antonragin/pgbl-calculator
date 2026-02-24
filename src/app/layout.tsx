import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calculadora PGBL - Descubra sua vantagem tributaria",
  description:
    "Simule o beneficio fiscal do PGBL e entenda como a deducao no IR pode aumentar seu patrimonio a longo prazo.",
  robots: "noindex, nofollow",
  openGraph: {
    title: "Calculadora PGBL",
    description: "Simule o beneficio fiscal do PGBL e descubra sua vantagem tributaria.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
