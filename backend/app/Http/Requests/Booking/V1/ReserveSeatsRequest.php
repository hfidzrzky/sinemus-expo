<?php

namespace App\Http\Requests\Booking\V1;

use App\Models\Schedule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ReserveSeatsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'schedule_id' => ['required', 'integer', 'exists:schedules,id'],
            'seat_ids' => ['nullable', 'array', 'min:1', 'max:6', 'distinct'],
            'seat_ids.*' => ['integer', 'exists:seats,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:6'],
            'voucher_code' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $scheduleId = $this->input('schedule_id');
            if (! $scheduleId) {
                return;
            }

            $schedule = Schedule::with('event')->find($scheduleId);
            if (! $schedule || ! $schedule->event) {
                return;
            }

            $seatingType = $schedule->event->seating_type;
            $seatIds = $this->input('seat_ids');
            $quantity = $this->input('quantity');

            if ($seatingType === 'assigned_seating') {
                if (empty($seatIds) || ! is_array($seatIds) || count($seatIds) === 0) {
                    $v->errors()->add('seat_ids', 'Pilihan kursi (seat_ids) wajib diisi untuk jadwal dengan denah bernomor.');
                }
            } elseif ($seatingType === 'general_admission') {
                if (empty($seatIds) && empty($quantity)) {
                    $v->errors()->add('quantity', 'Jumlah tiket (quantity) wajib diisi untuk jadwal general admission.');
                }
            }
        });
    }

    /**
     * Custom attribute names for clear validation messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'schedule_id' => 'jadwal tayang',
            'seat_ids' => 'kursi yang dipilih',
            'seat_ids.*' => 'ID kursi',
            'quantity' => 'jumlah tiket',
            'voucher_code' => 'kode voucher',
        ];
    }
}
