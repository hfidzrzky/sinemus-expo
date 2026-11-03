# MovieTransaction

> 61 nodes

## Key Concepts

- **MovieTransaction** (68 connections) — `backend/app/Models/MovieTransaction.php`
- **AdminOrderAuditTest** (26 connections) — `backend/tests/Feature/Admin/Orders/AdminOrderAuditTest.php`
- **OrderStatusService** (17 connections) — `backend/app/Services/Checkout/OrderStatusService.php`
- **OrderNotFoundException** (14 connections) — `backend/app/Exceptions/Checkout/OrderNotFoundException.php`
- **DashboardAnalyticsService** (11 connections) — `backend/app/Services/Admin/Dashboard/DashboardAnalyticsService.php`
- **AdminOrderAuditService** (11 connections) — `backend/app/Services/Admin/Orders/AdminOrderAuditService.php`
- **.computeStats()** (11 connections) — `backend/app/Services/Admin/Dashboard/DashboardAnalyticsService.php`
- **AdminOrderAuditService.php** (11 connections) — `backend/app/Services/Admin/Orders/AdminOrderAuditService.php`
- **.getStreamSession()** (9 connections) — `backend/app/Services/Movies/MovieStreamService.php`
- **DashboardAnalyticsService.php** (9 connections) — `backend/app/Services/Admin/Dashboard/DashboardAnalyticsService.php`
- **MovieCatalogService.php** (9 connections) — `backend/app/Services/Movies/MovieCatalogService.php`
- **MovieRentalPaymentService** (8 connections) — `backend/app/Services/Checkout/MovieRentalPaymentService.php`
- **AdminOrderDetailResource.php** (8 connections) — `backend/app/Http/Resources/Admin/V1/Orders/AdminOrderDetailResource.php`
- **AdminUserDetailResource.php** (8 connections) — `backend/app/Http/Resources/Admin/V1/Users/AdminUserDetailResource.php`
- **.cancelOrder()** (7 connections) — `backend/app/Services/Checkout/OrderStatusService.php`
- **.getOrderStatus()** (7 connections) — `backend/app/Services/Checkout/OrderStatusService.php`
- **MovieRentalPaymentService.php** (7 connections) — `backend/app/Services/Checkout/MovieRentalPaymentService.php`
- **.resendTicketNotification()** (6 connections) — `backend/app/Services/Admin/Orders/AdminOrderAuditService.php`
- **.getMovieBySlugOrId()** (6 connections) — `backend/app/Services/Movies/MovieCatalogService.php`
- **.setUp()** (6 connections) — `backend/tests/Feature/Admin/Orders/AdminOrderAuditTest.php`
- **.getRecentTransactions()** (5 connections) — `backend/app/Services/Admin/Dashboard/DashboardAnalyticsService.php`
- **.__construct()** (5 connections) — `backend/app/Services/Checkout/OrderStatusService.php`
- **Illuminate\Support\Carbon** (5 connections)
- **.computeRevenueTrends()** (4 connections) — `backend/app/Services/Admin/Dashboard/DashboardAnalyticsService.php`
- **.getOrderDetail()** (4 connections) — `backend/app/Services/Admin/Orders/AdminOrderAuditService.php`
- *... and 36 more nodes in this community*

## Relationships

- [EventTransaction](EventTransaction.md) (37 shared connections)
- [User](User.md) (32 shared connections)
- [Movie](Movie.md) (20 shared connections)
- [Illuminate\Http\JsonResponse](Illuminate_Http_JsonResponse.md) (15 shared connections)
- [Illuminate\Database\Eloquent\Relations\BelongsTo](Illuminate_Database_Eloquent_Relations_BelongsTo.md) (10 shared connections)
- [DomainException](DomainException.md) (8 shared connections)
- [Illuminate\Http\Request](Illuminate_Http_Request.md) (8 shared connections)
- [Illuminate\Support\Facades\Log](Illuminate_Support_Facades_Log.md) (5 shared connections)
- [ListMoviesRequest](ListMoviesRequest.md) (5 shared connections)
- [AdminOrderController.php](AdminOrderController.php.md) (5 shared connections)
- [VoucherService](VoucherService.md) (5 shared connections)
- [Voucher](Voucher.md) (4 shared connections)

## Source Files

- `backend/app/Exceptions/Checkout/OrderNotFoundException.php`
- `backend/app/Http/Controllers/Admin/V1/Dashboard/AdminDashboardController.php`
- `backend/app/Http/Controllers/Admin/V1/Orders/AdminOrderController.php`
- `backend/app/Http/Resources/Admin/V1/Orders/AdminOrderDetailResource.php`
- `backend/app/Http/Resources/Admin/V1/Users/AdminUserDetailResource.php`
- `backend/app/Models/Event.php`
- `backend/app/Models/MovieTransaction.php`
- `backend/app/Services/Admin/Dashboard/DashboardAnalyticsService.php`
- `backend/app/Services/Admin/Orders/AdminOrderAuditService.php`
- `backend/app/Services/Checkout/MovieRentalPaymentService.php`
- `backend/app/Services/Checkout/OrderStatusService.php`
- `backend/app/Services/Movies/MovieCatalogService.php`
- `backend/app/Services/Movies/MovieStreamService.php`
- `backend/tests/Feature/Admin/Orders/AdminOrderAuditTest.php`
- `backend/tests/Feature/Checkout/VoucherTest.php`

## Audit Trail

- EXTRACTED: 272 (100%)
- INFERRED: 1 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*