import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORBI IA | Inteligência de Operações Autônomas",
  description:
    "Camada estratégica de organização operacional. Conectamos sistemas, estruturamos informações e apoiamos decisões com mais previsibilidade.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17997912287"
          strategy="afterInteractive"
        />

        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17997912287');
          `}
        </Script>
      </head>

      <body className="antialiased bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
