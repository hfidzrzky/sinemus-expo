import React, { useState } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { DateTimePicker24 } from '../common';
import type { CreateEventPayload } from '../../types';

export interface EventTabSchedulesProps {
  schedules: NonNullable<CreateEventPayload['schedules']>;
  onChange: (schedules: NonNullable<CreateEventPayload['schedules']>) => void;
}

export function EventTabSchedules({
  schedules,
  onChange,
}: EventTabSchedulesProps): React.JSX.Element {
  const [showTime, setShowTime] = useState('');
  const [ticketPrice, setTicketPrice] = useState(50000);
  const [totalSeats, setTotalSeats] = useState(75);
  const [studioName, setStudioName] = useState('Studio 1');
  const [maxTickets] = useState(6);

  const handleAddSchedule = () => {
    if (!showTime) return;

    const newSchedule = {
      show_time: showTime.includes('T')
        ? `${showTime.slice(0, 19)}`
        : new Date(showTime).toISOString(),
      ticket_price: Number(ticketPrice),
      total_seats: Number(totalSeats),
      studio_name: studioName || 'Studio Utama',
      max_tickets_per_order: Number(maxTickets) || 6,
    };

    onChange([...schedules, newSchedule]);
    setShowTime('');
  };

  const handleRemoveSchedule = (index: number) => {
    onChange(schedules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-bold text-white">Sesi & Jam Tayang Pemutaran</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Tentukan waktu penayangan film, harga karcis per kursi, dan kapasitas studio.
        </p>
      </div>

      {/* Add New Schedule Form */}
      <div className="rounded-xl border border-neutral-800 bg-[#0D111A] p-4">
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-white">
          <Plus className="h-3.5 w-3.5 text-blue-400" />
          Tambah Sesi Tayang Baru
        </h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <DateTimePicker24
              label="Waktu & Jam Tayang"
              value={showTime}
              defaultTime="19:00"
              onChange={(val) => setShowTime(val || '')}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-300">
              Tarif Karcis (Rp)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-300">
              Kapasitas Kursi
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={totalSeats}
              onChange={(e) => setTotalSeats(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-300">Nama Studio</label>
            <input
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="Studio 1"
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddSchedule}
              disabled={!showTime}
              className="w-full rounded-lg bg-[#0066FF] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              + Tambah Sesi
            </button>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-300">
          Jadwal Terdaftar ({schedules.length} Sesi)
        </h4>

        {schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-800 p-6 text-center text-xs text-neutral-500">
            Belum ada jadwal tayang. Tambahkan minimal 1 sesi pemutaran di atas.
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((schedule, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-[#0B0E14] px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="font-bold text-blue-400">#{idx + 1}</span>
                  <div className="flex items-center gap-1.5 font-medium text-white">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    {new Date(schedule.show_time).toLocaleString('id-ID', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-300">
                    {schedule.studio_name || 'Studio'}
                  </span>
                  <span className="font-semibold text-emerald-400">
                    Rp {schedule.ticket_price.toLocaleString('id-ID')}
                  </span>
                  <span className="text-neutral-400">
                    {schedule.total_seats} Kursi (Maks {schedule.max_tickets_per_order || 6} /
                    order)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSchedule(idx)}
                  className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  title="Hapus Sesi"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
