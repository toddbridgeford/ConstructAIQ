import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://constructaiq.trade'

  return [
    { url: base,
      changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/dashboard`,
      changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/intelligence`,
      changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/docs/api`,
      changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/methodology`,
      changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/federal`,
      changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/permits`,
      changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/materials`,
      changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/markets`,
      changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/opportunity-index`,
      changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/reality-gap`,
      changeFrequency: 'daily',   priority: 0.6 },
    { url: `${base}/ground-signal`,
      changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${base}/status`,
      changeFrequency: 'hourly',  priority: 0.5 },
    { url: `${base}/subscribe`,
      changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/about`,
      changeFrequency: 'monthly', priority: 0.5 },
  ]
}
