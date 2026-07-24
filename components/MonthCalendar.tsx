'use client';

import { useState } from 'react';

interface MonthCalendarProps {
  markedDates: Record<string, string>; // dateStr -> status key
  onDayClick: (dateStr: string) => void;
  colorFor: (status?: string) => string;
  disabled?: boolean;
}

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function MonthCalendar({
  markedDates,
  onDayClick,
  colorFor,
  disabled,
}: MonthCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  const monthLabel = firstDay.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="px-2 py-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-zinc-700 capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="px-2 py-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] text-zinc-400 font-medium py-1">
            {w}
          </div>
        ))}
        {cells.map((dateStr, i) =>
          dateStr ? (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onDayClick(dateStr)}
              className={`aspect-square rounded-lg text-md   flex items-center justify-center transition-colors disabled:opacity-50 ${colorFor(
                markedDates[dateStr],
              )}`}
            >
              {Number(dateStr.slice(-2))}
            </button>
          ) : (
            <div key={`empty-${i}`} />
          ),
        )}
      </div>
    </div>
  );
}