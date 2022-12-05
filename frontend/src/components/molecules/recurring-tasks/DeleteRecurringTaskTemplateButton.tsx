import { useModifyRecurringTask } from '../../../services/api/recurring-tasks.hooks'
import { icons } from '../../../styles/images'
import GTIconButton from '../../atoms/buttons/GTIconButton'

interface DeleteRecurringTaskTemplateButtonProps {
    templateId: string
}
const DeleteRecurringTaskTemplateButton = ({ templateId }: DeleteRecurringTaskTemplateButtonProps) => {
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()
    const deleteTemplate = () => {
        modifyRecurringTask({
            id: templateId,
            is_deleted: true,
        })
    }
    return <GTIconButton icon={icons.trash} iconColor="red" tooltipText="Delete template" onClick={deleteTemplate} />
}

export default DeleteRecurringTaskTemplateButton
