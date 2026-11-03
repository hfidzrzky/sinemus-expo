# MovieTransaction

> God node · 68 connections · `backend/app/Models/MovieTransaction.php`

**Community:** [MovieTransaction](MovieTransaction.md)

## Connections by Relation

### calls
- .computeStats() `EXTRACTED`
- .createRentalOrder() `EXTRACTED`
- .getStreamSession() `EXTRACTED`
- .run() `EXTRACTED`
- .cancelOrder() `EXTRACTED`
- .getOrderStatus() `EXTRACTED`
- .test_dashboard_stats_accurately_aggregates_revenue_tickets_and_operational_kpis() `EXTRACTED`
- .test_super_admin_can_view_user_detail_with_transaction_history() `EXTRACTED`
- .deleteMovie() `EXTRACTED`
- .resendTicketNotification() `EXTRACTED`
- .getMovieBySlugOrId() `EXTRACTED`
- .getRecentTransactions() `EXTRACTED`
- .test_movie_rental_webhook_marks_as_paid_and_activates_access_for_48_hours() `EXTRACTED`
- .computeRevenueTrends() `EXTRACTED`
- .getOrderDetail() `EXTRACTED`
- .handleNotification() `EXTRACTED`
- .test_super_admin_can_search_orders_by_order_id_user_name_email_and_phone() `EXTRACTED`
- .test_delete_voucher_deactivates_if_has_movie_transactions() `EXTRACTED`
- .test_order_status_anti_idor_prevents_viewing_other_users_order() `EXTRACTED`
- .test_delete_movie_throws_domain_exception_when_has_paid_transaction() `EXTRACTED`
- *…and 13 more `calls` connection(s) not listed (lowest-degree first to go)*

### contains
- MovieTransaction.php `EXTRACTED`

### imports
- VoucherTest.php `EXTRACTED`
- MidtransWebhookTest.php `EXTRACTED`
- AdminOrderAuditTest.php `EXTRACTED`
- MovieRentalOrderTest.php `EXTRACTED`
- MovieRentalOrderService.php `EXTRACTED`
- MovieStreamService.php `EXTRACTED`
- DashboardAnalyticsTest.php `EXTRACTED`
- MovieRequestsAndResourcesTest.php `EXTRACTED`
- AdminOrderAuditService.php `EXTRACTED`
- OrderStatusService.php `EXTRACTED`
- AdminMovieCrudTest.php `EXTRACTED`
- AdminMovieServiceTest.php `EXTRACTED`
- AdminMovieService.php `EXTRACTED`
- AdminUserTest.php `EXTRACTED`
- AdminVoucherTest.php `EXTRACTED`
- DashboardAnalyticsService.php `EXTRACTED`
- MovieCatalogService.php `EXTRACTED`
- VoucherSeeder.php `EXTRACTED`
- AdminOrderDetailResource.php `EXTRACTED`
- AdminUserDetailResource.php `EXTRACTED`
- *…and 4 more `imports` connection(s) not listed (lowest-degree first to go)*

### inherits
- Illuminate\Database\Eloquent\Model `EXTRACTED`

### method
- .user() `EXTRACTED`
- .movie() `EXTRACTED`
- .voucher() `EXTRACTED`
- .movieAccess() `EXTRACTED`
- .casts() `EXTRACTED`
- .isPendingExpired() `EXTRACTED`
- .scopePendingExpired() `EXTRACTED`

### mixes_in
- Illuminate\Database\Eloquent\Factories\HasFactory `EXTRACTED`

### references_constant
- .syncMovieOrder() `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*