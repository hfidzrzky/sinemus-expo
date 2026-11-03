# MidtransWebhookTest

> 14 nodes

## Key Concepts

- **MidtransWebhookTest** (20 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.createPendingTicketTransaction()** (10 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.generateSignature()** (9 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_movie_rental_webhook_marks_as_paid_and_activates_access_for_48_hours()** (5 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_settlement_webhook_increments_voucher_usage_if_present()** (4 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_settlement_webhook_marks_ticket_as_paid_and_books_seats()** (4 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_cancel_or_failure_webhook_marks_ticket_as_failed_and_releases_seat_locks()** (3 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_capture_with_accept_fraud_status_marks_ticket_as_paid()** (3 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_concurrent_webhook_and_client_sync_race_condition()** (3 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_expire_webhook_marks_ticket_as_expired_and_releases_seat_locks()** (3 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_webhook_idempotency_ignores_subsequent_duplicate_calls()** (3 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_rejects_webhook_with_invalid_signature()** (1 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_rejects_webhook_with_missing_required_fields()** (1 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`
- **.test_webhook_route_has_throttle_middleware()** (1 connections) — `backend/tests/Feature/Checkout/MidtransWebhookTest.php`

## Relationships

- [EventTransaction](EventTransaction.md) (5 shared connections)
- [User](User.md) (4 shared connections)
- [Movie](Movie.md) (2 shared connections)
- [SeatLock](SeatLock.md) (1 shared connections)
- [MovieTransaction](MovieTransaction.md) (1 shared connections)
- [Voucher](Voucher.md) (1 shared connections)

## Source Files

- `backend/tests/Feature/Checkout/MidtransWebhookTest.php`

## Audit Trail

- EXTRACTED: 42 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*