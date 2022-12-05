import { useState } from 'react'
import { icons } from '../../../styles/images'
import GTButton from '../../atoms/buttons/GTButton'
import RecurringTaskTemplateModal from './RecurringTaskTemplateModal'
import { formatRecurrenceRateForEditButton, useGetRecurringTaskTemplateFromId } from './recurringTasks.utils'

interface RecurringTaskTemplateEditButtonProps {
    templateId: string
}
const RecurringTaskTemplateEditButton = ({ templateId }: RecurringTaskTemplateEditButtonProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const recurringTaskTemplate = useGetRecurringTaskTemplateFromId(templateId)

    if (!recurringTaskTemplate) return null
    return (
        <>
            <GTButton
                icon={icons.arrows_repeat}
                iconColor="green"
                value={formatRecurrenceRateForEditButton(recurringTaskTemplate)}
                styleType="simple"
                size="small"
                onClick={() => setIsEditModalOpen(true)}
            />
            {isEditModalOpen && (
                <RecurringTaskTemplateModal
                    onClose={() => setIsEditModalOpen(false)}
                    initialRecurringTask={recurringTaskTemplate}
                />
            )}
        </>
    )
}

export default RecurringTaskTemplateEditButton
