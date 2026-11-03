<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>E-Tiket Screening - {{ $order_id }}</title>
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
            background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
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
        .badge-blue {
            background-color: #eff6ff;
            color: #2563eb;
            border: 1px solid #bfdbfe;
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
        .val-green { color: #059669; }

        /* ── Seats ── */
        .seats { margin-top: 1.5mm; }
        .seat {
            display: inline-block;
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #2563eb;
            font-family: 'Courier New', monospace;
            font-weight: 800;
            font-size: 9pt;
            padding: 2px 8px;
            border-radius: 4px;
            margin-right: 3px;
            margin-bottom: 2px;
        }
        .seat-ga {
            display: inline-block;
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            font-size: 7.5pt;
            font-weight: 700;
            padding: 2.5px 8px;
            border-radius: 4px;
            letter-spacing: 0.2px;
        }

        /* ── QR ── */
        .qr-heading {
            font-size: 6pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: #9ca3af;
            margin-bottom: 5mm;
        }
        .qr-frame {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 4mm;
            display: inline-block;
            margin-bottom: 4mm;
        }
        .qr-img {
            width: 32mm;
            height: 32mm;
            display: block;
        }
        .qr-caption {
            font-size: 6.5pt;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.4;
            margin-bottom: 2mm;
        }
        .qr-code {
            font-family: 'Courier New', monospace;
            font-size: 9pt;
            font-weight: 800;
            color: #111827;
            letter-spacing: 1.2px;
            margin-bottom: 5mm;
        }

        /* ── Guide ── */
        .guide {
            background-color: #f9fafb;
            border: 1px solid #f3f4f6;
            border-radius: 6px;
            padding: 3mm 4mm;
            text-align: left;
        }
        .guide-heading {
            font-size: 6pt;
            font-weight: 700;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1.5mm;
        }
        .guide ol {
            padding-left: 4mm;
            font-size: 6.5pt;
            color: #6b7280;
            line-height: 1.55;
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
        .footer-val {
            font-family: 'Courier New', monospace;
            font-size: 7.5pt;
            font-weight: 800;
            color: #111827;
            margin-left: 2px;
        }
        .footer-brand {
            text-align: right;
            font-size: 6pt;
            font-weight: 600;
            color: #4b5563;
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
                                <span class="badge badge-blue">E-Pass Komunitas</span>
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
                                <div class="lbl">Studio / Lokasi</div>
                                <div class="val">{{ $auditorium_name ?? 'Studio Utama' }}</div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                @if(!empty($has_assigned_seats))
                                    <div class="lbl">Nomor Kursi ({{ count($seats) }} Kursi)</div>
                                    <div class="seats">
                                        @foreach($seats as $seat)
                                            <span class="seat">{{ $seat }}</span>
                                        @endforeach
                                    </div>
                                @else
                                    <div class="lbl">Tipe Akses / Kursi</div>
                                    <div class="seats">
                                        <span class="seat-ga">General Admission &bull; Bebas Pilih Kursi ({{ $ticket_quantity ?? 1 }} Tiket)</span>
                                    </div>
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="lbl">Nama Pemesan</div>
                                <div class="val">{{ $customer_name }}</div>
                            </td>
                            <td>
                                <div class="lbl">Status Verifikasi</div>
                                <div class="val val-green">Lunas Terverifikasi</div>
                            </td>
                        </tr>
                    </table>

                    <div class="footer">
                        <table class="footer-table">
                            <tr>
                                <td style="vertical-align: middle;">
                                    <span class="footer-label">ORDER ID:</span>
                                    <span class="footer-val">{{ $order_id }}</span>
                                </td>
                                <td class="footer-brand" style="vertical-align: middle;">
                                    E-Pass Resmi &bull; Sinemus Indonesia
                                </td>
                            </tr>
                        </table>
                    </div>

                </td>

                <td class="panel-right">

                    <div class="qr-heading">Tiket Digital</div>

                    <div class="qr-frame">
                        <img src="{{ $qr_data_uri }}" class="qr-img" alt="QR E-Pass">
                    </div>

                    <div class="qr-caption">Pindai di Gerbang<br>Masuk Screening</div>
                    <div class="qr-code">{{ $ticket_code }}</div>

                    <div class="guide">
                        <div class="guide-heading">Instruksi Masuk Venue</div>
                        <ol>
                            <li>Siapkan e-tiket ini pada layar ponsel atau cetak fisik.</li>
                            <li>Tunjukkan kode QR kepada panitia di pintu masuk.</li>
                            @if(!empty($has_assigned_seats))
                                <li>Langsung menempati nomor kursi yang tertera.</li>
                            @else
                                <li>Masuk dan bebas memilih kursi yang tersedia di venue.</li>
                            @endif
                        </ol>
                    </div>

                </td>
            </tr>
        </table>
    </div>

    </td></tr></table>
</body>
</html>
