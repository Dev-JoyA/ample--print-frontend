export const SITE_CONFIG = {
  name: 'Ample Print Hub',
  title: 'Ample Print Hub - Professional Printing Services',
  description:
    'Premium printing services for businesses and individuals. Custom printing, fast delivery, and quality guaranteed.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://ampleprinthub.com',
  logo: '/images/logo/logo.png',
  favicon: '/favicon.ico',
  email: 'hello@ampleprinthub.com',
  phone: '+234 123 456 7890',
  address: '5, Boyle Street, Somolu, Lagos',
  social: {
    twitter: '@ampleprinthub',
    facebook: 'ampleprinthub',
    instagram: 'ampleprinthub',
    linkedin: 'company/ampleprinthub',
  },
  keywords: [
    'printing services',
    'custom printing',
    'flyer printing',
    'business cards',
    'poster printing',
    'Nigeria printing',
    'Lagos printing',
    'digital printing',
  ],
};

export const METADATA = {
  home: {
    title: 'Professional Printing Services | Ample Print Hub',
    description: SITE_CONFIG.description,
    keywords: SITE_CONFIG.keywords,
    ogImage: '/images/og/home-og.jpg',
  },
  products: {
    title: 'Our Products | Ample Print Hub',
    description:
      'Explore our wide range of printing products including flyers, business cards, posters, and custom designs.',
    keywords: [...SITE_CONFIG.keywords, 'products', 'print products'],
    ogImage: '/images/og/products-og.jpg',
  },
  collections: {
    title: 'Collections | Ample Print Hub',
    description: 'Browse our curated collections of printing products for every need.',
    keywords: [...SITE_CONFIG.keywords, 'collections', 'print collections'],
    ogImage: '/images/og/collections-og.jpg',
  },
  orderTracking: {
    title: 'Track Your Order | Ample Print Hub',
    description:
      'Track the status of your print order in real-time. Enter your order number to get updates.',
    keywords: [...SITE_CONFIG.keywords, 'track order', 'order status'],
    ogImage: '/images/og/tracking-og.jpg',
  },
  orderHistory: {
    title: 'Order History | Ample Print Hub',
    description: 'View your complete order history and download past invoices.',
    keywords: [...SITE_CONFIG.keywords, 'order history', 'past orders'],
    ogImage: '/images/og/order-history-og.jpg',
  },
  invoices: {
    title: 'Invoices | Ample Print Hub',
    description: 'Manage and pay your invoices securely online.',
    keywords: [...SITE_CONFIG.keywords, 'invoices', 'payments', 'billing'],
    ogImage: '/images/og/invoices-og.jpg',
  },
  dashboard: {
    customer: {
      title: 'Customer Dashboard | Ample Print Hub',
      description: 'Manage your orders, track shipments, and view your account details.',
      keywords: [...SITE_CONFIG.keywords, 'dashboard', 'my account'],
      ogImage: '/images/og/dashboard-og.jpg',
    },
    admin: {
      title: 'Admin Dashboard | Ample Print Hub',
      description: 'Manage orders, customers, and printing jobs efficiently.',
      keywords: ['admin', 'order management', 'print management'],
      ogImage: '/images/og/admin-og.jpg',
      robots: 'noindex, nofollow',
    },
    superAdmin: {
      title: 'Super Admin Dashboard | Ample Print Hub',
      description: 'Full system administration and financial management.',
      keywords: ['super admin', 'system admin', 'financial management'],
      ogImage: '/images/og/super-admin-og.jpg',
      robots: 'noindex, nofollow',
    },
  },
  auth: {
    signIn: {
      title: 'Sign In | Ample Print Hub',
      description: 'Sign in to your Ample Print Hub account to manage orders and track prints.',
      keywords: [...SITE_CONFIG.keywords, 'sign in', 'login'],
      ogImage: '/images/og/auth-og.jpg',
    },
    signUp: {
      title: 'Create Account | Ample Print Hub',
      description: 'Create a new account to start ordering professional printing services.',
      keywords: [...SITE_CONFIG.keywords, 'sign up', 'register', 'create account'],
      ogImage: '/images/og/auth-og.jpg',
    },
    forgotPassword: {
      title: 'Forgot Password | Ample Print Hub',
      description: 'Reset your password to regain access to your account.',
      keywords: [...SITE_CONFIG.keywords, 'forgot password', 'reset password'],
      ogImage: '/images/og/auth-og.jpg',
    },
    resetPassword: {
      title: 'Reset Password | Ample Print Hub',
      description: 'Create a new password for your Ample Print Hub account.',
      keywords: [...SITE_CONFIG.keywords, 'reset password', 'new password'],
      ogImage: '/images/og/auth-og.jpg',
    },
  },
  briefs: {
    title: 'Customization Briefs | Ample Print Hub',
    description: 'Submit and manage your custom printing requirements.',
    keywords: [...SITE_CONFIG.keywords, 'custom brief', 'design brief'],
    ogImage: '/images/og/briefs-og.jpg',
  },
  designApproval: {
    title: 'Design Approval | Ample Print Hub',
    description: 'Review and approve your print designs before production.',
    keywords: [...SITE_CONFIG.keywords, 'design approval', 'proof'],
    ogImage: '/images/og/design-approval-og.jpg',
  },
  payment: {
    title: 'Make Payment | Ample Print Hub',
    description: 'Pay your invoices securely using bank transfer or card.',
    keywords: [...SITE_CONFIG.keywords, 'payment', 'pay invoice'],
    ogImage: '/images/og/payment-og.jpg',
  },
  shipping: {
    title: 'Shipping | Ample Print Hub',
    description: 'Track your shipments and manage delivery preferences.',
    keywords: [...SITE_CONFIG.keywords, 'shipping', 'delivery', 'tracking'],
    ogImage: '/images/og/shipping-og.jpg',
  },
  notifications: {
    title: 'Notifications | Ample Print Hub',
    description: 'View all your order updates and notifications.',
    keywords: [...SITE_CONFIG.keywords, 'notifications', 'updates'],
    ogImage: '/images/og/notifications-og.jpg',
  },
  profile: {
    title: 'My Profile | Ample Print Hub',
    description: 'Manage your personal information and account settings.',
    keywords: [...SITE_CONFIG.keywords, 'profile', 'account settings'],
    ogImage: '/images/og/profile-og.jpg',
  },
};

export const getProductMetadata = (product) => ({
  title: `${product.name} | Ample Print Hub`,
  description:
    product.description ||
    `Order ${product.name} from Ample Print Hub. ${product.material || 'High quality'} printing.`,
  keywords: [...SITE_CONFIG.keywords, product.name.toLowerCase(), product.material?.toLowerCase()],
  ogImage: product.images?.[0] || product.image || '/images/og/product-og.jpg',
  product: {
    name: product.name,
    price: product.price,
    description: product.description,
  },
});

export const getCollectionMetadata = (collection) => ({
  title: `${collection.name} Collection | Ample Print Hub`,
  description: `Explore our ${collection.name} collection. ${collection.description || 'Quality printing products for all your needs.'}`,
  keywords: [...SITE_CONFIG.keywords, collection.name.toLowerCase(), 'collection'],
  ogImage: collection.image || '/images/og/collection-og.jpg',
});

export const getOrderMetadata = (order) => ({
  title: `Order ${order.orderNumber} | Ample Print Hub`,
  description: `View details for order ${order.orderNumber}. Status: ${order.status}.`,
  keywords: [...SITE_CONFIG.keywords, 'order details', order.orderNumber],
  ogImage: '/images/og/order-og.jpg',
  robots: 'noindex, follow',
});

export const getInvoiceMetadata = (invoice) => ({
  title: `Invoice ${invoice.invoiceNumber} | Ample Print Hub`,
  description: `Invoice details for order ${invoice.orderNumber}. Amount: ₦${invoice.totalAmount?.toLocaleString()}`,
  keywords: [...SITE_CONFIG.keywords, 'invoice', 'payment'],
  ogImage: '/images/og/invoice-og.jpg',
  robots: 'noindex, follow',
});
