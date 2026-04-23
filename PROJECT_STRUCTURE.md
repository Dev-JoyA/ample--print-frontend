# Project Structure

This document outlines the structure of the Ampleprinthub frontend application.

## Directory Structure

```
ample--print-frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── auth/              # Authentication pages
│   │   ├── collections/    # Collection pages
│   │   ├── products/       # Product pages
│   │   ├── orders/         # Order pages
│   │   ├── payment/        # Payment pages
│   │   ├── shipping/       # Shipping pages
│   │   ├── invoices/       # Invoice pages
│   │   ├── order-tracking/  # Order tracking
│   │   ├── order-history/   # Order history
│   │   ├── design-approval/ # Design approval
│   │   ├── new-order/       # New order/studio
│   │   ├── dashboard/       # Customer dashboard
│   │   ├── admin/           # Admin pages
│   │   ├── super-admin/     # Super admin pages
│   │   ├── dashboards/      # Dashboard pages
│   │   ├── globals.css      # Global styles
│   │   └── layout.js        # Root layout
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Sidebar.js
│   │   │   ├── Header.js
│   │   │   ├── SearchBar.js
│   │   │   ├── Footer.js
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Textarea.js
│   │   │   └── StatusBadge.js
│   │   ├── cards/           # Card components
│   │   │   ├── ProductCard.js
│   │   │   ├── OrderCard.js
│   │   │   ├── InvoiceCard.js
│   │   │   ├── SummaryCard.js
│   │   │   └── CollectionCard.js
│   │   └── layouts/         # Layout components
│   │       └── DashboardLayout.js
│   └── lib/                  # Utility functions (to be created)
│       └── api.js           # API integration
├── public/                    # Static assets
│   └── images/
├── tailwind.config.mjs       # Tailwind configuration
├── next.config.mjs          # Next.js configuration
├── package.json             # Dependencies
├── TESTING_GUIDE.md         # Testing instructions
├── INTEGRATION_GUIDE.md     # Backend integration guide
└── PROJECT_STRUCTURE.md     # This file
```

## Component Architecture

### UI Components (`src/components/ui/`)

Reusable base components used throughout the application:

- **Sidebar**: Navigation sidebar with role-based menu items
- **Header**: Top header with search bar and user controls
- **SearchBar**: Search input component
- **Footer**: Site footer with links and newsletter
- **Button**: Button component with multiple variants
- **Input**: Form input component
- **Textarea**: Textarea component
- **StatusBadge**: Status indicator badge

### Card Components (`src/components/cards/`)

Specialized card components for displaying data:

- **ProductCard**: Displays product information
- **OrderCard**: Displays order information
- **InvoiceCard**: Displays invoice information
- **SummaryCard**: Displays summary statistics
- **CollectionCard**: Displays collection information

### Layout Components (`src/components/layouts/`)

Layout wrappers for pages:

- **DashboardLayout**: Layout for dashboard pages with sidebar and header

## Page Routes

### Customer Pages

- `/` - Landing page
- `/collections` - Collections list
- `/collections/[id]/products` - Products in a collection
- `/products/[id]` - Product detail
- `/products/[id]/customize` - Customer brief/customization
- `/orders/summary` - Order summary
- `/payment` - Payment page
- `/shipping` - Shipping selection
- `/invoices` - Invoices list
- `/order-tracking` - Order tracking
- `/order-history` - Order history
- `/design-approval` - Design approval
- `/new-order` - New order/studio
- `/dashboard` - Customer dashboard

### Admin Pages

- `/admin-dashboard` - Admin dashboard
- `/admin/orders` - Orders management
- `/admin/customer-briefs` - Customer briefs
- `/admin/design-upload` - Design upload

### Super Admin Pages

- `/super-admin-dashboard` - Super admin dashboard
- `/super-admin/invoices` - Invoice creation
- `/super-admin/shipping-invoices` - Shipping invoice creation
- `/super-admin/discounts` - Discount management
- `/super-admin/payment-verification` - Payment verification

## Styling

The project uses **Tailwind CSS 3** with a custom design system:

- Primary color: Red (#EF4444)
- Dark theme: Dark gray/black backgrounds
- Status colors: Blue, Yellow, Green, Red
- Typography: Carlito and Inter fonts

## State Management

Currently using React hooks (`useState`, `useEffect`) for local state. For production, consider:

- Context API for global state
- Zustand or Redux for complex state management
- React Query for server state

## Next Steps

1. **API Integration**: Connect all pages to backend API (see INTEGRATION_GUIDE.md)
2. **Authentication**: Implement auth context and protected routes
3. **Form Validation**: Add form validation library (e.g., react-hook-form, zod)
4. **Error Handling**: Implement error boundaries and error handling
5. **Loading States**: Add loading skeletons and spinners
6. **Toast Notifications**: Add toast notifications for user feedback
7. **Image Optimization**: Optimize images with Next.js Image component
8. **SEO**: Add meta tags and SEO optimization
9. **Testing**: Add unit and integration tests
10. **Performance**: Optimize bundle size and implement code splitting
