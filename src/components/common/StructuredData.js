import { SITE_CONFIG } from '@/lib/metadata';

export const OrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.url,
  logo: `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
  email: SITE_CONFIG.email,
  telephone: SITE_CONFIG.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE_CONFIG.address,
    addressLocality: 'Somolu',
    addressRegion: 'Lagos',
    addressCountry: 'NG',
  },
  sameAs: [
    `https://twitter.com/${SITE_CONFIG.social.twitter}`,
    `https://facebook.com/${SITE_CONFIG.social.facebook}`,
    `https://instagram.com/${SITE_CONFIG.social.instagram}`,
    `https://linkedin.com/company/${SITE_CONFIG.social.linkedin}`,
  ],
});

export const WebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.url,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_CONFIG.url}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const BreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_CONFIG.url}${item.url}`,
  })),
});

export const ProductSchema = (product, url) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.images?.[0] || product.image,
  sku: product._id,
  mpn: product._id,
  brand: {
    '@type': 'Brand',
    name: SITE_CONFIG.name,
  },
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'NGN',
    availability:
      product.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: url,
  },
});

export const CollectionSchema = (collection, products, url) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: collection.name,
  description: collection.description,
  url: url,
  numberOfItems: products?.length || 0,
  hasPart: products?.map((product) => ({
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.[0] || product.image,
    sku: product._id,
  })),
});

export const OrderSchema = (order, url) => ({
  '@context': 'https://schema.org',
  '@type': 'Order',
  orderNumber: order.orderNumber,
  orderStatus: `https://schema.org/${order.status}`,
  priceCurrency: 'NGN',
  price: order.totalAmount,
  acceptedOffer: order.items?.map((item) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Product',
      name: item.productName,
      quantity: item.quantity,
    },
    price: item.price,
    priceCurrency: 'NGN',
  })),
  orderDate: order.createdAt,
  merchant: {
    '@type': 'Organization',
    name: SITE_CONFIG.name,
  },
  url: url,
});

export const InvoiceSchema = (invoice, order, url) => ({
  '@context': 'https://schema.org',
  '@type': 'Invoice',
  accountId: invoice._id,
  invoiceNumber: invoice.invoiceNumber,
  paymentStatus: invoice.status,
  totalPaymentDue: {
    '@type': 'PriceSpecification',
    price: invoice.totalAmount,
    priceCurrency: 'NGN',
  },
  paymentDueDate: invoice.dueDate,
  referencesOrder: {
    '@type': 'Order',
    orderNumber: order?.orderNumber,
    url: `${SITE_CONFIG.url}/orders/${order?._id}`,
  },
  provider: {
    '@type': 'Organization',
    name: SITE_CONFIG.name,
  },
  url: url,
});
