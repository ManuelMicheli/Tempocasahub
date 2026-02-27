'use client';

import { useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameDay,
  isToday,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentCard } from './appointment-card';
import type { Interaction } from '@/types/database';

type AppointmentWithRelations = Interaction & {
  lead: { full_name: string };
  property?: { address: string } | null;
};

interface CalendarViewProps {
  appointments: AppointmentWithRelations[];
}

type ViewMode = 'week' | 'day';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00

export function CalendarView({ appointments }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  // Week view helpers
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  function getAppointmentsForDay(day: Date) {
    return appointments
      .filter((a) => a.scheduled_at && isSameDay(new Date(a.scheduled_at), day))
      .sort((a, b) => {
        const dateA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const dateB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
        return dateA - dateB;
      });
  }

  function navigatePrev() {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  }

  function navigateNext() {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const headerLabel =
    viewMode === 'week'
      ? `${format(weekStart, 'd MMM', { locale: it })} - ${format(weekEnd, 'd MMM yyyy', { locale: it })}`
      : format(currentDate, 'EEEE d MMMM yyyy', { locale: it });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <Calendar className="mr-1 h-4 w-4" />
            Oggi
          </Button>
          <h2 className="text-lg font-semibold font-display capitalize ml-2">{headerLabel}</h2>
        </div>

        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Settimana
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Giorno
          </Button>
        </div>
      </div>

      {/* View */}
      {viewMode === 'week' ? (
        <WeekView days={weekDays} getAppointmentsForDay={getAppointmentsForDay} />
      ) : (
        <DayView
          appointments={getAppointmentsForDay(currentDate)}
        />
      )}
    </div>
  );
}

// -----------------------------------------------
// Week View
// -----------------------------------------------
function WeekView({
  days,
  getAppointmentsForDay,
}: {
  days: Date[];
  getAppointmentsForDay: (day: Date) => AppointmentWithRelations[];
}) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, i) => {
        const dayAppointments = getAppointmentsForDay(day);
        const today = isToday(day);

        return (
          <div key={i} className="min-h-[160px]">
            {/* Day header */}
            <div
              className={`text-center text-sm py-2 rounded-t-md border-b ${
                today ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary ring-offset-1 ring-offset-background' : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              <div className="font-medium font-display">{DAY_LABELS[i]}</div>
              <div className={today ? 'font-mono-data' : ''}>{format(day, 'd')}</div>
            </div>

            {/* Appointments */}
            <div className="space-y-1 pt-1">
              {dayAppointments.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">-</p>
              ) : (
                dayAppointments.map((appt) => (
                  <AppointmentCard key={appt.id} appointment={appt} compact />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------
// Day View
// -----------------------------------------------
function DayView({
  appointments,
}: {
  appointments: AppointmentWithRelations[];
}) {
  function getAppointmentsForHour(hour: number) {
    return appointments.filter((a) => {
      if (!a.scheduled_at) return false;
      const d = new Date(a.scheduled_at);
      return d.getHours() === hour;
    });
  }

  return (
    <div className="border rounded-md divide-y">
      {HOURS.map((hour) => {
        const hourAppointments = getAppointmentsForHour(hour);

        return (
          <div key={hour} className="flex min-h-[64px]">
            {/* Time label */}
            <div className="w-16 shrink-0 border-r px-2 py-2 text-sm text-muted-foreground text-right font-mono-data">
              {String(hour).padStart(2, '0')}:00
            </div>

            {/* Appointment slots */}
            <div className="flex-1 p-1 space-y-1">
              {hourAppointments.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
