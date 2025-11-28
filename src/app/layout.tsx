import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'PredictHub | Prediction Market Aggregator',
  description: 'Real-time prediction market aggregator. Track odds from Polymarket, Kalshi, Manifold, and Metaculus in one place.',
  keywords: ['prediction markets', 'polymarket', 'kalshi', 'manifold', 'metaculus', 'trading', 'forecasting'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.history.scrollRestoration = 'manual';
              }
            `,
          }}
        />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
