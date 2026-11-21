<?php

use App\Http\Controllers\Admin\V1\Banners\AdminBannerController;
use App\Http\Controllers\Admin\V1\Cloudflare\AdminCloudflareController;
use App\Http\Controllers\Admin\V1\Dashboard\AdminDashboardController;
use App\Http\Controllers\Admin\V1\Events\AdminEventController;
use App\Http\Controllers\Admin\V1\Movies\AdminMovieAccessController;
use App\Http\Controllers\Admin\V1\Movies\AdminMovieController;
use App\Http\Controllers\Admin\V1\Orders\AdminOrderController;
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
    // Public Authentication Gateway (Isolated Bucket)
    Route::post('/auth/google', [AuthController::class, 'google'])
        ->middleware('throttle:auth-google');

    // Public Webhook Gateway (Midtrans HMAC SHA-512 Signed, Isolated High-Throughput Bucket)
    Route::post('/webhooks/midtrans', [MidtransWebhookController::class, 'handle'])
        ->middleware('throttle:midtrans-webhook');

    // Public Showcase & Banners
    Route::get('/banners', [BannerController::class, 'index'])
        ->middleware('throttle:public-catalog');

    // Public Settings & Operational Contact Gateway (Cached)
    Route::get('/public/settings', [PublicSettingController::class, 'index'])
        ->middleware('throttle:public-catalog');

    // Public Cinema Events & Screening Schedules
    Route::get('/events', [EventController::class, 'index'])
        ->middleware('throttle:public-catalog');
    Route::get('/events/cities', [EventController::class, 'cities'])
        ->middleware('throttle:public-catalog');
    Route::get('/events/formats', [EventController::class, 'formats'])
        ->middleware('throttle:public-catalog');
    Route::get('/events/{id_or_slug}', [EventController::class, 'show'])
        ->middleware('throttle:public-catalog');
    Route::get('/schedules/{id}/seats', [ScheduleController::class, 'seats'])
        ->middleware('throttle:public-seatmap');

    // Public VoD Movie Catalogue & Streaming Details
    Route::get('/movies', [MovieController::class, 'index'])
        ->middleware('throttle:public-catalog');
    Route::get('/movies/{id_or_slug}', [MovieController::class, 'show'])
        ->middleware('throttle:public-catalog');

    // Authenticated User Profile & Transactions
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me'])
            ->middleware('throttle:user-read');
        Route::post('/auth/logout', [AuthController::class, 'logout'])
            ->middleware('throttle:user-write');
        Route::put('/user/profile', [UserProfileController::class, 'update'])
            ->middleware('throttle:user-write');

        // Ticket War Booking Engine (15-Minute Seat Lock, Isolated Checkout Bucket)
        Route::post('/bookings/reserve', [BookingController::class, 'reserve'])
            ->middleware('throttle:booking-checkout');

        // Checkout & Voucher System
        Route::post('/checkout/voucher/apply', [CheckoutController::class, 'applyVoucher'])
            ->middleware('throttle:user-write');
        Route::get('/checkout/orders/{order_id}/status', [CheckoutController::class, 'orderStatus'])
            ->middleware('throttle:user-read');
        Route::post('/checkout/orders/{order_id}/sync', [CheckoutController::class, 'syncOrder'])
            ->middleware('throttle:user-write');
        Route::post('/checkout/orders/{order_id}/cancel', [CheckoutController::class, 'cancelOrder'])
            ->middleware('throttle:user-write');

        // My Tickets & Digital E-Pass (Anti-IDOR)
        Route::get('/user/tickets', [TicketController::class, 'index'])
            ->middleware('throttle:user-read');
        Route::get('/user/tickets/{code}', [TicketController::class, 'show'])
            ->middleware('throttle:user-read');
        Route::get('/user/tickets/{order_id}/pdf', [TicketController::class, 'downloadPdf'])
            ->middleware('throttle:user-write');

        // VoD Film Streaming & Rentals (Hak Sewa & Signed Token)
        Route::post('/movies/{id}/rent', [MovieRentalOrderController::class, 'rent'])
            ->middleware('throttle:booking-checkout');
        Route::get('/user/films', [UserFilmController::class, 'index'])
            ->middleware('throttle:user-read');
        Route::get('/movies/{id}/stream', [MovieStreamController::class, 'getStreamAccess'])
            ->middleware('throttle:user-write');
    });

    // Super Admin Studio & Analytics (Strict Role Guard & Isolated Admin Buckets)
    Route::middleware(['auth:sanctum', 'role:super_admin'])->prefix('admin')->group(function () {
        // Module 8: Dashboard KPI & Executive Analytics
        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats'])
            ->middleware('throttle:admin-read');

        // Module 9: Admin Event & Screening Management (CRUD + Seatmap Builder)
        Route::get('/events', [AdminEventController::class, 'index'])
            ->middleware('throttle:admin-read');
        Route::post('/events', [AdminEventController::class, 'store'])
            ->middleware('throttle:admin-write');
        Route::get('/events/{id}', [AdminEventController::class, 'show'])
            ->middleware('throttle:admin-read');
        Route::put('/events/{id}', [AdminEventController::class, 'update'])
            ->middleware('throttle:admin-write');
        Route::delete('/events/{id}', [AdminEventController::class, 'destroy'])
            ->middleware('throttle:admin-write');
        Route::post('/events/{id}/schedules', [AdminEventController::class, 'storeSchedule'])
            ->middleware('throttle:admin-write');
        Route::post('/schedules/{schedule_id}/seats/generate', [AdminEventController::class, 'generateSeats'])
            ->middleware('throttle:admin-write');

        // Module 11: Super Admin Movie Management & VoD Governance (CRUD)
        Route::prefix('movies')->group(function () {
            Route::get('/', [AdminMovieController::class, 'index'])
                ->name('admin.movies.index')
                ->middleware('throttle:admin-read');
            Route::post('/', [AdminMovieController::class, 'store'])
                ->name('admin.movies.store')
                ->middleware('throttle:admin-write');
            Route::get('/{id}', [AdminMovieController::class, 'show'])
                ->name('admin.movies.show')
                ->middleware('throttle:admin-read');
            Route::put('/{id}', [AdminMovieController::class, 'update'])
                ->name('admin.movies.update')
                ->middleware('throttle:admin-write');
            Route::delete('/{id}', [AdminMovieController::class, 'destroy'])
                ->name('admin.movies.destroy')
                ->middleware('throttle:admin-write');
        });

        // Super Admin Movie Entitlement Access Governance (Grant & Revoke)
        Route::prefix('movie-access')->group(function () {
            Route::get('/', [AdminMovieAccessController::class, 'index'])
                ->name('admin.movie-access.index')
                ->middleware('throttle:admin-read');
            Route::post('/grant', [AdminMovieAccessController::class, 'grant'])
                ->name('admin.movie-access.grant')
                ->middleware('throttle:admin-write');
            Route::post('/{id}/revoke', [AdminMovieAccessController::class, 'revoke'])
                ->name('admin.movie-access.revoke')
                ->middleware('throttle:admin-write');
        });

        // Module 12: Admin Financial Audit & Order Transactions History
        Route::get('/orders', [AdminOrderController::class, 'index'])
            ->name('admin.orders.index')
            ->middleware('throttle:admin-read');
        Route::get('/orders/export', [AdminOrderController::class, 'export'])
            ->name('admin.orders.export')
            ->middleware('throttle:admin-sensitive');
        Route::get('/orders/{order_id}', [AdminOrderController::class, 'show'])
            ->name('admin.orders.show')
            ->middleware('throttle:admin-read');
        Route::post('/orders/{order_id}/resend', [AdminOrderController::class, 'resend'])
            ->name('admin.orders.resend')
            ->middleware('throttle:admin-sensitive');

        // Module 13: Admin Voucher & Promo Coupon Management (CRUD & Quota Audit)
        Route::get('/vouchers', [AdminVoucherController::class, 'index'])
            ->name('admin.vouchers.index')
            ->middleware('throttle:admin-read');
        Route::post('/vouchers', [AdminVoucherController::class, 'store'])
            ->name('admin.vouchers.store')
            ->middleware('throttle:admin-write');
        Route::get('/vouchers/{id}', [AdminVoucherController::class, 'show'])
            ->name('admin.vouchers.show')
            ->middleware('throttle:admin-read');
        Route::put('/vouchers/{id}', [AdminVoucherController::class, 'update'])
            ->name('admin.vouchers.update')
            ->middleware('throttle:admin-write');
        Route::patch('/vouchers/{id}/toggle-status', [AdminVoucherController::class, 'toggleStatus'])
            ->name('admin.vouchers.toggle-status')
            ->middleware('throttle:admin-write');
        Route::post('/vouchers/{id}/restore', [AdminVoucherController::class, 'restore'])
            ->name('admin.vouchers.restore')
            ->middleware('throttle:admin-write');
        Route::delete('/vouchers/{id}', [AdminVoucherController::class, 'destroy'])
            ->name('admin.vouchers.destroy')
            ->middleware('throttle:admin-write');

        // Module 14: Admin Homepage Banner Management (CRUD & Drag-and-Drop Reordering)
        Route::get('/banners', [AdminBannerController::class, 'index'])
            ->name('admin.banners.index')
            ->middleware('throttle:admin-read');
        Route::post('/banners/reorder', [AdminBannerController::class, 'reorder'])
            ->name('admin.banners.reorder')
            ->middleware('throttle:admin-write');
        Route::post('/banners', [AdminBannerController::class, 'store'])
            ->name('admin.banners.store')
            ->middleware('throttle:admin-write');
        Route::get('/banners/{id}', [AdminBannerController::class, 'show'])
            ->name('admin.banners.show')
            ->middleware('throttle:admin-read');
        Route::put('/banners/{id}', [AdminBannerController::class, 'update'])
            ->name('admin.banners.update')
            ->middleware('throttle:admin-write');
        Route::delete('/banners/{id}', [AdminBannerController::class, 'destroy'])
            ->name('admin.banners.destroy')
            ->middleware('throttle:admin-write');

        // Module 15: Admin User Management & Role Governance (Users & Roles)
        Route::get('/users', [AdminUserController::class, 'index'])
            ->name('admin.users.index')
            ->middleware('throttle:admin-read');
        Route::get('/users/{id}', [AdminUserController::class, 'show'])
            ->name('admin.users.show')
            ->middleware('throttle:admin-read');
        Route::put('/users/{id}/role', [AdminUserController::class, 'updateRole'])
            ->name('admin.users.update-role')
            ->middleware('throttle:admin-write');

        // Module 16: Admin Mobile Ticket Scanner & Validasi Pintu Masuk Venue
        Route::get('/scanner/sessions', [AdminTicketScannerController::class, 'sessions'])
            ->name('admin.scanner.sessions')
            ->middleware('throttle:admin-read');
        Route::post('/tickets/validate', [AdminTicketScannerController::class, 'validateQr'])
            ->name('admin.tickets.validate')
            ->middleware('throttle:admin-read');

        // Module 18: Admin Cloudflare Media Integration & Verification Gateway
        Route::post('/cloudflare/stream/verify', [AdminCloudflareController::class, 'verifyStream'])
            ->name('admin.cloudflare.stream.verify')
            ->middleware('throttle:admin-write');
        Route::post('/cloudflare/stream/{uid}/token', [AdminCloudflareController::class, 'generatePreviewToken'])
            ->name('admin.cloudflare.stream.token')
            ->middleware('throttle:admin-write');
        Route::post('/cloudflare/images/direct-upload', [AdminCloudflareController::class, 'createImageDirectUpload'])
            ->name('admin.cloudflare.images.direct-upload')
            ->middleware('throttle:admin-write');
        Route::delete('/cloudflare/images/{id}', [AdminCloudflareController::class, 'deleteImage'])
            ->name('admin.cloudflare.images.delete')
            ->middleware('throttle:admin-write');

        // Module 19: Admin System Settings & Governance Controls
        Route::get('/settings', [AdminSettingController::class, 'index'])
            ->name('admin.settings.index')
            ->middleware('throttle:admin-read');
        Route::put('/settings/business-policies', [AdminSettingController::class, 'updateBusinessPolicies'])
            ->name('admin.settings.update-business-policies')
            ->middleware('throttle:admin-write');
        Route::put('/settings/public-contact', [AdminSettingController::class, 'updatePublicContact'])
            ->name('admin.settings.update-public-contact')
            ->middleware('throttle:admin-write');
        Route::put('/settings/emergency-controls', [AdminSettingController::class, 'updateEmergencyControls'])
            ->name('admin.settings.update-emergency-controls')
            ->middleware('throttle:admin-write');
    });
});
