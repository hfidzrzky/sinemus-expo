# SeatLock

> 34 nodes

## Key Concepts

- **SeatLock** (44 connections) — `backend/app/Models/SeatLock.php`
- **Carbon\Carbon** (23 connections)
- **SeatReservationService** (16 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **TicketPdfService.php** (16 connections) — `backend/app/Services/Tickets/TicketPdfService.php`
- **SeatReservationService.php** (15 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **TicketEmailPayloadBuilder.php** (12 connections) — `backend/app/Services/Tickets/TicketEmailPayloadBuilder.php`
- **ScheduleSeatMapTest** (11 connections) — `backend/tests/Feature/Events/ScheduleSeatMapTest.php`
- **.reserveAssignedSeats()** (11 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **SeatUnavailableException** (10 connections) — `backend/app/Exceptions/Booking/SeatUnavailableException.php`
- **.reserveGeneralAdmissionSeats()** (10 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **.createDraftTransaction()** (9 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **.executeReservation()** (9 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **.handleExistingReservation()** (9 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **.generateSnapToken()** (5 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **.validateAndLockSchedule()** (4 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **.test_expired_seat_locks_do_not_mark_seat_as_locked()** (4 connections) — `backend/tests/Feature/Events/ScheduleSeatMapTest.php`
- **.test_real_time_seat_status_calculation()** (4 connections) — `backend/tests/Feature/Events/ScheduleSeatMapTest.php`
- **.generateUniqueOrderId()** (3 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **.reserve()** (3 connections) — `backend/app/Services/Booking/SeatReservationService.php`
- **BaconQrCode\Common\ErrorCorrectionLevel** (3 connections)
- **.__construct()** (2 connections) — `backend/app/Exceptions/Booking/SeatUnavailableException.php`
- **.schedule()** (2 connections) — `backend/app/Models/SeatLock.php`
- **.seat()** (2 connections) — `backend/app/Models/SeatLock.php`
- **.user()** (2 connections) — `backend/app/Models/SeatLock.php`
- **.test_can_get_seat_map_with_correct_dynamic_dimensions_and_contract_structure()** (2 connections) — `backend/tests/Feature/Events/ScheduleSeatMapTest.php`
- *... and 9 more nodes in this community*

## Relationships

- [EventTransaction](EventTransaction.md) (36 shared connections)
- [User](User.md) (29 shared connections)
- [Illuminate\Database\Eloquent\Relations\BelongsTo](Illuminate_Database_Eloquent_Relations_BelongsTo.md) (11 shared connections)
- [Illuminate\Http\JsonResponse](Illuminate_Http_JsonResponse.md) (4 shared connections)
- [MovieTransaction](MovieTransaction.md) (4 shared connections)
- [Illuminate\Database\Seeder](Illuminate_Database_Seeder.md) (4 shared connections)
- [Illuminate\Support\Facades\Log](Illuminate_Support_Facades_Log.md) (4 shared connections)
- [SystemSettingService](SystemSettingService.md) (4 shared connections)
- [VoucherService](VoucherService.md) (3 shared connections)
- [Voucher](Voucher.md) (3 shared connections)
- [Illuminate\Console\Command](Illuminate_Console_Command.md) (2 shared connections)
- [DomainException](DomainException.md) (2 shared connections)

## Source Files

- `backend/app/Exceptions/Booking/SeatUnavailableException.php`
- `backend/app/Models/SeatLock.php`
- `backend/app/Services/Booking/SeatReservationService.php`
- `backend/app/Services/Tickets/TicketEmailPayloadBuilder.php`
- `backend/app/Services/Tickets/TicketPdfService.php`
- `backend/tests/Feature/Events/ScheduleSeatMapTest.php`

## Audit Trail

- EXTRACTED: 184 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*