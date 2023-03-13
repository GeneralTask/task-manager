import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Sentry from '@sentry/browser'
import styled from 'styled-components'
import { useGetFolders } from '../../../services/api/folders.hooks'
import { Colors } from '../../../styles'
import { DeprecatedBold } from '../../atoms/typography/Typography'
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
}
const RecurringTaskDetailsBanner = ({ templateId }: RecurringTaskDetailsBannerProps) => {
    const { data: folders } = useGetFolders()

    const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false)

    const recurringTaskTemplate = useGetRecurringTaskTemplateFromId(templateId)

    const folder = useMemo(() => {
        if (!folders) return null
        const folder = folders.find((folder) => folder.id === recurringTaskTemplate?.id_task_section)
        if (!folder) {
            Sentry.captureMessage('Recurring task has invalid folder id: ' + recurringTaskTemplate?.id_task_section)
        }
        return folder
    }, [folders, recurringTaskTemplate])

    if (!folder || !recurringTaskTemplate) return null

    return (
        <>
            <Banner>
                <span>
                    <DeprecatedBold>This is a recurring task.</DeprecatedBold> It will reappear in the {folder.name}{' '}
                    folder {formatRecurrenceRateForRecurringTaskBanner(recurringTaskTemplate)} (
                    <LinkText onClick={() => setIsEditTemplateModalOpen(true)}>edit schedule</LinkText>). Changes made
                    here will only apply to this task – to change future tasks,{' '}
                    <Link to={`/recurring-tasks/${recurringTaskTemplate.id}`}>edit the recurring task template</Link>.
                </span>
            </Banner>
            {isEditTemplateModalOpen && (
                <RecurringTaskTemplateModal
                    initialRecurringTaskTemplate={recurringTaskTemplate}
                    onClose={() => setIsEditTemplateModalOpen(false)}
                />
            )}
        </>
    )
}

export default RecurringTaskDetailsBanner
