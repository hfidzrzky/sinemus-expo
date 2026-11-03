# CinemaTicketStorageManager

> 58 nodes

## Key Concepts

- **CinemaTicketStorageManager** (23 connections) — `backend/app/Services/Admin/Presale/Support/CinemaTicketStorageManager.php`
- **CinemaQrImageExtractor** (19 connections) — `backend/app/Services/Admin/Presale/Support/CinemaQrImageExtractor.php`
- **VoucherInvalidException** (16 connections) — `backend/app/Exceptions/Checkout/VoucherInvalidException.php`
- **CinemaPdfParserService** (15 connections) — `backend/app/Services/Admin/Presale/CinemaPdfParserService.php`
- **.extractHybrid()** (12 connections) — `backend/app/Services/Admin/Presale/Support/CinemaQrImageExtractor.php`
- **self** (12 connections)
- **CinemaQrImageExtractor.php** (10 connections) — `backend/app/Services/Admin/Presale/Support/CinemaQrImageExtractor.php`
- **CinemaTicketTextExtractor** (9 connections) — `backend/app/Services/Admin/Presale/Support/CinemaTicketTextExtractor.php`
- **PdfTicketExtractorService** (8 connections) — `backend/app/Services/Admin/Presale/Support/PdfTicketExtractorService.php`
- **ZipArchiveExtractorService** (7 connections) — `backend/app/Services/Admin/Presale/Support/ZipArchiveExtractorService.php`
- **.__construct()** (5 connections) — `backend/app/Services/Admin/Presale/CinemaPdfParserService.php`
- **.parse()** (5 connections) — `backend/app/Services/Admin/Presale/CinemaPdfParserService.php`
- **.parseZipArchive()** (5 connections) — `backend/app/Services/Admin/Presale/CinemaPdfParserService.php`
- **PdfTicketExtractorService.php** (5 connections) — `backend/app/Services/Admin/Presale/Support/PdfTicketExtractorService.php`
- **.cropQrFromImageWithPadding()** (4 connections) — `backend/app/Services/Admin/Presale/Support/CinemaQrImageExtractor.php`
- **.smartDetectAndCropQr()** (4 connections) — `backend/app/Services/Admin/Presale/Support/CinemaQrImageExtractor.php`
- **.extractSafely()** (4 connections) — `backend/app/Services/Admin/Presale/Support/ZipArchiveExtractorService.php`
- **.parseMasterPdf()** (3 connections) — `backend/app/Services/Admin/Presale/CinemaPdfParserService.php`
- **.cropQrFromBinaryWithPadding()** (3 connections) — `backend/app/Services/Admin/Presale/Support/CinemaQrImageExtractor.php`
- **.decodeQrStringFromBinary()** (3 connections) — `backend/app/Services/Admin/Presale/Support/CinemaQrImageExtractor.php`
- **.normalizePdfImageToBinary()** (3 connections) — `backend/app/Services/Admin/Presale/Support/CinemaQrImageExtractor.php`
- **.storeTempQrImage()** (3 connections) — `backend/app/Services/Admin/Presale/Support/CinemaQrImageExtractor.php`
- **.storeTicketQrImage()** (3 connections) — `backend/app/Services/Admin/Presale/Support/CinemaTicketStorageManager.php`
- **.__construct()** (3 connections) — `backend/app/Services/Admin/Presale/Support/PdfTicketExtractorService.php`
- **.guardAntiZipSlip()** (3 connections) — `backend/app/Services/Admin/Presale/Support/ZipArchiveExtractorService.php`
- *... and 33 more nodes in this community*

## Relationships

- [DomainException](DomainException.md) (23 shared connections)
- [User](User.md) (7 shared connections)
- [Illuminate\Http\JsonResponse](Illuminate_Http_JsonResponse.md) (4 shared connections)
- [Illuminate\Console\Command](Illuminate_Console_Command.md) (4 shared connections)
- [VoucherService](VoucherService.md) (3 shared connections)
- [Illuminate\Support\Facades\Log](Illuminate_Support_Facades_Log.md) (3 shared connections)
- [SystemSettingService](SystemSettingService.md) (2 shared connections)
- [SeatLock](SeatLock.md) (2 shared connections)
- [Illuminate\Http\Request](Illuminate_Http_Request.md) (1 shared connections)
- [ProcessBulkInjectCinemaTicketsJob](ProcessBulkInjectCinemaTicketsJob.md) (1 shared connections)
- [EventTransaction](EventTransaction.md) (1 shared connections)
- [Illuminate\Database\Eloquent\Relations\BelongsTo](Illuminate_Database_Eloquent_Relations_BelongsTo.md) (1 shared connections)

## Source Files

- `backend/app/Exceptions/Checkout/VoucherInvalidException.php`
- `backend/app/Services/Admin/Presale/CinemaPdfParserService.php`
- `backend/app/Services/Admin/Presale/Support/CinemaQrImageExtractor.php`
- `backend/app/Services/Admin/Presale/Support/CinemaTicketStorageManager.php`
- `backend/app/Services/Admin/Presale/Support/CinemaTicketTextExtractor.php`
- `backend/app/Services/Admin/Presale/Support/PdfTicketExtractorService.php`
- `backend/app/Services/Admin/Presale/Support/ZipArchiveExtractorService.php`

## Audit Trail

- EXTRACTED: 142 (95%)
- INFERRED: 7 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*