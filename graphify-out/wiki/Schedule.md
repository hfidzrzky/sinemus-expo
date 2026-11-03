# Schedule

> God node · 135 connections · `backend/app/Models/Schedule.php`

**Community:** [EventTransaction](EventTransaction.md)

## Connections by Relation

### calls
- .computeStats() `EXTRACTED`
- .run() `EXTRACTED`
- .test_dashboard_stats_accurately_aggregates_revenue_tickets_and_operational_kpis() `EXTRACTED`
- .test_super_admin_can_view_user_detail_with_transaction_history() `EXTRACTED`
- .handle() `EXTRACTED`
- .reconcileScheduleSeats() `EXTRACTED`
- .run() `EXTRACTED`
- .setUp() `EXTRACTED`
- .test_order_status_sync_marks_order_older_than_15_minutes_as_expired() `EXTRACTED`
- .test_sync_order_status_cannot_be_manipulated_by_client_payload_when_midtrans_is_pending() `EXTRACTED`
- .test_sync_order_status_marks_pending_ticket_as_paid_and_books_seats() `EXTRACTED`
- .test_user_can_cancel_pending_order_and_free_seat_locks() `EXTRACTED`
- .generateSeats() `EXTRACTED`
- .confirmSmartIngest() `EXTRACTED`
- .fulfillmentOrders() `EXTRACTED`
- .previewSmartIngest() `EXTRACTED`
- .generateSeatsGrid() `EXTRACTED`
- .getSeatMap() `EXTRACTED`
- .run() `EXTRACTED`
- .run() `EXTRACTED`
- *…and 49 more `calls` connection(s) not listed (lowest-degree first to go)*

### contains
- Schedule.php `EXTRACTED`

### imports
- AdminPresaleInjectTest.php `EXTRACTED`
- VoucherTest.php `EXTRACTED`
- MidtransWebhookTest.php `EXTRACTED`
- AdminEventController.php `EXTRACTED`
- AdminPresaleInjectController.php `EXTRACTED`
- CinemaTicketFulfillmentService.php `EXTRACTED`
- SeatReservationService.php `EXTRACTED`
- AdminOrderAuditTest.php `EXTRACTED`
- UserTicketTest.php `EXTRACTED`
- AdminEventService.php `EXTRACTED`
- DashboardAnalyticsTest.php `EXTRACTED`
- ConcurrencyBookingTest.php `EXTRACTED`
- AdminEventTest.php `EXTRACTED`
- MultiVenuePresaleSchemaTest.php `EXTRACTED`
- AdminUserTest.php `EXTRACTED`
- AdminVoucherTest.php `EXTRACTED`
- DashboardAnalyticsService.php `EXTRACTED`
- UserTicketScenarioSeeder.php `EXTRACTED`
- VoucherSeeder.php `EXTRACTED`
- TicketScannerTest.php `EXTRACTED`
- *…and 15 more `imports` connection(s) not listed (lowest-degree first to go)*

### inherits
- Illuminate\Database\Eloquent\Model `EXTRACTED`

### method
- .scopeActive() `EXTRACTED`
- .event() `EXTRACTED`
- .venue() `EXTRACTED`
- .seats() `EXTRACTED`
- .seatLocks() `EXTRACTED`
- .eventTransactions() `EXTRACTED`
- .casts() `EXTRACTED`

### mixes_in
- Illuminate\Database\Eloquent\Factories\HasFactory `EXTRACTED`

### references
- [AdminPresaleInjectTest](AdminPresaleInjectTest.md) `EXTRACTED`
- AdminOrderAuditTest `EXTRACTED`
- [ConcurrencyBookingTest](ConcurrencyBookingTest.md) `EXTRACTED`
- TicketScannerTest `EXTRACTED`
- [MidtransWebhookTest](MidtransWebhookTest.md) `EXTRACTED`
- GeneralAdmissionQuotaTest `EXTRACTED`
- ScheduleSeatMapTest `EXTRACTED`
- .reserveAssignedSeats() `EXTRACTED`
- [SystemSettingsIntegrationTest](SystemSettingsIntegrationTest.md) `EXTRACTED`
- .reserveGeneralAdmissionSeats() `EXTRACTED`
- .createDraftTransaction() `EXTRACTED`
- .handleExistingReservation() `EXTRACTED`
- .syncScheduleSeats() `EXTRACTED`
- .execute() `EXTRACTED`
- .match() `EXTRACTED`
- .dispatchBulkInject() `EXTRACTED`
- .getScheduleFulfillmentOrders() `EXTRACTED`
- .isSeatMapConfigIdentical() `EXTRACTED`
- .previewSmartIngest() `EXTRACTED`
- .createSchedule() `EXTRACTED`
- *…and 1 more `references` connection(s) not listed (lowest-degree first to go)*

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*