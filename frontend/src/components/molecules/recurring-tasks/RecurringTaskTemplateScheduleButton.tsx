import { useState } from 'react'
import { icons } from '../../../styles/images'
import { TTaskV4 } from '../../../utils/types'
import GTButton from '../../atoms/buttons/GTButtonNew'
import GTIconButton from '../../atoms/buttons/GTIconButton'
import RecurringTaskTemplateModal from './RecurringTaskTemplateModal'
import { formatRecurrenceRateForScheduleButton, useGetRecurringTaskTemplateFromId } from './recurringTasks.utils'

interface RecurringTaskTemplateScheduleButtonProps {
    templateId?: string
    task?: TTaskV4
    folderId?: string
}
const RecurringTaskTemplateScheduleButton = ({
    templateId,
    task,
    folderId,
}: RecurringTaskTemplateScheduleButtonProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const recurringTaskTemplate = useGetRecurringTaskTemplateFromId(templateId)

    const button = recurringTaskTemplate ? (
        <GTButton
            icon={icons.arrows_repeat}
            value={formatRecurrenceRateForScheduleButton(recurringTaskTemplate)}
            styleType="control"
            onClick={() => setIsEditModalOpen(true)}
        />
    ) : (
        <GTIconButton
            icon={icons.arrows_repeat}
            tooltipText="Create a recurring task"
            onClick={() => setIsEditModalOpen(true)}
        />
    )

    return (
        <>
            {button}
            {isEditModalOpen && (
                <RecurringTaskTemplateModal
                    onClose={() => setIsEditModalOpen(false)}
                    initialRecurringTaskTemplate={recurringTaskTemplate}
                    initialTask={task}
                    initialFolderId={folderId}
                />
            )}
        </>
    )
}

export default RecurringTaskTemplateScheduleButton
