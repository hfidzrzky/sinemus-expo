<?php

use App\Http\Controllers\Admin\V1\Banners\AdminBannerController;
use App\Http\Controllers\Admin\V1\Cloudflare\AdminCloudflareController;
use App\Http\Controllers\Admin\V1\Dashboard\AdminDashboardController;
use App\Http\Controllers\Admin\V1\Events\AdminEventController;
use App\Http\Controllers\Admin\V1\Movies\AdminMovieAccessController;
use App\Http\Controllers\Admin\V1\Movies\AdminMovieController;
use App\Http\Controllers\Admin\V1\Orders\AdminOrderController;
use App\Http\Controllers\Admin\V1\Presale\AdminPresaleInjectController;
use App\Http\Controllers\Admin\V1\Scanner\AdminTicketScannerController;
use App\Http\Controllers\Admin\V1\Settings\AdminSettingController;
use App\Http\Controllers\Admin\V1\Users\AdminUserController;
use App\Http\Controllers\Admin\V1\Vouchers\AdminVoucherController;
use App\Http\Controllers\Auth\V1\AuthController;
use App\Http\Controllers\Banner\V1\BannerController;
use App\Http\Controllers\Booking\V1\BookingController;
use App\Http\Controllers\Checkout\V1\CheckoutController;
use App\Http\Controllers\Checkout\V1\MidtransWebhookController;
use App\Http\Controllers\Events\V1\EventController;
use App\Http\Controllers\Events\V1\ScheduleController;
use App\Http\Controllers\Movies\V1\MovieController;
use App\Http\Controllers\Movies\V1\MovieRentalOrderController;
use App\Http\Controllers\Movies\V1\MovieStreamController;
use App\Http\Controllers\Movies\V1\UserFilmController;
use App\Http\Controllers\Setting\V1\PublicSettingController;
use App\Http\Controllers\Tickets\V1\TicketController;
use App\Http\Controllers\User\V1\UserProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public Authentication Gateway
    Route::post('/auth/google', [AuthController::class, 'google'])
        ->middleware('throttle:10,1');

    // Public Webhook Gateway (Midtrans HMAC SHA-512 Signed)
    Route::post('/webhooks/midtrans', [MidtransWebhookController::class, 'handle'])
        ->middleware('throttle:60,1');

    // Public Showcase & Banners
    Route::get('/banners', [BannerController::class, 'index'])
        ->middleware('throttle:60,1');

    // Public Settings & Operational Contact Gateway (Cached)
    Route::get('/public/settings', [PublicSettingController::class, 'index'])
        ->middleware('throttle:60,1');

    // Public Cinema Events & Screening Schedules
    Route::get('/events', [EventController::class, 'index'])
        ->middleware('throttle:60,1');
    Route::get('/events/cities', [EventController::class, 'cities'])
        ->middleware('throttle:60,1');
    Route::get('/events/formats', [EventController::class, 'formats'])
        ->middleware('throttle:60,1');
    Route::get('/events/{id_or_slug}', [EventController::class, 'show'])
        ->middleware('throttle:60,1');
    Route::get('/schedules/{id}/seats', [ScheduleController::class, 'seats'])
        ->middleware('throttle:60,1');

    // Public Cinema QR Barcode Streaming (Protected by timing-safe hash comparison or auth)
    Route::get('/tickets/{order_id}/qr-image', [TicketController::class, 'streamQrImage'])
        ->middleware('throttle:60,1');

    // Public VoD Movie Catalogue & Streaming Details
    Route::get('/movies', [MovieController::class, 'index'])
        ->middleware('throttle:60,1');
    Route::get('/movies/{id_or_slug}', [MovieController::class, 'show'])
        ->middleware('throttle:60,1');

    // Authenticated User Profile & Transactions
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me'])
            ->middleware('throttle:60,1');
        Route::post('/auth/logout', [AuthController::class, 'logout'])
            ->middleware('throttle:20,1');
        Route::put('/user/profile', [UserProfileController::class, 'update'])
            ->middleware('throttle:20,1');

        // Ticket War Booking Engine (15-Minute Seat Lock)
        Route::post('/bookings/reserve', [BookingController::class, 'reserve'])
            ->middleware('throttle:10,1');

        // Checkout & Voucher System
        Route::post('/checkout/voucher/apply', [CheckoutController::class, 'applyVoucher'])
            ->middleware('throttle:20,1');
        Route::get('/checkout/orders/{order_id}/status', [CheckoutController::class, 'orderStatus'])
            ->middleware('throttle:60,1');
        Route::post('/checkout/orders/{order_id}/sync', [CheckoutController::class, 'syncOrder'])
            ->middleware('throttle:30,1');
        Route::post('/checkout/orders/{order_id}/cancel', [CheckoutController::class, 'cancelOrder'])
            ->middleware('throttle:20,1');

        // My Tickets & Digital E-Pass (Anti-IDOR)
        Route::get('/user/tickets', [TicketController::class, 'index'])
            ->middleware('throttle:60,1');
        Route::get('/user/tickets/{code}', [TicketController::class, 'show'])
            ->middleware('throttle:60,1');
        Route::get('/user/tickets/{order_id}/pdf', [TicketController::class, 'downloadPdf'])
            ->middleware('throttle:20,1');

        // VoD Film Streaming & Rentals (Hak Sewa & Signed Token)
        Route::post('/movies/{id}/rent', [MovieRentalOrderController::class, 'rent'])
            ->middleware('throttle:10,1');
        Route::get('/user/films', [UserFilmController::class, 'index'])
            ->middleware('throttle:60,1');
        Route::get('/movies/{id}/stream', [MovieStreamController::class, 'getStreamAccess'])
            ->middleware('throttle:30,1');
    });

    // Super Admin Studio & Analytics (Strict Role Guard & Throttled)
    Route::middleware(['auth:sanctum', 'role:super_admin'])->prefix('admin')->group(function () {
        // Module 8: Dashboard KPI & Executive Analytics
        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats'])
            ->middleware('throttle:60,1');

        // Module 9: Admin Event & Screening Management (CRUD + Seatmap Builder)
        Route::get('/events', [AdminEventController::class, 'index'])
            ->middleware('throttle:60,1');
        Route::post('/events', [AdminEventController::class, 'store'])
            ->middleware('throttle:20,1');
        Route::get('/events/{id}', [AdminEventController::class, 'show'])
            ->middleware('throttle:60,1');
        Route::put('/events/{id}', [AdminEventController::class, 'update'])
            ->middleware('throttle:20,1');
        Route::delete('/events/{id}', [AdminEventController::class, 'destroy'])
            ->middleware('throttle:20,1');
        Route::post('/events/{id}/schedules', [AdminEventController::class, 'storeSchedule'])
            ->middleware('throttle:20,1');
        Route::post('/schedules/{schedule_id}/seats/generate', [AdminEventController::class, 'generateSeats'])
            ->middleware('throttle:20,1');

        // Module 11: Super Admin Movie Management & VoD Governance (CRUD)
        Route::prefix('movies')->group(function () {
            Route::get('/', [AdminMovieController::class, 'index'])
                ->name('admin.movies.index')
                ->middleware('throttle:60,1');
            Route::post('/', [AdminMovieController::class, 'store'])
                ->name('admin.movies.store')
                ->middleware('throttle:20,1');
            Route::get('/{id}', [AdminMovieController::class, 'show'])
                ->name('admin.movies.show')
                ->middleware('throttle:60,1');
            Route::put('/{id}', [AdminMovieController::class, 'update'])
                ->name('admin.movies.update')
                ->middleware('throttle:20,1');
            Route::delete('/{id}', [AdminMovieController::class, 'destroy'])
                ->name('admin.movies.destroy')
                ->middleware('throttle:20,1');
        });

        // Super Admin Movie Entitlement Access Governance (Grant & Revoke)
        Route::prefix('movie-access')->group(function () {
            Route::get('/', [AdminMovieAccessController::class, 'index'])
                ->name('admin.movie-access.index')
                ->middleware('throttle:60,1');
            Route::post('/grant', [AdminMovieAccessController::class, 'grant'])
                ->name('admin.movie-access.grant')
                ->middleware('throttle:20,1');
            Route::post('/{id}/revoke', [AdminMovieAccessController::class, 'revoke'])
                ->name('admin.movie-access.revoke')
                ->middleware('throttle:20,1');
        });

        // Module 12: Admin Financial Audit & Order Transactions History
        Route::get('/orders', [AdminOrderController::class, 'index'])
            ->name('admin.orders.index')
            ->middleware('throttle:60,1');
        Route::get('/orders/export', [AdminOrderController::class, 'export'])
            ->name('admin.orders.export')
            ->middleware('throttle:10,1');
        Route::get('/orders/{order_id}', [AdminOrderController::class, 'show'])
            ->name('admin.orders.show')
            ->middleware('throttle:60,1');
        Route::post('/orders/{order_id}/resend', [AdminOrderController::class, 'resend'])
            ->name('admin.orders.resend')
            ->middleware('throttle:10,1');

        // Module 13: Admin Voucher & Promo Coupon Management (CRUD & Quota Audit)
        Route::get('/vouchers', [AdminVoucherController::class, 'index'])
            ->name('admin.vouchers.index')
            ->middleware('throttle:60,1');
        Route::post('/vouchers', [AdminVoucherController::class, 'store'])
            ->name('admin.vouchers.store')
            ->middleware('throttle:20,1');
        Route::get('/vouchers/{id}', [AdminVoucherController::class, 'show'])
            ->name('admin.vouchers.show')
            ->middleware('throttle:60,1');
        Route::put('/vouchers/{id}', [AdminVoucherController::class, 'update'])
            ->name('admin.vouchers.update')
            ->middleware('throttle:20,1');
        Route::delete('/vouchers/{id}', [AdminVoucherController::class, 'destroy'])
            ->name('admin.vouchers.destroy')
            ->middleware('throttle:20,1');

        // Module 14: Admin Homepage Banner Management (CRUD & Drag-and-Drop Reordering)
        Route::get('/banners', [AdminBannerController::class, 'index'])
            ->name('admin.banners.index')
            ->middleware('throttle:60,1');
        Route::post('/banners/reorder', [AdminBannerController::class, 'reorder'])
            ->name('admin.banners.reorder')
            ->middleware('throttle:20,1');
        Route::post('/banners', [AdminBannerController::class, 'store'])
            ->name('admin.banners.store')
            ->middleware('throttle:20,1');
        Route::get('/banners/{id}', [AdminBannerController::class, 'show'])
            ->name('admin.banners.show')
            ->middleware('throttle:60,1');
        Route::put('/banners/{id}', [AdminBannerController::class, 'update'])
            ->name('admin.banners.update')
            ->middleware('throttle:20,1');
        Route::delete('/banners/{id}', [AdminBannerController::class, 'destroy'])
            ->name('admin.banners.destroy')
            ->middleware('throttle:20,1');

        // Module 15: Admin User Management & Role Governance (Users & Roles)
        Route::get('/users', [AdminUserController::class, 'index'])
            ->name('admin.users.index')
            ->middleware('throttle:60,1');
        Route::get('/users/{id}', [AdminUserController::class, 'show'])
            ->name('admin.users.show')
            ->middleware('throttle:60,1');
        Route::put('/users/{id}/role', [AdminUserController::class, 'updateRole'])
            ->name('admin.users.update-role')
            ->middleware('throttle:20,1');

        // Module 16: Admin Mobile Ticket Scanner & Validasi Pintu Masuk Venue
        Route::post('/tickets/validate', [AdminTicketScannerController::class, 'validateQr'])
            ->name('admin.tickets.validate')
            ->middleware('throttle:60,1');

        // Module 17: Admin Injeksi Tiket Bioskop Presale (Manual Single, Smart Ingestion & Bulk)
        Route::get('/schedules/{schedule_id}/fulfillment', [AdminPresaleInjectController::class, 'fulfillmentOrders'])
            ->name('admin.presale.fulfillment-orders')
            ->middleware('throttle:60,1');

        Route::post('/transactions/{id}/inject-cinema-ticket', [AdminPresaleInjectController::class, 'injectSingle'])
            ->name('admin.presale.inject-single')
            ->middleware('throttle:20,1');

        Route::post('/transactions/{id}/reset-cinema-ticket', [AdminPresaleInjectController::class, 'resetTicket'])
            ->name('admin.presale.reset-ticket')
            ->middleware('throttle:20,1');

        Route::post('/schedules/{schedule_id}/smart-ingest/preview', [AdminPresaleInjectController::class, 'previewSmartIngest'])
            ->name('admin.presale.smart-ingest-preview')
            ->middleware('throttle:30,1');

        Route::post('/schedules/{schedule_id}/smart-ingest/confirm', [AdminPresaleInjectController::class, 'confirmSmartIngest'])
            ->name('admin.presale.smart-ingest-confirm')
            ->middleware('throttle:30,1');

        Route::post('/schedules/{schedule_id}/bulk-inject-tickets', [AdminPresaleInjectController::class, 'bulkInject'])
            ->name('admin.presale.bulk-inject')
            ->middleware('throttle:30,1');

        // Module 18: Admin Cloudflare Media Integration & Verification Gateway
        Route::post('/cloudflare/stream/verify', [AdminCloudflareController::class, 'verifyStream'])
            ->name('admin.cloudflare.stream.verify')
            ->middleware('throttle:30,1');
        Route::post('/cloudflare/stream/{uid}/token', [AdminCloudflareController::class, 'generatePreviewToken'])
            ->name('admin.cloudflare.stream.token')
            ->middleware('throttle:30,1');
        Route::post('/cloudflare/images/direct-upload', [AdminCloudflareController::class, 'createImageDirectUpload'])
            ->name('admin.cloudflare.images.direct-upload')
            ->middleware('throttle:30,1');
        Route::delete('/cloudflare/images/{id}', [AdminCloudflareController::class, 'deleteImage'])
            ->name('admin.cloudflare.images.delete')
            ->middleware('throttle:30,1');

        // Module 19: Admin System Settings & Governance Controls
        Route::get('/settings', [AdminSettingController::class, 'index'])
            ->name('admin.settings.index')
            ->middleware('throttle:60,1');
        Route::put('/settings/business-policies', [AdminSettingController::class, 'updateBusinessPolicies'])
            ->name('admin.settings.update-business-policies')
            ->middleware('throttle:20,1');
        Route::put('/settings/public-contact', [AdminSettingController::class, 'updatePublicContact'])
            ->name('admin.settings.update-public-contact')
            ->middleware('throttle:20,1');
        Route::put('/settings/emergency-controls', [AdminSettingController::class, 'updateEmergencyControls'])
            ->name('admin.settings.update-emergency-controls')
            ->middleware('throttle:20,1');
    });
});
