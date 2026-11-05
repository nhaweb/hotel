# 🏛️ PML HOTEL — SYSTEM ARCHITECTURE & STATE

> **Single Source of Truth** for Backend, Database (Neon Postgres), Server Actions, API Endpoints, and AI Concierge Integration. Managed by **Antigravity (Backend & AI Architect)** for seamless collaboration with **Cursor (Frontend Architect)**.

---

## 🟢 Ready APIs & Server Actions

### 1. Admin Dashboard KPI & Analytics (`@/lib/actions/admin-dashboard.ts`)
- **File**: [`lib/actions/admin-dashboard.ts`](file:///d:/luxury-hotel-landing-page/lib/actions/admin-dashboard.ts)
- **Functions**:
  ```typescript
  export async function getAdminDashboardStats(branchId?: string): Promise<{
    ok: true;
    stats: DashboardStats;
  } | {
    ok: false;
    error: string;
  }>
  ```
- **Returns (`DashboardStats`)**:
  - `todayCheckIns`: number (reservations arriving today)
  - `todayCheckOuts`: number (guests departing today)
  - `totalOccupiedRooms`: number
  - `totalAvailableRooms`: number
  - `occupancyRatePercent`: number (0 - 100%)
  - `pendingBookingsCount`: number
  - `confirmedBookingsCount`: number
  - `totalRevenueMonthVnd`: number
  - `recentBookings`: `AdminBookingItem[]` (5 most recent reservations)
  - `roomStatusBreakdown`: `{ available, occupied, dirty, cleaning, maintenance }`

---

### 2. Admin Bookings PMS Management (`@/lib/actions/admin-bookings.ts`)
- **File**: [`lib/actions/admin-bookings.ts`](file:///d:/luxury-hotel-landing-page/lib/actions/admin-bookings.ts)
- **Functions**:
  1. **`getAdminBookings(filter)`**:
     ```typescript
     export async function getAdminBookings(rawFilter?: AdminBookingFilter): Promise<{
       ok: true;
       result: PaginatedResult<AdminBookingItem>;
     } | {
       ok: false;
       error: string;
     }>
     ```
     - **Filter Parameters**:
       - `branchId?: string` (e.g. `'pml-dong-du'`)
       - `bookingStatus?: 'all' | 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'`
       - `paymentStatus?: 'all' | 'pending' | 'unpaid' | 'partial' | 'paid' | 'refunded'`
       - `searchQuery?: string` (matches Booking Code `PML-XXXX`, Customer Name, Phone)
       - `startDate?: string` (`YYYY-MM-DD`)
       - `endDate?: string` (`YYYY-MM-DD`)
       - `page?: number` (default 1)
       - `pageSize?: number` (default 10)
  2. **`updateBookingStatus(input)`**:
     ```typescript
     export async function updateBookingStatus(input: {
       bookingId: string; // UUID
       status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
       assignedRoomUnitId?: string | null; // e.g. "pml-dd-201"
       internalNotes?: string;
       adminName?: string;
     }): Promise<{ ok: true; bookingId: string } | { ok: false; error: string }>
     ```
     - *Automated PMS logic*:
       - Checking in marks the assigned physical room as `OCCUPIED`.
       - Checking out marks the room as `DIRTY` (queued for housekeeping).
       - Cancelling frees up any assigned room back to `AVAILABLE`.
       - Audit record logged into `admin_activity_logs`.
  3. **`updateBookingPayment(input)`**:
     ```typescript
     export async function updateBookingPayment(input: {
       bookingId: string; // UUID
       paymentStatus: 'pending' | 'unpaid' | 'partial' | 'paid' | 'refunded';
       paymentMethod: 'UNPAID' | 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'CREDIT_CARD';
       depositAmountVnd: number;
       adminName?: string;
     }): Promise<{ ok: true; bookingId: string } | { ok: false; error: string }>
     ```

---

### 3. Room Inventory, Room Types & Full CRUD Management (`@/lib/actions/admin-rooms.ts`)
- **File**: [`lib/actions/admin-rooms.ts`](file:///d:/luxury-hotel-landing-page/lib/actions/admin-rooms.ts)
- **Role Permissions**:
  - `SUPER_ADMIN` & `MANAGER` (`canManageRooms: true`): Full Create, Edit, Delete of Room Units and Room Types (Managers scoped to their assigned `branchId`).
  - `RECEPTIONIST` & `HOUSEKEEPING` (`canManageRooms: false`): Restricted to viewing and updating housekeeping status/notes.
- **Functions**:
  1. **`getAdminRoomUnits(branchId?, status?)`**:
     ```typescript
     export async function getAdminRoomUnits(
       branchId?: string,
       status?: RoomUnitStatus
     ): Promise<{ ok: true; units: RoomUnit[] } | { ok: false; error: string }>
     ```
     - Returns physical rooms (Floor 2, 3, 4, 5, Penthouse) with base price per night (`basePriceVnd`), real-time status (`AVAILABLE`, `OCCUPIED`, `DIRTY`, `CLEANING`, `MAINTENANCE`), currently assigned guest name (`currentGuestName`), booking code (`currentBookingCode`), and checkout date (`currentCheckOut`).
  2. **`createRoomUnit(input)`**:
     ```typescript
     export async function createRoomUnit(input: CreateRoomUnitInput): Promise<{ ok: true; unitId: string } | { ok: false; error: string }>
     ```
     - Parameters: `branchId`, `roomTypeId`, `roomNumber`, `floor`, `status`, `notes`.
     - Validates unique room number per branch, checks branch scope, logs to `admin_activity_logs`.
  3. **`updateRoomUnit(input)`**:
     ```typescript
     export async function updateRoomUnit(input: UpdateRoomUnitInput): Promise<{ ok: true; unitId: string } | { ok: false; error: string }>
     ```
     - Full physical room update: room number, floor, room category (`roomTypeId`), status, notes.
  4. **`deleteRoomUnit(roomUnitId)`**:
     ```typescript
     export async function deleteRoomUnit(roomUnitId: string): Promise<{ ok: true; deletedId: string } | { ok: false; error: string }>
     ```
     - Guard: Blocks deletion if active guest or confirmed booking is assigned; unlinks past bookings safely before deleting.
  5. **`updateRoomUnitStatus(input)`**:
     ```typescript
     export async function updateRoomUnitStatus(input: {
       roomUnitId: string;
       status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'MAINTENANCE';
       notes?: string;
       adminName?: string;
     }): Promise<{ ok: true; unitId: string } | { ok: false; error: string }>
     ```
     - Lifecycle logic: When a room status is changed to `AVAILABLE`, any active booking is automatically marked `checked_out`, unlinked, and guest name, checkout date & deposit badge are cleared immediately. When changed to `DIRTY`, `CLEANING`, or `MAINTENANCE`, active bookings are checked out.
       adminName?: string;
     }): Promise<{ ok: true; unitId: string } | { ok: false; error: string }>
     ```
  6. **`getAdminRoomTypes(branchId?)`**:
     ```typescript
     export async function getAdminRoomTypes(branchId?: string): Promise<{ ok: true; roomTypes: AdminRoomTypeItem[] } | { ok: false; error: string }>
     ```
     - Returns room categories with base price, capacity, size, nominal inventory, and actual count of linked physical rooms (`physicalRoomsCount`).
  7. **`createRoomType(input)`**:
     ```typescript
     export async function createRoomType(input: CreateRoomTypeInput): Promise<{ ok: true; roomTypeId: string } | { ok: false; error: string }>
     ```
  8. **`updateRoomType(input)`**:
     ```typescript
     export async function updateRoomType(input: UpdateRoomTypeInput): Promise<{ ok: true; roomTypeId: string } | { ok: false; error: string }>
     ```
  9. **`deleteRoomType(roomTypeId)`**:
     ```typescript
     export async function deleteRoomType(roomTypeId: string): Promise<{ ok: true; deletedId: string } | { ok: false; error: string }>
     ```
     - Guard: Blocks deletion if physical rooms or active reservations are linked.
  10. **`updateRoomTypePricing(input)`**:
      ```typescript
      export async function updateRoomTypePricing(input: {
        roomTypeId: string;
        basePriceVnd: number;
        totalInventory?: number;
        adminName?: string;
      }): Promise<{ ok: true; roomTypeId: string } | { ok: false; error: string }>
      ```
  11. **`getAdminBranches()`**:
      ```typescript
      export async function getAdminBranches(): Promise<{ ok: true; branches: AdminBranchItem[] } | { ok: false; error: string }>
      ```
  12. **`updateRoomGuest(input)`**:
      ```typescript
      export async function updateRoomGuest(input: {
        roomUnitId: string;
        bookingId?: string;
        guestName: string;
        guestPhone?: string;
        checkOutDate?: string;
        depositAmountVnd?: number;
        adminName?: string;
      }): Promise<{ ok: true; bookingCode: string } | { ok: false; error: string }>
      ```
      - Updates active booking guest name & phone in `customers`, adjusts `check_out_date` in `bookings`, logs to audit.
  13. **`checkInRoomGuest(input)`**:
      ```typescript
      export async function checkInRoomGuest(input: {
        roomUnitId: string;
        guestName: string;
        guestPhone?: string;
        checkOutDate: string;
        depositAmountVnd?: number;
        adminName?: string;
      }): Promise<{ ok: true; bookingCode: string } | { ok: false; error: string }>
      ```
      - Quick Walk-in Check-in: Creates customer, generates booking code, creates booking with `checked_in` status, sets room unit to `OCCUPIED`.
  14. **`checkOutRoomGuest(input)`**:
      ```typescript
      export async function checkOutRoomGuest(input: {
        roomUnitId: string;
        bookingId?: string;
        adminName?: string;
      }): Promise<{ ok: true; unitId: string } | { ok: false; error: string }>
      ```
      - Quick Check-out: Updates active booking to `checked_out`, sets room unit to `DIRTY` (ready for housekeeping).

---

### 4. Real-time Hotel FAQs & Knowledge Base (`@/lib/actions/admin-faqs.ts`)
- **File**: [`lib/actions/admin-faqs.ts`](file:///d:/luxury-hotel-landing-page/lib/actions/admin-faqs.ts)
- **Functions**:
  1. **`getAdminFaqs(category?)`**: Retrieves all FAQs live from Neon Postgres.
  2. **`saveAdminFaq(input)`**: Inserts or updates an FAQ. Any changes immediately update the AI Concierge!
  3. **`deleteAdminFaq(id)`**: Deletes an FAQ item.

---

### 5. Mini-CRM & Lead Management (`@/lib/actions/admin-leads.ts`)
- **File**: [`lib/actions/admin-leads.ts`](file:///d:/luxury-hotel-landing-page/lib/actions/admin-leads.ts)
- **Functions**:
  1. **`getAdminLeads(filter)`**:
     ```typescript
     export async function getAdminLeads(rawFilter?: AdminLeadFilter): Promise<{
       ok: true;
       result: PaginatedResult<AdminLeadItem>;
     } | {
       ok: false;
       error: string;
     }>
     ```
     - **Filter Parameters**:
       - `stage?: 'all' | 'NEW' | 'CONTACTED' | 'CONSULTING' | 'PROPOSAL_SENT' | 'NEGOTIATING' | 'WON_BOOKED' | 'LOST'`
       - `source?: 'all' | 'WEBSITE' | 'AI_CHATBOT' | 'HOTLINE' | 'ZALO' | 'FACEBOOK' | 'WALK_IN' | 'REFERRAL' | 'EVENT'`
       - `priority?: 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VIP'`
       - `branchId?: string` (e.g. `'pml-dong-du'`)
       - `assignedStaff?: string`
       - `searchQuery?: string` (matches Name, Phone, Email, Tags)
       - `startDate?: string` (`YYYY-MM-DD`)
       - `endDate?: string` (`YYYY-MM-DD`)
       - `page?: number` (default 1)
       - `pageSize?: number` (default 10)
     - **Item includes**: Contact info, budget, pipeline stage, priority, branch/room preferences, tags, latest interaction snippet, and converted booking code.
  2. **`getAdminLeadDetails(leadId)`**:
     ```typescript
     export async function getAdminLeadDetails(leadId: string): Promise<{
       ok: true;
       lead: AdminLeadDetail;
     } | {
       ok: false;
       error: string;
     }>
     ```
     - Returns full lead profile and complete chronological interaction timeline (`interactions: LeadInteraction[]` including `CALL`, `ZALO`, `EMAIL`, `NOTE`, `MEETING`, `STAGE_CHANGE`).
  3. **`createLead(input)`**:
     ```typescript
     export async function createLead(input: CreateLeadInput): Promise<{
       ok: true;
       leadId: string;
     } | {
       ok: false;
       error: string;
     }>
     ```
     - Can be called by Admin UI, Landing Page Consultation forms, or AI Concierge when guest requests callback.
     - Automatically creates initial timestamped interaction note and logs admin audit.
  4. **`updateLead(input)`**:
     ```typescript
     export async function updateLead(input: UpdateLeadInput): Promise<{
       ok: true;
       leadId: string;
     } | {
       ok: false;
       error: string;
     }>
     ```
     - Updates customer preferences, estimated dates, budget, assigned sales staff, tags, and internal notes.
  5. **`updateLeadStage(input)`**:
     ```typescript
     export async function updateLeadStage(input: {
       leadId: string;
       stage: LeadStage;
       note?: string;
       staffName?: string;
     }): Promise<{ ok: true; leadId: string } | { ok: false; error: string }>
     ```
     - Moves lead across the CRM Pipeline (e.g. `NEW` → `CONTACTED` → `CONSULTING` → `PROPOSAL_SENT` → `WON_BOOKED` / `LOST`).
     - Automatically appends a `STAGE_CHANGE` entry into `lead_interactions`.
  6. **`addLeadInteraction(input)`**:
     ```typescript
     export async function addLeadInteraction(input: {
       leadId: string;
       type: 'CALL' | 'ZALO' | 'EMAIL' | 'NOTE' | 'MEETING' | 'STAGE_CHANGE';
       content: string;
       staffName?: string;
     }): Promise<{ ok: true; interactionId: string } | { ok: false; error: string }>
     ```
     - Records phone call logs, Zalo chat summaries, sent proposals, or meeting notes.
  7. **`convertLeadToBooking(input)`**:
     ```typescript
     export async function convertLeadToBooking(input: ConvertLeadToBookingInput): Promise<{
       ok: true;
       bookingId: string;
       bookingCode: string;
     } | {
       ok: false;
       error: string;
     }>
     ```
     - Converts a qualified lead directly into an active PMS reservation in Neon DB.
     - Auto-creates/matches `customers` table row.
     - Generates booking code (e.g. `PML-XXXX`), sets lead `stage = 'WON_BOOKED'`, and binds `converted_booking_id`.
     - Logs conversion details to interaction history and audit logs.
  8. **`getAdminLeadStats(branchId?)`**:
     ```typescript
     export async function getAdminLeadStats(branchId?: string): Promise<{
       ok: true;
       stats: AdminLeadStats;
     } | {
       ok: false;
       error: string;
     }>
     ```
     - Provides CRM dashboard KPIs: Total leads, New leads, Consulting leads, Won leads, Conversion rate (%), Total potential revenue, and breakdowns by Stage, Source, and Priority.

---

### 6. Admin Authentication & RBAC (`@/lib/actions/admin-auth.ts`)
- **File**: [`lib/actions/admin-auth.ts`](file:///d:/luxury-hotel-landing-page/lib/actions/admin-auth.ts)
- **Permissions Helper**: [`lib/auth-permissions.ts`](file:///d:/luxury-hotel-landing-page/lib/auth-permissions.ts)
- **Security & Proxy**: [`proxy.ts`](file:///d:/luxury-hotel-landing-page/proxy.ts) protects all `/admin/*` routes, redirecting unauthenticated users to `/admin/login`.
- **Functions**:
  1. **`loginAdmin(credentials)`**:
     ```typescript
     export async function loginAdmin(rawInput: LoginCredentials): Promise<{
       ok: true;
       user: AdminUser;
     } | {
       ok: false;
       error: string;
     }>
     ```
     - Validates username/email and password (PBKDF2 SHA-512 with salt).
     - Issues 7-day session in Neon DB (`admin_sessions`).
     - Sets secure HttpOnly cookie `pml_admin_session`.
     - Returns `user` with embedded `permissions: RolePermissions`.
  2. **`getCurrentAdmin()`**:
     ```typescript
     export async function getCurrentAdmin(): Promise<{
       ok: true;
       user: AdminUser;
     } | {
       ok: false;
       error: string;
     }>
     ```
     - Reads HttpOnly cookie and validates session against Neon DB.
     - Returns user profile, role, branch assignment, and `permissions`.
  3. **`logoutAdmin()`**:
     ```typescript
     export async function logoutAdmin(): Promise<{ ok: true } | { ok: false; error: string }>
     ```
     - Removes session from Neon DB and deletes `pml_admin_session` cookie.
  4. **`changeAdminPassword(input)`**:
     ```typescript
     export async function changeAdminPassword(rawInput: ChangePasswordInput): Promise<{
       ok: true;
     } | {
       ok: false;
       error: string;
     }>
     ```

- **Role-Based Access Control (RBAC) Matrix**:
  | Chức năng | 👑 `SUPER_ADMIN` | 👔 `MANAGER` | 🛎️ `RECEPTIONIST` | 🧹 `HOUSEKEEPING` |
  | :--- | :---: | :---: | :---: | :---: |
  | **Phạm vi dữ liệu** | Toàn bộ 3 cơ sở | Giới hạn cơ sở phụ trách | Giới hạn cơ sở phụ trách | Giới hạn cơ sở phụ trách |
  | **Overview (Doanh thu)** | ✅ Có | ✅ Có (cơ sở) | ❌ Không | ❌ Không |
  | **Quản lý phòng (Rooms)** | ✅ Có | ✅ Có | ✅ Có | ✅ Có (Dọn phòng) |
  | **Điều chỉnh giá phòng** | ✅ Có | ✅ Có | ❌ Không | ❌ Không |
  | **Đơn đặt phòng (Bookings)** | ✅ Có | ✅ Có | ✅ Có | ❌ Không |
  | **CRM Leads (Khách tiềm năng)** | ✅ Có | ✅ Có | ✅ Có | ❌ Không |
  | **Chốt Lead → Booking** | ✅ Có | ✅ Có | ✅ Có | ❌ Không |
  | **Knowledge Base (FAQs)** | ✅ Xem & Chỉnh sửa | ✅ Xem & Chỉnh sửa | 👁️ Chỉ xem hỗ trợ khách | ❌ Không |

- **Default Seeded Accounts**:
  | Username | Default Password | Role | Branch Assignment | Full Name |
  | :--- | :--- | :--- | :--- | :--- |
  | `admin` | `PmlAdmin@2026` | `SUPER_ADMIN` | All properties | Trần Văn Hoàng (Super Admin) |
  | `manager_dongdu` | `PmlDongDu@2026` | `MANAGER` | PML Đông Du | Nguyễn Thu Thảo (GM) |
  | `reception_onsen` | `PmlOnsen@2026` | `RECEPTIONIST` | PML Onsen Hai Bà Trưng | Phạm Minh Trang (Lễ tân) |
  | `housekeeping_cp` | `PmlHousekeeping@2026` | `HOUSEKEEPING` | PML Central Park | Lê Tuấn Kiệt (Buồng phòng) |


---

### 7. Real-Time Booking Engine & VietQR Payment System (`@/lib/actions/booking-engine.ts`)
- **File**: [`lib/actions/booking-engine.ts`](file:///d:/luxury-hotel-landing-page/lib/actions/booking-engine.ts)
- **Types**: [`types/booking-engine.ts`](file:///d:/luxury-hotel-landing-page/types/booking-engine.ts)
- **VietQR Generator**: [`lib/vietqr.ts`](file:///d:/luxury-hotel-landing-page/lib/vietqr.ts)
- **Payment Webhook**: [`app/api/webhooks/payment/route.ts`](file:///d:/luxury-hotel-landing-page/app/api/webhooks/payment/route.ts)
- **Interactive UI Wizard**: [`components/booking/booking-wizard.tsx`](file:///d:/luxury-hotel-landing-page/components/booking/booking-wizard.tsx) mounted at [`app/dat-phong/page.tsx`](file:///d:/luxury-hotel-landing-page/app/dat-phong/page.tsx)
- **Room Detail Quick Booking**: [`components/booking/room-booking-aside.tsx`](file:///d:/luxury-hotel-landing-page/components/booking/room-booking-aside.tsx) mounted on room pages [`app/phong/[slug]/page.tsx`](file:///d:/luxury-hotel-landing-page/app/phong/[slug]/page.tsx)
- **Predefined Room & Out-of-Stock Flow**:
  - Automatically reads `?room=...&branchId=...&checkIn=...&checkOut=...&guests=...` via `useSearchParams()`.
  - Auto-infers branch ID if omitted.
  - Automatically queries inventory for the selected room without requiring manual re-search.
  - **If Available**: Highlights room with badge `✓ Còn X phòng trống` and enables 1-click continuation to Step 2.
  - **If Sold Out (Hết phòng)**: Displays high-priority warning banner, disables booking button for that room, and immediately suggests alternative available rooms at the same branch, date change, or 24/7 hotline.
- **Anti-Overbooking Architecture**:
  $$\text{Available Rooms} = \text{effective\_inventory (from room\_units)} - (\text{confirmed / checked\_in / pending bookings} + \text{active unexpired room\_holds})$$
  - Physical room count (`room_units`) is the single source of truth for boutique hotel inventory.
  - Active `pending` bookings (e.g. `PAY_AT_HOTEL` or pending VietQR) strictly hold room inventory to prevent overbooking.
  - `createOnlineBooking` performs a strict server-side inventory verification before writing to the database. If zero rooms remain, the reservation is rejected.
- **Functions**:
  1. **`checkRoomAvailability(input)`**:
     ```typescript
     export async function checkRoomAvailability(input: CheckAvailabilityInput): Promise<{
       ok: true;
       branch: { id: string; name: string; address: string };
       nights: number;
       checkInDate: string;
       checkOutDate: string;
       roomTypes: AvailableRoomType[];
     } | { ok: false; error: string }>
     ```
     - Validates date range, calculates nights, queries Neon DB for active reservations and 15-minute room holds, computes available room count, and calculates total price for the entire stay.
  2. **`createRoomHold(input)`**:
     ```typescript
     export async function createRoomHold(input: CreateRoomHoldInput): Promise<{
       ok: true;
       holdToken: string;
       expiresAt: string; // ISO string (15 mins TTL)
     } | { ok: false; error: string }>
     ```
     - Acquires a 15-minute lock on room inventory in `room_holds` table during checkout to prevent concurrent booking conflicts.
  3. **`createOnlineBooking(input)`**:
     ```typescript
     export async function createOnlineBooking(input: CreateOnlineBookingInput): Promise<OnlineBookingResult>
     ```
     - Atomically verifies availability / releases room hold, creates/updates `customers` record, creates PMS `bookings` reservation with unique code (`PML-XXXX`), logs initial transaction in `payments` table, and automatically synchronizes a CRM Lead with stage `WON_BOOKED` into `leads` and `lead_interactions`.
     - Returns pre-calculated deposit amount, VietQR payload (with MB Bank `0789780167`, exact VND amount, transfer syntax `PML-XXXX`), and QR code image URL.
  4. **`checkBookingPaymentStatus(bookingCode)`**:
     ```typescript
     export async function checkBookingPaymentStatus(bookingCode: string): Promise<{
       ok: true;
       bookingCode: string;
       bookingStatus: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
       paymentStatus: 'pending' | 'unpaid' | 'partial' | 'paid' | 'refunded';
       totalAmountVnd: number;
       depositAmountVnd: number;
       paidAmountVnd: number;
       isFullyPaid: boolean;
       isDepositConfirmed: boolean;
     } | { ok: false; error: string }>
     ```
     - Real-time polling endpoint (used by client booking wizard every 3s) to detect incoming bank transfer confirmations.
  5. **`confirmBookingPayment(input)`**:
     ```typescript
     export async function confirmBookingPayment(input: {
       bookingCode: string;
       amountVnd: number;
       paymentMethod?: PaymentMethod;
       transactionCode?: string;
       gatewayResponse?: any;
     }): Promise<{ ok: true; bookingCode: string; paymentStatus: string } | { ok: false; error: string }>
     ```
     - Marks transaction as `completed` in `payments`, updates `bookings` status to `confirmed` and `payment_status` to `partial` or `paid`, updates linked CRM Lead, and logs admin activity.

---

### 8. Payment Webhook Endpoint (`/api/webhooks/payment`)
- **File**: [`app/api/webhooks/payment/route.ts`](file:///d:/luxury-hotel-landing-page/app/api/webhooks/payment/route.ts)
- **POST `/api/webhooks/payment`**:
  - Compatible with PayOS, SePay, and generic Vietnamese banking webhook formats.
  - Automatically extracts booking reference via regex `/PML-[A-Z0-9]+/i` from transfer descriptions (e.g. `"PML-K8J2 THANH TOAN DAT PHONG"`).
  - Matches the pending booking in Neon DB and calls `confirmBookingPayment`.
  - Supports sandbox simulation parameter `?sandbox=true` for testing without financial transactions.

---

### 9. AI Concierge & Chatbot (`/api/assistant`)
- **File**: [`app/api/assistant/route.ts`](file:///d:/luxury-hotel-landing-page/app/api/assistant/route.ts)
- **Capability**: Real-time room availability querying from Neon Postgres + automated follow-up suggestions + rich Room Cards with direct `/dat-phong?branchId=...&roomId=...` deep-linking.
- **POST `/api/assistant`**: Returns `{ reply, suggestions, roomCards }`.

---

## 🗄️ Neon PostgreSQL Database Schema

### Current Active Tables:
1. **`branches`**: Multi-property management (`pml-dong-du`, `pml-onsen-hai-ba-trung`, `pml-central-park`).
2. **`room_types`**: Room categories, pricing, size, capacity, inventory pool.
3. **`room_units`**: Physical rooms (`101`, `202`, `PH-01`) per floor with live status (`AVAILABLE`, `OCCUPIED`, `DIRTY`, `CLEANING`, `MAINTENANCE`).
4. **`customers`**: Guest CRM profiles with phones and booking history.
5. **`bookings`**: PMS reservation records, room assignments, payment methods, deposits, and stay dates.
6. **`faqs`**: Real-time knowledge base articles for helpdesk and AI Concierge.
7. **`services`**: Luxury amenities & experiences catalog (Onsen, Afternoon Tea, Airport pickup).
8. **`amenity_reservations`**: Experience bookings.
9. **`admin_activity_logs`**: Audit trail of admin actions (check-ins, price adjustments, status transitions).
10. **`leads`**: Mini-CRM potential customer records, pipeline stages (`NEW`, `CONSULTING`, `WON_BOOKED`, etc.), channels (`WEBSITE`, `AI_CHATBOT`, `HOTLINE`, `ZALO`), budget, and converted booking linkage.
11. **`lead_interactions`**: Comprehensive timeline of communications (`CALL`, `ZALO`, `EMAIL`, `NOTE`, `STAGE_CHANGE`) per lead.
12. **`admin_users`**: Hotel staff accounts, password hashes, salts, and roles (`SUPER_ADMIN`, `MANAGER`, `RECEPTIONIST`, `HOUSEKEEPING`).
13. **`admin_sessions`**: Active staff sessions with expiration dates, IP, and User-Agent.
14. **`payments`**: Payment transaction records with gateway reference, transfer description, payment method (`VIETQR`, `BANK_TRANSFER`, `CASH`, `VNPAY`, `STRIPE`), status (`pending`, `completed`, `failed`, `refunded`), and raw gateway payload.
15. **`room_holds`**: Temporary anti-overbooking inventory lock (15-minute TTL) with `hold_token`, `room_type_id`, `check_in_date`, `check_out_date`, `expires_at`, and `is_released`.

*Database URL configured in `.env.local` as `DATABASE_URL` on Neon Lakebase Postgres.*

---

## 🔄 Agent Hand-off Protocol

- **Cursor Responsibility (Frontend Specialist)**:
  - Build UI layouts under `app/(admin)/...`, public pages, and components in `components/admin/` or `components/ui/` or `components/booking/`.
  - Import Server Actions directly:
    ```typescript
    // Admin & PMS Actions
    import { getAdminDashboardStats } from '@/lib/actions/admin-dashboard'
    import { getAdminBookings, updateBookingStatus, updateBookingPayment } from '@/lib/actions/admin-bookings'
    import { getAdminRoomUnits, updateRoomUnitStatus, updateRoomTypePricing } from '@/lib/actions/admin-rooms'
    import { getAdminFaqs, saveAdminFaq, deleteAdminFaq } from '@/lib/actions/admin-faqs'
    import {
      getAdminLeads,
      getAdminLeadDetails,
      createLead,
      updateLead,
      updateLeadStage,
      addLeadInteraction,
      convertLeadToBooking,
      getAdminLeadStats,
    } from '@/lib/actions/admin-leads'
    import {
      loginAdmin,
      logoutAdmin,
      getCurrentAdmin,
      changeAdminPassword,
    } from '@/lib/actions/admin-auth'

    // Online Booking Engine & Payment Actions
    import {
      checkRoomAvailability,
      createRoomHold,
      createOnlineBooking,
      checkBookingPaymentStatus,
      confirmBookingPayment,
    } from '@/lib/actions/booking-engine'
    ```
  - Import shared types from `@/types/admin` and `@/types/booking-engine`.
- **Antigravity Responsibility (Backend & AI Architect)**:
  - Database migrations, performance indexing, and Neon connection.
  - Zod validation and transaction safety.
  - Maintain and update `docs/SYSTEM_STATE.md` with all backend capabilities.

---

## 🔵 UI Components Needed

> Logged by Cursor (Frontend) — awaiting Antigravity backend support.

1. **Admin Login Page (`/admin/login`)** [🟢 UI BOUND BY CURSOR]
   - `/admin/login` binds `loginAdmin`; admin shell header shows `getCurrentAdmin()` profile and `logoutAdmin`.
   - Route guard remains in `proxy.ts`.
2. **Room type CRUD for Admin Rooms**
   - `createRoomType` / `updateRoomType` / `getRoomTypes` (full catalog with capacity, bed type, description)
   - Current UI uses `getAdminRoomUnits` + `updateRoomUnitStatus` + `updateRoomTypePricing` only.
3. **Leads / CRM inbox** [🟢 UI BOUND BY CURSOR]
   - `/admin/leads` uses `getAdminLeads`, `getAdminLeadStats`, `getAdminLeadDetails`, `createLead`, `updateLeadStage`, `addLeadInteraction`, `convertLeadToBooking`.


