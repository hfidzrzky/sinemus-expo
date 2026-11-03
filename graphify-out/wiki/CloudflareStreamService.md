# CloudflareStreamService

> 35 nodes

## Key Concepts

- **CloudflareStreamService** (22 connections) — `backend/app/Services/Cloudflare/CloudflareStreamService.php`
- **CloudflareImageService** (14 connections) — `backend/app/Services/Cloudflare/CloudflareImageService.php`
- **AdminCloudflareController** (10 connections) — `backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php`
- **AdminCloudflareController.php** (8 connections) — `backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php`
- **StreamVideoMetadata** (7 connections) — `backend/app/DTO/Cloudflare/StreamVideoMetadata.php`
- **MovieStreamService** (7 connections) — `backend/app/Services/Movies/MovieStreamService.php`
- **AdminMovieResource.php** (7 connections) — `backend/app/Http/Resources/Admin/V1/Movies/AdminMovieResource.php`
- **StreamVerificationResource** (6 connections) — `backend/app/Http/Resources/Admin/V1/Cloudflare/StreamVerificationResource.php`
- **.getStreamAccess()** (5 connections) — `backend/app/Http/Controllers/Movies/V1/MovieStreamController.php`
- **.verifyStream()** (4 connections) — `backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php`
- **.fetchFromCloudflare()** (4 connections) — `backend/app/Services/Cloudflare/CloudflareStreamService.php`
- **.generateSignedToken()** (4 connections) — `backend/app/Services/Cloudflare/CloudflareStreamService.php`
- **StreamVerificationResource.php** (4 connections) — `backend/app/Http/Resources/Admin/V1/Cloudflare/StreamVerificationResource.php`
- **.__construct()** (3 connections) — `backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php`
- **.createImageDirectUpload()** (3 connections) — `backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php`
- **.verifyVideo()** (3 connections) — `backend/app/Services/Cloudflare/CloudflareStreamService.php`
- **.__construct()** (3 connections) — `backend/app/Services/Movies/MovieStreamService.php`
- **.deleteImage()** (2 connections) — `backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php`
- **.generatePreviewToken()** (2 connections) — `backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php`
- **.toArray()** (2 connections) — `backend/app/Http/Resources/Admin/V1/Cloudflare/StreamVerificationResource.php`
- **.withPreviewToken()** (2 connections) — `backend/app/Http/Resources/Admin/V1/Cloudflare/StreamVerificationResource.php`
- **.base64UrlEncode()** (2 connections) — `backend/app/Services/Cloudflare/CloudflareStreamService.php`
- **.formatDuration()** (2 connections) — `backend/app/Services/Cloudflare/CloudflareStreamService.php`
- **.formatPemKey()** (2 connections) — `backend/app/Services/Cloudflare/CloudflareStreamService.php`
- **.getCachedTeaserToken()** (2 connections) — `backend/app/Services/Cloudflare/CloudflareStreamService.php`
- *... and 10 more nodes in this community*

## Relationships

- [Illuminate\Http\Request](Illuminate_Http_Request.md) (9 shared connections)
- [Illuminate\Http\JsonResponse](Illuminate_Http_JsonResponse.md) (8 shared connections)
- [Controller](Controller.md) (6 shared connections)
- [AdminMovieService](AdminMovieService.md) (4 shared connections)
- [CloudflareStreamService.php](CloudflareStreamService.php.md) (3 shared connections)
- [SystemSettingService](SystemSettingService.md) (3 shared connections)
- [ListMoviesRequest](ListMoviesRequest.md) (2 shared connections)
- [Illuminate\Database\Eloquent\Relations\BelongsTo](Illuminate_Database_Eloquent_Relations_BelongsTo.md) (2 shared connections)
- [Movie](Movie.md) (2 shared connections)
- [DirectUploadImageRequest](DirectUploadImageRequest.md) (2 shared connections)
- [VerifyStreamUidRequest](VerifyStreamUidRequest.md) (2 shared connections)
- [DomainException](DomainException.md) (1 shared connections)

## Source Files

- `backend/app/DTO/Cloudflare/StreamVideoMetadata.php`
- `backend/app/Http/Controllers/Admin/V1/Cloudflare/AdminCloudflareController.php`
- `backend/app/Http/Controllers/Movies/V1/MovieStreamController.php`
- `backend/app/Http/Resources/Admin/V1/Cloudflare/StreamVerificationResource.php`
- `backend/app/Http/Resources/Admin/V1/Movies/AdminMovieResource.php`
- `backend/app/Services/Cloudflare/CloudflareImageService.php`
- `backend/app/Services/Cloudflare/CloudflareStreamService.php`
- `backend/app/Services/Movies/MovieStreamService.php`

## Audit Trail

- EXTRACTED: 93 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*