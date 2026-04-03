'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { SITE_CONFIG, METADATA } from '@/lib/metadata';

export default function SEOHead({ 
  title, 
  description, 
  keywords, 
  ogImage, 
  canonicalUrl,
  robots,
  noIndex = false,
  noFollow = false,
  structuredData 
}) {
  const pathname = usePathname();
  const canonical = canonicalUrl || `${SITE_CONFIG.url}${pathname}`;
  const finalRobots = robots || (noIndex ? 'noindex' : 'index') + (noFollow ? ', nofollow' : ', follow');

  return (
    <Head>
      <title>{title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.title}</title>
      <meta name="description" content={description || SITE_CONFIG.description} />
      {keywords && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="robots" content={finalRobots} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="UTF-8" />
      <link rel="canonical" href={canonical} />
      <link rel="icon" href={SITE_CONFIG.favicon} />
      <meta name="author" content={SITE_CONFIG.name} />
      <meta name="theme-color" content="#FF676A" />

      <meta property="og:title" content={title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.title} />
      <meta property="og:description" content={description || SITE_CONFIG.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_CONFIG.name} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage || `${SITE_CONFIG.url}/images/og/default-og.jpg`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={SITE_CONFIG.name} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.title} />
      <meta name="twitter:description" content={description || SITE_CONFIG.description} />
      <meta name="twitter:image" content={ogImage || `${SITE_CONFIG.url}/images/og/default-og.jpg`} />
      <meta name="twitter:site" content={SITE_CONFIG.social.twitter} />

      <meta name="format-detection" content="telephone=no" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  );
}