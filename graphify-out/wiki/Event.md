# Event

> God node · 163 connections · `backend/app/Models/Event.php`

**Community:** [EventTransaction](EventTransaction.md)

## Connections by Relation

### calls
- .computeStats() `EXTRACTED`
- .createTestEvent() `EXTRACTED`
- .test_dashboard_stats_accurately_aggregates_revenue_tickets_and_operational_kpis() `EXTRACTED`
- .test_super_admin_can_view_user_detail_with_transaction_history() `EXTRACTED`
- .handle() `EXTRACTED`
- .run() `EXTRACTED`
- .setUp() `EXTRACTED`
- .test_order_status_sync_marks_order_older_than_15_minutes_as_expired() `EXTRACTED`
- .test_sync_order_status_cannot_be_manipulated_by_client_payload_when_midtrans_is_pending() `EXTRACTED`
- .test_sync_order_status_marks_pending_ticket_as_paid_and_books_seats() `EXTRACTED`
- .test_user_can_cancel_pending_order_and_free_seat_locks() `EXTRACTED`
- .resolveSpotlightData() `EXTRACTED`
- .run() `EXTRACTED`
- .run() `EXTRACTED`
- .test_cannot_regenerate_seats_when_schedule_has_paid_tickets() `EXTRACTED`
- .test_fulfillment_orders_api_returns_event_venue_id_and_studio_name() `EXTRACTED`
- .setUp() `EXTRACTED`
- .setUp() `EXTRACTED`
- .setUp() `EXTRACTED`
- .test_delete_voucher_deactivates_instead_of_physical_delete_if_has_event_transactions() `EXTRACTED`
- *…and 70 more `calls` connection(s) not listed (lowest-degree first to go)*

### contains
- Event.php `EXTRACTED`

### imports
- AdminPresaleInjectTest.php `EXTRACTED`
- VoucherTest.php `EXTRACTED`
- MidtransWebhookTest.php `EXTRACTED`
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
- AdminBannerTest.php `EXTRACTED`
- TicketScannerTest.php `EXTRACTED`
- SystemSettingsIntegrationTest.php `EXTRACTED`
- ScheduleSeatMapTest.php `EXTRACTED`
- TestMailCommand.php `EXTRACTED`
- AdminBannerService.php `EXTRACTED`
- *…and 17 more `imports` connection(s) not listed (lowest-degree first to go)*

### inherits
- Illuminate\Database\Eloquent\Model `EXTRACTED`

### method
- .salesEndAt() `EXTRACTED`
- .getEffectiveConcludesAt() `EXTRACTED`
- .posterUrl() `EXTRACTED`
- .backdropUrl() `EXTRACTED`
- .venueName() `EXTRACTED`
- .cinemaPartner() `EXTRACTED`
- .venueAddress() `EXTRACTED`
- .city() `EXTRACTED`
- .salesStartAt() `EXTRACTED`
- .isConcluded() `EXTRACTED`
- .scopeCity() `EXTRACTED`
- .venues() `EXTRACTED`
- .schedules() `EXTRACTED`
- .eventTransactions() `EXTRACTED`
- .seatLocks() `EXTRACTED`
- .banners() `EXTRACTED`
- .scopeActive() `EXTRACTED`
- .scopeNotConcluded() `EXTRACTED`
- .scopeSalesOpen() `EXTRACTED`
- .isSalesOpen() `EXTRACTED`
- *…and 1 more `method` connection(s) not listed (lowest-degree first to go)*

### mixes_in
- Illuminate\Database\Eloquent\Factories\HasFactory `EXTRACTED`

### references
- [AdminPresaleInjectTest](AdminPresaleInjectTest.md) `EXTRACTED`
- AdminBannerTest `EXTRACTED`
- AdminOrderAuditTest `EXTRACTED`
- [ConcurrencyBookingTest](ConcurrencyBookingTest.md) `EXTRACTED`
- TicketScannerTest `EXTRACTED`
- [MidtransWebhookTest](MidtransWebhookTest.md) `EXTRACTED`
- GeneralAdmissionQuotaTest `EXTRACTED`
- ScheduleSeatMapTest `EXTRACTED`
- .updateEvent() `EXTRACTED`
- .deleteEvent() `EXTRACTED`
- .syncLinkedBanners() `EXTRACTED`
- .createSchedule() `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*