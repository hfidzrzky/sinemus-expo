# TicketPdfService

> 21 nodes

## Key Concepts

- **TicketPdfService** (31 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.generatePdfForTransaction()** (11 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.generateQrDataUri()** (6 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.generateFallbackQrSvg()** (5 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.buildViewData()** (4 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.findAuthorizedTransaction()** (4 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.buildCacheFilePath()** (3 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.generateTicketPdf()** (3 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.renderWithLock()** (3 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.resolveQrFromLocalFile()** (3 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.resolveQrPayload()** (3 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.generateVectorQrSvg()** (2 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.isPathWithinAllowedDirectories()** (2 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.readFromCache()** (2 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.renderPdfContent()** (2 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.resolveFilename()** (2 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.resolveLogoDataUri()** (2 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.resolveQrFromStorageDisk()** (2 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.resolveViewTemplate()** (2 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.pruneExpiredPdfCache()** (1 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **.purgeCache()** (1 connections) — `backend/app/Services/Tickets/TicketPdfService.php`

## Relationships

- [EventTransaction](EventTransaction.md) (7 shared connections)
- [User](User.md) (3 shared connections)
- [SystemSettingService](SystemSettingService.md) (2 shared connections)
- [Illuminate\Support\Facades\Log](Illuminate_Support_Facades_Log.md) (2 shared connections)
- [DomainException](DomainException.md) (2 shared connections)
- [console.php](console.php.md) (1 shared connections)
- [SeatLock](SeatLock.md) (1 shared connections)
- [TicketNotFoundException](TicketNotFoundException.md) (1 shared connections)
- [Illuminate\Http\JsonResponse](Illuminate_Http_JsonResponse.md) (1 shared connections)

## Source Files

- `backend/app/Services/Tickets/TicketPdfService.php`

## Audit Trail

- EXTRACTED: 57 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*