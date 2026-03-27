import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  path: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_URL = 'https://taxlk.com';
const SITE_NAME = 'TaxLK';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export function SEO({ title, description, path, type = 'website', jsonLd }: SEOProps) {
  const url = `${SITE_URL}${path}`;
  const fullTitle = path === '/' ? title : `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
