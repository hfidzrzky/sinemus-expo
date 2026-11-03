# Voucher

> 30 nodes

## Key Concepts

- **Voucher** (69 connections) — `backend/app/Models/Voucher.php`
- **VoucherTest** (27 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **AdminVoucherService** (9 connections) — `backend/app/Services/Admin/Vouchers/AdminVoucherService.php`
- **.listVouchers()** (3 connections) — `backend/app/Services/Admin/Vouchers/AdminVoucherService.php`
- **.test_order_status_polling_for_movie_rental_order()** (3 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.__construct()** (2 connections) — `backend/app/Http/Controllers/Admin/V1/Vouchers/AdminVoucherController.php`
- **.createVoucher()** (2 connections) — `backend/app/Services/Admin/Vouchers/AdminVoucherService.php`
- **.deleteVoucher()** (2 connections) — `backend/app/Services/Admin/Vouchers/AdminVoucherService.php`
- **.getVoucherById()** (2 connections) — `backend/app/Services/Admin/Vouchers/AdminVoucherService.php`
- **.updateVoucher()** (2 connections) — `backend/app/Services/Admin/Vouchers/AdminVoucherService.php`
- **.setUp()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_can_apply_fixed_discount_voucher_successfully()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_can_apply_percentage_discount_voucher_successfully()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_can_apply_slashed_price_discount_voucher_successfully()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_fixed_discount_cannot_exceed_gross_amount()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_increment_usage_atomically_increases_quota_used()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_percentage_discount_is_capped_by_max_discount()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_rejects_expired_voucher_with_422_and_voucher_expired_code()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_rejects_inactive_or_non_existent_voucher_with_422_and_voucher_invalid_code()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_rejects_not_yet_started_voucher_with_422()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_rejects_over_quota_voucher_with_422_and_quota_exceeded_code()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_rejects_voucher_for_incompatible_item_type()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_rejects_voucher_when_minimum_purchase_is_not_met()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.test_voucher_with_item_type_all_works_for_both_ticket_and_movie_rental()** (2 connections) — `backend/tests/Feature/Checkout/VoucherTest.php`
- **.calculateDiscount()** (1 connections) — `backend/app/Models/Voucher.php`
- *... and 5 more nodes in this community*

## Relationships

- [AdminVoucherTest](AdminVoucherTest.md) (11 shared connections)
- [User](User.md) (10 shared connections)
- [Illuminate\Database\Eloquent\Relations\BelongsTo](Illuminate_Database_Eloquent_Relations_BelongsTo.md) (10 shared connections)
- [VoucherService](VoucherService.md) (6 shared connections)
- [EventTransaction](EventTransaction.md) (6 shared connections)
- [MovieTransaction](MovieTransaction.md) (4 shared connections)
- [AdminVoucherController](AdminVoucherController.md) (4 shared connections)
- [SeatLock](SeatLock.md) (3 shared connections)
- [Illuminate\Database\Seeder](Illuminate_Database_Seeder.md) (2 shared connections)
- [ConcurrencyBookingTest](ConcurrencyBookingTest.md) (2 shared connections)
- [MovieRentalOrderTest](MovieRentalOrderTest.md) (2 shared connections)
- [app.php](app.php.md) (2 shared connections)

## Source Files

- `backend/app/Http/Controllers/Admin/V1/Vouchers/AdminVoucherController.php`
- `backend/app/Models/Voucher.php`
- `backend/app/Services/Admin/Vouchers/AdminVoucherService.php`
- `backend/tests/Feature/Checkout/VoucherTest.php`

## Audit Trail

- EXTRACTED: 110 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*