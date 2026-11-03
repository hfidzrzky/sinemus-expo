# Graph Report - sinemus-expo  (2026-11-03)

## Corpus Check
- 611 files · ~295,901 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4268 nodes · 8793 edges · 269 communities (175 shown, 55 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `be923156`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EventTransaction
- User
- features/events/index.ts
- Movie
- DomainException
- Illuminate\Database\Eloquent\Relations\BelongsTo
- Illuminate\Http\Request
- UpdateEventRequest
- Illuminate\Http\JsonResponse
- features/movies/index.ts
- auth/index.ts
- react
- checkout/index.ts
- MovieTransaction
- CinemaTicketStorageManager
- tickets/index.ts
- properties
- Illuminate\Support\Facades\Log
- Controller
- AdminMovieFilterRequest
- properties
- Banner
- CloudflareImageUpload.tsx
- src/components/common/index.ts
- admin/components/common/index.ts
- SystemSettingService
- endpoints
- BulkInjectTicketsRequest
- properties
- listMyTickets
- ListMoviesRequest
- SystemSetting
- CloudflareStreamService
- admin/types/index.ts
- SeatLock
- Mockery
- SinemusCinemaPlayer.tsx
- AdminBannerController
- AdminPresaleInjectTest
- properties
- properties
- AdminOrderController.php
- @tanstack/react-query
- admin.handler.ts
- BannerFormModal.tsx
- lucide-react
- Voucher
- properties
- SettingsEmergencyTab.tsx
- useAdminUsersQuery.ts
- properties
- package.json
- AdminVoucherController
- TicketPdfService
- properties
- properties
- properties
- properties
- useAdminOrdersQuery.ts
- CloudflareStreamInput.tsx
- properties
- useEventMutations.ts
- properties
- status-dot.tsx
- AdminVoucherTest
- FulfillmentReviewMatrixModal.tsx
- UpdateBusinessPoliciesRequest
- AdminUserController.php
- listAdminUsers
- properties
- properties
- Illuminate\Foundation\Http\FormRequest
- VoucherFormModal.tsx
- DashboardKpiCards.tsx
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
- RootLayout.tsx
- ListEventsRequest
- listAdminOrders
- properties
- properties
- dependencies
- compilerOptions
- Authorization
- properties
- properties
- getStreamAccess
- queryParameters
- 📖 Dokumentasi Rinci per Domain Kontrak
- properties
- features/admin/index.ts
- MidtransWebhookDispatcherService
- endpoints
- movies.contract.json
- useMovieMutations.ts
- src/hooks/index.ts
- useSettingsQueries.ts
- ReserveSeatsRequest
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
- movies/hooks/index.ts
- AGENT.md — Strict Execution & Anti-Technical-Debt Blueprint
- Gatekeeper-QA Subagent Mandate & Audit Protocol
- properties
- scripts
- MovieRentalOrderTest
- auth.contract.json
- banners.contract.json
- mockServiceWorker.js
- Sinemus Screen — Campus Software Expo Edition
- utils.ts
- data
- listActiveBanners
- AppServiceProvider
- Illuminate\Database\Schema\Blueprint
- Illuminate\Database\Migrations\Migration
- Illuminate\Support\Facades\Schema
- TicketNotFoundException
- require-dev
- scripts
- items
- confirmSmartCinemaTicketsFulfillment
- grantMovieAccess
- revokeMovieAccess
- validateTicketQR
- seat_ids
- useCameraScanner.ts
- Illuminate\Console\Command
- psr-4
- sanctum.php
- cancelOrder
- reserveEventSeats
- cast
- look_films
- src/mocks/browser.ts
- api.ts
- extra
- assets_zip
- csv_file
- qr_image
- birth_date
- googleAuth
- image_url
- genre
- access_model
- backdrop_url
- cast
- seat_codes
- token-storage.ts
- vite.config.ts
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
- AdminMovieService
- Illuminate\Database\Seeder
- Illuminate\Contracts\Validation\ValidationRule
- ConcurrencyBookingTest
- TicketConfirmationMail
- AdminOrderFilterRequest
- MidtransSnapService
- BannerController
- app.php
- TicketEmailPayloadBuilder
- ScheduleController
- RevokeMovieAccessRequest
- ReorderBannerRequest
- StoreEventRequest
- GrantMovieAccessRequest
- ConfirmSmartIngestRequest
- InjectCinemaTicketRequest
- StoreVoucherRequest
- ApplyVoucherRequest
- AdminDashboardPage.tsx
- StoreBannerRequest
- UpdateBannerRequest
- VerifyStreamUidRequest
- StoreScheduleRequest
- PreviewSmartIngestRequest
- ValidateTicketQrRequest
- UpdatePublicContactRequest
- AdminUserFilterRequest
- UpdateUserRoleRequest
- ProcessBulkInjectCinemaTicketsJob
- SystemSettingsIntegrationTest
- DirectUploadImageRequest
- GenerateSeatMapRequest
- CloudflareStreamService.php
- UserFactory.php
- console.php
- PruneExpiredMovieRentalsCommand.php

## God Nodes (most connected - your core abstractions)
1. `User` - 189 edges
2. `EventTransaction` - 171 edges
3. `Event` - 163 edges
4. `react` - 154 edges
5. `Schedule` - 135 edges
6. `Movie` - 113 edges
7. `lucide-react` - 113 edges
8. `TestCase` - 74 edges
9. `Voucher` - 69 edges
10. `MovieTransaction` - 68 edges

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

## Communities (269 total, 55 thin omitted)

### Community 0 - "EventTransaction"
Cohesion: 0.04
Nodes (12): TestMailCommand, Event, EventTransaction, Schedule, Seat, PresaleCinemaTicketSeeder, UserTicketScenarioSeeder, AdminEventTest (+4 more)

### Community 1 - "User"
Cohesion: 0.04
Nodes (25): User, UserProfileService, AdminCloudflareImageUploadTest, AdminCloudflareStreamVerifyTest, DashboardAnalyticsTest, EventSalesWindowAndAutoDraftTest, AdminUserTest, GeneralAdmissionQuotaTest (+17 more)

### Community 2 - "features/events/index.ts"
Cohesion: 0.05
Nodes (75): RFC-5545, EVENT_DETAIL_QUERY_KEY, fetchEventDetail(), useEventDetailQuery(), EVENT_CITIES_QUERY_KEY, EVENT_FORMATS_QUERY_KEY, EVENTS_QUERY_KEY, fetchEventCities() (+67 more)

### Community 3 - "Movie"
Cohesion: 0.04
Nodes (11): Movie, UserMovieAccess, AdminMovieAccessService, AdminMovieCrudTest, MovieCatalogTest, MovieStreamTest, UserFilmTest, AdminMovieAccessServiceTest (+3 more)

### Community 4 - "DomainException"
Cohesion: 0.06
Nodes (13): ReconcileSeatOccupancyCommand, AdminEventService, AdminScheduleSeatService, BatchFulfillmentConfirmationAction, SingleTicketInjectionAction, SmartIngestMatcherAction, CinemaTicketFulfillmentService, AdminUserService (+5 more)

### Community 5 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.04
Nodes (12): EventVenue, TicketCheckin, Illuminate\Database\Eloquent\Builder, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Database\Eloquent\Model, Illuminate\Database\Eloquent\Relations\BelongsTo, Illuminate\Database\Eloquent\Relations\HasMany, Illuminate\Database\Eloquent\Relations\HasManyThrough (+4 more)

### Community 6 - "Illuminate\Http\Request"
Cohesion: 0.05
Nodes (20): AdminEventController, AdminPresaleInjectController, CheckoutController, AdminEventDetailResource, AdminEventListResource, AdminEventVenueResource, AdminScheduleResource, AdminMovieAccessResource (+12 more)

### Community 7 - "UpdateEventRequest"
Cohesion: 0.10
Nodes (4): UpdateEventRequest, UpdateVoucherRequest, UpdateProfileRequest, Illuminate\Validation\Rule

### Community 8 - "Illuminate\Http\JsonResponse"
Cohesion: 0.06
Nodes (17): InvalidGoogleTokenException, PhoneLockedException, InvalidWebhookSignatureException, EventNotFoundException, ScheduleNotFoundException, MovieAlreadyRentedException, MovieNotFoundException, MovieNotRentableException (+9 more)

### Community 9 - "features/movies/index.ts"
Cohesion: 0.09
Nodes (49): getAdminMoviesState(), fetchMovieDetail(), MOVIE_DETAIL_QUERY_KEY, useMovieDetailQuery(), fetchMovies(), MOVIES_QUERY_KEY, useMoviesQuery(), fetchMovieStreamAccess() (+41 more)

### Community 10 - "auth/index.ts"
Cohesion: 0.09
Nodes (43): CURRENT_USER_QUERY_KEY, fetchCurrentUser(), useCurrentUserQuery(), loginWithGoogle(), useGoogleAuthMutation(), logoutUser(), useLogoutMutation(), updateUserProfile() (+35 more)

### Community 11 - "react"
Cohesion: 0.05
Nodes (22): App(), AdminBannerEditorFormProps, AdminBannerEditorPageProps, AdminBannersPageProps, AdminEventsPageProps, AdminMovieAccessPageProps, AdminMoviesPageProps, AdminOrdersPageProps (+14 more)

### Community 12 - "checkout/index.ts"
Cohesion: 0.09
Nodes (48): applyVoucher(), useApplyVoucherMutation(), cancelOrder(), CancelOrderPayload, useCancelOrderMutation(), fetchPaymentStatus(), PAYMENT_STATUS_QUERY_KEY, usePaymentStatusQuery() (+40 more)

### Community 13 - "MovieTransaction"
Cohesion: 0.05
Nodes (9): OrderNotFoundException, MovieTransaction, DashboardAnalyticsService, AdminOrderAuditService, MovieRentalPaymentService, OrderStatusService, AdminOrderAuditTest, Illuminate\Database\Query\Builder (+1 more)

### Community 14 - "CinemaTicketStorageManager"
Cohesion: 0.06
Nodes (13): VoucherInvalidException, CinemaPdfParserService, CinemaQrImageExtractor, CinemaTicketStorageManager, CinemaTicketTextExtractor, PdfTicketExtractorService, ZipArchiveExtractorService, BaconQrCode\Encoder\Encoder (+5 more)

### Community 15 - "tickets/index.ts"
Cohesion: 0.08
Nodes (43): fetchMyFilms(), MY_FILMS_QUERY_KEY, useMyFilmsQuery(), fetchMyTickets(), MY_TICKETS_QUERY_KEY, useMyTicketsQuery(), fetchTicketDetail(), TICKET_DETAIL_QUERY_KEY (+35 more)

### Community 16 - "properties"
Cohesion: 0.04
Nodes (54): example, type, example, type, properties, example, type, access_id (+46 more)

### Community 17 - "Illuminate\Support\Facades\Log"
Cohesion: 0.30
Nodes (10): GenerateTicketPdfJob, SendCinemaTicketReadyEmailJob, SendTransactionEmailJob, Illuminate\Bus\Queueable, Illuminate\Contracts\Queue\ShouldQueue, Illuminate\Foundation\Bus\Dispatchable, Illuminate\Queue\InteractsWithQueue, Illuminate\Queue\SerializesModels (+2 more)

### Community 18 - "Controller"
Cohesion: 0.07
Nodes (14): AdminDashboardController, AdminMovieAccessController, AuthController, BookingController, Controller, EventController, MovieStreamController, UserFilmController (+6 more)

### Community 19 - "AdminMovieFilterRequest"
Cohesion: 0.09
Nodes (4): AdminMovieFilterRequest, StoreMovieRequest, UpdateMovieRequest, AdminMovieRequestsTest

### Community 20 - "properties"
Cohesion: 0.06
Nodes (46): endpoints, getEventDetail, getScheduleSeats, listCities, listEvents, listFormats, reserveSeats, description (+38 more)

### Community 21 - "Banner"
Cohesion: 0.05
Nodes (9): Banner, Attribute, Attribute, Attribute, Attribute, AdminBannerService, AdminBannerTest, BannerTest (+1 more)

### Community 22 - "CloudflareImageUpload.tsx"
Cohesion: 0.07
Nodes (20): useCreateImageDirectUploadMutation(), useDeleteCloudflareImageMutation(), AdminMediaUploadCardProps, CloudflareImageUpload(), CloudflareImageUploadProps, MovieLookFilmsUploader(), MovieLookFilmsUploaderProps, CloudflareDirectUploadResponse (+12 more)

### Community 23 - "src/components/common/index.ts"
Cohesion: 0.07
Nodes (21): AdminMaintenancePreviewBanner(), AdminMaintenancePreviewBannerProps, CinemaMaintenanceScreen(), CinemaMaintenanceScreenProps, CloudflareStreamPlayer(), CloudflareStreamPlayerProps, EmergencyAnnouncementBanner(), EmergencyAnnouncementBannerProps (+13 more)

### Community 24 - "admin/components/common/index.ts"
Cohesion: 0.06
Nodes (33): AdminConfirmModal(), AdminConfirmModalProps, DateTimePicker24(), DateTimePicker24Props, formatIndonesianDateTime(), getTodayDateStr(), HOUR_OPTIONS, MINUTE_OPTIONS (+25 more)

### Community 25 - "SystemSettingService"
Cohesion: 0.08
Nodes (12): PublicSettingController, TicketController, CheckMaintenanceMode, EnsureUserHasRole, TicketDetailResource, TicketItemResource, SystemSettingService, UserTicketService (+4 more)

### Community 26 - "endpoints"
Cohesion: 0.06
Nodes (40): description, method, path, response, description, headers, method, path (+32 more)

### Community 28 - "properties"
Cohesion: 0.07
Nodes (40): description, type, enum, type, request, request, request, type (+32 more)

### Community 29 - "listMyTickets"
Cohesion: 0.06
Nodes (40): items, $ref, type, endpoints, getTicketDetail, listMyFilms, listMyTickets, description (+32 more)

### Community 30 - "ListMoviesRequest"
Cohesion: 0.07
Nodes (10): MovieController, MovieRentalOrderController, ListMoviesRequest, RentMovieRequest, MovieDetailResource, MovieRentalOrderResource, MovieSummaryResource, MovieCatalogService (+2 more)

### Community 32 - "CloudflareStreamService"
Cohesion: 0.08
Nodes (7): StreamVideoMetadata, AdminCloudflareController, StreamVerificationResource, CloudflareImageService, CloudflareStreamService, MovieStreamService, static

### Community 33 - "admin/types/index.ts"
Cohesion: 0.08
Nodes (28): ADMIN_MOVIE_ACCESS_QUERY_KEY, AdminMovieAccessQueryParams, fetchAdminMovieAccess(), useAdminMovieAccessQuery(), CastInput(), CastInputProps, normalizeItem(), AdminMovieAccessItem (+20 more)

### Community 34 - "SeatLock"
Cohesion: 0.11
Nodes (12): SeatUnavailableException, SeatLock, SeatReservationService, ScheduleSeatMapTest, BaconQrCode\Common\ErrorCorrectionLevel, BaconQrCode\Renderer\Image\SvgImageBackEnd, BaconQrCode\Renderer\ImageRenderer, BaconQrCode\Renderer\RendererStyle\RendererStyle (+4 more)

### Community 35 - "Mockery"
Cohesion: 0.10
Nodes (7): GoogleAuthService, AuthEndpointsTest, GoogleAuthServiceTest, Google\Auth\Cache\FileSystemCacheItemPool, Google_Client, Mockery, Throwable

### Community 36 - "SinemusCinemaPlayer.tsx"
Cohesion: 0.12
Nodes (21): SinemusCenterControls(), SinemusCenterControlsProps, formatTime(), SinemusPlayerControls(), SinemusPlayerControlsProps, SinemusPlayerHeader(), SinemusPlayerHeaderProps, SinemusPlayerOverlay() (+13 more)

### Community 39 - "properties"
Cohesion: 0.06
Nodes (32): description, enum, type, description, type, format, type, properties (+24 more)

### Community 40 - "properties"
Cohesion: 0.06
Nodes (32): description, format, type, description, format, type, description, format (+24 more)

### Community 41 - "AdminOrderController.php"
Cohesion: 0.23
Nodes (3): AdminOrderController, AdminOrderDetailResource, AdminOrderListResource

### Community 42 - "@tanstack/react-query"
Cohesion: 0.10
Nodes (23): ADMIN_FULFILLMENT_QUERY_KEY, BulkInjectTicketsArgs, ConfirmSmartIngestArgs, StreamPreviewTokenResponse, useGenerateStreamPreviewTokenMutation(), InjectCinemaTicketArgs, useInjectCinemaTicketMutation(), PreviewSmartIngestArgs (+15 more)

### Community 43 - "admin.handler.ts"
Cohesion: 0.10
Nodes (26): getMockAdminStats(), mockAdminBanners, mockAdminEvents, mockAdminMovieAccess, mockAdminMovies, mockAdminOrders, mockAdminStats, mockAdminUsers (+18 more)

### Community 44 - "BannerFormModal.tsx"
Cohesion: 0.12
Nodes (21): ADMIN_BANNERS_QUERY_KEY, fetchAdminBanners(), useAdminBannersQuery(), useCreateBannerMutation(), useDeleteBannerMutation(), useReorderBannersMutation(), useUpdateBannerMutation(), BannerFormModalContent() (+13 more)

### Community 45 - "lucide-react"
Cohesion: 0.08
Nodes (25): TabType, UserDetailModalProps, UserPhoneLockBadge(), UserPhoneLockBadgeProps, EventDetailPage(), EventDetailPageProps, EventsCataloguePage(), EventsCataloguePageProps (+17 more)

### Community 46 - "Voucher"
Cohesion: 0.10
Nodes (3): Voucher, AdminVoucherService, VoucherTest

### Community 47 - "properties"
Cohesion: 0.08
Nodes (29): items, items, properties, $ref, required, type, available_seats_count, formatted_original_ticket_price (+21 more)

### Community 48 - "SettingsEmergencyTab.tsx"
Cohesion: 0.16
Nodes (9): SettingsBusinessTabProps, SettingsEmergencyTabProps, SettingsSubNavProps, SettingsSupportTabProps, BusinessPoliciesConfig, EmergencyControlsConfig, PublicContactConfig, SettingsActiveTab (+1 more)

### Community 49 - "useAdminUsersQuery.ts"
Cohesion: 0.15
Nodes (16): fetchAdminUserDetail(), useAdminUserDetailQuery(), ADMIN_USERS_QUERY_KEY, AdminUsersResult, fetchAdminUsers(), useAdminUsersQuery(), useUpdateUserRoleMutation(), UserDetailModal() (+8 more)

### Community 50 - "properties"
Cohesion: 0.08
Nodes (26): enum, type, type, type, type, type, type, properties (+18 more)

### Community 51 - "package.json"
Cohesion: 0.09
Nodes (24): allowScripts, msw, workerDirectory, name, private, type, version, autoprefixer (+16 more)

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
Cohesion: 0.12
Nodes (20): fetchAdminOrderDetail(), useAdminOrderDetailQuery(), ADMIN_ORDERS_QUERY_KEY, AdminOrdersResult, fetchAdminOrders(), useAdminOrdersQuery(), ResendNotificationArgs, useResendOrderNotificationMutation() (+12 more)

### Community 59 - "CloudflareStreamInput.tsx"
Cohesion: 0.24
Nodes (7): STREAM_METADATA_QUERY_KEY, useStreamVideoMetadataQuery(), CloudflareStreamInput(), CloudflareStreamInputProps, StreamVideoMetadata, VerifyStreamUidPayload, formatStreamDuration()

### Community 60 - "properties"
Cohesion: 0.08
Nodes (24): type, type, type, type, type, type, type, format (+16 more)

### Community 61 - "useEventMutations.ts"
Cohesion: 0.11
Nodes (13): ADMIN_EVENT_DETAIL_QUERY_KEY, fetchAdminEventDetail(), useAdminEventDetailQuery(), ADMIN_EVENTS_QUERY_KEY, AdminEventsFilterParams, fetchAdminEvents(), useAdminEventsQuery(), EventVenueCell() (+5 more)

### Community 62 - "properties"
Cohesion: 0.09
Nodes (23): items, $ref, required, type, getAdminUserDetail, description, headers, method (+15 more)

### Community 63 - "status-dot.tsx"
Cohesion: 0.13
Nodes (18): ensureStatusDotStyles(), getStatusDotConfig(), ResolvedStatusDotConfig, resolveStatusDotA11yProps(), resolveStatusDotAccessibleName(), resolveStatusDotLabel(), RIPPLE_DELAYS, StatusDot (+10 more)

### Community 65 - "FulfillmentReviewMatrixModal.tsx"
Cohesion: 0.15
Nodes (14): useBulkInjectTicketsMutation(), useConfirmSmartIngestMutation(), usePreviewSmartIngestMutation(), BulkInjectCsvModal(), BulkInjectCsvModalProps, FulfillmentReviewMatrixContent(), FulfillmentReviewMatrixContentProps, FulfillmentReviewMatrixModalProps (+6 more)

### Community 67 - "AdminUserController.php"
Cohesion: 0.25
Nodes (3): AdminUserController, AdminUserDetailResource, AdminUserListResource

### Community 68 - "listAdminUsers"
Cohesion: 0.10
Nodes (21): listAdminUsers, type, description, headers, method, path, queryParameters, response (+13 more)

### Community 69 - "properties"
Cohesion: 0.10
Nodes (21): type, format, type, description, format, type, type, description (+13 more)

### Community 70 - "properties"
Cohesion: 0.10
Nodes (21): type, type, type, type, properties, format, type, duration_minutes (+13 more)

### Community 71 - "Illuminate\Foundation\Http\FormRequest"
Cohesion: 0.09
Nodes (7): AdminEventFilterRequest, AdminFulfillmentFilterRequest, UpdateEmergencyControlsRequest, AdminVoucherFilterRequest, GoogleAuthRequest, GetUserTicketsRequest, Illuminate\Foundation\Http\FormRequest

### Community 72 - "VoucherFormModal.tsx"
Cohesion: 0.18
Nodes (14): ADMIN_VOUCHERS_QUERY_KEY, AdminVouchersFilters, fetchAdminVouchers(), useAdminVouchersQuery(), useCreateVoucherMutation(), useUpdateVoucherMutation(), VoucherFormModalContent(), VoucherFormModalContentProps (+6 more)

### Community 73 - "DashboardKpiCards.tsx"
Cohesion: 0.16
Nodes (12): ADMIN_DASHBOARD_STATS_QUERY_KEY, DashboardStatsFilterParams, fetchAdminDashboardStats(), useDashboardStatsQuery(), DashboardKpiCardsProps, PendingFulfillmentKpiCardProps, DEFAULT_TRENDS, RevenueTrendChartProps (+4 more)

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
Cohesion: 0.26
Nodes (10): BANNERS_QUERY_KEY, fetchBanners(), useBannersQuery(), HeroBannerCarousel(), HeroBannerCarouselProps, MOCK_BANNERS, bannersHandlers, BannerDisplayMode (+2 more)

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

### Community 84 - "RootLayout.tsx"
Cohesion: 0.20
Nodes (12): Footer(), FooterProps, getModalContent(), InfoModalContent, InfoModalType, MobileNavDrawer(), MobileNavDrawerProps, NAV_LINKS (+4 more)

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

### Community 91 - "Authorization"
Cohesion: 0.15
Nodes (15): headers, injectCinemaTicket, updateAdminUserRole, Authorization, Content-Type, description, headers, method (+7 more)

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

### Community 98 - "features/admin/index.ts"
Cohesion: 0.06
Nodes (13): AdminLayoutProps, AdminRouteGuardProps, AdminSidebar(), AdminSidebarProps, NavGroup, NavItem, AdminTopBar(), AdminTopBarProps (+5 more)

### Community 99 - "MidtransWebhookDispatcherService"
Cohesion: 0.22
Nodes (4): MidtransWebhookController, MidtransWebhookRequest, MidtransWebhookDispatcherService, InvalidArgumentException

### Community 100 - "endpoints"
Cohesion: 0.14
Nodes (13): description, endpoints, getPaymentStatus, midtransWebhook, description, method, path, description (+5 more)

### Community 101 - "movies.contract.json"
Cohesion: 0.14
Nodes (13): definitions, MovieDetail, MovieSummary, description, description, required, type, description (+5 more)

### Community 102 - "useMovieMutations.ts"
Cohesion: 0.19
Nodes (9): ADMIN_MOVIE_DETAIL_QUERY_KEY, fetchAdminMovieDetail(), useAdminMovieDetailQuery(), ADMIN_MOVIES_QUERY_KEY, AdminMoviesQueryParams, fetchAdminMovies(), useAdminMoviesQuery(), AdminMovieItem (+1 more)

### Community 103 - "src/hooks/index.ts"
Cohesion: 0.27
Nodes (9): useDebounce(), useDebouncedSearch(), UseDebouncedSearchOptions, UseDebouncedSearchResult, useRateLimitCooldown(), UseRateLimitCooldownOptions, UseRateLimitCooldownReturn, useRecentSearches() (+1 more)

### Community 104 - "useSettingsQueries.ts"
Cohesion: 0.10
Nodes (15): ADMIN_SETTINGS_QUERY_KEY, fetchAdminSettings(), fetchPublicSettings(), PUBLIC_SETTINGS_QUERY_KEY, PublicSettingsData, useAdminSettingsQuery(), usePublicSettingsQuery(), MovieTabMediaAssetsProps (+7 more)

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

### Community 119 - "movies/hooks/index.ts"
Cohesion: 0.30
Nodes (9): calculateInitialRemaining(), MovieRentalCountdownState, useMovieRentalCountdown(), UseMovieRentalCountdownOptions, MovieWatchPlayerControls, MovieWatchPlayerState, useMovieWatchPlayer(), UseMovieWatchPlayerOptions (+1 more)

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

### Community 136 - "TicketNotFoundException"
Cohesion: 0.12
Nodes (5): TicketAlreadyCheckedInException, TicketNotFoundException, AdminTicketScannerController, TicketValidationResource, TicketValidationService

### Community 137 - "require-dev"
Cohesion: 0.33
Nodes (6): require-dev, fakerphp/faker, laravel/pint, mockery/mockery, nunomaduro/collision, phpunit/phpunit

### Community 138 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, format, lint, post-autoload-dump, post-install-cmd, pre-autoload-dump

### Community 139 - "items"
Cohesion: 0.33
Nodes (6): items, type, properties, required, type, approved_items

### Community 140 - "confirmSmartCinemaTicketsFulfillment"
Cohesion: 0.33
Nodes (6): description, headers, method, path, response, confirmSmartCinemaTicketsFulfillment

### Community 141 - "grantMovieAccess"
Cohesion: 0.33
Nodes (6): grantMovieAccess, description, headers, method, path, response

### Community 142 - "revokeMovieAccess"
Cohesion: 0.33
Nodes (6): revokeMovieAccess, description, headers, method, path, response

### Community 143 - "validateTicketQR"
Cohesion: 0.33
Nodes (6): validateTicketQR, description, headers, method, path, response

### Community 144 - "seat_ids"
Cohesion: 0.33
Nodes (6): type, seat_ids, items, maxItems, minItems, type

### Community 145 - "useCameraScanner.ts"
Cohesion: 0.40
Nodes (5): isVirtualCamera(), useCameraScanner(), UseCameraScannerOptions, UseCameraScannerReturn, html5-qrcode

### Community 146 - "Illuminate\Console\Command"
Cohesion: 0.14
Nodes (8): CleanCinemaTempStorageCommand, CloseExpiredEventsCommand, GenerateAdminTestToken, GenerateDevTokenCommand, PruneExpiredSeatLocksCommand, SyncCinemaTicketsToR2Command, Command, Illuminate\Console\Command

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

### Community 156 - "assets_zip"
Cohesion: 0.50
Nodes (4): description, format, type, assets_zip

### Community 157 - "csv_file"
Cohesion: 0.50
Nodes (4): description, format, type, csv_file

### Community 158 - "qr_image"
Cohesion: 0.50
Nodes (4): qr_image, description, format, type

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

### Community 232 - "AdminMovieService"
Cohesion: 0.16
Nodes (4): AdminMovieController, AdminMovieDetailResource, AdminMovieResource, AdminMovieService

### Community 233 - "Illuminate\Database\Seeder"
Cohesion: 0.14
Nodes (7): BannerSeeder, DatabaseSeeder, EventSeeder, FulfillSpecificOrderSeeder, SystemSettingSeeder, VoucherSeeder, Illuminate\Database\Seeder

### Community 234 - "Illuminate\Contracts\Validation\ValidationRule"
Cohesion: 0.12
Nodes (4): AdminBannerFilterRequest, GetDashboardStatsRequest, ResendNotificationRequest, Illuminate\Contracts\Validation\ValidationRule

### Community 236 - "TicketConfirmationMail"
Cohesion: 0.16
Nodes (8): TicketConfirmationMail, Content, Envelope, Illuminate\Mail\Mailable, Illuminate\Mail\Mailables\Address, Illuminate\Mail\Mailables\Attachment, Illuminate\Mail\Mailables\Content, Illuminate\Mail\Mailables\Envelope

### Community 237 - "AdminOrderFilterRequest"
Cohesion: 0.20
Nodes (3): AdminOrderFilterRequest, AdminOrderExportService, Symfony\Component\HttpFoundation\StreamedResponse

### Community 238 - "MidtransSnapService"
Cohesion: 0.27
Nodes (3): MidtransSnapService, MidtransSnapServiceTest, RuntimeException

### Community 239 - "BannerController"
Cohesion: 0.27
Nodes (3): BannerController, BannerResource, BannerService

### Community 240 - "app.php"
Cohesion: 0.22
Nodes (7): Illuminate\Auth\AuthenticationException, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions, Illuminate\Foundation\Configuration\Middleware, Illuminate\Validation\ValidationException, Symfony\Component\HttpKernel\Exception\HttpException, Symfony\Component\HttpKernel\Exception\NotFoundHttpException

### Community 242 - "ScheduleController"
Cohesion: 0.36
Nodes (3): ScheduleController, ScheduleSeatMapResource, ScheduleSeatMapService

### Community 251 - "AdminDashboardPage.tsx"
Cohesion: 0.40
Nodes (5): AdminDashboardPage(), AdminDashboardPageProps, calculatePresetDates(), EMPTY_STATS, PERIOD_OPTIONS

### Community 267 - "console.php"
Cohesion: 0.50
Nodes (3): Illuminate\Foundation\Inspiring, Illuminate\Support\Facades\Artisan, Illuminate\Support\Facades\Schedule

## Knowledge Gaps
- **1010 isolated node(s):** `name`, `version`, `type`, `description`, `keywords` (+1005 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1581 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `EventTransaction`, `Movie`, `DomainException`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `SystemSettingsIntegrationTest`, `TicketNotFoundException`, `Illuminate\Http\JsonResponse`, `UserFactory.php`, `MovieTransaction`, `Illuminate\Console\Command`, `Controller`, `Banner`, `SystemSettingService`, `SystemSetting`, `SeatLock`, `Mockery`, `AdminPresaleInjectTest`, `Voucher`, `AdminVoucherTest`, `AdminUserController.php`, `Illuminate\Database\Seeder`, `ConcurrencyBookingTest`, `MidtransWebhookTest`, `MidtransSnapService`, `MovieRentalOrderTest`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `features/events/index.ts`, `features/movies/index.ts`, `auth/index.ts`, `checkout/index.ts`, `tickets/index.ts`, `useCameraScanner.ts`, `CloudflareImageUpload.tsx`, `src/components/common/index.ts`, `admin/components/common/index.ts`, `admin/types/index.ts`, `SinemusCinemaPlayer.tsx`, `@tanstack/react-query`, `BannerFormModal.tsx`, `lucide-react`, `SettingsEmergencyTab.tsx`, `useAdminUsersQuery.ts`, `package.json`, `useAdminOrdersQuery.ts`, `CloudflareStreamInput.tsx`, `useEventMutations.ts`, `status-dot.tsx`, `FulfillmentReviewMatrixModal.tsx`, `VoucherFormModal.tsx`, `DashboardKpiCards.tsx`, `features/banners/index.ts`, `RootLayout.tsx`, `features/admin/index.ts`, `src/hooks/index.ts`, `useSettingsQueries.ts`, `ScannerResultCard.tsx`, `movies/hooks/index.ts`, `AdminDashboardPage.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Event` connect `EventTransaction` to `User`, `SeatLock`, `Movie`, `DomainException`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `Illuminate\Http\Request`, `AdminPresaleInjectTest`, `Illuminate\Database\Seeder`, `ConcurrencyBookingTest`, `MovieTransaction`, `MidtransWebhookTest`, `Illuminate\Console\Command`, `Banner`, `StoreBannerRequest`, `UpdateBannerRequest`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _1010 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EventTransaction` be split into smaller, more focused modules?**
  _Cohesion score 0.03512112556860256 - nodes in this community are weakly interconnected._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.03957528957528957 - nodes in this community are weakly interconnected._
- **Should `features/events/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050917336631622345 - nodes in this community are weakly interconnected._