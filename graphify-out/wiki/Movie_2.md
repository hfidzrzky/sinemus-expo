# Movie

> God node · 113 connections · `backend/app/Models/Movie.php`

**Community:** [Movie](Movie.md)

## Connections by Relation

### calls
- .computeStats() `EXTRACTED`
- .createRentalOrder() `EXTRACTED`
- .getStreamSession() `EXTRACTED`
- .run() `EXTRACTED`
- .test_dashboard_stats_accurately_aggregates_revenue_tickets_and_operational_kpis() `EXTRACTED`
- .test_super_admin_can_view_user_detail_with_transaction_history() `EXTRACTED`
- .deleteMovie() `EXTRACTED`
- .getMovieBySlugOrId() `EXTRACTED`
- .setUp() `EXTRACTED`
- .resolveSpotlightData() `EXTRACTED`
- .test_movie_rental_webhook_marks_as_paid_and_activates_access_for_48_hours() `EXTRACTED`
- .grantAccess() `EXTRACTED`
- .run() `EXTRACTED`
- .test_admin_movie_list_and_detail_accurately_reflects_active_rentals_count() `EXTRACTED`
- .setUp() `EXTRACTED`
- .test_delete_voucher_deactivates_if_has_movie_transactions() `EXTRACTED`
- .test_banner_item_matches_contract_specification() `EXTRACTED`
- .test_order_status_anti_idor_prevents_viewing_other_users_order() `EXTRACTED`
- .test_super_admin_with_revoked_access_receives_expired_status_on_published_movie() `EXTRACTED`
- .test_get_access_list_filters_by_user_movie_and_status() `EXTRACTED`
- *…and 41 more `calls` connection(s) not listed (lowest-degree first to go)*

### contains
- Movie.php `EXTRACTED`

### imports
- VoucherTest.php `EXTRACTED`
- MidtransWebhookTest.php `EXTRACTED`
- AdminOrderAuditTest.php `EXTRACTED`
- MovieRentalOrderTest.php `EXTRACTED`
- MovieRentalOrderService.php `EXTRACTED`
- MovieStreamService.php `EXTRACTED`
- DashboardAnalyticsTest.php `EXTRACTED`
- AdminMovieRequestsTest.php `EXTRACTED`
- MovieRequestsAndResourcesTest.php `EXTRACTED`
- AdminMovieCrudTest.php `EXTRACTED`
- AdminMovieServiceTest.php `EXTRACTED`
- AdminMovieService.php `EXTRACTED`
- AdminUserTest.php `EXTRACTED`
- AdminVoucherTest.php `EXTRACTED`
- DashboardAnalyticsService.php `EXTRACTED`
- MovieCatalogService.php `EXTRACTED`
- VoucherSeeder.php `EXTRACTED`
- AdminBannerTest.php `EXTRACTED`
- MovieDetailResource.php `EXTRACTED`
- AdminBannerService.php `EXTRACTED`
- *…and 13 more `imports` connection(s) not listed (lowest-degree first to go)*

### inherits
- Illuminate\Database\Eloquent\Model `EXTRACTED`

### method
- .posterUrl() `EXTRACTED`
- .backdropUrl() `EXTRACTED`
- .synopsisShort() `EXTRACTED`
- .scopePublished() `EXTRACTED`
- .banners() `EXTRACTED`
- .transactions() `EXTRACTED`
- .userAccess() `EXTRACTED`
- .casts() `EXTRACTED`

### mixes_in
- Illuminate\Database\Eloquent\Factories\HasFactory `EXTRACTED`

### references
- AdminBannerTest `EXTRACTED`
- AdminOrderAuditTest `EXTRACTED`
- MovieCatalogTest `EXTRACTED`
- MovieStreamTest `EXTRACTED`
- [MovieRentalOrderTest](MovieRentalOrderTest.md) `EXTRACTED`
- UserFilmTest `EXTRACTED`
- PruneExpiredMovieRentalsCommandTest `EXTRACTED`
- .syncLinkedBanners() `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*