# TicketConfirmationMail

> 15 nodes

## Key Concepts

- **TicketConfirmationMail** (19 connections) — `backend/app/Mail/Tickets/TicketConfirmationMail.php`
- **TicketConfirmationMail.php** (11 connections) — `backend/app/Mail/Tickets/TicketConfirmationMail.php`
- **.handle()** (3 connections) — `backend/app/Jobs/SendCinemaTicketReadyEmailJob.php`
- **.handle()** (3 connections) — `backend/app/Jobs/SendTransactionEmailJob.php`
- **.content()** (3 connections) — `backend/app/Mail/Tickets/TicketConfirmationMail.php`
- **.envelope()** (3 connections) — `backend/app/Mail/Tickets/TicketConfirmationMail.php`
- **.__construct()** (2 connections) — `backend/app/Mail/Tickets/TicketConfirmationMail.php`
- **Illuminate\Mail\Mailable** (2 connections)
- **Illuminate\Mail\Mailables\Content** (2 connections)
- **Illuminate\Mail\Mailables\Envelope** (2 connections)
- **.attachments()** (1 connections) — `backend/app/Mail/Tickets/TicketConfirmationMail.php`
- **Content** (1 connections)
- **Envelope** (1 connections)
- **Illuminate\Mail\Mailables\Address** (1 connections)
- **Illuminate\Mail\Mailables\Attachment** (1 connections)

## Relationships

- [EventTransaction](EventTransaction.md) (9 shared connections)
- [Illuminate\Support\Facades\Log](Illuminate_Support_Facades_Log.md) (8 shared connections)
- [User](User.md) (2 shared connections)
- [SystemSettingService](SystemSettingService.md) (1 shared connections)
- [TicketEmailPayloadBuilder](TicketEmailPayloadBuilder.md) (1 shared connections)

## Source Files

- `backend/app/Jobs/SendCinemaTicketReadyEmailJob.php`
- `backend/app/Jobs/SendTransactionEmailJob.php`
- `backend/app/Mail/Tickets/TicketConfirmationMail.php`

## Audit Trail

- EXTRACTED: 38 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*