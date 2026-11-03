# MidtransSnapService

> 11 nodes

## Key Concepts

- **MidtransSnapService** (19 connections) — `backend/app/Services/Checkout/MidtransSnapService.php`
- **MidtransSnapServiceTest** (9 connections) — `backend/tests/Unit/Checkout/MidtransSnapServiceTest.php`
- **RuntimeException** (6 connections)
- **.createTicketSnapToken()** (3 connections) — `backend/app/Services/Checkout/MidtransSnapService.php`
- **.createTransaction()** (3 connections) — `backend/app/Services/Checkout/MidtransSnapService.php`
- **.test_create_ticket_snap_token_builds_correct_payload()** (3 connections) — `backend/tests/Unit/Checkout/MidtransSnapServiceTest.php`
- **.setUp()** (2 connections) — `backend/tests/Unit/Checkout/MidtransSnapServiceTest.php`
- **.test_create_transaction_returns_token_and_redirect_url()** (2 connections) — `backend/tests/Unit/Checkout/MidtransSnapServiceTest.php`
- **.test_throws_exception_if_api_returns_error()** (2 connections) — `backend/tests/Unit/Checkout/MidtransSnapServiceTest.php`
- **.checkTransactionStatus()** (1 connections) — `backend/app/Services/Checkout/MidtransSnapService.php`
- **.test_throws_exception_if_server_key_is_missing()** (1 connections) — `backend/tests/Unit/Checkout/MidtransSnapServiceTest.php`

## Relationships

- [User](User.md) (10 shared connections)
- [SeatLock](SeatLock.md) (2 shared connections)
- [MovieTransaction](MovieTransaction.md) (2 shared connections)
- [Illuminate\Http\JsonResponse](Illuminate_Http_JsonResponse.md) (2 shared connections)
- [VoucherService](VoucherService.md) (2 shared connections)
- [MidtransWebhookDispatcherService](MidtransWebhookDispatcherService.md) (2 shared connections)
- [Mockery](Mockery.md) (1 shared connections)

## Source Files

- `backend/app/Services/Checkout/MidtransSnapService.php`
- `backend/tests/Unit/Checkout/MidtransSnapServiceTest.php`

## Audit Trail

- EXTRACTED: 35 (97%)
- INFERRED: 1 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*