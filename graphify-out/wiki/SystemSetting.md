# SystemSetting

> 20 nodes

## Key Concepts

- **SystemSetting** (17 connections) — `backend/app/Models/SystemSetting.php`
- **AdminSettingsTest** (14 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- **.clearSettingsCache()** (4 connections) — `backend/app/Services/Admin/Settings/SystemSettingService.php`
- **.updateBusinessPolicies()** (3 connections) — `backend/app/Services/Admin/Settings/SystemSettingService.php`
- **.updateEmergencyControls()** (3 connections) — `backend/app/Services/Admin/Settings/SystemSettingService.php`
- **.updatePublicContact()** (3 connections) — `backend/app/Services/Admin/Settings/SystemSettingService.php`
- **SystemSettingService.php** (3 connections) — `backend/app/Services/Admin/Settings/SystemSettingService.php`
- **.updatedBy()** (2 connections) — `backend/app/Models/SystemSetting.php`
- **.setUp()** (2 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- **.test_super_admin_can_update_business_policies()** (2 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- **.test_emergency_freeze_guard_rejects_rental_when_frozen()** (2 connections) — `backend/tests/Feature/Movies/MovieRentalOrderTest.php`
- **.casts()** (1 connections) — `backend/app/Models/SystemSetting.php`
- **.test_business_policies_validation_rejects_out_of_bounds()** (1 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- **.test_customer_cannot_access_admin_settings()** (1 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- **.test_public_can_fetch_public_settings_without_auth()** (1 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- **.test_public_contact_validation_rejects_invalid_phone()** (1 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- **.test_super_admin_can_retrieve_all_settings_with_envelope()** (1 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- **.test_super_admin_can_update_emergency_controls()** (1 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- **.test_super_admin_can_update_public_contact()** (1 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- **.test_unauthenticated_user_cannot_access_admin_settings()** (1 connections) — `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`

## Relationships

- [User](User.md) (8 shared connections)
- [SystemSettingService](SystemSettingService.md) (7 shared connections)
- [Illuminate\Database\Eloquent\Relations\BelongsTo](Illuminate_Database_Eloquent_Relations_BelongsTo.md) (4 shared connections)
- [Illuminate\Database\Seeder](Illuminate_Database_Seeder.md) (2 shared connections)
- [MovieRentalOrderTest](MovieRentalOrderTest.md) (1 shared connections)

## Source Files

- `backend/app/Models/SystemSetting.php`
- `backend/app/Services/Admin/Settings/SystemSettingService.php`
- `backend/tests/Feature/Admin/Settings/AdminSettingsTest.php`
- `backend/tests/Feature/Movies/MovieRentalOrderTest.php`

## Audit Trail

- EXTRACTED: 43 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*