# AdminOrderFilterRequest

> 12 nodes

## Key Concepts

- **AdminOrderFilterRequest** (7 connections) — `backend/app/Http/Requests/Admin/V1/Orders/AdminOrderFilterRequest.php`
- **Symfony\Component\HttpFoundation\StreamedResponse** (6 connections)
- **AdminOrderExportService** (5 connections) — `backend/app/Services/Admin/Orders/AdminOrderExportService.php`
- **.export()** (3 connections) — `backend/app/Http/Controllers/Admin/V1/Orders/AdminOrderController.php`
- **.exportOrdersCsv()** (3 connections) — `backend/app/Services/Admin/Orders/AdminOrderExportService.php`
- **AdminOrderFilterRequest.php** (3 connections) — `backend/app/Http/Requests/Admin/V1/Orders/AdminOrderFilterRequest.php`
- **.exportOrdersCsv()** (2 connections) — `backend/app/Services/Admin/Orders/AdminOrderAuditService.php`
- **.__construct()** (2 connections) — `backend/app/Services/Admin/Orders/AdminOrderExportService.php`
- **.sanitizeCsvField()** (2 connections) — `backend/app/Services/Admin/Orders/AdminOrderExportService.php`
- **AdminOrderExportService.php** (2 connections) — `backend/app/Services/Admin/Orders/AdminOrderExportService.php`
- **.authorize()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Orders/AdminOrderFilterRequest.php`
- **.rules()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Orders/AdminOrderFilterRequest.php`

## Relationships

- [AdminOrderController.php](AdminOrderController.php.md) (4 shared connections)
- [MovieTransaction](MovieTransaction.md) (4 shared connections)
- [Illuminate\Foundation\Http\FormRequest](Illuminate_Foundation_Http_FormRequest.md) (2 shared connections)
- [Illuminate\Contracts\Validation\ValidationRule](Illuminate_Contracts_Validation_ValidationRule.md) (1 shared connections)

## Source Files

- `backend/app/Http/Controllers/Admin/V1/Orders/AdminOrderController.php`
- `backend/app/Http/Requests/Admin/V1/Orders/AdminOrderFilterRequest.php`
- `backend/app/Services/Admin/Orders/AdminOrderAuditService.php`
- `backend/app/Services/Admin/Orders/AdminOrderExportService.php`

## Audit Trail

- EXTRACTED: 24 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*