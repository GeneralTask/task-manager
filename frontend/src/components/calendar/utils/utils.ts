import { DEFAULT_CALENDAR_COLOR, calendarColors } from './colors'

// backend sends empty string for title if it is the primary calendar, so fall back to account id
export const getCalendarName = (accountId: string, calendarTitle?: string): string => calendarTitle || accountId

export const getCalendarColor = (colorId: string): string =>
    calendarColors[colorId as keyof typeof calendarColors]?.background ?? DEFAULT_CALENDAR_COLOR
