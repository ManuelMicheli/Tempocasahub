import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: it });
}

export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  return format(new Date(date), pattern, { locale: it });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: it });
}

export function daysSince(date: string | Date): number {
  return differenceInDays(new Date(), new Date(date));
}

export function daysUntil(date: string | Date): number {
  return differenceInDays(new Date(date), new Date());
}
