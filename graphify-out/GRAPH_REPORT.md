# Graph Report - sinemus-expo  (2026-11-03)

## Corpus Check
- 580 files · ~268,234 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4054 nodes · 8191 edges · 252 communities (182 shown, 27 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `226ccb41`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EventTransaction
- User
- features/events/index.ts
- Movie
- OrderStatusService
- Event
- Illuminate\Http\Request
- EventController
- Illuminate\Http\JsonResponse
- features/movies/index.ts
- auth/index.ts
- lucide-react
- checkout/index.ts
- DashboardAnalyticsService
- AdminSettingController
- tickets/index.ts
- properties
- features/admin/index.ts
- Controller
- AdminMovieController.php
- properties
- Banner
- api/index.ts
- src/components/common/index.ts
- EventTabVenue.tsx
- SystemSettingService
- endpoints
- properties
- properties
- listMyTickets
- ListMoviesRequest
- Illuminate\Support\Facades\DB
- CloudflareImageService
- admin/types/index.ts
- Illuminate\Database\Seeder
- Mockery
- SinemusCinemaPlayer.tsx
- Illuminate\Foundation\Http\FormRequest
- updateBusinessPolicies
- properties
- properties
- AdminOrderAuditService
- ConcurrencyBookingTest
- admin.handler.ts
- BannerFormModal.tsx
- react
- Voucher
- properties
- useSettingsQueries.ts
- useAdminUsersQuery.ts
- properties
- package.json
- Illuminate\Database\Eloquent\Relations\BelongsTo
- useMovieMutations.ts
- properties
- properties
- properties
- properties
- useAdminOrdersQuery.ts
- TestCase
- properties
- useEventMutations.ts
- properties
- status-dot.tsx
- AdminVoucherTest
- MidtransWebhookDispatcherService
- AdminVoucherController
- AdminUserController.php
- queryParameters
- properties
- properties
- MidtransSnapService
- VoucherFormModal.tsx
- CloudflareStreamService
- compilerOptions
- events.contract.json
- properties
- tickets.contract.json
- devDependencies
- features/banners/index.ts
- Getting Started Backend (Laravel Herd & Production-Parity Setup)
- updateProfile
- properties
- components.json
- UserMovieAccess
- AdminEventController.php
- queryParameters
- properties
- properties
- dependencies
- compilerOptions
- AdminSettingsTest
- properties
- properties
- getStreamAccess
- queryParameters
- 📖 Dokumentasi Rinci per Domain Kontrak
- properties
- AdminLayout.tsx
- AdminCloudflareStreamVerifyTest
- endpoints
- movies.contract.json
- listAdminUsers
- src/hooks/index.ts
- CloudflareStreamInput.tsx
- TicketController.php
- VoucherService
- config
- require
- MidtransWebhookTest
- properties
- data
- composer.json
- applyVoucher
- queryParameters
- properties
- properties
- seat_ids
- ScannerResultCard.tsx
- AdminUserDetail
- AGENT.md — Strict Execution & Anti-Technical-Debt Blueprint
- Gatekeeper-QA Subagent Mandate & Audit Protocol
- properties
- scripts
- properties
- auth.contract.json
- banners.contract.json
- mockServiceWorker.js
- Sinemus Screen — Campus Software Expo Edition
- utils.ts
- data
- listActiveBanners
- AppServiceProvider
- Illuminate\Database\Migrations\Migration
- Illuminate\Support\Facades\Schema
- ReserveSeatsRequest
- require-dev
- scripts
- Carbon
- TicketPdfService
- grantMovieAccess
- revokeMovieAccess
- createImageDirectUpload
- seat_ids
- useCameraScanner.ts
- DomainException
- psr-4
- sanctum.php
- cancelOrder
- reserveEventSeats
- cast
- look_films
- src/mocks/browser.ts
- api.ts
- extra
- admin.contract.json
- data
- birth_date
- googleAuth
- image_url
- genre
- access_model
- backdrop_url
- cast
- seat_codes
- token-storage.ts
- updateEmergencyControls
- verifyStreamUID
- SeatLock
- Illuminate\Database\Schema\Blueprint
- avatar_url
- birth_date
- RevenueTrendChart.tsx
- role
- age_rating
- badge_text
- button_text
- display_mode
- duration_minutes
- event_slug
- movie_slug
- release_year
- subtitle
- target_url
- title
- checkin_at
- checkin_status
- event_type
- vite-env.d.ts
- tailwind.config.ts
- tsconfig.json
- graphify.md
- tickets/presale-fulfilled.blade.php
- tickets/presale-receipt.blade.php
- regular-event.blade.php
- ui-copy.ts
- pre-push
- setup-hooks.sh
- Illuminate\Database\Eloquent\Casts\Attribute
- vite.config.ts
- Illuminate\Console\Command
- GrantMovieAccessRequest
- MovieCatalogTest
- MovieRentalOrderTest
- ValidateTicketQrRequest
- movies/hooks/index.ts
- AdminVoucherService
- SystemSettingsIntegrationTest
- app-provider.tsx

## God Nodes (most connected - your core abstractions)
1. `User` - 183 edges
2. `Event` - 148 edges
3. `react` - 148 edges
4. `EventTransaction` - 137 edges
5. `Movie` - 113 edges
6. `Schedule` - 108 edges
7. `lucide-react` - 108 edges
8. `TestCase` - 72 edges
9. `MovieTransaction` - 69 edges
10. `Voucher` - 69 edges

## Surprising Connections (you probably didn't know these)
- `AdminBannerController` --inherits--> `Controller`  [EXTRACTED]
  backend/app/Http/Controllers/Admin/V1/Banners/AdminBannerController.php → backend/app/Http/Controllers/Controller.php
- `AdminBannerController` --references--> `AdminBannerService`  [EXTRACTED]
  backend/app/Http/Controllers/Admin/V1/Banners/AdminBannerController.php → backend/app/Services/Admin/Banners/AdminBannerService.php
- `AdminCloudflareController` --inherits--> `Controller`  [EXTRACTED]
  backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php → backend/app/Http/Controllers/Controller.php
- `AdminCloudflareController` --references--> `CloudflareStreamService`  [EXTRACTED]
  backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php → backend/app/Services/Cloudflare/CloudflareStreamService.php
- `AdminDashboardController` --references--> `DashboardAnalyticsService`  [EXTRACTED]
  backend/app/Http/Controllers/Admin/V1/Dashboard/AdminDashboardController.php → backend/app/Services/Admin/Dashboard/DashboardAnalyticsService.php

## Import Cycles
- None detected.

## Communities (252 total, 27 thin omitted)

### Community 0 - "EventTransaction"
Cohesion: 0.07
Nodes (5): EventTransaction, Schedule, AdminOrderAuditTest, TicketScannerTest, UserTicketTest

### Community 1 - "User"
Cohesion: 0.07
Nodes (7): User, AdminUserService, UserProfileService, AdminUserTest, AuthEndpointsTest, UserProfileServiceTest, Illuminate\Foundation\Auth\User

### Community 2 - "features/events/index.ts"
Cohesion: 0.05
Nodes (69): RFC-5545, EVENT_DETAIL_QUERY_KEY, fetchEventDetail(), useEventDetailQuery(), EVENT_CITIES_QUERY_KEY, EVENT_FORMATS_QUERY_KEY, EVENTS_QUERY_KEY, fetchEventCities() (+61 more)

### Community 3 - "Movie"
Cohesion: 0.07
Nodes (6): Movie, MovieTransaction, AdminMovieService, AdminMovieCrudTest, PruneExpiredMovieRentalsCommandTest, AdminMovieServiceTest

### Community 4 - "OrderStatusService"
Cohesion: 0.08
Nodes (21): TestMailCommand, OrderNotFoundException, GenerateTicketPdfJob, SendTransactionEmailJob, TicketConfirmationMail, MovieRentalPaymentService, OrderStatusService, TicketPaymentService (+13 more)

### Community 5 - "Event"
Cohesion: 0.06
Nodes (5): Event, AdminEventTest, GeneralAdmissionQuotaTest, EventCatalogTest, Illuminate\Database\Eloquent\Relations\HasManyThrough

### Community 6 - "Illuminate\Http\Request"
Cohesion: 0.06
Nodes (19): CheckoutController, MovieStreamController, ApplyVoucherRequest, DashboardStatsResource, AdminEventListResource, AdminEventVenueResource, AdminScheduleResource, AdminMovieAccessResource (+11 more)

### Community 7 - "EventController"
Cohesion: 0.11
Nodes (5): EventController, ListEventsRequest, EventDetailResource, EventSummaryResource, EventCatalogService

### Community 8 - "Illuminate\Http\JsonResponse"
Cohesion: 0.04
Nodes (18): InvalidGoogleTokenException, PhoneLockedException, InvalidWebhookSignatureException, VoucherInvalidException, EventNotFoundException, ScheduleNotFoundException, MovieAlreadyRentedException, MovieNotRentableException (+10 more)

### Community 9 - "features/movies/index.ts"
Cohesion: 0.09
Nodes (49): getAdminMoviesState(), fetchMovieDetail(), MOVIE_DETAIL_QUERY_KEY, useMovieDetailQuery(), fetchMovies(), MOVIES_QUERY_KEY, useMoviesQuery(), fetchMovieStreamAccess() (+41 more)

### Community 10 - "auth/index.ts"
Cohesion: 0.09
Nodes (43): CURRENT_USER_QUERY_KEY, fetchCurrentUser(), useCurrentUserQuery(), loginWithGoogle(), useGoogleAuthMutation(), logoutUser(), useLogoutMutation(), updateUserProfile() (+35 more)

### Community 11 - "lucide-react"
Cohesion: 0.04
Nodes (33): formatTime(), SinemusPlayerControls(), SinemusPlayerControlsProps, SinemusResolutionMenu(), SinemusResolutionMenuProps, ResolutionTrack, AdminBannerEditorFormProps, AdminBannerEditorPageProps (+25 more)

### Community 12 - "checkout/index.ts"
Cohesion: 0.09
Nodes (50): applyVoucher(), useApplyVoucherMutation(), cancelOrder(), CancelOrderPayload, useCancelOrderMutation(), fetchPaymentStatus(), PAYMENT_STATUS_QUERY_KEY, usePaymentStatusQuery() (+42 more)

### Community 14 - "AdminSettingController"
Cohesion: 0.11
Nodes (4): AdminSettingController, UpdateBusinessPoliciesRequest, UpdateEmergencyControlsRequest, UpdatePublicContactRequest

### Community 15 - "tickets/index.ts"
Cohesion: 0.08
Nodes (40): GrantAccessModalProps, RevokeAccessModalProps, fetchMyFilms(), MY_FILMS_QUERY_KEY, useMyFilmsQuery(), fetchMyTickets(), MY_TICKETS_QUERY_KEY, useMyTicketsQuery() (+32 more)

### Community 16 - "properties"
Cohesion: 0.05
Nodes (37): properties, access_id, access_status, active_movies_count, audit_meta, business_policies, buyer_name, checkin_status (+29 more)

### Community 17 - "features/admin/index.ts"
Cohesion: 0.10
Nodes (16): fetchPublicSettings(), usePublicSettingsQuery(), AdminConfirmModalProps, CastInput(), CastInputProps, normalizeItem(), TagInputProps, MovieTabMediaAssetsProps (+8 more)

### Community 18 - "Controller"
Cohesion: 0.09
Nodes (13): AdminDashboardController, AuthController, BannerController, Controller, ScheduleController, UserFilmController, PublicSettingController, UserProfileController (+5 more)

### Community 19 - "AdminMovieController.php"
Cohesion: 0.07
Nodes (6): AdminMovieController, AdminMovieFilterRequest, StoreMovieRequest, UpdateMovieRequest, AdminMovieDetailResource, AdminMovieResource

### Community 20 - "properties"
Cohesion: 0.06
Nodes (46): endpoints, getEventDetail, getScheduleSeats, listCities, listEvents, listFormats, reserveSeats, description (+38 more)

### Community 21 - "Banner"
Cohesion: 0.07
Nodes (5): Banner, AdminBannerService, AdminBannerTest, BannerTest, Illuminate\Database\Eloquent\Collection

### Community 22 - "api/index.ts"
Cohesion: 0.10
Nodes (17): useCreateImageDirectUploadMutation(), useDeleteCloudflareImageMutation(), StreamPreviewTokenResponse, useGenerateStreamPreviewTokenMutation(), AdminMediaUploadCardProps, CloudflareImageUpload(), CloudflareImageUploadProps, AdminStreamTestModal() (+9 more)

### Community 23 - "src/components/common/index.ts"
Cohesion: 0.07
Nodes (21): AdminMaintenancePreviewBanner(), AdminMaintenancePreviewBannerProps, CinemaMaintenanceScreen(), CinemaMaintenanceScreenProps, CloudflareStreamPlayer(), CloudflareStreamPlayerProps, EmergencyAnnouncementBanner(), EmergencyAnnouncementBannerProps (+13 more)

### Community 24 - "EventTabVenue.tsx"
Cohesion: 0.07
Nodes (30): DateTimePicker24(), DateTimePicker24Props, formatIndonesianDateTime(), getTodayDateStr(), HOUR_OPTIONS, MINUTE_OPTIONS, parseDateTimeParts(), EventLivePreviewCardProps (+22 more)

### Community 25 - "SystemSettingService"
Cohesion: 0.11
Nodes (5): SystemSetting, SystemSettingService, UserTicketService, SystemSettingSeeder, Illuminate\Support\Collection

### Community 26 - "endpoints"
Cohesion: 0.07
Nodes (39): description, headers, method, path, response, endpoints, deleteCloudflareImage, getAdminUserDetail (+31 more)

### Community 27 - "properties"
Cohesion: 0.10
Nodes (21): properties, type, format, type, type, format, type, type (+13 more)

### Community 28 - "properties"
Cohesion: 0.09
Nodes (29): description, type, enum, type, request, type, default, type (+21 more)

### Community 29 - "listMyTickets"
Cohesion: 0.06
Nodes (40): items, $ref, type, endpoints, getTicketDetail, listMyFilms, listMyTickets, description (+32 more)

### Community 30 - "ListMoviesRequest"
Cohesion: 0.06
Nodes (9): MovieController, MovieRentalOrderController, ListMoviesRequest, RentMovieRequest, MovieDetailResource, MovieRentalOrderResource, MovieSummaryResource, MovieCatalogService (+1 more)

### Community 31 - "Illuminate\Support\Facades\DB"
Cohesion: 0.10
Nodes (13): BaconQrCode\Common\ErrorCorrectionLevel, BaconQrCode\Encoder\Encoder, BaconQrCode\Renderer\Image\SvgImageBackEnd, BaconQrCode\Renderer\ImageRenderer, BaconQrCode\Renderer\RendererStyle\RendererStyle, BaconQrCode\Writer, Barryvdh\DomPDF\PDF, Carbon\Carbon (+5 more)

### Community 32 - "CloudflareImageService"
Cohesion: 0.09
Nodes (6): StreamVideoMetadata, AdminCloudflareController, VerifyStreamUidRequest, StreamVerificationResource, CloudflareImageService, static

### Community 33 - "admin/types/index.ts"
Cohesion: 0.09
Nodes (23): ADMIN_MOVIE_ACCESS_QUERY_KEY, AdminMovieAccessQueryParams, fetchAdminMovieAccess(), useAdminMovieAccessQuery(), AdminMovieAccessItem, AdminOrderAuditLogsSnapshot, AdminOrderBuyerSnapshot, AdminOrderFinancialsSnapshot (+15 more)

### Community 34 - "Illuminate\Database\Seeder"
Cohesion: 0.21
Nodes (5): BannerSeeder, DatabaseSeeder, UserTicketScenarioSeeder, VoucherSeeder, Illuminate\Database\Seeder

### Community 35 - "Mockery"
Cohesion: 0.17
Nodes (5): GoogleAuthService, GoogleAuthServiceTest, Google\Auth\Cache\FileSystemCacheItemPool, Google_Client, Mockery

### Community 36 - "SinemusCinemaPlayer.tsx"
Cohesion: 0.14
Nodes (15): SinemusCenterControls(), SinemusCenterControlsProps, SinemusPlayerHeader(), SinemusPlayerHeaderProps, SinemusPlayerOverlay(), SinemusPlayerOverlayProps, SinemusSeekIndicator(), SinemusSeekIndicatorProps (+7 more)

### Community 37 - "Illuminate\Foundation\Http\FormRequest"
Cohesion: 0.04
Nodes (15): AdminBannerController, AdminBannerFilterRequest, ReorderBannerRequest, StoreBannerRequest, UpdateBannerRequest, DirectUploadImageRequest, GetDashboardStatsRequest, UpdateEventRequest (+7 more)

### Community 38 - "updateBusinessPolicies"
Cohesion: 0.12
Nodes (16): updateBusinessPolicies, updatePublicContact, $ref, description, headers, method, path, request (+8 more)

### Community 39 - "properties"
Cohesion: 0.06
Nodes (32): description, enum, type, description, type, format, type, properties (+24 more)

### Community 40 - "properties"
Cohesion: 0.06
Nodes (32): description, format, type, description, format, type, description, format (+24 more)

### Community 41 - "AdminOrderAuditService"
Cohesion: 0.10
Nodes (9): AdminOrderController, AdminOrderFilterRequest, ResendNotificationRequest, AdminOrderDetailResource, AdminOrderListResource, AdminOrderAuditService, AdminOrderExportService, Illuminate\Database\Query\Builder (+1 more)

### Community 43 - "admin.handler.ts"
Cohesion: 0.11
Nodes (24): getMockAdminStats(), mockAdminBanners, mockAdminEvents, mockAdminMovieAccess, mockAdminMovies, mockAdminOrders, mockAdminStats, mockAdminUsers (+16 more)

### Community 44 - "BannerFormModal.tsx"
Cohesion: 0.12
Nodes (22): ADMIN_BANNERS_QUERY_KEY, fetchAdminBanners(), useAdminBannersQuery(), useCreateBannerMutation(), useDeleteBannerMutation(), useReorderBannersMutation(), useUpdateBannerMutation(), BannerFormModalContent() (+14 more)

### Community 45 - "react"
Cohesion: 0.06
Nodes (34): App(), Footer(), FooterProps, getModalContent(), InfoModalContent, InfoModalType, MobileNavDrawer(), MobileNavDrawerProps (+26 more)

### Community 47 - "properties"
Cohesion: 0.08
Nodes (29): items, items, properties, $ref, required, type, available_seats_count, formatted_original_ticket_price (+21 more)

### Community 48 - "useSettingsQueries.ts"
Cohesion: 0.10
Nodes (15): ADMIN_SETTINGS_QUERY_KEY, fetchAdminSettings(), PUBLIC_SETTINGS_QUERY_KEY, PublicSettingsData, useAdminSettingsQuery(), SettingsBusinessTabProps, SettingsEmergencyTabProps, SettingsSubNavProps (+7 more)

### Community 49 - "useAdminUsersQuery.ts"
Cohesion: 0.11
Nodes (20): fetchAdminUserDetail(), useAdminUserDetailQuery(), ADMIN_USERS_QUERY_KEY, AdminUsersResult, fetchAdminUsers(), useAdminUsersQuery(), useUpdateUserRoleMutation(), TabType (+12 more)

### Community 50 - "properties"
Cohesion: 0.08
Nodes (26): enum, type, type, type, type, type, type, properties (+18 more)

### Community 51 - "package.json"
Cohesion: 0.09
Nodes (24): allowScripts, msw, workerDirectory, name, private, type, version, autoprefixer (+16 more)

### Community 52 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.04
Nodes (10): TicketCheckin, UserFactory, Illuminate\Database\Eloquent\Builder, Illuminate\Database\Eloquent\Factories\Factory, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Database\Eloquent\Model, Illuminate\Database\Eloquent\Relations\BelongsTo, Illuminate\Database\Eloquent\Relations\HasMany (+2 more)

### Community 53 - "useMovieMutations.ts"
Cohesion: 0.19
Nodes (9): ADMIN_MOVIE_DETAIL_QUERY_KEY, fetchAdminMovieDetail(), useAdminMovieDetailQuery(), ADMIN_MOVIES_QUERY_KEY, AdminMoviesQueryParams, fetchAdminMovies(), useAdminMoviesQuery(), AdminMovieItem (+1 more)

### Community 54 - "properties"
Cohesion: 0.10
Nodes (25): request, description, type, type, request, description, type, event_id (+17 more)

### Community 55 - "properties"
Cohesion: 0.08
Nodes (25): properties, required, type, type, enum, type, type, type (+17 more)

### Community 56 - "properties"
Cohesion: 0.08
Nodes (25): enum, type, description, type, description, type, type, properties (+17 more)

### Community 57 - "properties"
Cohesion: 0.08
Nodes (25): format, type, enum, type, type, type, type, type (+17 more)

### Community 58 - "useAdminOrdersQuery.ts"
Cohesion: 0.10
Nodes (21): fetchAdminOrderDetail(), useAdminOrderDetailQuery(), ADMIN_ORDERS_QUERY_KEY, AdminOrdersResult, fetchAdminOrders(), useAdminOrdersQuery(), ResendNotificationArgs, useResendOrderNotificationMutation() (+13 more)

### Community 59 - "TestCase"
Cohesion: 0.10
Nodes (12): DashboardAnalyticsTest, EventSalesWindowAndAutoDraftTest, TestCase, AdminMovieRequestsTest, Illuminate\Foundation\Testing\RefreshDatabase, Illuminate\Foundation\Testing\TestCase, Illuminate\Http\UploadedFile, Illuminate\Routing\Route (+4 more)

### Community 60 - "properties"
Cohesion: 0.08
Nodes (24): type, type, type, type, type, type, type, format (+16 more)

### Community 61 - "useEventMutations.ts"
Cohesion: 0.11
Nodes (13): ADMIN_EVENT_DETAIL_QUERY_KEY, fetchAdminEventDetail(), useAdminEventDetailQuery(), ADMIN_EVENTS_QUERY_KEY, AdminEventsFilterParams, fetchAdminEvents(), useAdminEventsQuery(), EventVenueCell() (+5 more)

### Community 62 - "properties"
Cohesion: 0.12
Nodes (17): validateTicketQR, type, $ref, message, meta, server_time, success, properties (+9 more)

### Community 63 - "status-dot.tsx"
Cohesion: 0.13
Nodes (18): ensureStatusDotStyles(), getStatusDotConfig(), ResolvedStatusDotConfig, resolveStatusDotA11yProps(), resolveStatusDotAccessibleName(), resolveStatusDotLabel(), RIPPLE_DELAYS, StatusDot (+10 more)

### Community 65 - "MidtransWebhookDispatcherService"
Cohesion: 0.19
Nodes (5): MidtransWebhookController, MidtransWebhookRequest, MidtransWebhookDispatcherService, InvalidArgumentException, RuntimeException

### Community 66 - "AdminVoucherController"
Cohesion: 0.12
Nodes (4): AdminVoucherController, StoreVoucherRequest, UpdateVoucherRequest, AdminVoucherResource

### Community 67 - "AdminUserController.php"
Cohesion: 0.12
Nodes (5): AdminUserController, AdminUserFilterRequest, UpdateUserRoleRequest, AdminUserDetailResource, AdminUserListResource

### Community 68 - "queryParameters"
Cohesion: 0.17
Nodes (12): type, queryParameters, default, type, enum, type, is_phone_locked, is_phone_locked (+4 more)

### Community 69 - "properties"
Cohesion: 0.10
Nodes (21): type, format, type, description, format, type, type, description (+13 more)

### Community 70 - "properties"
Cohesion: 0.10
Nodes (21): type, type, type, type, properties, format, type, duration_minutes (+13 more)

### Community 71 - "MidtransSnapService"
Cohesion: 0.14
Nodes (5): PruneExpiredMovieRentalsCommand, MidtransSnapService, MovieRentalOrderService, MidtransSnapServiceTest, Illuminate\Http\Client\Response

### Community 72 - "VoucherFormModal.tsx"
Cohesion: 0.13
Nodes (15): ADMIN_VOUCHERS_QUERY_KEY, AdminVouchersFilters, fetchAdminVouchers(), useAdminVouchersQuery(), useCreateVoucherMutation(), useUpdateVoucherMutation(), VoucherFormModalContent(), VoucherFormModalContentProps (+7 more)

### Community 73 - "CloudflareStreamService"
Cohesion: 0.16
Nodes (3): MovieNotFoundException, CloudflareStreamService, MovieStreamService

### Community 74 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 75 - "events.contract.json"
Cohesion: 0.11
Nodes (17): definitions, EventDetail, EventSummary, PaginationMeta, description, description, required, type (+9 more)

### Community 76 - "properties"
Cohesion: 0.11
Nodes (18): items, type, type, type, type, type, properties, type (+10 more)

### Community 77 - "tickets.contract.json"
Cohesion: 0.11
Nodes (17): definitions, MyFilmRentalItem, TicketDetail, TicketItem, description, description, required, type (+9 more)

### Community 78 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, msw, postcss (+10 more)

### Community 79 - "features/banners/index.ts"
Cohesion: 0.23
Nodes (12): BANNERS_QUERY_KEY, fetchBanners(), useBannersQuery(), HeroBannerCarousel(), HeroBannerCarouselProps, HeroBannerEmptyState(), HeroBannerEmptyStateProps, MOCK_BANNERS (+4 more)

### Community 80 - "Getting Started Backend (Laravel Herd & Production-Parity Setup)"
Cohesion: 0.12
Nodes (16): 1. Prasyarat Sistem, 2. Inisialisasi Project Backend, 3. Migrasi Database dan Storage Link, 4. Konfigurasi Web Server dengan Laravel Herd, 5. Menjalankan Task Scheduler (Cronjob Parity), 6. Menjalankan Queue Worker (Background Jobs), 7. Standar Terminal Saat Development, 8. Verifikasi Integrasi Frontend (+8 more)

### Community 81 - "updateProfile"
Cohesion: 0.13
Nodes (17): description, headers, method, path, endpoints, currentUser, logout, updateProfile (+9 more)

### Community 82 - "properties"
Cohesion: 0.19
Nodes (17): response, response, response, type, response, message, server_time, success (+9 more)

### Community 83 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 84 - "UserMovieAccess"
Cohesion: 0.08
Nodes (5): UserMovieAccess, AdminMovieAccessService, MovieStreamTest, UserFilmTest, AdminMovieAccessServiceTest

### Community 85 - "AdminEventController.php"
Cohesion: 0.08
Nodes (6): AdminEventController, AdminEventFilterRequest, GenerateSeatMapRequest, StoreEventRequest, StoreScheduleRequest, AdminEventDetailResource

### Community 86 - "queryParameters"
Cohesion: 0.20
Nodes (10): queryParameters, default, type, page, status, type, enum, type (+2 more)

### Community 87 - "properties"
Cohesion: 0.13
Nodes (16): request, description, type, maxLength, minLength, type, description, pattern (+8 more)

### Community 88 - "properties"
Cohesion: 0.16
Nodes (16): response, response, response, type, $ref, message, meta, server_time (+8 more)

### Community 89 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, clsx, embla-carousel-react, html5-qrcode, lucide-react, qrcode.react, react (+8 more)

### Community 90 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 92 - "properties"
Cohesion: 0.19
Nodes (15): response, response, response, type, message, server_time, success, properties (+7 more)

### Community 93 - "properties"
Cohesion: 0.13
Nodes (15): type, PaginationMeta, type, type, description, properties, required, type (+7 more)

### Community 94 - "getStreamAccess"
Cohesion: 0.13
Nodes (15): endpoints, getMovieDetail, getStreamAccess, listMovies, description, method, path, description (+7 more)

### Community 95 - "queryParameters"
Cohesion: 0.13
Nodes (15): type, type, queryParameters, default, type, default, type, genre (+7 more)

### Community 96 - "📖 Dokumentasi Rinci per Domain Kontrak"
Cohesion: 0.13
Nodes (14): 1. [`auth.contract.json`](./auth.contract.json) — Autentikasi & Profil Pengguna, 2. [`banners.contract.json`](./banners.contract.json) — Banner Promo & Hero Carousel, 3. [`movies.contract.json`](./movies.contract.json) — Video on Demand (VoD), 4. [`events.contract.json`](./events.contract.json) — Screening Bioskop & Denah Kursi, 5. [`checkout.contract.json`](./checkout.contract.json) — Pembayaran & Gateway Midtrans, 6. [`tickets.contract.json`](./tickets.contract.json) — Tiket Saya & Akses Sewa, 7. [`admin.contract.json`](./admin.contract.json) — Super Admin & Petugas Scanner, 📖 Dokumentasi Rinci per Domain Kontrak (+6 more)

### Community 97 - "properties"
Cohesion: 0.13
Nodes (15): type, properties, type, format, type, type, type, booking_code (+7 more)

### Community 98 - "AdminLayout.tsx"
Cohesion: 0.17
Nodes (8): AdminLayoutProps, AdminRouteGuardProps, AdminSidebar(), AdminSidebarProps, NavGroup, NavItem, AdminTopBar(), AdminTopBarProps

### Community 99 - "AdminCloudflareStreamVerifyTest"
Cohesion: 0.09
Nodes (7): AdminCloudflareImageUploadTest, AdminCloudflareStreamVerifyTest, Illuminate\Http\Client\ConnectionException, Illuminate\Http\Client\RequestException, Illuminate\Support\Facades\Cache, Illuminate\Support\Facades\Config, Illuminate\Support\Facades\Http

### Community 100 - "endpoints"
Cohesion: 0.14
Nodes (13): description, endpoints, getPaymentStatus, midtransWebhook, description, method, path, description (+5 more)

### Community 101 - "movies.contract.json"
Cohesion: 0.14
Nodes (13): definitions, MovieDetail, MovieSummary, description, description, required, type, description (+5 more)

### Community 102 - "listAdminUsers"
Cohesion: 0.33
Nodes (6): listAdminUsers, description, headers, method, path, response

### Community 103 - "src/hooks/index.ts"
Cohesion: 0.27
Nodes (9): useDebounce(), useDebouncedSearch(), UseDebouncedSearchOptions, UseDebouncedSearchResult, useRateLimitCooldown(), UseRateLimitCooldownOptions, UseRateLimitCooldownReturn, useRecentSearches() (+1 more)

### Community 104 - "CloudflareStreamInput.tsx"
Cohesion: 0.24
Nodes (7): STREAM_METADATA_QUERY_KEY, useStreamVideoMetadataQuery(), CloudflareStreamInput(), CloudflareStreamInputProps, StreamVideoMetadata, VerifyStreamUidPayload, formatStreamDuration()

### Community 105 - "TicketController.php"
Cohesion: 0.13
Nodes (13): TicketController, CheckMaintenanceMode, EnsureUserHasRole, Closure, Illuminate\Auth\AuthenticationException, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions, Illuminate\Foundation\Configuration\Middleware (+5 more)

### Community 107 - "config"
Cohesion: 0.15
Nodes (13): block, pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, platform, policy (+5 more)

### Community 108 - "require"
Cohesion: 0.15
Nodes (13): require, barryvdh/laravel-dompdf, google/apiclient, intervention/image, khanamiryan/qrcode-detector-decoder, laravel/framework, laravel/sanctum, laravel/tinker (+5 more)

### Community 110 - "properties"
Cohesion: 0.15
Nodes (13): items, type, $ref, type, data, message, server_time, success (+5 more)

### Community 111 - "data"
Cohesion: 0.15
Nodes (13): items, properties, $ref, required, type, $ref, data, playback_url (+5 more)

### Community 112 - "composer.json"
Cohesion: 0.17
Nodes (11): autoload-dev, psr-4, description, keywords, license, minimum-stability, name, prefer-stable (+3 more)

### Community 113 - "applyVoucher"
Cohesion: 0.17
Nodes (12): description, headers, method, path, applyVoucher, rentMovie, headers, Authorization (+4 more)

### Community 114 - "queryParameters"
Cohesion: 0.17
Nodes (12): type, enum, type, queryParameters, default, type, city, city (+4 more)

### Community 115 - "properties"
Cohesion: 0.17
Nodes (12): type, ScheduleSeatMap, cols, rows, ticket_price, items, type, description (+4 more)

### Community 116 - "properties"
Cohesion: 0.17
Nodes (12): properties, $ref, required, type, data, discount_amount, expires_at, gross_amount (+4 more)

### Community 117 - "seat_ids"
Cohesion: 0.17
Nodes (12): schedule_id, seat_ids, voucher_code, properties, required, type, request, type (+4 more)

### Community 118 - "ScannerResultCard.tsx"
Cohesion: 0.18
Nodes (5): ScannerLiveStatsProps, ScheduleOption, ScannerResultCardProps, ScannerViewportProps, ScannerScanResult

### Community 119 - "AdminUserDetail"
Cohesion: 0.22
Nodes (9): description, required, type, description, required, type, definitions, AdminUserDetail (+1 more)

### Community 120 - "AGENT.md — Strict Execution & Anti-Technical-Debt Blueprint"
Cohesion: 0.18
Nodes (10): 0. Mandatory Execution Protocol (Graphify & Plan-First SOP), 1. Non-Negotiable Core Invariants, 2. Strict Security & Anti-Vulnerability Guardrails, 3. Production-Ready, Clean Code & Architecture Integrity Standards, 4. Backend Layering Standards (Laravel 11), 5. Frontend Feature-Driven Standards (React + Vite), 6. Checklist Eksekusi Sebelum Selesai Generate Kode, 7. Rujukan Berkas Kunci (+2 more)

### Community 121 - "Gatekeeper-QA Subagent Mandate & Audit Protocol"
Cohesion: 0.18
Nodes (10): 1. Identitas & Persona Gatekeeper-QA, 2. Rules of Engagement & Standar Anti-Halusinasi, 3. Matriks 25 Pilar Audit (Security, Architecture, Performance & Scalability), 4. Format Output Wajib (Strict Non-Conversational), 5. Aturan Blokir Push & Larangan Push Otomatis (Enforcement Rule), A. Kepatuhan Arsitektur & Clean Architecture, B. Audit Keamanan & OWASP Top 10 (Zero Tolerance), C. Kualitas Kode, Strict Typing & Stack Standards (+2 more)

### Community 122 - "properties"
Cohesion: 0.18
Nodes (11): properties, description, type, type, enum, type, type, genre (+3 more)

### Community 123 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, dev, format, format:check, lint, lint:fix, postinstall (+3 more)

### Community 124 - "properties"
Cohesion: 0.22
Nodes (9): properties, type, type, type, type, email, google_id_masked, id (+1 more)

### Community 125 - "auth.contract.json"
Cohesion: 0.20
Nodes (9): definitions, User, description, $schema, title, description, required, type (+1 more)

### Community 126 - "banners.contract.json"
Cohesion: 0.20
Nodes (9): description, required, type, definitions, BannerItem, description, $schema, title (+1 more)

### Community 127 - "mockServiceWorker.js"
Cohesion: 0.36
Nodes (8): activeClientIds, getResponse(), handleRequest(), IS_MOCKED_RESPONSE, resolveMainClient(), respondWithMock(), sendToClient(), serializeRequest()

### Community 128 - "Sinemus Screen — Campus Software Expo Edition"
Cohesion: 0.20
Nodes (9): Fitur Utama & Rekayasa Perangkat Lunak, Lisensi & Hak Cipta, Mode 1: Jalur Cepat Frontend (Standar Demo Booth), Mode 2: Jalur Full-Stack (Frontend + Backend API), Panduan Menjalankan Demo (Quick Start), Sinemus Screen — Campus Software Expo Edition, Struktur Direktori, Tech Stack (+1 more)

### Community 130 - "data"
Cohesion: 0.25
Nodes (8): properties, $ref, required, type, data, is_new_user, token, user

### Community 131 - "listActiveBanners"
Cohesion: 0.25
Nodes (8): endpoints, listActiveBanners, description, method, path, response, required, type

### Community 132 - "AppServiceProvider"
Cohesion: 0.33
Nodes (3): AppServiceProvider, Illuminate\Support\ServiceProvider, SimpleSoftwareIO\QrCode\QrCodeServiceProvider

### Community 136 - "ReserveSeatsRequest"
Cohesion: 0.19
Nodes (4): BookingController, ReserveSeatsRequest, SeatReservationResource, Illuminate\Validation\Validator

### Community 137 - "require-dev"
Cohesion: 0.33
Nodes (6): require-dev, fakerphp/faker, laravel/pint, mockery/mockery, nunomaduro/collision, phpunit/phpunit

### Community 138 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, format, lint, post-autoload-dump, post-install-cmd, pre-autoload-dump

### Community 139 - "Carbon"
Cohesion: 0.12
Nodes (4): EventVenue, Carbon, TicketEmailPayloadBuilder, MultiVenuePresaleSchemaTest

### Community 140 - "TicketPdfService"
Cohesion: 0.15
Nodes (4): TicketPdfService, Illuminate\Foundation\Inspiring, Illuminate\Support\Facades\Artisan, Illuminate\Support\Facades\Schedule

### Community 141 - "grantMovieAccess"
Cohesion: 0.33
Nodes (6): grantMovieAccess, description, headers, method, path, response

### Community 142 - "revokeMovieAccess"
Cohesion: 0.33
Nodes (6): revokeMovieAccess, description, headers, method, path, response

### Community 143 - "createImageDirectUpload"
Cohesion: 0.33
Nodes (6): description, headers, method, path, response, createImageDirectUpload

### Community 144 - "seat_ids"
Cohesion: 0.33
Nodes (6): type, seat_ids, items, maxItems, minItems, type

### Community 145 - "useCameraScanner.ts"
Cohesion: 0.22
Nodes (6): isVirtualCamera(), useCameraScanner(), UseCameraScannerOptions, UseCameraScannerReturn, TabConfig, html5-qrcode

### Community 146 - "DomainException"
Cohesion: 0.13
Nodes (5): ReconcileSeatOccupancyCommand, AdminEventService, AdminScheduleSeatService, DomainException, Illuminate\Support\Arr

### Community 147 - "psr-4"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 148 - "sanctum.php"
Cohesion: 0.40
Nodes (4): Illuminate\Cookie\Middleware\EncryptCookies, Illuminate\Foundation\Http\Middleware\ValidateCsrfToken, Laravel\Sanctum\Http\Middleware\AuthenticateSession, Laravel\Sanctum\Sanctum

### Community 149 - "cancelOrder"
Cohesion: 0.40
Nodes (5): description, headers, method, path, cancelOrder

### Community 150 - "reserveEventSeats"
Cohesion: 0.40
Nodes (5): reserveEventSeats, description, headers, method, path

### Community 151 - "cast"
Cohesion: 0.40
Nodes (5): description, items, type, oneOf, cast

### Community 152 - "look_films"
Cohesion: 0.40
Nodes (5): type, description, items, type, look_films

### Community 154 - "api.ts"
Cohesion: 0.40
Nodes (4): ApiErrorResponse, ApiResponse, PaginatedApiResponse, PaginationMeta

### Community 155 - "extra"
Cohesion: 0.50
Nodes (4): extra, google/apiclient-services, laravel, dont-discover

### Community 156 - "admin.contract.json"
Cohesion: 0.40
Nodes (4): description, $schema, title, version

### Community 157 - "data"
Cohesion: 0.33
Nodes (6): items, $ref, required, type, $ref, data

### Community 159 - "birth_date"
Cohesion: 0.50
Nodes (4): description, format, type, birth_date

### Community 160 - "googleAuth"
Cohesion: 0.50
Nodes (4): googleAuth, description, method, path

### Community 161 - "image_url"
Cohesion: 0.50
Nodes (4): description, format, type, image_url

### Community 162 - "genre"
Cohesion: 0.50
Nodes (4): description, items, type, genre

### Community 163 - "access_model"
Cohesion: 0.50
Nodes (4): default, enum, type, access_model

### Community 164 - "backdrop_url"
Cohesion: 0.50
Nodes (4): description, format, type, backdrop_url

### Community 165 - "cast"
Cohesion: 0.50
Nodes (4): items, type, anyOf, cast

### Community 166 - "seat_codes"
Cohesion: 0.50
Nodes (4): type, seat_codes, items, type

### Community 167 - "token-storage.ts"
Cohesion: 0.50
Nodes (3): ROLE_KEY, TOKEN_KEY, tokenStorage

### Community 168 - "updateEmergencyControls"
Cohesion: 0.33
Nodes (6): updateEmergencyControls, description, headers, method, path, response

### Community 173 - "verifyStreamUID"
Cohesion: 0.33
Nodes (6): verifyStreamUID, description, headers, method, path, response

### Community 175 - "SeatLock"
Cohesion: 0.10
Nodes (6): SeatUnavailableException, Seat, SeatLock, SeatReservationService, EventSeeder, ScheduleSeatMapTest

### Community 185 - "avatar_url"
Cohesion: 0.67
Nodes (3): format, type, avatar_url

### Community 186 - "birth_date"
Cohesion: 0.67
Nodes (3): format, type, birth_date

### Community 187 - "RevenueTrendChart.tsx"
Cohesion: 0.13
Nodes (14): ADMIN_DASHBOARD_STATS_QUERY_KEY, DashboardStatsFilterParams, fetchAdminDashboardStats(), useDashboardStatsQuery(), DashboardKpiCardsProps, DEFAULT_TRENDS, RevenueTrendChartProps, TopPerformersFilterType (+6 more)

### Community 189 - "role"
Cohesion: 0.67
Nodes (4): role, role, enum, type

### Community 195 - "age_rating"
Cohesion: 0.67
Nodes (3): description, type, age_rating

### Community 196 - "badge_text"
Cohesion: 0.67
Nodes (3): description, type, badge_text

### Community 197 - "button_text"
Cohesion: 0.67
Nodes (3): default, type, button_text

### Community 198 - "display_mode"
Cohesion: 0.67
Nodes (3): enum, type, display_mode

### Community 199 - "duration_minutes"
Cohesion: 0.67
Nodes (3): description, type, duration_minutes

### Community 200 - "event_slug"
Cohesion: 0.67
Nodes (3): description, type, event_slug

### Community 201 - "movie_slug"
Cohesion: 0.67
Nodes (3): description, type, movie_slug

### Community 202 - "release_year"
Cohesion: 0.67
Nodes (3): release_year, description, type

### Community 203 - "subtitle"
Cohesion: 0.67
Nodes (3): subtitle, description, type

### Community 204 - "target_url"
Cohesion: 0.67
Nodes (3): target_url, description, type

### Community 205 - "title"
Cohesion: 0.67
Nodes (3): title, description, type

### Community 206 - "checkin_at"
Cohesion: 0.67
Nodes (3): format, type, checkin_at

### Community 207 - "checkin_status"
Cohesion: 0.67
Nodes (3): enum, type, checkin_status

### Community 208 - "event_type"
Cohesion: 0.67
Nodes (3): enum, type, event_type

### Community 233 - "Illuminate\Database\Eloquent\Casts\Attribute"
Cohesion: 0.14
Nodes (7): Attribute, Attribute, Attribute, Attribute, Illuminate\Database\Eloquent\Casts\Attribute, Illuminate\Notifications\Notifiable, Laravel\Sanctum\HasApiTokens

### Community 238 - "Illuminate\Console\Command"
Cohesion: 0.13
Nodes (9): CloseExpiredEventsCommand, GenerateAdminTestToken, GenerateDevTokenCommand, PruneExpiredSeatLocksCommand, SyncPlatformDatabaseCommand, Command, Illuminate\Console\Command, PDO (+1 more)

### Community 239 - "GrantMovieAccessRequest"
Cohesion: 0.13
Nodes (3): AdminMovieAccessController, GrantMovieAccessRequest, RevokeMovieAccessRequest

### Community 242 - "ValidateTicketQrRequest"
Cohesion: 0.21
Nodes (4): AdminTicketScannerController, ValidateTicketQrRequest, TicketValidationResource, TicketValidationService

### Community 243 - "movies/hooks/index.ts"
Cohesion: 0.30
Nodes (9): calculateInitialRemaining(), MovieRentalCountdownState, useMovieRentalCountdown(), UseMovieRentalCountdownOptions, MovieWatchPlayerControls, MovieWatchPlayerState, useMovieWatchPlayer(), UseMovieWatchPlayerOptions (+1 more)

### Community 250 - "app-provider.tsx"
Cohesion: 0.40
Nodes (3): AppProviderProps, QueryProvider(), QueryProviderProps

## Knowledge Gaps
- **999 isolated node(s):** `name`, `version`, `type`, `description`, `keywords` (+994 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1524 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `EventTransaction`, `Movie`, `OrderStatusService`, `Event`, `Illuminate\Http\JsonResponse`, `Carbon`, `DashboardAnalyticsService`, `Banner`, `SystemSettingService`, `Illuminate\Support\Facades\DB`, `Illuminate\Database\Seeder`, `Mockery`, `ConcurrencyBookingTest`, `Voucher`, `SeatLock`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `TestCase`, `AdminVoucherTest`, `MidtransSnapService`, `CloudflareStreamService`, `UserMovieAccess`, `AdminSettingsTest`, `AdminCloudflareStreamVerifyTest`, `TicketController.php`, `Illuminate\Database\Eloquent\Casts\Attribute`, `MidtransWebhookTest`, `Illuminate\Console\Command`, `MovieCatalogTest`, `MovieRentalOrderTest`, `SystemSettingsIntegrationTest`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `features/events/index.ts`, `features/movies/index.ts`, `auth/index.ts`, `lucide-react`, `checkout/index.ts`, `tickets/index.ts`, `features/admin/index.ts`, `useCameraScanner.ts`, `api/index.ts`, `src/components/common/index.ts`, `EventTabVenue.tsx`, `SinemusCinemaPlayer.tsx`, `BannerFormModal.tsx`, `useSettingsQueries.ts`, `useAdminUsersQuery.ts`, `package.json`, `useAdminOrdersQuery.ts`, `RevenueTrendChart.tsx`, `useEventMutations.ts`, `status-dot.tsx`, `VoucherFormModal.tsx`, `features/banners/index.ts`, `AdminLayout.tsx`, `src/hooks/index.ts`, `CloudflareStreamInput.tsx`, `movies/hooks/index.ts`, `ScannerResultCard.tsx`, `app-provider.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Event` connect `Event` to `EventTransaction`, `User`, `OrderStatusService`, `Illuminate\Http\Request`, `EventController`, `Carbon`, `DashboardAnalyticsService`, `DomainException`, `Banner`, `SystemSettingService`, `Illuminate\Database\Seeder`, `Illuminate\Foundation\Http\FormRequest`, `ConcurrencyBookingTest`, `SeatLock`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `TestCase`, `AdminEventController.php`, `AdminCloudflareStreamVerifyTest`, `Illuminate\Database\Eloquent\Casts\Attribute`, `MidtransWebhookTest`, `Illuminate\Console\Command`, `SystemSettingsIntegrationTest`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _999 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EventTransaction` be split into smaller, more focused modules?**
  _Cohesion score 0.06594071385359952 - nodes in this community are weakly interconnected._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.07419712070874862 - nodes in this community are weakly interconnected._
- **Should `features/events/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05347985347985348 - nodes in this community are weakly interconnected._