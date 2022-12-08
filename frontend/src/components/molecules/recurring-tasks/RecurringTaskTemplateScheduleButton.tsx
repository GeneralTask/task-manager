import { useState } from 'react'
import { icons } from '../../../styles/images'
import { TTask } from '../../../utils/types'
import GTButton from '../../atoms/buttons/GTButton'
import GTIconButton from '../../atoms/buttons/GTIconButton'
import RecurringTaskTemplateModal from './RecurringTaskTemplateModal'
import { formatRecurrenceRateForScheduleButton, useGetRecurringTaskTemplateFromId } from './recurringTasks.utils'

interface RecurringTaskTemplateScheduleButtonProps {
    templateId?: string
    task?: TTask
}
const RecurringTaskTemplateScheduleButton = ({ templateId, task }: RecurringTaskTemplateScheduleButtonProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const recurringTaskTemplate = useGetRecurringTaskTemplateFromId(templateId)

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

export default RecurringTaskTemplateScheduleButton
