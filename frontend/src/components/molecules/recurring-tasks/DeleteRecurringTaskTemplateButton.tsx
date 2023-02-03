import { useModifyRecurringTask } from '../../../services/api/recurring-tasks.hooks'
import { icons } from '../../../styles/images'
import { TRecurringTaskTemplate } from '../../../utils/types'
import GTButton from '../../atoms/buttons/GTButton'
import GTIconButton from '../../atoms/buttons/GTIconButton'

interface DeleteRecurringTaskTemplateButtonProps {
    task: TRecurringTaskTemplate
}
const DeleteRecurringTaskTemplateButton = ({ task }: DeleteRecurringTaskTemplateButtonProps) => {
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()
    const deleteOrRestoreTemplate = (is_deleted: boolean) => {
        modifyRecurringTask({
            id: task.id,
            is_deleted: is_deleted,
        })
    }
    if (task.is_deleted) {
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
