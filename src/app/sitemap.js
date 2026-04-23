import { SITE_CONFIG } from '@/lib/metadata';

export default async function sitemap() {
  const baseUrl = SITE_CONFIG.url;

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/order-tracking`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/order-history`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/invoices`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const [collectionsRes, productsRes] = await Promise.all([
      fetch(`${baseUrl}/api/collections?limit=100`).catch(() => null),
      fetch(`${baseUrl}/api/products?limit=100`).catch(() => null),
    ]);

    const collections = collectionsRes?.ok ? await collectionsRes.json() : { collections: [] };
    const products = productsRes?.ok ? await productsRes.json() : { products: [] };

    const collectionPages = (collections.collections || []).map((collection) => ({
      url: `${baseUrl}/collections/${collection._id}`,
      lastModified: new Date(collection.updatedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const productPages = (products.products || []).map((product) => ({
      url: `${baseUrl}/products/${product._id}`,
      lastModified: new Date(product.updatedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticPages, ...collectionPages, ...productPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
