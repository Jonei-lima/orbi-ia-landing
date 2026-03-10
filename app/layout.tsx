import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ORBI IA",
  description: "Inteligência de Operações Autônomas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17997912287" />
        <script dangerouslySetInnerHTML={{__html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17997912287');
        `}} />
      </head>
      <body className="antialiased bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
