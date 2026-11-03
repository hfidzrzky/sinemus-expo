# Voucher

> God node · 69 connections · `backend/app/Models/Voucher.php`

**Community:** [Voucher](Voucher.md)

## Connections by Relation

### calls
- .createDraftTransaction() `EXTRACTED`
- .handleExistingReservation() `EXTRACTED`
- .run() `EXTRACTED`
- .setUp() `EXTRACTED`
- .applyVoucher() `EXTRACTED`
- .test_delete_voucher_deactivates_instead_of_physical_delete_if_has_event_transactions() `EXTRACTED`
- .test_delete_voucher_deactivates_if_has_movie_transactions() `EXTRACTED`
- .test_settlement_webhook_increments_voucher_usage_if_present() `EXTRACTED`
- .listVouchers() `EXTRACTED`
- .getActiveDirectDiscount() `EXTRACTED`
- .incrementUsage() `EXTRACTED`
- .createVoucher() `EXTRACTED`
- .getVoucherById() `EXTRACTED`
- .test_store_voucher_rejects_duplicate_code() `EXTRACTED`
- .test_super_admin_can_filter_vouchers_by_promo_type() `EXTRACTED`
- .test_super_admin_can_filter_vouchers_by_search_code() `EXTRACTED`
- .test_super_admin_can_filter_vouchers_by_status() `EXTRACTED`
- .test_super_admin_can_list_vouchers_with_standard_envelope() `EXTRACTED`
- .test_super_admin_can_physically_delete_unused_voucher() `EXTRACTED`
- .test_super_admin_can_update_voucher() `EXTRACTED`
- *…and 20 more `calls` connection(s) not listed (lowest-degree first to go)*

### contains
- Voucher.php `EXTRACTED`

### imports
- VoucherTest.php `EXTRACTED`
- MidtransWebhookTest.php `EXTRACTED`
- SeatReservationService.php `EXTRACTED`
- AdminOrderAuditTest.php `EXTRACTED`
- MovieRentalOrderTest.php `EXTRACTED`
- ConcurrencyBookingTest.php `EXTRACTED`
- AdminVoucherTest.php `EXTRACTED`
- VoucherSeeder.php `EXTRACTED`
- AdminVoucherService.php `EXTRACTED`
- AdminVoucherResource.php `EXTRACTED`
- VoucherService.php `EXTRACTED`

### inherits
- Illuminate\Database\Eloquent\Model `EXTRACTED`

### method
- .event() `EXTRACTED`
- .movie() `EXTRACTED`
- .eventTransactions() `EXTRACTED`
- .movieTransactions() `EXTRACTED`
- .scopeActive() `EXTRACTED`
- .scopeDirectDiscounts() `EXTRACTED`
- .scopeVoucherCodes() `EXTRACTED`
- .calculateDiscount() `EXTRACTED`
- .casts() `EXTRACTED`
- .isValidFor() `EXTRACTED`

### mixes_in
- Illuminate\Database\Eloquent\Factories\HasFactory `EXTRACTED`

### references
- AdminOrderAuditTest `EXTRACTED`
- .calculateDiscount() `EXTRACTED`
- .generateDescription() `EXTRACTED`
- .deleteVoucher() `EXTRACTED`
- .updateVoucher() `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*