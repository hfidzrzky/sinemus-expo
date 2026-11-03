# EventTransaction

> 138 nodes

## Key Concepts

- **EventTransaction** (171 connections) — `backend/app/Models/EventTransaction.php`
- **Event** (163 connections) — `backend/app/Models/Event.php`
- **Schedule** (135 connections) — `backend/app/Models/Schedule.php`
- **Seat** (43 connections) — `backend/app/Models/Seat.php`
- **UserTicketTest** (31 connections) — `backend/tests/Feature/Tickets/UserTicketTest.php`
- **AdminEventTest** (27 connections) — `backend/tests/Feature/Admin/Events/AdminEventTest.php`
- **TicketScannerTest** (20 connections) — `backend/tests/Feature/Admin/Scanner/TicketScannerTest.php`
- **EventCatalogTest** (16 connections) — `backend/tests/Feature/Events/EventCatalogTest.php`
- **MultiVenuePresaleSchemaTest** (12 connections) — `backend/tests/Feature/Admin/Events/MultiVenuePresaleSchemaTest.php`
- **AdminVoucherTest.php** (10 connections) — `backend/tests/Feature/Admin/Vouchers/AdminVoucherTest.php`
- **UserTicketScenarioSeeder.php** (9 connections) — `backend/database/seeders/UserTicketScenarioSeeder.php`
- **SystemSettingsIntegrationTest.php** (9 connections) — `backend/tests/Feature/Admin/Settings/SystemSettingsIntegrationTest.php`
- **.handleNotification()** (8 connections) — `backend/app/Services/Checkout/TicketPaymentService.php`
- **.createTestEvent()** (8 connections) — `backend/tests/Feature/Tickets/UserTicketTest.php`
- **TestMailCommand.php** (8 connections) — `backend/app/Console/Commands/TestMailCommand.php`
- **AdminScheduleSeatService.php** (8 connections) — `backend/app/Services/Admin/Events/AdminScheduleSeatService.php`
- **EventSeeder.php** (8 connections) — `backend/database/seeders/EventSeeder.php`
- **PresaleCinemaTicketSeeder.php** (8 connections) — `backend/database/seeders/PresaleCinemaTicketSeeder.php`
- **.test_dashboard_stats_accurately_aggregates_revenue_tickets_and_operational_kpis()** (7 connections) — `backend/tests/Feature/Admin/Dashboard/DashboardAnalyticsTest.php`
- **.test_super_admin_can_view_user_detail_with_transaction_history()** (7 connections) — `backend/tests/Feature/Admin/Users/AdminUserTest.php`
- **.handle()** (6 connections) — `backend/app/Console/Commands/TestMailCommand.php`
- **.reconcileScheduleSeats()** (6 connections) — `backend/app/Services/Admin/Events/AdminScheduleSeatService.php`
- **.run()** (6 connections) — `backend/database/seeders/PresaleCinemaTicketSeeder.php`
- **.test_order_status_sync_marks_order_older_than_15_minutes_as_expired()** (6 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_sync_order_status_cannot_be_manipulated_by_client_payload_when_midtrans_is_pending()** (6 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- *... and 113 more nodes in this community*

## Relationships

- [User](User.md) (103 shared connections)
- [Illuminate\Database\Eloquent\Relations\BelongsTo](Illuminate_Database_Eloquent_Relations_BelongsTo.md) (48 shared connections)
- [DomainException](DomainException.md) (42 shared connections)
- [MovieTransaction](MovieTransaction.md) (37 shared connections)
- [SeatLock](SeatLock.md) (36 shared connections)
- [Illuminate\Database\Seeder](Illuminate_Database_Seeder.md) (18 shared connections)
- [Illuminate\Http\Request](Illuminate_Http_Request.md) (16 shared connections)
- [Banner](Banner.md) (11 shared connections)
- [Illuminate\Support\Facades\Log](Illuminate_Support_Facades_Log.md) (11 shared connections)
- [Movie](Movie.md) (10 shared connections)
- [TicketConfirmationMail](TicketConfirmationMail.md) (9 shared connections)
- [Illuminate\Console\Command](Illuminate_Console_Command.md) (8 shared connections)

## Source Files

- `backend/app/Console/Commands/TestMailCommand.php`
- `backend/app/Models/Event.php`
- `backend/app/Models/EventTransaction.php`
- `backend/app/Models/Schedule.php`
- `backend/app/Models/Seat.php`
- `backend/app/Services/Admin/Events/AdminEventService.php`
- `backend/app/Services/Admin/Events/AdminScheduleSeatService.php`
- `backend/app/Services/Admin/Presale/Actions/BatchFulfillmentConfirmationAction.php`
- `backend/app/Services/Admin/Presale/Actions/SmartIngestMatcherAction.php`
- `backend/app/Services/Admin/Presale/CinemaTicketFulfillmentService.php`
- `backend/app/Services/Checkout/TicketPaymentService.php`
- `backend/app/Services/Event/ScheduleSeatMapService.php`
- `backend/database/seeders/EventSeeder.php`
- `backend/database/seeders/PresaleCinemaTicketSeeder.php`
- `backend/database/seeders/UserTicketScenarioSeeder.php`
- `backend/tests/Feature/Admin/Dashboard/DashboardAnalyticsTest.php`
- `backend/tests/Feature/Admin/Events/AdminEventTest.php`
- `backend/tests/Feature/Admin/Events/EventSalesWindowAndAutoDraftTest.php`
- `backend/tests/Feature/Admin/Events/MultiVenuePresaleSchemaTest.php`
- `backend/tests/Feature/Admin/Presale/AdminPresaleInjectTest.php`

## Audit Trail

- EXTRACTED: 743 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*