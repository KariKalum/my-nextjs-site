/**
 * Global SEO structured data component
 * Adds Organization and WebSite schema.org structured data to all pages
 */

import { getAbsoluteUrl, siteName } from '@/lib/seo/metadata'

export default function GlobalSEO() {
  const baseUrl = getAbsoluteUrl('')
  
  // Organization schema.org structured data
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    logo: getAbsoluteUrl('/logo.svg'),
    description: 'Discover the best cafés for working with your laptop in Germany',
    sameAs: [], // Add social media links if available
  }

  // WebSite schema.org structured data
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: baseUrl,
    description: 'Discover the best cafés for working with your laptop in Germany',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/en/cities?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  )
}
