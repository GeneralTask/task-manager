import { useCallback } from 'react'
import Log from '../../../services/api/log'
import { useMarkTaskDoneOrDeleted } from '../../../services/api/tasks.hooks'
import GTCheckbox from '../GTCheckbox'

interface MarkTaskDoneButtonProps {
    isDone: boolean
    taskId: string
    isSelected: boolean
    sectionId?: string
    isDisabled?: boolean
    onMarkComplete?: () => void
    optimsticId?: string
}
const MarkTaskDoneButton = ({
    isDone,
    taskId,
    isSelected,
    sectionId,
    isDisabled,
    onMarkComplete,
    optimsticId,
}: MarkTaskDoneButtonProps) => {
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const onMarkTaskDone = useCallback(() => {
        if (isDisabled) return
        if (onMarkComplete) onMarkComplete()
        markTaskDoneOrDeleted(
            {
                id: taskId,
                isDone: !isDone,
                waitForAnimation: true,
            },
            optimsticId
        )
        Log({
            taskId: taskId,
            sectionId: sectionId,
            isDone: !isDone,
        })
    }, [taskId, sectionId, isDone, onMarkComplete])

    return (
        <GTCheckbox
            isChecked={isDone}
            onChange={onMarkTaskDone}
            animated
            shortcutName="markAsDone"
            shortcutDisabled={!isSelected || isDisabled}
            disabled={isDisabled}
        />
    )
}

export default MarkTaskDoneButton
