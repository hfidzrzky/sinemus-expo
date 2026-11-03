<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'Sinemus Screen API (Expo Edition)',
        'server_time' => now()->toIso8601String(),
    ]);
});

Route::get('/preview-email/regular', function () {
    return view('emails.tickets.regular-event', [
        'subject' => 'E-Tiket Siap: Khoas (ORD-998877)',
        'eventTitle' => 'Khoas - Special Screening',
        'orderId' => 'ORD-998877',
        'userName' => 'Hafidz',
        'ticketCode' => 'TIX-ABC123XYZ',
        'venueName' => 'CGV Paris Van Java',
        'studioName' => 'Audi 2',
        'showTimeFormatted' => 'Sabtu, 26 Sep 2026 - 19:00 WIB',
        'hasAssignedSeats' => true,
        'seatsText' => 'E10, E11',
        'ticketQuantity' => 2,
        'totalFormatted' => '90.000',
        'ticketPdfUrl' => '#',
        'ticketWebUrl' => '#',
        'userEmail' => 'hafidz@example.com',
    ]);
});

// Preview: Regular Event - General Admission (Tanpa Nomor Kursi)
Route::get('/preview-email/regular-ga', function () {
    return view('emails.tickets.regular-event', [
        'subject' => 'E-Tiket Siap: Bandung Film Screening 2026 (ORD-881122)',
        'eventTitle' => 'Bandung Film Screening 2026',
        'orderId' => 'ORD-881122',
        'userName' => 'Hafidz',
        'ticketCode' => 'TIX-GA99021X',
        'venueName' => 'Amphitheater Dago Tea House',
        'studioName' => '-',
        'showTimeFormatted' => 'Sabtu, 10 Okt 2026 - 15:30 WIB',
        'hasAssignedSeats' => false,
        'seatsText' => 'General Admission',
        'ticketQuantity' => 2,
        'totalFormatted' => '75.000',
        'ticketPdfUrl' => '#',
        'ticketWebUrl' => '#',
        'userEmail' => 'hafidz@example.com',
    ]);
});
