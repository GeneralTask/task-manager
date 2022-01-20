import { casual } from 'chrono-node'
import { ParsingContext } from 'chrono-node/dist/chrono'
import ENCasualTimeParser from 'chrono-node/dist/locales/en/parsers/ENCasualTimeParser'

// Overrides the built-in ENCasualTimeParser, but assigns parsed hour with certainty instead of implying it
// i.e. for input 'noon', instead of implying this means 12:00,
// we assign the hour to be 12:00 with certainty
class ENCertainCasualTimeParser extends ENCasualTimeParser {
    innerExtract(context: ParsingContext, match: RegExpMatchArray) {
        const result = super.innerExtract(context, match)
        const parsedHour = result.get('hour')
        if (parsedHour != null) {
            result.assign('hour', parsedHour)
        }
        return result
    }
}

// create our own TimeParser
export const TimeParser = casual.clone()

// remove the built-in ENCasualTimeParser
TimeParser.parsers = TimeParser.parsers.filter((parser) => !(parser instanceof ENCasualTimeParser))

// insert our overrided parser
TimeParser.parsers.push(new ENCertainCasualTimeParser())

// ensure that parsed dates of today are in the future
// for example, make sure that 'noon' is tomorrow if the current time is past 12:00
TimeParser.refiners.push({
    refine: (context, results) => {
        const now = new Date()
        const nowDay = now.getDate()
        const nowMonth = now.getMonth() + 1
        results.forEach((result) => {
            const day = result.start.get('day')
            const month = result.start.get('month')
            if (
                day != null &&
                month != null &&
                // if the parsed day is today
                day === nowDay &&
                month === nowMonth &&
                // and if the parsed time is before right now (- 10 seconds so that 'today' still counts as today)
                result.start.date().getTime() < now.getTime() - 10000
            ) {
                // then set the day to tomorrow
                result.start.assign('day', day + 1)
            }
        })
        return results
    },
})

// if we are not sure about the hour of the due date, set the time to 11:59 PM
TimeParser.refiners.push({
    refine: (context, results) => {
        results.forEach((result) => {
            if (!result.start.isCertain('hour')) {
                result.start.assign('hour', 23)
                result.start.assign('minute', 59)
                result.start.assign('second', 0)
                result.start.assign('millisecond', 0)
            }
        })
        return results
    },
})

export const parseDate = (dueDate: string): Date | null =>
    TimeParser.parseDate(dueDate, new Date(), {
        forwardDate: true,
    })
