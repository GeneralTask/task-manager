// parameters:
// event: a date range
// blocks: a list of date ranges

import { DateTime } from "luxon";

interface DateRange {
    start: DateTime
    end: DateTime
}

// returns the index of the *first* block that the event fits completely into
export function getContainingTimeBlock(event: DateRange, blocks: DateRange[]): number {
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (event.start >= block.start && event.end <= block.end) {
            return i;
        }
    }
    return -1;
}

export function getMonthBlocks(date: DateTime): DateRange[] {
    const startOfMonth = date.startOf('month')
    const endOfMonth = date.endOf('month')
    return [
        {
            start: startOfMonth.minus({ months: 1 }),
            end: endOfMonth.minus({ months: 1 }),
        },
        {
            start: startOfMonth,
            end: endOfMonth,
        },
        {
            start: startOfMonth.plus({ months: 1 }),
            end: endOfMonth.plus({ months: 1 }),
        }
    ]
}
