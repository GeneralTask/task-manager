import { DateTime } from 'luxon'

interface DateRange {
    start: DateTime
    end: DateTime
}

// returns an array of the month of date, numMonths before, and numMonths after
// for example given date = now, numMonths = 1, will return [now - 1 month, now, now + 1 month]
export function getMonthsAroundDate(date: DateTime, numMonths = 1): DateRange[] {
    const startOfFirstMonth = date.startOf('month').minus({ months: numMonths })
    const endOfFirstMonth = date.endOf('month').minus({ months: numMonths })

    return [...Array(numMonths * 2 + 1).keys()].map(
        (i: number): DateRange => ({
            start: startOfFirstMonth.plus({ months: i }).startOf('month'),
            end: endOfFirstMonth.plus({ months: i }).endOf('month'),
        })
    )
}

export function getDiffBetweenISOTimes(start: string, end: string) {
    const startDateTime = DateTime.fromISO(start)
    const endDateTime = DateTime.fromISO(end)
    return endDateTime.diff(startDateTime)
}

export function isDateToday(date: DateTime) {
    return date.hasSame(DateTime.local(), 'day')
}

// https://www.sitepoint.com/convert-numbers-to-ordinals-javascript/
export function getOrdinal(n: number) {
    let ord = 'th'

    if (n % 10 == 1 && n % 100 != 11) {
        ord = 'st'
    } else if (n % 10 == 2 && n % 100 != 12) {
        ord = 'nd'
    } else if (n % 10 == 3 && n % 100 != 13) {
        ord = 'rd'
    }

    return n + ord
}
