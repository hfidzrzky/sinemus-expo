<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use SimpleSoftwareIO\QrCode\QrCodeServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // DomPDF & QR Generator dependencies PSR-4 fallback registration (Zero overhead)
        spl_autoload_register(function ($class) {
            $prefixMap = [
                'Barryvdh\\DomPDF\\' => base_path('vendor/barryvdh/laravel-dompdf/src/'),
                'Dompdf\\' => base_path('vendor/dompdf/dompdf/src/'),
                'FontLib\\' => base_path('vendor/dompdf/php-font-lib/src/FontLib/'),
                'Svg\\' => base_path('vendor/dompdf/php-svg-lib/src/Svg/'),
                'Masterminds\\' => base_path('vendor/masterminds/html5/src/'),
                'Sabberworm\\CSS\\' => base_path('vendor/sabberworm/php-css-parser/src/'),
                'BaconQrCode\\' => base_path('vendor/bacon/bacon-qr-code/src/'),
                'SimpleSoftwareIO\\QrCode\\' => base_path('vendor/simplesoftwareio/simple-qrcode/src/'),
                'DASPRiD\\Enum\\' => base_path('vendor/dasprid/enum/src/'),
            ];

            if ($class === 'Dompdf\\Cpdf') {
                $cpdfFile = base_path('vendor/dompdf/dompdf/lib/Cpdf.php');
                if (file_exists($cpdfFile)) {
                    require_once $cpdfFile;

                    return;
                }
            }

            foreach ($prefixMap as $prefix => $baseDir) {
                if (str_starts_with($class, $prefix)) {
                    $relativeClass = substr($class, strlen($prefix));
                    $file = $baseDir.str_replace('\\', '/', $relativeClass).'.php';
                    if (file_exists($file)) {
                        require_once $file;

                        return;
                    }
                }
            }
        });

        if (class_exists(\Barryvdh\DomPDF\ServiceProvider::class)) {
            $this->app->register(\Barryvdh\DomPDF\ServiceProvider::class);
        }

        if (class_exists(QrCodeServiceProvider::class)) {
            $this->app->register(QrCodeServiceProvider::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiters();
    }

    /**
     * Daftarkan Named Rate Limiters terisolasi per domain untuk mencegah
     * tabrakan global bucket antar endpoint publik, autentikasi, transaksi, dan admin.
     */
    protected function configureRateLimiters(): void
    {
        // 1. Public Read-Only Catalog (Banners, Settings, Events, Movies)
        RateLimiter::for('public-catalog', function (Request $request): Limit {
            return Limit::perMinute(120)->by('public-catalog|'.$request->ip());
        });

        // 2. Public Real-Time Seat Map Polling (terisolasi agar polling tidak menggerus kuota login/katalog)
        RateLimiter::for('public-seatmap', function (Request $request): Limit {
            return Limit::perMinute(120)->by('public-seatmap|'.$request->ip());
        });

        // 3. Public Ticket QR Image Streaming (anti-scraping & anti-enumeration)
        RateLimiter::for('public-qr-stream', function (Request $request): Limit {
            return Limit::perMinute(60)->by('public-qr-stream|'.$request->ip());
        });

        // 4. Google OAuth2 Login Gateway (terisolasi dari traffic browsing publik)
        RateLimiter::for('auth-google', function (Request $request): Limit {
            return Limit::perMinute(15)->by('auth-google|'.$request->ip());
        });

        // 5. Midtrans Payment Webhook Gateway (kuota tinggi & terisolasi untuk burst flash sale)
        RateLimiter::for('midtrans-webhook', function (Request $request): Limit {
            return Limit::perMinute(180)->by('midtrans-webhook|'.$request->ip());
        });

        // 6. Authenticated User Read Operations (/auth/me, /user/tickets, /user/films, order status)
        RateLimiter::for('user-read', function (Request $request): Limit {
            $identifier = $request->user()?->getAuthIdentifier() ?: $request->ip();

            return Limit::perMinute(120)->by('user-read|'.$identifier);
        });

        // 7. Authenticated User Write & Interactive Operations (profile, voucher, sync, cancel, stream, pdf)
        RateLimiter::for('user-write', function (Request $request): Limit {
            $identifier = $request->user()?->getAuthIdentifier() ?: $request->ip();

            return Limit::perMinute(30)->by('user-write|'.$identifier);
        });

        // 8. Critical Booking & VoD Rental Checkout (terisolasi penuh dari traffic baca & admin)
        RateLimiter::for('booking-checkout', function (Request $request): Limit {
            $identifier = $request->user()?->getAuthIdentifier() ?: $request->ip();

            return Limit::perMinute(15)->by('booking-checkout|'.$identifier);
        });

        // 9. Super Admin Read Operations
        RateLimiter::for('admin-read', function (Request $request): Limit {
            $identifier = $request->user()?->getAuthIdentifier() ?: $request->ip();

            return Limit::perMinute(180)->by('admin-read|'.$identifier);
        });

        // 10. Super Admin Write & Media Operations
        RateLimiter::for('admin-write', function (Request $request): Limit {
            $identifier = $request->user()?->getAuthIdentifier() ?: $request->ip();

            return Limit::perMinute(60)->by('admin-write|'.$identifier);
        });

        // 11. Super Admin Sensitive Operations (CSV Export, Resend Email)
        RateLimiter::for('admin-sensitive', function (Request $request): Limit {
            $identifier = $request->user()?->getAuthIdentifier() ?: $request->ip();

            return Limit::perMinute(20)->by('admin-sensitive|'.$identifier);
        });
    }
}
