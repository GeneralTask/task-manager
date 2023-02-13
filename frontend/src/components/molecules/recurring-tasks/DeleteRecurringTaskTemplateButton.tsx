import { useModifyRecurringTask } from '../../../services/api/recurring-tasks.hooks'
import { icons } from '../../../styles/images'
import GTButton from '../../atoms/buttons/GTButton'
import GTIconButton from '../../atoms/buttons/GTIconButton'

interface DeleteRecurringTaskTemplateButtonProps {
    templateId: string
    is_deleted: boolean
}
const DeleteRecurringTaskTemplateButton = ({ templateId, is_deleted }: DeleteRecurringTaskTemplateButtonProps) => {
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()
    const deleteOrRestoreTemplate = (deleted: boolean) => {
        modifyRecurringTask({
            id: templateId,
            is_deleted: deleted,
        })
    }
    if (is_deleted) {
        return (
            <GTButton
                styleType="secondary"
                size="small"
                value="Restore template"
                onClick={() => deleteOrRestoreTemplate(false)}
            />
        )
    }
    return (
        <GTIconButton
            icon={icons.trash}
            iconColor="red"
            tooltipText="Delete template"
            onClick={() => deleteOrRestoreTemplate(true)}
        />
    )
}

export default DeleteRecurringTaskTemplateButton
