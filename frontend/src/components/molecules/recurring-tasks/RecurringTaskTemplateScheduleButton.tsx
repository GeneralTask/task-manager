import { useState } from 'react'
import { icons } from '../../../styles/images'
import { TTask, TTaskV4 } from '../../../utils/types'
import GTButton from '../../atoms/buttons/GTButton'
import GTIconButton from '../../atoms/buttons/GTIconButton'
import RecurringTaskTemplateModal from './RecurringTaskTemplateModal'
import { formatRecurrenceRateForScheduleButton, useGetRecurringTaskTemplateFromId } from './recurringTasks.utils'

interface RecurringTaskTemplateScheduleButtonProps {
    templateId?: string
    task?: TTask
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
            styleType="simple"
            size="small"
            onClick={() => setIsEditModalOpen(true)}
        />
    ) : (
        <GTIconButton
            icon={icons.arrows_repeat}
            tooltipText="Create a recurring task"
            onClick={() => setIsEditModalOpen(true)}
        />
    )

    const taskV4: TTaskV4 | undefined = task
        ? {
              ...task,
              source: {
                  ...task.source,
                  logo: task.source?.logo_v2,
              },
          }
        : undefined

    return (
        <>
            {button}
            {isEditModalOpen && (
                <RecurringTaskTemplateModal
                    onClose={() => setIsEditModalOpen(false)}
                    initialRecurringTaskTemplate={recurringTaskTemplate}
                    initialTask={taskV4}
                    initialFolderId={folderId}
                />
            )}
        </>
    )
}

export default RecurringTaskTemplateScheduleButton
