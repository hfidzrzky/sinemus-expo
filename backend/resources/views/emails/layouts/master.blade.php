<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark only" />
    <title>{{ $subject ?? 'Sinemus Screen - Konfirmasi Tiket' }}</title>
    <!--[if mso]>
        <style type="text/css">
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        </style>
    <![endif]-->
    <style type="text/css">
        /* Client-specific Resets */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7; }
        
        /* Typography Helpers */
        .text-center { text-align: center !important; }
        .highlight { color: #ffffff !important; font-weight: 600 !important; }
        
        @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; max-width: 100% !important; }
            .content-padding { padding: 24px 16px !important; }
            .header-padding { padding: 24px 16px !important; }
            .footer-padding { padding: 24px 16px !important; }
            .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
            .stack-column-space { height: 12px !important; }
            .btn-table { width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
    <!-- Outer Wrapper Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #09090b; min-width: 100%;">
        <tr>
            <td align="center" style="padding: 40px 12px;">
                <!-- Main Container Table (Max 600px) -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; width: 100%; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    @php
                        $bgAccent = $accentGradient ?? 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)';
                        $logoPath = public_path('sinemus-logo.png');
                        $logoSrc = (isset($message) && file_exists($logoPath)) ? $message->embed($logoPath) : (!empty($logoDataUri) ? $logoDataUri : asset('sinemus-logo.png'));
                    @endphp

                    <!-- Accent Bar -->
                    <tr>
                        <td height="4" {!! 'style="background: ' . $bgAccent . '; height: 4px; font-size: 1px; line-height: 1px;"' !!}>&nbsp;</td>
                    </tr>

                    <!-- Header -->
                    <tr>
                        <td class="header-padding" style="padding: 28px 40px; background-color: #121214; border-bottom: 1px solid #27272a;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                                <tr>
                                    <td valign="middle" style="padding-right: 14px;">
                                        <img src="{{ $logoSrc }}" alt="Sinemus Logo" width="44" height="44" style="width: 44px; height: 44px; border-radius: 8px; display: block;" />
                                    </td>
                                    <td valign="middle" style="text-align: left;">
                                        <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; line-height: 1.1;">
                                            SINEMUS <span style="color: #3b82f6;">SCREEN</span>
                                        </div>
                                        <div style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1aa; font-weight: 600; margin-top: 4px; line-height: 1;">
                                            Cinema Screening &amp; Event
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td class="content-padding" style="padding: 36px 40px; background-color: #18181b;">
                            @yield('content')
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td class="footer-padding" style="background-color: #09090b; padding: 32px 40px; text-align: center; border-top: 1px solid #27272a;">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
                                Butuh bantuan seputar tiket atau penayangan bioskop?<br />
                                <a href="https://wa.me/6289526020145" target="_blank" style="color: #34d399; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 8px;">Hubungi Customer Service &rarr;</a>
                            </p>
                            <p style="margin: 20px 0 0; font-size: 11px; color: #71717a; line-height: 1.5;">
                                &copy; {{ date('Y') }} Sinemus Indonesia Platform.<br />
                                Email transaksi resmi ini dikirimkan ke <strong style="color: #a1a1aa;">{{ $userEmail }}</strong>.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>