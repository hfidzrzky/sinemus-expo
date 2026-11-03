<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Bukti Reservasi Kursi - {{ $order_id }}</title>
    <style>
        @page {
            size: 250mm 150mm landscape;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }
        body {
            background-color: #f4f5f7;
            color: #111827;
            width: 250mm;
            margin: 0;
            padding: 0;
        }

        /* ── Canvas Wrapper (DomPDF-safe outer spacing) ── */
        .canvas {
            width: 100%;
            border-collapse: collapse;
        }
        .canvas-cell {
            padding: 6mm;
        }

        /* ── Card ── */
        .card {
            width: 100%;
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            page-break-inside: avoid;
        }
        .accent-top {
            height: 4px;
            background: linear-gradient(90deg, #d97706 0%, #f59e0b 100%);
        }

        /* ── Two-Panel ── */
        .main-table {
            width: 100%;
            border-collapse: collapse;
        }
        .panel-left {
            vertical-align: top;
            padding: 7mm 7mm 7mm 8mm;
            width: 62%;
            border-right: 1px solid #f3f4f6;
        }
        .panel-right {
            vertical-align: top;
            padding: 7mm 8mm 7mm 7mm;
            width: 38%;
            text-align: center;
        }

        /* ── Brand ── */
        .brand-bar {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
        }
        .brand-bar td { vertical-align: middle; }
        .brand-logo {
            height: 22px;
            width: auto;
            display: block;
        }
        .brand-name {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 13pt;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #111827;
            line-height: 1.1;
            margin: 0;
            padding: 0;
        }
        .brand-name .blue {
            font-family: Helvetica, Arial, sans-serif;
            color: #2563eb;
            font-size: 13pt;
            font-weight: 800;
            letter-spacing: 0.5px;
        }
        .brand-sub {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 5.5pt;
            font-weight: 700;
            letter-spacing: 1.2px;
            color: #9ca3af;
            text-transform: uppercase;
            margin-top: 2px;
            line-height: 1;
        }
        .badge {
            display: inline-block;
            font-size: 6pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 3px 10px;
            border-radius: 4px;
            white-space: nowrap;
        }
        .badge-amber {
            background-color: #fffbeb;
            color: #b45309;
            border: 1px solid #fde68a;
        }

        /* ── Divider ── */
        .sep {
            border: none;
            border-top: 1px solid #f3f4f6;
            margin: 0 0 5mm 0;
        }

        /* ── Event ── */
        .title {
            font-size: 14pt;
            font-weight: 800;
            line-height: 1.25;
            color: #111827;
            margin-bottom: 2mm;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .venue {
            font-size: 8pt;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 5mm;
        }

        /* ── Detail Rows ── */
        .details {
            width: 100%;
            border-collapse: collapse;
        }
        .details td {
            vertical-align: top;
            padding-bottom: 4mm;
        }
        .lbl {
            font-size: 6pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #9ca3af;
            margin-bottom: 2mm;
            line-height: 1;
        }
        .val {
            font-size: 9pt;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.3;
        }
        .val-amber { color: #b45309; }
        .val-green { color: #059669; }

        /* ── Seats ── */
        .seats { margin-top: 1.5mm; }
        .seat {
            display: inline-block;
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            color: #b45309;
            font-family: 'Courier New', monospace;
            font-weight: 800;
            font-size: 9pt;
            padding: 2px 8px;
            border-radius: 4px;
            margin-right: 3px;
            margin-bottom: 2px;
        }

        /* ── Seal Box ── */
        .seal-box {
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 8px;
            padding: 2.5mm 3mm;
            text-align: center;
            margin-bottom: 2.5mm;
        }
        .seal-title {
            font-size: 7pt;
            font-weight: 800;
            color: #b45309;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            line-height: 1.2;
        }
        .seal-sub {
            font-size: 5.5pt;
            font-weight: 700;
            color: #d97706;
            letter-spacing: 0.4px;
            margin-top: 1px;
        }

        /* ── Timeline Box ── */
        .timeline-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 2.5mm 3.5mm;
            text-align: left;
            margin-bottom: 2.5mm;
        }
        .timeline-heading {
            font-size: 5.5pt;
            font-weight: 700;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2mm;
        }
        .timeline-table {
            width: 100%;
            border-collapse: collapse;
        }
        .timeline-table td {
            vertical-align: middle;
            padding: 1mm 0;
            font-size: 6pt;
        }
        .step-num-col {
            width: 15px;
            vertical-align: middle;
        }
        .step-badge {
            display: inline-block;
            width: 11px;
            height: 11px;
            line-height: 11px;
            text-align: center;
            border-radius: 3px;
            font-size: 5.5pt;
            font-weight: 800;
            font-family: Arial, Helvetica, sans-serif;
        }
        .step-badge-done {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .step-badge-active {
            background-color: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
        }
        .step-badge-pending {
            background-color: #f3f4f6;
            color: #9ca3af;
            border: 1px solid #e5e7eb;
        }
        .step-text {
            color: #4b5563;
            line-height: 1.25;
            padding-left: 2px;
        }
        .step-highlight {
            color: #b45309;
            font-weight: 700;
        }
        .step-muted {
            color: #9ca3af;
        }

        /* ── Notice ── */
        .notice {
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            border-left: 3px solid #f59e0b;
            border-radius: 6px;
            padding: 2.5mm 3.5mm;
            text-align: left;
        }
        .notice-heading {
            font-size: 5.5pt;
            font-weight: 700;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1mm;
        }
        .notice-body {
            font-size: 6pt;
            color: #78716c;
            line-height: 1.45;
        }

        /* ── Footer ── */
        .footer {
            margin-top: 4mm;
            padding-top: 2.5mm;
            border-top: 1px solid #f3f4f6;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }
        .footer-label {
            font-size: 5.5pt;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .footer-val-plain {
            font-size: 6.5pt;
            font-weight: 700;
            color: #1f2937;
            margin-left: 2px;
        }
        .footer-brand {
            text-align: right;
            font-size: 6pt;
            font-weight: 600;
            color: #4b5563;
        }
        .order-id-box {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 2mm 3mm;
            text-align: center;
            margin-top: 2.5mm;
        }
        .order-id-label {
            display: block;
            font-size: 5pt;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 0.5mm;
        }
        .order-id-val {
            font-family: 'Courier New', monospace;
            font-size: 7.5pt;
            font-weight: 800;
            color: #111827;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    {{-- Canvas wrapper: DomPDF-safe outer spacing via table cellpadding --}}
    <table class="canvas"><tr><td class="canvas-cell">

    <div class="card">
        <div class="accent-top"></div>
        <table class="main-table">
            <tr>
                <td class="panel-left">

                    <table class="brand-bar">
                        <tr>
                            <td style="vertical-align: middle;">
                                <table style="border-collapse: collapse; margin: 0; padding: 0;">
                                     <tr>
                                         @if(!empty($logo_data_uri))
                                             <td style="vertical-align: middle; padding-right: 7px; line-height: 0;">
                                                 <img src="{{ $logo_data_uri }}" class="brand-logo" alt="Sinemus">
                                             </td>
                                         @endif
                                         <td style="vertical-align: middle;">
                                             <div class="brand-name">SINE<span class="blue">MUS</span></div>
                                             <div class="brand-sub">Sinemus Indonesia</div>
                                         </td>
                                     </tr>
                                </table>
                            </td>
                            <td style="text-align: right; vertical-align: middle;">
                                <span class="badge badge-amber">Reservasi Resmi</span>
                            </td>
                        </tr>
                    </table>

                    <hr class="sep">

                    <div class="title">{{ $event_title }}</div>
                    <div class="venue">{{ $venue_name }} &bull; {{ $city }}</div>

                    <table class="details">
                        <tr>
                            <td style="width: 55%;">
                                <div class="lbl">Jadwal Penayangan</div>
                                <div class="val">{{ $show_time_formatted }}</div>
                            </td>
                            <td>
                                <div class="lbl">Status Kursi</div>
                                <div class="val val-amber">Terkunci Sah</div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <div class="lbl">Nomor Kursi Terkunci ({{ count($seats) }} Kursi)</div>
                                <div class="seats">
                                    @foreach($seats as $seat)
                                        <span class="seat">{{ $seat }}</span>
                                    @endforeach
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="lbl">Nama Pemesan</div>
                                <div class="val">{{ $customer_name }}</div>
                            </td>
                            <td>
                                <div class="lbl">Status Pembayaran</div>
                                <div class="val val-green">Lunas (Midtrans)</div>
                            </td>
                        </tr>
                    </table>

                    <div class="footer">
                        <table class="footer-table">
                            <tr>
                                <td style="vertical-align: middle;">
                                    <span class="footer-label">WAKTU BAYAR:</span>
                                    <span class="footer-val-plain">{{ $paid_at_formatted }}</span>
                                </td>
                                <td class="footer-brand" style="vertical-align: middle;">
                                    Tanda Terima Sah &bull; Sinemus Indonesia
                                </td>
                            </tr>
                        </table>
                    </div>

                </td>

                <td class="panel-right">

                    <div class="seal-box">
                        <div class="seal-title">JAMINAN ALOKASI KURSI</div>
                        <div class="seal-sub">100% TERDAFTAR RESMI</div>
                    </div>

                    <div class="timeline-box">
                        <div class="timeline-heading">Status Distribusi Tiket</div>
                        <table class="timeline-table">
                            <tr>
                                <td class="step-num-col"><span class="step-badge step-badge-done">1</span></td>
                                <td class="step-text"><strong style="color: #059669;">Lunas</strong> &bull; Pembayaran Terverifikasi</td>
                            </tr>
                            <tr>
                                <td class="step-num-col"><span class="step-badge step-badge-active">2</span></td>
                                <td class="step-text step-highlight"><strong>Proses</strong> &bull; Pemrosesan Karcis Resmi oleh Tim Operasional</td>
                            </tr>
                            <tr>
                                <td class="step-num-col"><span class="step-badge step-badge-pending">3</span></td>
                                <td class="step-text step-muted"><strong>Siap</strong> &bull; Kode Cetak Terbit di Menu "Tiket Saya"</td>
                            </tr>
                        </table>
                    </div>

                    <div class="notice">
                        <div class="notice-heading">Instruksi & Pemberitahuan</div>
                        <div class="notice-body">
                            Dokumen ini adalah bukti kepemilikan reservasi sah. Kode booking & passcode pencetakan tiket di mesin kiosk bioskop akan otomatis tersedia di menu <strong>Tiket Saya</strong> serta <strong>diinfokan melalui email</strong> Anda mendekati jadwal penayangan.
                        </div>
                    </div>

                    <div class="order-id-box">
                        <span class="order-id-label">NO. ORDER PEMESANAN</span>
                        <span class="order-id-val">{{ $order_id }}</span>
                    </div>

                </td>
            </tr>
        </table>
    </div>

    </td></tr></table>
</body>
</html>
