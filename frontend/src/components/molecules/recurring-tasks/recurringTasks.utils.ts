import { useMemo } from 'react'
import * as Sentry from '@sentry/browser'
import { EMPTY_MONGO_OBJECT_ID } from '../../../constants'
import { useRecurringTaskTemplates } from '../../../services/api/recurring-tasks.hooks'
import { RecurrenceRate } from '../../../utils/enums'
import { getOrdinal } from '../../../utils/time'
import { TRecurringTaskTemplate } from '../../../utils/types'

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTHS_SHORTENED = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

export const useGetRecurringTaskTemplateFromId = (templateId?: string): TRecurringTaskTemplate | undefined => {
    const { data: recurringTaskTemplates } = useRecurringTaskTemplates()

    return useMemo(() => {
        if (!recurringTaskTemplates || !templateId || templateId === EMPTY_MONGO_OBJECT_ID) return undefined
        const recurringTaskTemplate = recurringTaskTemplates.find((rt) => rt.id === templateId)
        if (!recurringTaskTemplate) {
            Sentry.captureMessage('Recurring task has invalid template id: ' + templateId)
        }
        return recurringTaskTemplate
    }, [recurringTaskTemplates, templateId])
}

export const formatRecurrenceRateForRecurringTaskBanner = (recurringTaskTemplate: TRecurringTaskTemplate) => {
    switch (recurringTaskTemplate.recurrence_rate) {
        case RecurrenceRate.DAILY:
            return 'every day'
        case RecurrenceRate.WEEK_DAILY:
            return 'every weekday'
        case RecurrenceRate.WEEKLY:
            if (recurringTaskTemplate.day_to_create_task !== undefined) {
                return `on ${WEEK_DAYS[recurringTaskTemplate.day_to_create_task - 1]} of every week`
            } else return 'every week'
        case RecurrenceRate.MONTHLY:
            if (recurringTaskTemplate.day_to_create_task) {
                return `on the ${getOrdinal(recurringTaskTemplate.day_to_create_task)} of every month`
            } else return 'every month'
        case RecurrenceRate.YEARLY:
            if (recurringTaskTemplate.day_to_create_task && recurringTaskTemplate.month_to_create_task !== undefined) {
                return `on the ${getOrdinal(recurringTaskTemplate.day_to_create_task)} of ${
                    MONTHS[recurringTaskTemplate.month_to_create_task - 1]
                } of every year`
            } else return 'every year'
        default:
            return ''
    }
}

export const formatRecurrenceRateForScheduleButton = (recurringTaskTemplate: TRecurringTaskTemplate) => {
    switch (recurringTaskTemplate.recurrence_rate) {
        case RecurrenceRate.DAILY:
            return 'Daily'
        case RecurrenceRate.WEEK_DAILY:
            return 'Every weekday'
        case RecurrenceRate.WEEKLY:
            if (recurringTaskTemplate.day_to_create_task !== undefined) {
                return `Weekly on ${WEEK_DAYS[recurringTaskTemplate.day_to_create_task - 1]}`
            } else return 'Weekly'
        case RecurrenceRate.MONTHLY:
            if (recurringTaskTemplate.day_to_create_task) {
                return `Monthly on the ${getOrdinal(recurringTaskTemplate.day_to_create_task)}`
            } else return 'Monthly'
        case RecurrenceRate.YEARLY:
            if (
                recurringTaskTemplate.day_to_create_task !== undefined &&
                recurringTaskTemplate.month_to_create_task !== undefined
            ) {
                return `Annually on ${MONTHS_SHORTENED[recurringTaskTemplate.month_to_create_task - 1]} ${getOrdinal(
                    recurringTaskTemplate.day_to_create_task
                )}`
            } else return 'Annually'
        default:
            return ''
    }
}
