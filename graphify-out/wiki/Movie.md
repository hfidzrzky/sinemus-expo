# Movie

> 87 nodes

## Key Concepts

- **Movie** (113 connections) — `backend/app/Models/Movie.php`
- **UserMovieAccess** (65 connections) — `backend/app/Models/UserMovieAccess.php`
- **AdminMovieCrudTest** (18 connections) — `backend/tests/Feature/Admin/AdminMovieCrudTest.php`
- **MovieCatalogTest** (18 connections) — `backend/tests/Feature/Movies/MovieCatalogTest.php`
- **MovieStreamTest** (18 connections) — `backend/tests/Feature/Movies/MovieStreamTest.php`
- **AdminMovieServiceTest** (14 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieServiceTest.php`
- **AdminMovieAccessService** (11 connections) — `backend/app/Services/Admin/Movies/AdminMovieAccessService.php`
- **UserFilmTest** (11 connections) — `backend/tests/Feature/Movies/UserFilmTest.php`
- **AdminMovieServiceTest.php** (11 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieServiceTest.php`
- **AdminMovieAccessServiceTest** (9 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieAccessServiceTest.php`
- **AdminMovieAccessService.php** (8 connections) — `backend/app/Services/Admin/Movies/AdminMovieAccessService.php`
- **Illuminate\Database\Eloquent\Collection** (6 connections)
- **.grantAccess()** (4 connections) — `backend/app/Services/Admin/Movies/AdminMovieAccessService.php`
- **.getActiveFilms()** (4 connections) — `backend/app/Services/Movies/UserFilmService.php`
- **.test_admin_movie_list_and_detail_accurately_reflects_active_rentals_count()** (4 connections) — `backend/tests/Feature/Admin/AdminMovieCrudTest.php`
- **.setUp()** (4 connections) — `backend/tests/Feature/Admin/Banners/AdminBannerTest.php`
- **.test_banner_item_matches_contract_specification()** (4 connections) — `backend/tests/Feature/Banner/BannerTest.php`
- **.test_super_admin_with_revoked_access_receives_expired_status_on_published_movie()** (4 connections) — `backend/tests/Feature/Movies/MovieCatalogTest.php`
- **.test_get_access_list_filters_by_user_movie_and_status()** (4 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieAccessServiceTest.php`
- **.test_grant_access_updates_existing_access_record()** (4 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieAccessServiceTest.php`
- **.test_revoke_access_updates_status_and_reason()** (4 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieAccessServiceTest.php`
- **.test_grant_movie_access_request_validates_existence_and_duration()** (4 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieRequestsTest.php`
- **.test_delete_movie_throws_domain_exception_when_has_active_rental()** (4 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieServiceTest.php`
- **.test_delete_movie_throws_domain_exception_when_has_paid_transaction()** (4 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieServiceTest.php`
- **.test_get_admin_movies_and_get_movie_by_id_include_active_rentals_count()** (4 connections) — `backend/tests/Unit/Admin/Movies/AdminMovieServiceTest.php`
- *... and 62 more nodes in this community*

## Relationships

- [User](User.md) (75 shared connections)
- [MovieTransaction](MovieTransaction.md) (20 shared connections)
- [Illuminate\Database\Eloquent\Relations\BelongsTo](Illuminate_Database_Eloquent_Relations_BelongsTo.md) (14 shared connections)
- [DomainException](DomainException.md) (10 shared connections)
- [EventTransaction](EventTransaction.md) (10 shared connections)
- [Banner](Banner.md) (9 shared connections)
- [AdminMovieService](AdminMovieService.md) (9 shared connections)
- [Illuminate\Http\JsonResponse](Illuminate_Http_JsonResponse.md) (6 shared connections)
- [ListMoviesRequest](ListMoviesRequest.md) (6 shared connections)
- [Controller](Controller.md) (6 shared connections)
- [Illuminate\Database\Seeder](Illuminate_Database_Seeder.md) (4 shared connections)
- [MovieRentalOrderTest](MovieRentalOrderTest.md) (3 shared connections)

## Source Files

- `backend/app/Http/Requests/Admin/V1/Banners/StoreBannerRequest.php`
- `backend/app/Http/Requests/Admin/V1/Banners/UpdateBannerRequest.php`
- `backend/app/Models/Movie.php`
- `backend/app/Models/UserMovieAccess.php`
- `backend/app/Services/Admin/Movies/AdminMovieAccessService.php`
- `backend/app/Services/Movies/UserFilmService.php`
- `backend/tests/Feature/Admin/AdminMovieCrudTest.php`
- `backend/tests/Feature/Admin/Banners/AdminBannerTest.php`
- `backend/tests/Feature/Banner/BannerTest.php`
- `backend/tests/Feature/Movies/MovieCatalogTest.php`
- `backend/tests/Feature/Movies/MovieRentalOrderTest.php`
- `backend/tests/Feature/Movies/MovieStreamTest.php`
- `backend/tests/Feature/Movies/UserFilmTest.php`
- `backend/tests/Unit/Admin/Movies/AdminMovieAccessServiceTest.php`
- `backend/tests/Unit/Admin/Movies/AdminMovieRequestsTest.php`
- `backend/tests/Unit/Admin/Movies/AdminMovieServiceTest.php`

## Audit Trail

- EXTRACTED: 332 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*