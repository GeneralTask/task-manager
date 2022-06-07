import { DateTime } from "luxon";

interface DateRange {
    start: DateTime
    end: DateTime
}

// returns an array of the month of date, numMonths before, and numMonths after
// for example given date = now, numMonths = 1, will return [now - 1 month, now, now + 1 month] 
export function getMonthsAroundDate(date: DateTime, numMonths = 1): DateRange[] {
    const startOfFirstMonth = date.startOf('month').minus({ months: numMonths })
    const endOfFirstMonth = date.endOf('month').minus({ months: numMonths })

    return [...Array(numMonths * 2 + 1).keys()].map((i: number): DateRange => ({
        start: startOfFirstMonth.plus({ days: (31*i) }),
        end: endOfFirstMonth.plus({ days: (31*i) }),
    }))

    // add conditional: if month has 31 days, define days: {31*i}. Otherwise {30*i}
}

