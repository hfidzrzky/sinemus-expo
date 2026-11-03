<?php

use App\Services\Tickets\TicketPdfService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('bookings:prune-expired-locks')
    ->everyMinute()
    ->runInBackground();

Schedule::command('movies:prune-expired-orders')
    ->everyMinute()
    ->runInBackground()
    ->name('movies:prune-expired-orders');

Schedule::call(function (TicketPdfService $pdfService) {
    $pdfService->pruneExpiredPdfCache();
})->twiceDaily(3, 15)->name('tickets:prune-expired-pdf-cache');

Schedule::command('cinema:clean-temp-storage --hours=6')
    ->everyTwoHours()
    ->runInBackground()
    ->name('cinema:clean-temp-storage');

Schedule::command('events:close-expired-sales')
    ->everyFiveMinutes()
    ->runInBackground()
    ->name('events:close-expired-sales');

// Prune Sanctum Personal Access Tokens yang telah kedaluwarsa (> 30 hari) setiap hari
Schedule::command('sanctum:prune-expired --hours=24')
    ->daily()
    ->runInBackground()
    ->name('sanctum:prune-expired');
