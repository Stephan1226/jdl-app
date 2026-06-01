import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export const fmtDate = (d: Date | string) =>
  format(new Date(d), "yyyy. M. d.", { locale: ko });

export const fmtDateTime = (d: Date | string) =>
  format(new Date(d), "yyyy. M. d. HH:mm", { locale: ko });

export const fmtMonth = (d: Date | string) =>
  format(new Date(d), "yyyy년 M월", { locale: ko });

export const fmtMonthKey = (d: Date | string) => format(new Date(d), "yyyy-MM");

export const fromNow = (d: Date | string) =>
  formatDistanceToNow(new Date(d), { addSuffix: true, locale: ko });

/** <input type="date"> 용 값 (yyyy-MM-dd) */
export const toDateInput = (d: Date | string) => format(new Date(d), "yyyy-MM-dd");
