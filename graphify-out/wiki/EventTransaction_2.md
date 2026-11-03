# EventTransaction

> God node · 171 connections · `backend/app/Models/EventTransaction.php`

**Community:** [EventTransaction](EventTransaction.md)

## Connections by Relation

### calls
- .computeStats() `EXTRACTED`
- .reserveAssignedSeats() `EXTRACTED`
- .reserveGeneralAdmissionSeats() `EXTRACTED`
- .createPendingTicketTransaction() `EXTRACTED`
- .createDraftTransaction() `EXTRACTED`
- .executeReservation() `EXTRACTED`
- .handleNotification() `EXTRACTED`
- .run() `EXTRACTED`
- .syncScheduleSeats() `EXTRACTED`
- .cancelOrder() `EXTRACTED`
- .getOrderStatus() `EXTRACTED`
- .test_dashboard_stats_accurately_aggregates_revenue_tickets_and_operational_kpis() `EXTRACTED`
- .test_super_admin_can_view_user_detail_with_transaction_history() `EXTRACTED`
- .handle() `EXTRACTED`
- .handle() `EXTRACTED`
- .updateEvent() `EXTRACTED`
- .reconcileScheduleSeats() `EXTRACTED`
- .resendTicketNotification() `EXTRACTED`
- .execute() `EXTRACTED`
- .validateAndCheckin() `EXTRACTED`
- *…and 76 more `calls` connection(s) not listed (lowest-degree first to go)*

### contains
- EventTransaction.php `EXTRACTED`

### imports
- AdminPresaleInjectTest.php `EXTRACTED`
- VoucherTest.php `EXTRACTED`
- MidtransWebhookTest.php `EXTRACTED`
- TicketPdfService.php `EXTRACTED`
- CinemaTicketFulfillmentService.php `EXTRACTED`
- SeatReservationService.php `EXTRACTED`
- AdminOrderAuditTest.php `EXTRACTED`
- UserTicketTest.php `EXTRACTED`
- TicketController.php `EXTRACTED`
- AdminEventService.php `EXTRACTED`
- DashboardAnalyticsTest.php `EXTRACTED`
- ConcurrencyBookingTest.php `EXTRACTED`
- ProcessBulkInjectCinemaTicketsJob.php `EXTRACTED`
- TicketEmailPayloadBuilder.php `EXTRACTED`
- AdminEventTest.php `EXTRACTED`
- TicketConfirmationMail.php `EXTRACTED`
- AdminOrderAuditService.php `EXTRACTED`
- OrderStatusService.php `EXTRACTED`
- MultiVenuePresaleSchemaTest.php `EXTRACTED`
- SendCinemaTicketReadyEmailJob.php `EXTRACTED`
- *…and 29 more `imports` connection(s) not listed (lowest-degree first to go)*

### inherits
- Illuminate\Database\Eloquent\Model `EXTRACTED`

### method
- .fulfilledByAdmin() `EXTRACTED`
- .user() `EXTRACTED`
- .voucher() `EXTRACTED`
- .checkins() `EXTRACTED`
- .schedule() `EXTRACTED`
- .casts() `EXTRACTED`

### mixes_in
- Illuminate\Database\Eloquent\Factories\HasFactory `EXTRACTED`

### references
- [AdminPresaleInjectTest](AdminPresaleInjectTest.md) `EXTRACTED`
- TicketScannerTest `EXTRACTED`
- [TicketConfirmationMail](TicketConfirmationMail.md) `EXTRACTED`
- .generatePdfForTransaction() `EXTRACTED`
- .handleExistingReservation() `EXTRACTED`
- .build() `EXTRACTED`
- .resolveQrInfo() `EXTRACTED`
- .generateQrDataUri() `EXTRACTED`
- .generateFallbackQrSvg() `EXTRACTED`
- .markTicketOrderAsExpired() `EXTRACTED`
- .syncTicketOrder() `EXTRACTED`
- .buildViewData() `EXTRACTED`
- .generateQrDataUri() `EXTRACTED`
- .buildCacheFilePath() `EXTRACTED`
- .resolveQrPayload() `EXTRACTED`
- .injectSingleTicket() `EXTRACTED`
- .__construct() `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*