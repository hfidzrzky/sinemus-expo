# Graph Report - sinemus-expo  (2026-11-21)

## Corpus Check
- 587 files · ~274,205 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4103 nodes · 8282 edges · 250 communities (164 shown, 44 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `09e3dc30`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EventTransaction
- AdminMovieFilterRequest
- features/events/index.ts
- Movie
- TicketPdfService
- Sinemus Screen — Design System & Engineering Protocol (`DESIGN.md`)
- Illuminate\Http\Resources\Json\JsonResource
- Event
- Illuminate\Http\JsonResponse
- features/movies/index.ts
- auth/index.ts
- AdminStreamTestModal.tsx
- @tanstack/react-query
- SeatLock
- UpdateBusinessPoliciesRequest
- tickets/index.ts
- properties
- features/admin/index.ts
- Controller
- AdminMovieService
- properties
- Banner
- ConcurrencyBookingTest
- src/components/common/index.ts
- EventTabVenue.tsx
- Illuminate\Http\Request
- endpoints
- RootLayout.tsx
- properties
- listMyTickets
- ListMoviesRequest
- AdminUserController.php
- CloudflareStreamService
- admin/types/index.ts
- AdminLayout.tsx
- Mockery
- SinemusCinemaPlayer.tsx
- ListEventsRequest
- updateBusinessPolicies
- properties
- properties
- AdminOrderAuditService
- UpdateProfileRequest
- admin.handler.ts
- BannerFormModal.tsx
- app-provider.tsx
- Voucher
- properties
- useSettingsQueries.ts
- ApplyVoucherRequest
- properties
- package.json
- Illuminate\Database\Eloquent\Relations\BelongsTo
- SystemSetting
- properties
- properties
- properties
- properties
- MidtransSnapService
- User
- properties
- useEventMutations.ts
- properties
- status-dot.tsx
- AdminVoucherTest
- MidtransWebhookRequest
- AdminVoucherController
- DashboardAnalyticsService
- listAdminUsers
- properties
- properties
- useAdminUsersQuery.ts
- listScannerSessions
- AdminBannerController
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
- SinemusPlayerControls.tsx
- Illuminate\Foundation\Http\FormRequest
- listAdminOrders
- properties
- properties
- dependencies
- compilerOptions
- VoucherInvalidException
- properties
- properties
- getStreamAccess
- queryParameters
- 📖 Dokumentasi Rinci per Domain Kontrak
- MovieController.php
- react
- SystemSettingService
- endpoints
- movies.contract.json
- BannerController
- src/hooks/index.ts
- revokeMovieAccess
- GateSessionPicker.tsx
- GrantMovieAccessRequest
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
- AdminEventController.php
- ErrorBoundary.tsx
- AGENT.md — Strict Execution & Anti-Technical-Debt Blueprint
- Gatekeeper-QA Subagent Mandate & Audit Protocol
- properties
- scripts
- admin.contract.json
- auth.contract.json
- banners.contract.json
- mockServiceWorker.js
- Sinemus Screen — Campus Software Expo Edition
- utils.ts
- data
- listActiveBanners
- AppServiceProvider.php
- ReserveSeatsRequest
- Illuminate\Database\Migrations\Migration
- QuickSearchModal.tsx
- require-dev
- scripts
- Illuminate\Support\Facades\DB
- ReorderBannerRequest
- UpdatePublicContactRequest
- AdminUserFilterRequest
- TicketDetail
- seat_ids
- useCameraScanner.ts
- psr-4
- sanctum.php
- cancelOrder
- reserveEventSeats
- cast
- look_films
- src/mocks/browser.ts
- api.ts
- extra
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
- 2026_11_21_000001_drop_presale_fulfillment_columns_from_event_transactions_table.php
- Illuminate\Database\Schema\Blueprint
- VoucherService
- expires_at
- UpdateVoucherRequest
- GetUserTicketsRequest
- AdminBannerFilterRequest
- StoreBannerRequest
- UpdateBannerRequest
- PublicEndpointSecurityTest
- GetDashboardStatsRequest
- Illuminate\Support\Facades\Schema
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
- checkin_status
- vite-env.d.ts
- tailwind.config.ts
- tsconfig.json
- graphify.md
- createImageDirectUpload
- ScannerSessionsFilterRequest
- regular-event.blade.php
- ui-copy.ts
- pre-push
- setup-hooks.sh
- ValidateTicketQrRequest
- UpdateEmergencyControlsRequest
- GoogleAuthRequest
- MovieTransaction
- UserFactory.php
- SinemusSeekIndicator.tsx
- vite.config.ts
- error-formatter.ts
- Visual & UI Design Engineering Protocol (Anti-Slop & DESIGN.md SSOT)
- Visual & UI Design Engineering Protocol (Anti-Slop)

## God Nodes (most connected - your core abstractions)
1. `User` - 185 edges
2. `Event` - 150 edges
3. `react` - 149 edges
4. `EventTransaction` - 131 edges
5. `Schedule` - 115 edges
6. `Movie` - 113 edges
7. `lucide-react` - 108 edges
8. `TestCase` - 74 edges
9. `MovieTransaction` - 69 edges
10. `Voucher` - 69 edges

## Surprising Connections (you probably didn't know these)
- `AdminBannerController` --inherits--> `Controller`  [EXTRACTED]
  backend/app/Http/Controllers/Admin/V1/Banners/AdminBannerController.php → backend/app/Http/Controllers/Controller.php
- `AdminBannerController` --references--> `AdminBannerService`  [EXTRACTED]
  backend/app/Http/Controllers/Admin/V1/Banners/AdminBannerController.php → backend/app/Services/Admin/Banners/AdminBannerService.php
- `AdminCloudflareController` --inherits--> `Controller`  [EXTRACTED]
  backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php → backend/app/Http/Controllers/Controller.php
- `AdminDashboardController` --references--> `DashboardAnalyticsService`  [EXTRACTED]
  backend/app/Http/Controllers/Admin/V1/Dashboard/AdminDashboardController.php → backend/app/Services/Admin/Dashboard/DashboardAnalyticsService.php
- `AdminEventController` --inherits--> `Controller`  [EXTRACTED]
  backend/app/Http/Controllers/Admin/V1/Events/AdminEventController.php → backend/app/Http/Controllers/Controller.php

## Import Cycles
- None detected.

## Communities (250 total, 44 thin omitted)

### Community 0 - "EventTransaction"
Cohesion: 0.04
Nodes (11): ReconcileSeatOccupancyCommand, TestMailCommand, TicketConfirmationMail, EventTransaction, Schedule, TicketCheckin, AdminScheduleSeatService, UserTicketScenarioSeeder (+3 more)

### Community 1 - "AdminMovieFilterRequest"
Cohesion: 0.08
Nodes (5): AdminMovieFilterRequest, RevokeMovieAccessRequest, StoreMovieRequest, UpdateMovieRequest, AdminMovieRequestsTest

### Community 2 - "features/events/index.ts"
Cohesion: 0.06
Nodes (59): EVENT_DETAIL_QUERY_KEY, fetchEventDetail(), useEventDetailQuery(), EVENT_CITIES_QUERY_KEY, EVENT_FORMATS_QUERY_KEY, EVENTS_QUERY_KEY, fetchEventCities(), fetchEventFormats() (+51 more)

### Community 3 - "Movie"
Cohesion: 0.04
Nodes (11): Movie, UserMovieAccess, AdminMovieAccessService, AdminMovieCrudTest, MovieCatalogTest, MovieStreamTest, UserFilmTest, AdminMovieAccessServiceTest (+3 more)

### Community 4 - "TicketPdfService"
Cohesion: 0.06
Nodes (28): GenerateTicketPdfJob, SendTransactionEmailJob, TicketEmailPayloadBuilder, TicketPdfService, BaconQrCode\Common\ErrorCorrectionLevel, BaconQrCode\Encoder\Encoder, BaconQrCode\Renderer\Image\SvgImageBackEnd, BaconQrCode\Renderer\ImageRenderer (+20 more)

### Community 5 - "Sinemus Screen — Design System & Engineering Protocol (`DESIGN.md`)"
Cohesion: 0.07
Nodes (26): 1.1 Aesthetic Direction: Obsidian Dark Cinema & High-Performance Minimalist, 1.2 Anti-Patterns & Zero Visual Slop Mandates (STRICT), 1. Brand Identity & Visual Vibe, 2.1 Type Scale & Application Specs, 2. Typography Hierarchy, 3.1 Primitive Hex & Tailwind Palette Foundations, 3.2 Shadcn UI CSS Variables Integration (`src/index.css`), 3. Color System & Tokens (+18 more)

### Community 6 - "Illuminate\Http\Resources\Json\JsonResource"
Cohesion: 0.07
Nodes (13): AdminTicketScannerController, EventController, StreamVerificationResource, DashboardStatsResource, ScannerSessionResource, TicketValidationResource, EventDetailResource, EventSummaryResource (+5 more)

### Community 7 - "Event"
Cohesion: 0.05
Nodes (9): Event, Seat, Carbon, AdminEventTest, EventSalesWindowAndAutoDraftTest, MultiVenueEventSchemaTest, EventCatalogTest, ScheduleSeatMapTest (+1 more)

### Community 8 - "Illuminate\Http\JsonResponse"
Cohesion: 0.04
Nodes (17): PhoneLockedException, InvalidWebhookSignatureException, EventNotFoundException, ScheduleNotFoundException, MovieAlreadyRentedException, MovieNotRentableException, MovieRentalFrozenException, MovieStreamForbiddenException (+9 more)

### Community 9 - "features/movies/index.ts"
Cohesion: 0.07
Nodes (58): getAdminMoviesState(), fetchMovieDetail(), MOVIE_DETAIL_QUERY_KEY, useMovieDetailQuery(), fetchMovies(), MOVIES_QUERY_KEY, useMoviesQuery(), fetchMovieStreamAccess() (+50 more)

### Community 10 - "auth/index.ts"
Cohesion: 0.09
Nodes (44): CURRENT_USER_QUERY_KEY, fetchCurrentUser(), useCurrentUserQuery(), loginWithGoogle(), useGoogleAuthMutation(), logoutUser(), useLogoutMutation(), updateUserProfile() (+36 more)

### Community 11 - "AdminStreamTestModal.tsx"
Cohesion: 0.40
Nodes (4): StreamPreviewTokenResponse, useGenerateStreamPreviewTokenMutation(), AdminStreamTestModal(), AdminStreamTestModalProps

### Community 12 - "@tanstack/react-query"
Cohesion: 0.09
Nodes (49): applyVoucher(), useApplyVoucherMutation(), cancelOrder(), CancelOrderPayload, useCancelOrderMutation(), fetchPaymentStatus(), PAYMENT_STATUS_QUERY_KEY, usePaymentStatusQuery() (+41 more)

### Community 13 - "SeatLock"
Cohesion: 0.11
Nodes (10): PruneExpiredSeatLocksCommand, SeatUnavailableException, SeatLock, SeatReservationService, BannerSeeder, DatabaseSeeder, EventSeeder, VoucherSeeder (+2 more)

### Community 15 - "tickets/index.ts"
Cohesion: 0.12
Nodes (33): fetchMyFilms(), MY_FILMS_QUERY_KEY, useMyFilmsQuery(), fetchMyTickets(), MY_TICKETS_QUERY_KEY, useMyTicketsQuery(), fetchTicketDetail(), TICKET_DETAIL_QUERY_KEY (+25 more)

### Community 16 - "properties"
Cohesion: 0.05
Nodes (43): properties, access_id, access_status, active_movies_count, audit_meta, business_policies, buyer_name, checkin_status (+35 more)

### Community 17 - "features/admin/index.ts"
Cohesion: 0.07
Nodes (25): fetchPublicSettings(), usePublicSettingsQuery(), STREAM_METADATA_QUERY_KEY, useStreamVideoMetadataQuery(), CastInput(), CastInputProps, normalizeItem(), CloudflareStreamInput() (+17 more)

### Community 18 - "Controller"
Cohesion: 0.07
Nodes (16): AdminDashboardController, AdminMovieAccessController, AuthController, BookingController, MidtransWebhookController, Controller, ScheduleController, MovieRentalOrderController (+8 more)

### Community 19 - "AdminMovieService"
Cohesion: 0.16
Nodes (4): AdminMovieController, AdminMovieDetailResource, AdminMovieResource, AdminMovieService

### Community 20 - "properties"
Cohesion: 0.06
Nodes (46): endpoints, getEventDetail, getScheduleSeats, listCities, listEvents, listFormats, reserveSeats, description (+38 more)

### Community 21 - "Banner"
Cohesion: 0.05
Nodes (10): Banner, Attribute, Attribute, Attribute, Attribute, AdminBannerService, AdminBannerTest, BannerTest (+2 more)

### Community 23 - "src/components/common/index.ts"
Cohesion: 0.13
Nodes (14): AdminMaintenancePreviewBanner(), AdminMaintenancePreviewBannerProps, CinemaMaintenanceScreen(), CinemaMaintenanceScreenProps, CloudflareStreamPlayer(), CloudflareStreamPlayerProps, EmergencyAnnouncementBanner(), EmergencyAnnouncementBannerProps (+6 more)

### Community 24 - "EventTabVenue.tsx"
Cohesion: 0.06
Nodes (31): DateTimePicker24(), DateTimePicker24Props, formatIndonesianDateTime(), getTodayDateStr(), HOUR_OPTIONS, MINUTE_OPTIONS, parseDateTimeParts(), EventLivePreviewCardProps (+23 more)

### Community 25 - "Illuminate\Http\Request"
Cohesion: 0.06
Nodes (21): CheckoutController, TicketController, EnsureUserHasRole, AdminMovieAccessResource, OrderStatusResource, VoucherResource, EventVenueResource, TicketDetailResource (+13 more)

### Community 26 - "endpoints"
Cohesion: 0.06
Nodes (51): description, headers, method, path, response, endpoints, deleteCloudflareImage, getAdminUserDetail (+43 more)

### Community 27 - "RootLayout.tsx"
Cohesion: 0.20
Nodes (12): Footer(), FooterProps, getModalContent(), InfoModalContent, InfoModalType, MobileNavDrawer(), MobileNavDrawerProps, NAV_LINKS (+4 more)

### Community 28 - "properties"
Cohesion: 0.08
Nodes (32): description, type, enum, type, request, type, default, type (+24 more)

### Community 29 - "listMyTickets"
Cohesion: 0.06
Nodes (40): items, $ref, type, endpoints, getTicketDetail, listMyFilms, listMyTickets, description (+32 more)

### Community 30 - "ListMoviesRequest"
Cohesion: 0.11
Nodes (3): ListMoviesRequest, RentMovieRequest, MovieRequestsAndResourcesTest

### Community 31 - "AdminUserController.php"
Cohesion: 0.15
Nodes (5): AdminUserController, UpdateUserRoleRequest, AdminUserDetailResource, AdminUserListResource, AdminUserService

### Community 32 - "CloudflareStreamService"
Cohesion: 0.07
Nodes (9): StreamVideoMetadata, AdminCloudflareController, MovieStreamController, DirectUploadImageRequest, VerifyStreamUidRequest, MovieStreamAccessResource, CloudflareImageService, CloudflareStreamService (+1 more)

### Community 33 - "admin/types/index.ts"
Cohesion: 0.03
Nodes (74): ADMIN_MOVIE_ACCESS_QUERY_KEY, AdminMovieAccessQueryParams, fetchAdminMovieAccess(), useAdminMovieAccessQuery(), ADMIN_MOVIE_DETAIL_QUERY_KEY, fetchAdminMovieDetail(), useAdminMovieDetailQuery(), ADMIN_MOVIES_QUERY_KEY (+66 more)

### Community 34 - "AdminLayout.tsx"
Cohesion: 0.17
Nodes (8): AdminLayoutProps, AdminRouteGuardProps, AdminSidebar(), AdminSidebarProps, NavGroup, NavItem, AdminTopBar(), AdminTopBarProps

### Community 35 - "Mockery"
Cohesion: 0.08
Nodes (10): SyncPlatformDatabaseCommand, InvalidGoogleTokenException, GoogleAuthService, AuthEndpointsTest, GoogleAuthServiceTest, Google\Auth\Cache\FileSystemCacheItemPool, Google_Client, Mockery (+2 more)

### Community 36 - "SinemusCinemaPlayer.tsx"
Cohesion: 0.17
Nodes (10): SinemusCenterControls(), SinemusCenterControlsProps, SinemusPlayerHeader(), SinemusPlayerHeaderProps, SinemusPlayerOverlay(), SinemusPlayerOverlayProps, usePlayerControls(), UsePlayerControlsOptions (+2 more)

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
Cohesion: 0.06
Nodes (38): ADMIN_DASHBOARD_STATS_QUERY_KEY, DashboardStatsFilterParams, fetchAdminDashboardStats(), useDashboardStatsQuery(), DashboardKpiCardsProps, DEFAULT_TRENDS, RevenueTrendChartProps, TopPerformersFilterType (+30 more)

### Community 44 - "BannerFormModal.tsx"
Cohesion: 0.11
Nodes (23): ADMIN_BANNERS_QUERY_KEY, fetchAdminBanners(), useAdminBannersQuery(), fetchAdminMovies(), useAdminMoviesQuery(), useCreateBannerMutation(), useDeleteBannerMutation(), useReorderBannersMutation() (+15 more)

### Community 45 - "app-provider.tsx"
Cohesion: 0.40
Nodes (3): AppProviderProps, QueryProvider(), QueryProviderProps

### Community 46 - "Voucher"
Cohesion: 0.11
Nodes (3): Voucher, AdminVoucherService, VoucherTest

### Community 47 - "properties"
Cohesion: 0.08
Nodes (29): items, items, properties, $ref, required, type, available_seats_count, formatted_original_ticket_price (+21 more)

### Community 48 - "useSettingsQueries.ts"
Cohesion: 0.10
Nodes (15): ADMIN_SETTINGS_QUERY_KEY, fetchAdminSettings(), PUBLIC_SETTINGS_QUERY_KEY, PublicSettingsData, useAdminSettingsQuery(), SettingsBusinessTabProps, SettingsEmergencyTabProps, SettingsSubNavProps (+7 more)

### Community 50 - "properties"
Cohesion: 0.08
Nodes (26): enum, type, type, type, type, type, type, properties (+18 more)

### Community 51 - "package.json"
Cohesion: 0.08
Nodes (25): allowScripts, msw, workerDirectory, name, private, type, version, autoprefixer (+17 more)

### Community 52 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.04
Nodes (9): EventVenue, Illuminate\Database\Eloquent\Builder, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Database\Eloquent\Model, Illuminate\Database\Eloquent\Relations\BelongsTo, Illuminate\Database\Eloquent\Relations\HasMany, Illuminate\Database\Eloquent\Relations\HasOne, Illuminate\Notifications\Notifiable (+1 more)

### Community 53 - "SystemSetting"
Cohesion: 0.07
Nodes (5): SystemSetting, SystemSettingSeeder, AdminSettingsTest, MovieRentalOrderTest, Mockery\MockInterface

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
Nodes (25): type, type, type, type, type, type, enum, type (+17 more)

### Community 58 - "MidtransSnapService"
Cohesion: 0.21
Nodes (4): MidtransSnapService, MidtransSnapServiceTest, Illuminate\Http\Client\Response, RuntimeException

### Community 59 - "User"
Cohesion: 0.05
Nodes (19): User, UserProfileService, AdminCloudflareImageUploadTest, AdminCloudflareStreamVerifyTest, SystemSettingsIntegrationTest, AdminUserTest, GeneralAdmissionQuotaTest, PruneExpiredMovieRentalsCommandTest (+11 more)

### Community 60 - "properties"
Cohesion: 0.08
Nodes (24): type, type, format, type, type, enum, type, type (+16 more)

### Community 61 - "useEventMutations.ts"
Cohesion: 0.11
Nodes (13): ADMIN_EVENT_DETAIL_QUERY_KEY, fetchAdminEventDetail(), useAdminEventDetailQuery(), ADMIN_EVENTS_QUERY_KEY, AdminEventsFilterParams, fetchAdminEvents(), useAdminEventsQuery(), EventVenueCell() (+5 more)

### Community 62 - "properties"
Cohesion: 0.12
Nodes (17): updateAdminUserRole, type, $ref, message, meta, server_time, success, properties (+9 more)

### Community 63 - "status-dot.tsx"
Cohesion: 0.13
Nodes (18): ensureStatusDotStyles(), getStatusDotConfig(), ResolvedStatusDotConfig, resolveStatusDotA11yProps(), resolveStatusDotAccessibleName(), resolveStatusDotLabel(), RIPPLE_DELAYS, StatusDot (+10 more)

### Community 66 - "AdminVoucherController"
Cohesion: 0.14
Nodes (4): AdminVoucherController, AdminVoucherFilterRequest, StoreVoucherRequest, AdminVoucherResource

### Community 67 - "DashboardAnalyticsService"
Cohesion: 0.24
Nodes (3): DashboardAnalyticsService, Illuminate\Support\Carbon, Illuminate\Support\Collection

### Community 68 - "listAdminUsers"
Cohesion: 0.11
Nodes (19): listAdminUsers, type, description, headers, method, path, queryParameters, response (+11 more)

### Community 69 - "properties"
Cohesion: 0.10
Nodes (21): type, format, type, description, format, type, type, description (+13 more)

### Community 70 - "properties"
Cohesion: 0.10
Nodes (21): type, type, type, type, properties, format, type, duration_minutes (+13 more)

### Community 71 - "useAdminUsersQuery.ts"
Cohesion: 0.11
Nodes (20): fetchAdminUserDetail(), useAdminUserDetailQuery(), ADMIN_USERS_QUERY_KEY, AdminUsersResult, fetchAdminUsers(), useAdminUsersQuery(), useUpdateUserRoleMutation(), TabType (+12 more)

### Community 72 - "listScannerSessions"
Cohesion: 0.15
Nodes (13): listScannerSessions, description, headers, method, path, queryParameters, response, scope (+5 more)

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
Cohesion: 0.14
Nodes (13): definitions, MyFilmRentalItem, TicketItem, description, description, required, type, $schema (+5 more)

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

### Community 84 - "SinemusPlayerControls.tsx"
Cohesion: 0.28
Nodes (8): formatTime(), SinemusPlayerControls(), SinemusPlayerControlsProps, SinemusResolutionMenu(), SinemusResolutionMenuProps, UseShakaPlayerOptions, ResolutionTrack, SinemusCinemaPlayerProps

### Community 85 - "Illuminate\Foundation\Http\FormRequest"
Cohesion: 0.12
Nodes (3): Illuminate\Contracts\Validation\ValidationRule, Illuminate\Foundation\Http\FormRequest, Illuminate\Validation\Rule

### Community 86 - "listAdminOrders"
Cohesion: 0.12
Nodes (16): listAdminOrders, description, headers, method, path, queryParameters, response, default (+8 more)

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

### Community 97 - "MovieController.php"
Cohesion: 0.19
Nodes (4): MovieController, MovieDetailResource, MovieSummaryResource, MovieCatalogService

### Community 98 - "react"
Cohesion: 0.03
Nodes (64): App(), useCreateImageDirectUploadMutation(), useDeleteCloudflareImageMutation(), AdminConfirmModal(), AdminConfirmModalProps, AdminMediaUploadCardProps, CloudflareImageUpload(), CloudflareImageUploadProps (+56 more)

### Community 99 - "SystemSettingService"
Cohesion: 0.14
Nodes (3): PublicSettingController, CheckMaintenanceMode, SystemSettingService

### Community 100 - "endpoints"
Cohesion: 0.14
Nodes (13): description, endpoints, getPaymentStatus, midtransWebhook, description, method, path, description (+5 more)

### Community 101 - "movies.contract.json"
Cohesion: 0.14
Nodes (13): definitions, MovieDetail, MovieSummary, description, description, required, type, description (+5 more)

### Community 102 - "BannerController"
Cohesion: 0.36
Nodes (3): BannerController, BannerResource, BannerService

### Community 103 - "src/hooks/index.ts"
Cohesion: 0.27
Nodes (9): useDebounce(), useDebouncedSearch(), UseDebouncedSearchOptions, UseDebouncedSearchResult, useRateLimitCooldown(), UseRateLimitCooldownOptions, UseRateLimitCooldownReturn, useRecentSearches() (+1 more)

### Community 104 - "revokeMovieAccess"
Cohesion: 0.33
Nodes (6): revokeMovieAccess, description, headers, method, path, response

### Community 105 - "GateSessionPicker.tsx"
Cohesion: 0.11
Nodes (20): formatWibDate(), formatWibTime(), GateSessionPicker(), GateSessionPickerProps, getStatusBadge(), GroupedSessions, formatWibDateTime(), ScannerLiveStats() (+12 more)

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

### Community 118 - "AdminEventController.php"
Cohesion: 0.07
Nodes (10): AdminEventController, AdminEventFilterRequest, GenerateSeatMapRequest, StoreEventRequest, StoreScheduleRequest, UpdateEventRequest, AdminEventDetailResource, AdminEventListResource (+2 more)

### Community 119 - "ErrorBoundary.tsx"
Cohesion: 0.25
Nodes (3): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState

### Community 120 - "AGENT.md — Strict Execution & Anti-Technical-Debt Blueprint"
Cohesion: 0.17
Nodes (11): 0. Mandatory Execution Protocol (Graphify & Plan-First SOP), 1. Non-Negotiable Core Invariants, 2. Strict Security & Anti-Vulnerability Guardrails, 3. Production-Ready, Clean Code & Architecture Integrity Standards, 4. Backend Layering Standards (Laravel 11), 5.1 Visual & UI Design Engineering Protocol (Anti-Slop & DESIGN.md SSOT), 5. Frontend Feature-Driven Standards (React + Vite), 6. Checklist Eksekusi Sebelum Selesai Generate Kode (+3 more)

### Community 121 - "Gatekeeper-QA Subagent Mandate & Audit Protocol"
Cohesion: 0.18
Nodes (10): 1. Identitas & Persona Gatekeeper-QA, 2. Rules of Engagement & Standar Anti-Halusinasi, 3. Matriks 25 Pilar Audit (Security, Architecture, Performance & Scalability), 4. Format Output Wajib (Strict Non-Conversational), 5. Aturan Blokir Push & Larangan Push Otomatis (Enforcement Rule), A. Kepatuhan Arsitektur & Clean Architecture, B. Audit Keamanan & OWASP Top 10 (Zero Tolerance), C. Kualitas Kode, Strict Typing & Stack Standards (+2 more)

### Community 122 - "properties"
Cohesion: 0.18
Nodes (11): properties, description, type, type, enum, type, type, genre (+3 more)

### Community 123 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, dev, format, format:check, lint, lint:fix, postinstall (+3 more)

### Community 124 - "admin.contract.json"
Cohesion: 0.10
Nodes (19): description, properties, required, type, format, type, definitions, AdminUserListItem (+11 more)

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

### Community 132 - "AppServiceProvider.php"
Cohesion: 0.24
Nodes (5): AppServiceProvider, Illuminate\Cache\RateLimiting\Limit, Illuminate\Support\Facades\RateLimiter, Illuminate\Support\ServiceProvider, SimpleSoftwareIO\QrCode\QrCodeServiceProvider

### Community 136 - "QuickSearchModal.tsx"
Cohesion: 0.33
Nodes (4): FilterTab, QuickSearchModal(), QuickSearchModalProps, SearchItem

### Community 137 - "require-dev"
Cohesion: 0.33
Nodes (6): require-dev, fakerphp/faker, laravel/pint, mockery/mockery, nunomaduro/collision, phpunit/phpunit

### Community 138 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, format, lint, post-autoload-dump, post-install-cmd, pre-autoload-dump

### Community 139 - "Illuminate\Support\Facades\DB"
Cohesion: 0.07
Nodes (13): CloseExpiredEventsCommand, GenerateAdminTestToken, GenerateDevTokenCommand, AdminEventService, Command, DomainException, Illuminate\Console\Command, Illuminate\Contracts\Pagination\LengthAwarePaginator (+5 more)

### Community 143 - "TicketDetail"
Cohesion: 0.50
Nodes (4): TicketDetail, description, required, type

### Community 144 - "seat_ids"
Cohesion: 0.33
Nodes (6): type, seat_ids, items, maxItems, minItems, type

### Community 145 - "useCameraScanner.ts"
Cohesion: 0.40
Nodes (5): isVirtualCamera(), useCameraScanner(), UseCameraScannerOptions, UseCameraScannerReturn, html5-qrcode

### Community 147 - "psr-4"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 148 - "sanctum.php"
Cohesion: 0.50
Nodes (3): Illuminate\Cookie\Middleware\EncryptCookies, Illuminate\Foundation\Http\Middleware\ValidateCsrfToken, Laravel\Sanctum\Http\Middleware\AuthenticateSession

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

### Community 157 - "data"
Cohesion: 0.22
Nodes (9): items, $ref, required, type, properties, $ref, required, type (+1 more)

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

### Community 175 - "VoucherService"
Cohesion: 0.17
Nodes (5): MidtransWebhookDispatcherService, MovieRentalPaymentService, TicketPaymentService, VoucherService, InvalidArgumentException

### Community 176 - "expires_at"
Cohesion: 0.67
Nodes (3): format, type, expires_at

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

### Community 207 - "checkin_status"
Cohesion: 0.67
Nodes (3): enum, type, checkin_status

### Community 214 - "createImageDirectUpload"
Cohesion: 0.33
Nodes (6): description, headers, method, path, response, createImageDirectUpload

### Community 238 - "MovieTransaction"
Cohesion: 0.06
Nodes (11): PruneExpiredMovieRentalsCommand, OrderNotFoundException, MovieNotFoundException, MovieTransaction, OrderStatusService, MovieRentalOrderService, DashboardAnalyticsTest, Illuminate\Http\Client\ConnectionException (+3 more)

### Community 240 - "SinemusSeekIndicator.tsx"
Cohesion: 0.67
Nodes (3): SinemusSeekIndicator(), SinemusSeekIndicatorProps, SeekFeedbackState

### Community 250 - "Visual & UI Design Engineering Protocol (Anti-Slop & DESIGN.md SSOT)"
Cohesion: 0.40
Nodes (4): 1. Wajib Baca & Patuhi `DESIGN.md` Terlebih Dahulu, 2. Zero AI Visual Slop (Anti-Slop Rules), 3. Disiplin Layout & Micro-Interactions, Visual & UI Design Engineering Protocol (Anti-Slop & DESIGN.md SSOT)

## Knowledge Gaps
- **1008 isolated node(s):** `name`, `version`, `type`, `description`, `keywords` (+1003 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1546 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `features/events/index.ts`, `QuickSearchModal.tsx`, `features/movies/index.ts`, `auth/index.ts`, `AdminStreamTestModal.tsx`, `@tanstack/react-query`, `tickets/index.ts`, `features/admin/index.ts`, `useCameraScanner.ts`, `src/components/common/index.ts`, `EventTabVenue.tsx`, `RootLayout.tsx`, `admin/types/index.ts`, `AdminLayout.tsx`, `SinemusCinemaPlayer.tsx`, `admin.handler.ts`, `BannerFormModal.tsx`, `app-provider.tsx`, `useSettingsQueries.ts`, `package.json`, `useEventMutations.ts`, `status-dot.tsx`, `useAdminUsersQuery.ts`, `features/banners/index.ts`, `SinemusPlayerControls.tsx`, `src/hooks/index.ts`, `GateSessionPicker.tsx`, `SinemusSeekIndicator.tsx`, `ErrorBoundary.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `EventTransaction`, `Movie`, `Event`, `Illuminate\Http\JsonResponse`, `Illuminate\Support\Facades\DB`, `SeatLock`, `Controller`, `Banner`, `ConcurrencyBookingTest`, `Illuminate\Http\Request`, `AdminUserController.php`, `Mockery`, `Voucher`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `SystemSetting`, `MidtransSnapService`, `PublicEndpointSecurityTest`, `AdminVoucherTest`, `MidtransWebhookTest`, `MovieTransaction`, `UserFactory.php`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Event` connect `Event` to `EventTransaction`, `Movie`, `DashboardAnalyticsService`, `Illuminate\Http\Resources\Json\JsonResource`, `Illuminate\Http\JsonResponse`, `Illuminate\Support\Facades\DB`, `SeatLock`, `MovieTransaction`, `MidtransWebhookTest`, `PublicEndpointSecurityTest`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `Illuminate\Foundation\Http\FormRequest`, `AdminEventController.php`, `Banner`, `ConcurrencyBookingTest`, `User`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _1008 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EventTransaction` be split into smaller, more focused modules?**
  _Cohesion score 0.0438871473354232 - nodes in this community are weakly interconnected._
- **Should `AdminMovieFilterRequest` be split into smaller, more focused modules?**
  _Cohesion score 0.07977207977207977 - nodes in this community are weakly interconnected._
- **Should `features/events/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.062317429406037 - nodes in this community are weakly interconnected._