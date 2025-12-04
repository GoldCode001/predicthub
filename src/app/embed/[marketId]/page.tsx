import { Metadata } from 'next';
import EmbedWidget from './EmbedWidget';

interface PageProps {
  params: { marketId: string };
  searchParams: { theme?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'PredictHub Market Widget',
    description: 'Embedded prediction market widget from PredictHub',
    robots: 'noindex, nofollow',
  };
}

export default function EmbedPage({ params, searchParams }: PageProps) {
  const theme = searchParams.theme === 'light' ? 'light' : 'dark';
  
  return (
    <html lang="en" className={theme}>
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: transparent;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `}</style>
      </head>
      <body>
        <EmbedWidget marketId={params.marketId} theme={theme} />
      </body>
    </html>
  );
}


