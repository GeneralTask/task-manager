import { RecurrenceRate } from '../../../../utils/enums'
import { getOrdinal } from '../../../../utils/time'
import { TRecurringTaskTemplate } from '../../../../utils/types'

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const formatRecurrenceRateForRecurringTaskBanner = (recurringTaskTemplate: TRecurringTaskTemplate) => {
    switch (recurringTaskTemplate.recurrence_rate) {
        case RecurrenceRate.DAILY:
            return 'every day'
        case RecurrenceRate.WEEK_DAILY:
            return 'every weekday'
        case RecurrenceRate.WEEKLY:
            if (recurringTaskTemplate.day_to_create_task) {
                return `on ${WEEK_DAYS[recurringTaskTemplate.day_to_create_task]} of every week`
            } else return 'every week'
        case RecurrenceRate.MONTHLY:
            if (recurringTaskTemplate.day_to_create_task) {
                return `on the ${getOrdinal(recurringTaskTemplate.day_to_create_task)} of every month`
            } else return 'every month'
        case RecurrenceRate.YEARLY:
            if (recurringTaskTemplate.day_to_create_task && recurringTaskTemplate.month_to_create_task) {
                return `on the ${getOrdinal(recurringTaskTemplate.day_to_create_task)} of ${
                    recurringTaskTemplate.month_to_create_task
                } of every year`
            } else return 'every year'
        default:
            return ''
    }
}
