import type { Metadata } from "next";
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
      <body className="antialiased bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
