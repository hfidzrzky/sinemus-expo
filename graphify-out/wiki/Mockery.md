# Mockery

> 34 nodes

## Key Concepts

- **Mockery** (17 connections)
- **AuthEndpointsTest** (16 connections) — `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- **GoogleAuthService** (15 connections) — `backend/app/Services/Auth/GoogleAuthService.php`
- **GoogleAuthServiceTest** (13 connections) — `backend/tests/Unit/Auth/GoogleAuthServiceTest.php`
- **GoogleAuthServiceTest.php** (9 connections) — `backend/tests/Unit/Auth/GoogleAuthServiceTest.php`
- **GoogleAuthService.php** (7 connections) — `backend/app/Services/Auth/GoogleAuthService.php`
- **Google_Client** (5 connections)
- **.test_authenticates_existing_user_by_email_and_links_google_id()** (4 connections) — `backend/tests/Unit/Auth/GoogleAuthServiceTest.php`
- **.test_authenticates_existing_user_by_google_id()** (4 connections) — `backend/tests/Unit/Auth/GoogleAuthServiceTest.php`
- **.authenticate()** (3 connections) — `backend/app/Services/Auth/GoogleAuthService.php`
- **.__construct()** (3 connections) — `backend/app/Services/Auth/GoogleAuthService.php`
- **.test_authenticates_new_user_and_issues_sanctum_token()** (3 connections) — `backend/tests/Unit/Auth/GoogleAuthServiceTest.php`
- **.test_throws_exception_if_google_email_not_verified()** (3 connections) — `backend/tests/Unit/Auth/GoogleAuthServiceTest.php`
- **.test_throws_exception_on_empty_token()** (3 connections) — `backend/tests/Unit/Auth/GoogleAuthServiceTest.php`
- **.test_throws_exception_on_invalid_or_expired_token()** (3 connections) — `backend/tests/Unit/Auth/GoogleAuthServiceTest.php`
- **.test_throws_exception_on_mismatched_audience()** (3 connections) — `backend/tests/Unit/Auth/GoogleAuthServiceTest.php`
- **.tearDown()** (2 connections) — `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- **.test_current_user_endpoint_returns_authenticated_user()** (2 connections) — `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- **.test_expired_sanctum_token_is_rejected_with_401()** (2 connections) — `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- **.test_google_auth_endpoint_rejects_mismatched_audience()** (2 connections) — `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- **.test_google_auth_endpoint_returns_token_and_user()** (2 connections) — `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- **.test_logout_revokes_token()** (2 connections) — `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- **.test_update_profile_endpoint_saves_phone_number_and_locks_it()** (2 connections) — `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- **.test_update_profile_rejects_duplicate_phone_number_belonging_to_another_user()** (2 connections) — `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- **.test_update_profile_rejects_updating_locked_phone_number()** (2 connections) — `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- *... and 9 more nodes in this community*

## Relationships

- [User](User.md) (23 shared connections)
- [Illuminate\Http\JsonResponse](Illuminate_Http_JsonResponse.md) (3 shared connections)
- [Movie](Movie.md) (3 shared connections)
- [Controller](Controller.md) (2 shared connections)
- [MidtransSnapService](MidtransSnapService.md) (1 shared connections)

## Source Files

- `backend/app/Services/Auth/GoogleAuthService.php`
- `backend/tests/Feature/Auth/AuthEndpointsTest.php`
- `backend/tests/Unit/Auth/GoogleAuthServiceTest.php`

## Audit Trail

- EXTRACTED: 86 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*