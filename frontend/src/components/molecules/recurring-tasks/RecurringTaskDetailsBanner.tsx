import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Sentry from '@sentry/browser'
import styled from 'styled-components'
import { useGetTasks } from '../../../services/api/tasks.hooks'
import { Colors } from '../../../styles'
import { Banner } from './RecurringTaskTemplateDetailsBanner'
import RecurringTaskTemplateModal from './RecurringTaskTemplateModal'
import { formatRecurrenceRateForRecurringTaskBanner, useGetRecurringTaskTemplateFromId } from './recurringTasks.utils'

const LinkText = styled.span`
    color: ${Colors.text.purple};
    cursor: pointer;
    text-decoration: underline;
`

interface RecurringTaskDetailsBannerProps {
    templateId: string
    folderId: string
}
const RecurringTaskDetailsBanner = ({ templateId, folderId }: RecurringTaskDetailsBannerProps) => {
    const { data: folders } = useGetTasks()

    const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false)

    const folder = useMemo(() => {
        if (!folders) return null
        const folder = folders.find((folder) => folder.id === folderId)
        if (!folder) {
            Sentry.captureMessage('Recurring task has invalid folder id: ' + folderId)
        }
        return folder
    }, [folders, folderId])

    const recurringTaskTemplate = useGetRecurringTaskTemplateFromId(templateId)

    if (!folder || !recurringTaskTemplate) return null

    return (
        <>
            <Banner>
                <span>
                    This task will reappear in the {folder.name} folder{' '}
                    {formatRecurrenceRateForRecurringTaskBanner(recurringTaskTemplate)} (
                    <LinkText onClick={() => setIsEditTemplateModalOpen(true)}>edit schedule</LinkText>). You can also{' '}
                    <Link to={`/recurring-tasks/${recurringTaskTemplate.id}`}>
                        edit the template for this recurring task
                    </Link>
                    .
                </span>
            </Banner>
            {isEditTemplateModalOpen && (
                <RecurringTaskTemplateModal
                    initialRecurringTask={recurringTaskTemplate}
                    onClose={() => setIsEditTemplateModalOpen(false)}
                />
            )}
        </>
    )
}

export default RecurringTaskDetailsBanner
