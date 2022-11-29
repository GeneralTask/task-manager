import { useMemo } from 'react'
import * as Sentry from '@sentry/browser'
import { useRecurringTaskTemplates } from '../../../services/api/recurring-tasks.hooks'
import { useGetTasks } from '../../../services/api/tasks.hooks'
import { Banner } from './RecurringTaskTemplateDetailsBanner'
import { formatRecurrenceRateForRecurringTaskBanner } from './RecurringTaskTemplateModal/recurrenceRate.utils'

interface RecurringTaskDetailsBannerProps {
    templateId: string
    folderId: string
}
const RecurringTaskDetailsBanner = ({ templateId, folderId }: RecurringTaskDetailsBannerProps) => {
    const { data: folders } = useGetTasks()
    const { data: recurringTaskTemplates } = useRecurringTaskTemplates()

    const folder = useMemo(() => {
        if (!folders) return null
        const folder = folders.find((folder) => folder.id === folderId)
        if (!folder) {
            Sentry.captureMessage('Recurring task has invalid folder id: ' + folderId)
        }
        return folder
    }, [folders, folderId])

    const recurringTaskTemplate = useMemo(() => {
        if (!recurringTaskTemplates) return null
        const recurringTaskTemplate = recurringTaskTemplates.find((rt) => rt.id === templateId)
        if (!recurringTaskTemplate) {
            Sentry.captureMessage('Recurring task has invalid template id: ' + templateId)
        }
        return recurringTaskTemplate
    }, [recurringTaskTemplates, templateId])

    if (!folder || !recurringTaskTemplate) return null

    console.log({
        folder,
        recurringTaskTemplate,
        templateId,
        folderId,
        f: formatRecurrenceRateForRecurringTaskBanner(recurringTaskTemplate),
    })

    return (
        <Banner>
            This task will reappear in the {folder.name} folder{' '}
            {formatRecurrenceRateForRecurringTaskBanner(recurringTaskTemplate)} (edit schedule). You can also edit the
            template for this recurring task.
        </Banner>
    )
}

export default RecurringTaskDetailsBanner
