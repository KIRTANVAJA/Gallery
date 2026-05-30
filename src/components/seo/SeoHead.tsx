import { Helmet } from 'react-helmet-async'

interface SeoHeadProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
}

export function SeoHead({
  title = 'Capture in Silences',
  description = 'Cinematic photography portfolio — capturing emotions words cannot explain.',
  image,
  url,
  type = 'website',
}: SeoHeadProps) {
  const fullTitle = title.includes('Capture in Silences')
    ? title
    : `${title} | Capture in Silences`
  const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Capture in Silences',
          description,
          url: import.meta.env.VITE_SITE_URL || 'https://captureinsilences.com',
        })}
      </script>
    </Helmet>
  )
}
