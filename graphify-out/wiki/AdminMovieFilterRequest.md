# AdminMovieFilterRequest

> 23 nodes

## Key Concepts

- **AdminMovieFilterRequest** (11 connections) — `backend/app/Http/Requests/Admin/V1/Movies/AdminMovieFilterRequest.php`
- **StoreMovieRequest** (11 connections) — `backend/app/Http/Requests/Admin/V1/Movies/StoreMovieRequest.php`
- **UpdateMovieRequest** (10 connections) — `backend/app/Http/Requests/Admin/V1/Movies/UpdateMovieRequest.php`
- **AdminMovieRequestsTest** (10 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieRequestsTest.php`
- **.test_update_movie_request_allows_same_slug_for_current_movie_and_rejects_duplicates()** (3 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieRequestsTest.php`
- **AdminMovieFilterRequest.php** (3 connections) — `backend/app/Http/Requests/Admin/V1/Movies/AdminMovieFilterRequest.php`
- **StoreMovieRequest.php** (3 connections) — `backend/app/Http/Requests/Admin/V1/Movies/StoreMovieRequest.php`
- **.test_admin_movie_filter_request_enforces_bounds_on_per_page()** (2 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieRequestsTest.php`
- **.test_admin_movie_filter_request_sanitizes_and_validates_inputs()** (2 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieRequestsTest.php`
- **.test_store_movie_request_rejects_invalid_cloudflare_uid_and_short_synopsis()** (2 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieRequestsTest.php`
- **.test_store_movie_request_validates_and_normalizes_frontend_payload()** (2 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieRequestsTest.php`
- **.authorize()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/AdminMovieFilterRequest.php`
- **.messages()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/AdminMovieFilterRequest.php`
- **.prepareForValidation()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/AdminMovieFilterRequest.php`
- **.rules()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/AdminMovieFilterRequest.php`
- **.authorize()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/StoreMovieRequest.php`
- **.messages()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/StoreMovieRequest.php`
- **.prepareForValidation()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/StoreMovieRequest.php`
- **.rules()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/StoreMovieRequest.php`
- **.authorize()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/UpdateMovieRequest.php`
- **.messages()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/UpdateMovieRequest.php`
- **.prepareForValidation()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/UpdateMovieRequest.php`
- **.rules()** (1 connections) — `backend/app/Http/Requests/Admin/V1/Movies/UpdateMovieRequest.php`

## Relationships

- [AdminMovieService](AdminMovieService.md) (6 shared connections)
- [User](User.md) (6 shared connections)
- [Illuminate\Foundation\Http\FormRequest](Illuminate_Foundation_Http_FormRequest.md) (5 shared connections)
- [Movie](Movie.md) (2 shared connections)
- [Illuminate\Contracts\Validation\ValidationRule](Illuminate_Contracts_Validation_ValidationRule.md) (2 shared connections)
- [UpdateEventRequest](UpdateEventRequest.md) (1 shared connections)
- [RevokeMovieAccessRequest](RevokeMovieAccessRequest.md) (1 shared connections)

## Source Files

- `backend/app/Http/Requests/Admin/V1/Movies/AdminMovieFilterRequest.php`
- `backend/app/Http/Requests/Admin/V1/Movies/StoreMovieRequest.php`
- `backend/app/Http/Requests/Admin/V1/Movies/UpdateMovieRequest.php`
- `backend/tests/Unit/Admin/Movies/AdminMovieRequestsTest.php`

## Audit Trail

- EXTRACTED: 47 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*