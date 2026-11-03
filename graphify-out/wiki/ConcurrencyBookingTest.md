# ConcurrencyBookingTest

> 16 nodes

## Key Concepts

- **ConcurrencyBookingTest** (22 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_expired_seat_lock_allows_new_user_to_reserve()** (3 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_same_user_can_apply_voucher_to_existing_active_reservation()** (2 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_second_user_attempting_to_lock_same_seat_is_rejected_with_409()** (2 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_simulation_of_50_concurrent_requests_for_same_seat_yields_exactly_one_success()** (2 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_stale_pending_transaction_is_marked_as_expired_when_user_makes_new_reservation()** (2 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_voucher_discount_is_applied_correctly_to_net_amount()** (2 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_booking_rejects_reservation_outside_presale_window()** (1 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_booking_route_has_throttle_middleware()** (1 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_cannot_reserve_physically_booked_or_disabled_seats()** (1 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_deterministic_ordering_handles_unsorted_seat_ids_safely()** (1 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_dynamic_pricing_for_vip_and_regular_seats()** (1 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_exceeding_max_seats_per_booking_fails_validation()** (1 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_same_user_reopening_modal_resumes_existing_active_reservation_without_409()** (1 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_single_user_can_reserve_seats_with_15_minute_lock_and_draft_transaction()** (1 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`
- **.test_unauthenticated_request_is_rejected_with_401()** (1 connections) — `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`

## Relationships

- [User](User.md) (7 shared connections)
- [EventTransaction](EventTransaction.md) (4 shared connections)
- [Voucher](Voucher.md) (2 shared connections)
- [SeatLock](SeatLock.md) (1 shared connections)

## Source Files

- `backend/tests/Feature/Booking/ConcurrencyBookingTest.php`

## Audit Trail

- EXTRACTED: 29 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*