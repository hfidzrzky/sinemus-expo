# TicketNotFoundException

> 21 nodes

## Key Concepts

- **TicketNotFoundException** (10 connections) — `backend/app/Exceptions/Tickets/TicketNotFoundException.php`
- **TicketAlreadyCheckedInException** (8 connections) — `backend/app/Exceptions/Tickets/TicketAlreadyCheckedInException.php`
- **TicketValidationService.php** (8 connections) — `backend/app/Services/Admin/Scanner/TicketValidationService.php`
- **AdminTicketScannerController** (6 connections) — `backend/app/Http/Controllers/Admin/V1/Scanner/AdminTicketScannerController.php`
- **.validateAndCheckin()** (6 connections) — `backend/app/Services/Admin/Scanner/TicketValidationService.php`
- **AdminTicketScannerController.php** (6 connections) — `backend/app/Http/Controllers/Admin/V1/Scanner/AdminTicketScannerController.php`
- **TicketValidationResource** (5 connections) — `backend/app/Http/Resources/Admin/V1/Scanner/TicketValidationResource.php`
- **TicketValidationService** (5 connections) — `backend/app/Services/Admin/Scanner/TicketValidationService.php`
- **.validateQr()** (4 connections) — `backend/app/Http/Controllers/Admin/V1/Scanner/AdminTicketScannerController.php`
- **TicketAlreadyCheckedInException.php** (4 connections) — `backend/app/Exceptions/Tickets/TicketAlreadyCheckedInException.php`
- **TicketNotFoundException.php** (4 connections) — `backend/app/Exceptions/Tickets/TicketNotFoundException.php`
- **TicketValidationResource.php** (4 connections) — `backend/app/Http/Resources/Admin/V1/Scanner/TicketValidationResource.php`
- **.render()** (3 connections) — `backend/app/Exceptions/Tickets/TicketAlreadyCheckedInException.php`
- **.render()** (3 connections) — `backend/app/Exceptions/Tickets/TicketNotFoundException.php`
- **.getTicketByCode()** (3 connections) — `backend/app/Services/Tickets/UserTicketService.php`
- **.__construct()** (2 connections) — `backend/app/Exceptions/Tickets/TicketAlreadyCheckedInException.php`
- **.__construct()** (2 connections) — `backend/app/Exceptions/Tickets/TicketNotFoundException.php`
- **.__construct()** (2 connections) — `backend/app/Http/Controllers/Admin/V1/Scanner/AdminTicketScannerController.php`
- **.toArray()** (2 connections) — `backend/app/Http/Resources/Admin/V1/Scanner/TicketValidationResource.php`
- **.getScannedAt()** (1 connections) — `backend/app/Exceptions/Tickets/TicketAlreadyCheckedInException.php`
- **.getScannedByName()** (1 connections) — `backend/app/Exceptions/Tickets/TicketAlreadyCheckedInException.php`

## Relationships

- [Illuminate\Http\JsonResponse](Illuminate_Http_JsonResponse.md) (12 shared connections)
- [Illuminate\Http\Request](Illuminate_Http_Request.md) (8 shared connections)
- [EventTransaction](EventTransaction.md) (4 shared connections)
- [Controller](Controller.md) (3 shared connections)
- [User](User.md) (3 shared connections)
- [SystemSettingService](SystemSettingService.md) (2 shared connections)
- [ValidateTicketQrRequest](ValidateTicketQrRequest.md) (2 shared connections)
- [Illuminate\Database\Eloquent\Relations\BelongsTo](Illuminate_Database_Eloquent_Relations_BelongsTo.md) (2 shared connections)
- [TicketPdfService](TicketPdfService.md) (1 shared connections)
- [SeatLock](SeatLock.md) (1 shared connections)
- [app.php](app.php.md) (1 shared connections)

## Source Files

- `backend/app/Exceptions/Tickets/TicketAlreadyCheckedInException.php`
- `backend/app/Exceptions/Tickets/TicketNotFoundException.php`
- `backend/app/Http/Controllers/Admin/V1/Scanner/AdminTicketScannerController.php`
- `backend/app/Http/Resources/Admin/V1/Scanner/TicketValidationResource.php`
- `backend/app/Services/Admin/Scanner/TicketValidationService.php`
- `backend/app/Services/Tickets/UserTicketService.php`

## Audit Trail

- EXTRACTED: 64 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*