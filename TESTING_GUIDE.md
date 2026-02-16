# Testing Guide

This guide provides comprehensive instructions for testing all pages and features in the Ampleprinthub application.

## Prerequisites

1. Ensure all dependencies are installed:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. The application will be available at `http://localhost:3000`

## Customer Pages Testing

### 1. Landing Page (`/`)
- [ ] Verify hero section displays correctly
- [ ] Check navigation links work
- [ ] Test "Start Your First Order" button
- [ ] Verify Print Solutions section displays all 6 categories
- [ ] Check "How It Works" section displays 4 steps
- [ ] Verify testimonials section displays 3 testimonials
- [ ] Test CTA section "Get Started Free" button
- [ ] Check footer displays all links and information

### 2. Collections Page (`/collections`)
- [ ] Verify all collections are displayed in grid
- [ ] Check collection cards show name and image
- [ ] Test clicking on a collection navigates to product list
- [ ] Verify responsive layout on mobile/tablet

### 3. Product List Page (`/collections/[id]/products`)
- [ ] Verify filters sidebar displays correctly
- [ ] Test category filter selection
- [ ] Check price range slider works
- [ ] Verify products display in grid
- [ ] Test "Back to Studio" button
- [ ] Check product cards show all information
- [ ] Test clicking product navigates to detail page
- [ ] Verify "Custom Quote" button works

### 4. Product Detail Page (`/products/[id]`)
- [ ] Verify product images display
- [ ] Test view switching (FRONT, INNER, BACK)
- [ ] Check product information displays correctly
- [ ] Test quantity selection buttons
- [ ] Verify price calculation updates with quantity
- [ ] Test "Proceed to Design Briefing" button
- [ ] Check technical specifications display
- [ ] Verify "Back to Studio" button works

### 5. Customer Brief Page (`/products/[id]/customize`)
- [ ] Verify design instructions textarea works
- [ ] Test voice recording button (UI only)
- [ ] Check file upload for logos/imagery
- [ ] Verify multiple file uploads work
- [ ] Test technical specifications inputs
- [ ] Check "Save & Continue Later" button
- [ ] Verify "Continue to Order" button navigates correctly

### 6. Order Summary Page (`/orders/summary`)
- [ ] Verify product preview displays
- [ ] Check customization details show correctly
- [ ] Verify order totals calculate correctly
- [ ] Test "Back" button
- [ ] Check "Proceed to Payment" button navigates

### 7. Payment Page (`/payment`)
- [ ] Verify order total displays
- [ ] Test payment method selection (Paystack/Bank Transfer)
- [ ] Check bank transfer details display when selected
- [ ] Test receipt upload for bank transfer
- [ ] Verify payment options (Full/Deposit/Part Payment)
- [ ] Test "Pay with Paystack" button
- [ ] Check "Submit Receipt" button (bank transfer)
- [ ] Verify form validation works

### 8. Shipping Selection Page (`/shipping`)
- [ ] Verify all shipping options display
- [ ] Test pickup option selection
- [ ] Check delivery to own address option
- [ ] Test delivery to another address option
- [ ] Verify shipping form displays for delivery options
- [ ] Check form validation
- [ ] Test shipping cost estimate displays
- [ ] Verify "Continue" button works

### 9. Invoices Page (`/invoices`)
- [ ] Verify all invoices display in grid
- [ ] Check invoice cards show correct information
- [ ] Test "Pay Invoice" button
- [ ] Verify status badges display correctly
- [ ] Check "Due Soon" badges show when applicable

### 10. Order Tracking Page (`/order-tracking`)
- [ ] Verify search input works
- [ ] Test "Track Order" button
- [ ] Check order details display after tracking
- [ ] Verify status timeline displays correctly
- [ ] Test payment status badge
- [ ] Check shipping status badge
- [ ] Verify all status steps show correct state

### 11. Customer Dashboard (`/dashboard`)
- [ ] Verify welcome message displays
- [ ] Check summary cards show correct values
- [ ] Test "Start a New Print Order" button
- [ ] Verify active orders list displays
- [ ] Check unpaid invoices list displays
- [ ] Test "View All" links work
- [ ] Verify order cards are clickable

### 12. Order History Page (`/order-history`)
- [ ] Verify all orders display
- [ ] Test search functionality
- [ ] Check order cards show correct information
- [ ] Verify status badges display

### 13. Design Approval Page (`/design-approval`)
- [ ] Verify pending designs display
- [ ] Check design images display correctly
- [ ] Test "Approve Design" button
- [ ] Verify "Request Changes" button works
- [ ] Check order information displays

### 14. New Order/Studio Page (`/new-order`)
- [ ] Verify hero section displays
- [ ] Check "Explore Print Solutions" button
- [ ] Test "Start Custom Brief" button
- [ ] Verify Essential Solutions cards display
- [ ] Check process steps section displays
- [ ] Test navigation to collections

## Admin Pages Testing

### 15. Admin Dashboard (`/admin-dashboard`)
- [ ] Verify summary cards display
- [ ] Check recent orders list
- [ ] Test "View All" link
- [ ] Verify sidebar navigation works

### 16. Admin Orders Page (`/admin/orders`)
- [ ] Verify orders list displays
- [ ] Test search functionality
- [ ] Check order detail modal opens
- [ ] Test status update buttons
- [ ] Verify status changes reflect

### 17. Customer Briefs Page (`/admin/customer-briefs`)
- [ ] Verify briefs list displays
- [ ] Check brief details show correctly
- [ ] Test "Respond to Brief" button
- [ ] Verify response textarea works
- [ ] Test "Send Response" button
- [ ] Check "Cancel" button works

### 18. Design Upload Page (`/admin/design-upload`)
- [ ] Verify order selection dropdown works
- [ ] Test file upload functionality
- [ ] Check uploaded files list displays
- [ ] Test file removal
- [ ] Verify "Upload Designs" button
- [ ] Check form validation

## Super Admin Pages Testing

### 19. Super Admin Dashboard (`/super-admin-dashboard`)
- [ ] Verify summary cards display
- [ ] Check financial metrics
- [ ] Verify sidebar navigation

### 20. Invoice Creation Page (`/super-admin/invoices`)
- [ ] Verify order selection works
- [ ] Test adding invoice items
- [ ] Check item removal
- [ ] Verify discount input
- [ ] Test deposit amount input
- [ ] Check total calculations
- [ ] Verify "Generate Invoice" button

### 21. Shipping Invoice Page (`/super-admin/shipping-invoices`)
- [ ] Verify order selection
- [ ] Test shipping address input
- [ ] Check shipping cost input
- [ ] Verify "Create Shipping Invoice" button
- [ ] Test form validation

### 22. Discount Management Page (`/super-admin/discounts`)
- [ ] Verify existing discounts display
- [ ] Test creating new discount (percentage)
- [ ] Test creating new discount (amount)
- [ ] Check discount code validation
- [ ] Test activate/deactivate toggle
- [ ] Verify discount list updates

### 23. Payment Verification Page (`/super-admin/payment-verification`)
- [ ] Verify pending payments display
- [ ] Check receipt images display
- [ ] Test "Verify Payment" button
- [ ] Test "Reject Payment" button
- [ ] Verify payment details show correctly

## Component Testing

### UI Components
- [ ] Test Button component with all variants
- [ ] Verify Input component validation
- [ ] Check Textarea component
- [ ] Test StatusBadge with all types
- [ ] Verify SearchBar functionality
- [ ] Check Header component displays correctly
- [ ] Test Sidebar navigation
- [ ] Verify Footer links

### Card Components
- [ ] Test ProductCard displays correctly
- [ ] Verify OrderCard shows all information
- [ ] Check InvoiceCard displays
- [ ] Test SummaryCard with all colors
- [ ] Verify CollectionCard works

## Responsive Design Testing

Test all pages on:
- [ ] Mobile (320px - 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1024px+)

## Browser Compatibility

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Performance Testing

- [ ] Check page load times
- [ ] Verify image optimization
- [ ] Test lazy loading
- [ ] Check bundle size

## Accessibility Testing

- [ ] Test keyboard navigation
- [ ] Verify screen reader compatibility
- [ ] Check color contrast
- [ ] Test focus indicators

## Notes

- All forms should validate required fields
- All buttons should provide feedback on click
- Navigation should work consistently
- Images should have alt text
- Error states should be handled gracefully
