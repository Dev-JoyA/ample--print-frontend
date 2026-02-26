# Integration Testing Guide

This guide walks through testing **all backend–frontend integration flows** in a recommended order. Use it to verify that the frontend services, API client, and auth are correctly wired to the backend.

---

## Prerequisites

1. **Backend**
   - From `ample-print-backend`: install deps, set `.env` (see `.env.example`), start the server (e.g. `npm run dev`).
   - Note the port (e.g. `4001` or `8000`). Backend base URL = `http://localhost:<PORT>/api/v1`.

2. **Frontend**
   - From `ample--print-frontend`: copy `.env.example` to `.env.local`.
   - Set `NEXT_PUBLIC_API_URL=http://localhost:<PORT>/api/v1` (same port as backend).
   - Install deps and start the app (e.g. `npm run dev`).

3. **Optional**
   - Open backend Swagger: `http://localhost:<PORT>/api-docs` to confirm endpoints and try them manually.

---

## Test Order Overview

| # | Flow              | Role(s)     | Frontend route / action                    |
|---|-------------------|------------|--------------------------------------------|
| 1 | Super-admin sign-up | (public) | `/auth/sign-up` (super-admin path)          |
| 2 | Sign-in           | SuperAdmin | `/auth/sign-in`                             |
| 3 | Create admin      | SuperAdmin | Create admin, then (optional) sign in as admin |
| 4 | Customer sign-up  | (public)   | `/auth/sign-up` (customer)                  |
| 5 | Customer sign-in  | Customer   | `/auth/sign-in`                             |
| 6 | Forgot password   | (public)   | `/auth/forgot-password`                     |
| 7 | Deactivate/activate admin | SuperAdmin | Admin management pages              |
| 8 | Collections & products | Any   | Collections list → products → product detail |
| 9 | Orders            | Customer / Admin | Create order, my orders, order detail   |
| 10| Design            | Admin / Customer | Design upload, list, approve            |
| 11| Feedback          | Customer / Admin | Create feedback, respond, list         |
| 12| Customer briefs   | Customer / Admin | Submit brief, admin respond, list      |

---

## 1. Super-admin sign-up

- **URL:** `/auth/sign-up` → use the **Super admin** / super-admin registration link (e.g. `/auth/sign-up` with super-admin path or dedicated super-admin sign-up page).
- **Action:** Fill form (firstName, lastName, userName, email, password, phoneNumber) and submit.
- **Expect:** Success message and redirect to sign-in (or dashboard if backend returns tokens).
- **API:** `POST /api/v1/auth/superadmin-sign-up` via `authService.superAdminSignUp`.

---

## 2. Sign-in (SuperAdmin)

- **URL:** `/auth/sign-in`.
- **Action:** Enter the super-admin email and password; submit.
- **Expect:** Redirect to `/dashboards/super-admin-dashboard`; cookies `token` and `refreshToken` set.
- **API:** `POST /api/v1/auth/sign-in` via `authService.signIn`; `setAuthCookies` then redirect by role.

---

## 3. Create admin (SuperAdmin)

- **URL:** e.g. `/auth/sign-up` (admin) or super-admin admin-management create-admin page (e.g. `/dashboards/super-admin-dashboard` → Create admin).
- **Action:** While signed in as SuperAdmin, fill admin form and submit.
- **Expect:** Success message; new admin can sign in.
- **API:** `POST /api/v1/auth/admin-sign-up` (Bearer token required) via `authService.adminSignUp`.

---

## 4. Customer sign-up

- **URL:** `/auth/sign-up` (customer registration).
- **Action:** Fill customer form and submit.
- **Expect:** Success and either redirect to dashboard with cookies set or “success” and redirect to sign-in.
- **API:** `POST /api/v1/auth/sign-up` via `authService.signUp`.

---

## 5. Customer sign-in

- **URL:** `/auth/sign-in`.
- **Action:** Sign in with customer email and password.
- **Expect:** Redirect to `/dashboard`; cookies set.
- **API:** `POST /api/v1/auth/sign-in` via `authService.signIn`.

---

## 6. Forgot password

- **URL:** `/auth/forgot-password` (link from sign-in page).
- **Action:** Enter email; submit “Reset Password”.
- **Expect:** Message like “Check your email for reset instructions” (if backend sends email).
- **API:** `POST /api/v1/auth/forgot-password` via `authService.forgotPassword`.

(Optional: complete reset via email link and `effect-forgot-password` if that page is implemented.)

---

## 7. Deactivate / activate admin (SuperAdmin)

- **URL:** Super-admin admin-management: deactivate and activate admin pages (e.g. paths under `/auth/.../admin-management/deactivate-admin` and `.../activate-admin`).
- **Action:**
  - Deactivate: enter admin email, confirm, submit. Expect success message.
  - Activate: enter same admin email, confirm, submit. Expect success message.
- **API:** `POST /api/v1/auth/deactivate-admin`, `POST /api/v1/auth/reactivate-admin` (Bearer SuperAdmin token) via `authService.deactivateAdmin` / `authService.reactivateAdmin`.

---

## 8. Collections and products

- **URL:** `/collections` (or equivalent collections list).
- **Action:**
  1. Open collections list → expect list from backend (paginated).
  2. Open a collection’s products (e.g. `/collections/[id]/products`) → expect products for that collection.
  3. Open a product detail (e.g. `/products/[id]`) → expect single product.
- **APIs (when wired in UI):**
  - `collectionService.getList()` → `GET /api/v1/collections`
  - `collectionService.getAllProducts(collectionId)` → `GET /api/v1/collections/:id/all-products`
  - `productService.getById(id)` → `GET /api/v1/products/:id`
  - Optional: `productService.getList()`, `productService.searchByName()`, `productService.filter()`.

---

## 9. Orders

- **As customer**
  - **URL:** e.g. `/new-order`, then order summary / confirmation.
  - **Action:** Create an order (with required fields). Then open “My orders” or order history.
  - **Expect:** Order created; list shows your orders; opening an order shows details.
- **APIs (when wired):**
  - `orderService.create(data)` → `POST /api/v1/orders/create`
  - `orderService.getMyOrders()` → `GET /api/v1/orders/my-orders`
  - `orderService.getById(id)` → `GET /api/v1/orders/:id`

- **As admin**
  - **URL:** Admin orders page (e.g. `/admin/orders`).
  - **Action:** View all orders; optionally filter, search by order number, update status.
  - **APIs (when wired):** `orderService.getAll()`, `orderService.filter()`, `orderService.searchByOrderNumber()`, `orderService.updateStatus()`.

---

## 10. Design

- **Admin**
  - **URL:** e.g. `/admin/design-upload` or design upload flow.
  - **Action:** Upload a design for a product (select product, upload file). Then list designs by order/product.
  - **Expect:** Upload success; design appears in list/detail.
- **Customer**
  - **URL:** e.g. `/design-approval` or “Approve design” on an order.
  - **Action:** Open design and approve (or reject).
- **APIs (when wired):**
  - `designService.upload(productId, formData)` → `POST /api/v1/design/orders/:productId`
  - `designService.getByOrder(orderId)`, `designService.getByProduct(productId)`, `designService.getById(designId)`
  - `designService.approve(designId)` → `PUT /api/v1/design/:designId/approve`

---

## 11. Feedback

- **Customer**
  - **URL:** Page where customer can submit feedback (e.g. from order or design flow).
  - **Action:** Submit feedback (message, optional attachments). Then view “My feedback”.
  - **Expect:** Feedback created; list shows it.
- **Admin**
  - **URL:** Admin feedback / pending feedback.
  - **Action:** View pending feedback; respond to one; optionally update status.
- **APIs (when wired):**
  - `feedbackService.create(formData)` → `POST /api/v1/feedback`
  - `feedbackService.getMyFeedback()` → `GET /api/v1/feedback/user`
  - `feedbackService.getPending()` → `GET /api/v1/feedback/pending`
  - `feedbackService.respond(feedbackId, response)` → `POST /api/v1/feedback/:feedbackId/respond`
  - `feedbackService.updateStatus(feedbackId, status)` → `PATCH /api/v1/feedback/:feedbackId/status`

---

## 12. Customer briefs

- **Customer**
  - **URL:** Brief submission for an order/product (e.g. from customize or order flow).
  - **Action:** Submit a brief (description, optional image/voice/video/logo). View “My briefs”.
  - **Expect:** Brief saved; visible in list and in conversation for that order/product.
- **Admin**
  - **URL:** Admin customer-briefs (e.g. `/admin/customer-briefs`).
  - **Action:** View briefs needing response; respond (with optional files).
  - **Expect:** Response attached to conversation; status can be checked.
- **APIs (when wired):**
  - `customerBriefService.submit(orderId, productId, formData)` → `POST /api/v1/customer-briefs/customer/orders/:orderId/products/:productId/brief`
  - `customerBriefService.getMyBriefs()` → `GET /api/v1/customer-briefs/customer/briefs`
  - `customerBriefService.getByOrderAndProduct(orderId, productId)` → `GET /api/v1/customer-briefs/briefs/orders/:orderId/products/:productId`
  - `customerBriefService.adminRespond(orderId, productId, formData)` → `POST /api/v1/customer-briefs/admin/orders/:orderId/products/:productId/respond`
  - `customerBriefService.getAdminBriefs()` → `GET /api/v1/customer-briefs/admin/briefs`

---

## Quick checklist

- [ ] Backend running; frontend `NEXT_PUBLIC_API_URL` points to it.
- [ ] Super-admin sign-up and sign-in.
- [ ] Create admin (as SuperAdmin); sign in as admin.
- [ ] Customer sign-up and sign-in.
- [ ] Forgot password (request only).
- [ ] Deactivate and activate admin (SuperAdmin).
- [ ] Collections list → products in collection → product detail.
- [ ] Create order (customer); my orders; order detail.
- [ ] Upload design (admin); approve design (customer) if UI exists.
- [ ] Submit feedback (customer); respond (admin) if UI exists.
- [ ] Submit customer brief (customer); respond (admin) if UI exists.

---

## Troubleshooting

- **401 on protected routes:** Ensure you’re signed in and the cookie `token` is set. Try sign-in again or use refresh (if the app retries with refresh token).
- **CORS or network errors:** Confirm backend allows the frontend origin and that `NEXT_PUBLIC_API_URL` is correct (including `/api/v1`).
- **404 on feedback or customer-briefs:** Ensure backend has feedback and customer-brief routes mounted (see backend `server.ts` and Swagger at `/api-docs`).

For full API details and service usage, see `INTEGRATION_GUIDE.md` and the backend Swagger UI.
