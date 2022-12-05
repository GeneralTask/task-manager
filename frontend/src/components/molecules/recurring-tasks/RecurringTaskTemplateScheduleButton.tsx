import { useState } from 'react'
import { icons } from '../../../styles/images'
import { TTask } from '../../../utils/types'
import GTButton from '../../atoms/buttons/GTButton'
import GTIconButton from '../../atoms/buttons/GTIconButton'
import RecurringTaskTemplateModal from './RecurringTaskTemplateModal'
import { formatRecurrenceRateForScheduleButton, useGetRecurringTaskTemplateFromId } from './recurringTasks.utils'

interface RecurringTaskTemplateEditButtonProps {
    templateId?: string
    task?: TTask
}
const RecurringTaskTemplateEditButton = ({ templateId, task }: RecurringTaskTemplateEditButtonProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const recurringTaskTemplate = useGetRecurringTaskTemplateFromId(templateId)

    // temporarily hide the button to create a template from a task until the backend supports this
    if (task && !recurringTaskTemplate) return null

    const button = recurringTaskTemplate ? (
        <GTButton
            icon={icons.arrows_repeat}
            iconColor="green"
            value={formatRecurrenceRateForScheduleButton(recurringTaskTemplate)}
            styleType="simple"
            size="small"
            onClick={() => setIsEditModalOpen(true)}
        />
    ) : (
        <GTIconButton
            icon={icons.arrows_repeat}
            tooltipText="Make this a recurring task"
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
                />
            )}
        </>
    )
}

export default RecurringTaskTemplateEditButton
