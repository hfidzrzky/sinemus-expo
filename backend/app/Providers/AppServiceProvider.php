<?php

namespace App\Providers;

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
        //
    }
}
