import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-white text-neutral-900">

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17997912287"
          strategy="beforeInteractive"
        />

        <Script id="google-ads" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17997912287');
          `}
        </Script>

        {children}

      </body>
    </html>
  );
}
